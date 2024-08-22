const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const roomName = urlParams.get('roomName');

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const roomNameDisplay = document.getElementById('roomNameDisplay');
const muteButton = document.createElement('button');
const cameraButton = document.createElement('button');

let localStream;
let peerConnection;
let isMuted = false;
let isCameraOff = false;

const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// Set room name display
roomNameDisplay.textContent = roomName;

// Get user media
async function getLocalStream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
        joinRoom();
        setupControls();
    } catch (error) {
        console.error('Error accessing media devices.', error);
    }
}

// Join the room
function joinRoom() {
    socket.emit('joinRoom', { roomName, userId: localStorage.getItem('userId') });
}

// Handle user joining
socket.on('userJoined', async ({ userId }) => {
    if (!peerConnection) {
        createPeerConnection();
    }

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('signal', { roomName, description: peerConnection.localDescription });
});

// Handle incoming signal
socket.on('signal', async (data) => {
    if (data.description) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.description));
        if (data.description.type === 'offer') {
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('signal', { roomName, description: peerConnection.localDescription });
        }
    } else if (data.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
});

// Create a peer connection
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);
    peerConnection.addStream(localStream);

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', { roomName, candidate: event.candidate });
        }
    };
}

// Setup camera and microphone controls
function setupControls() {
    muteButton.textContent = 'Mute';
    cameraButton.textContent = 'Turn Off Camera';

    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        localStream.getAudioTracks()[0].enabled = !isMuted;
        muteButton.textContent = isMuted ? 'Unmute' : 'Mute';
    });

    cameraButton.addEventListener('click', () => {
        isCameraOff = !isCameraOff;
        localStream.getVideoTracks()[0].enabled = !isCameraOff;
        cameraButton.textContent = isCameraOff ? 'Turn On Camera' : 'Turn Off Camera';
    });

    document.body.appendChild(muteButton);
    document.body.appendChild(cameraButton);
}

// Initialize
getLocalStream();
