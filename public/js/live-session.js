const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('sessionId');
const localVideoContainer = document.getElementById('videoContainer');
const participantsList = document.getElementById('participantsList');
const muteButton = document.getElementById('muteButton');
const cameraButton = document.getElementById('cameraButton');
const recordSessionButton = document.getElementById('recordSessionButton');
const endMeetingButton = document.getElementById('endMeetingButton');

let localStream;
let peerConnections = {};
let isMuted = false;
let isCameraOff = false;
let isRecording = false;
let mediaRecorder;
let recordedChunks = [];

// Get user media
async function getLocalStream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log('Local stream obtained', localStream);
        // For each room, create a video element and join the room
        await joinAllRooms();
        setupControls();
    } catch (error) {
        console.error('Error accessing media devices.', error);
    }
}

// Join all rooms associated with the session
async function joinAllRooms() {
    try {
        console.log('Joining all rooms for sessionId:', sessionId);
        const response = await fetch(`/api/meeting-sessions/join-all/${sessionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const rooms = await response.json();
        console.log('Rooms retrieved:', rooms);
        if (rooms && rooms.length > 0) {
            rooms.forEach(room => {
                joinRoom(room.roomName, room._id);
            });
        } else {
            console.warn('No rooms found for this session');
        }
    } catch (error) {
        console.error('Error joining all rooms:', error);
    }
}

function joinRoom(roomName, roomId) {
    console.log('Joining room:', roomName, roomId);
    // Create local video element for this room
    const localVideo = document.createElement('video');
    localVideo.srcObject = localStream;
    localVideo.autoplay = true;
    localVideo.muted = true;
    localVideo.classList.add('video-box');
    localVideoContainer.appendChild(localVideo);

    // Create remote video element for this room
    const remoteVideo = document.createElement('video');
    remoteVideo.autoplay = true;
    remoteVideo.classList.add('video-box');
    localVideoContainer.appendChild(remoteVideo);

    socket.emit('joinRoom', { roomName, sessionId, userId: localStorage.getItem('userId') });

    // Create a list item for participants
    const participantItem = document.createElement('li');
    participantItem.textContent = `Room: ${roomName}`;
    participantItem.classList.add('list-group-item');
    participantsList.appendChild(participantItem);

    createPeerConnection(roomName, remoteVideo);
}

socket.on('userJoined', async ({ userId, roomName }) => {
    console.log(`User ${userId} joined room ${roomName}`);
    const participantItem = document.createElement('li');
    const userResponse = await fetch(`/api/user/${userId}`);
    const user = await userResponse.json();
    participantItem.textContent = `${user.firstName} ${user.lastName} joined ${roomName}`;
    participantItem.classList.add('list-group-item');
    participantsList.appendChild(participantItem);
});

function createPeerConnection(roomName, remoteVideoElement) {
    const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peerConnection.addStream(localStream);
    peerConnections[roomName] = peerConnection;

    peerConnection.ontrack = (event) => {
        remoteVideoElement.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', { roomName, candidate: event.candidate });
        }
    };

    // Handle signaling for this room
    socket.on('signal', async (data) => {
        if (data.roomName === roomName) {
            console.log(`Received signal for room ${roomName}`, data);
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
        }
    });
}

// Setup camera and microphone controls
function setupControls() {
    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        localStream.getAudioTracks()[0].enabled = !isMuted;
        muteButton.textContent = isMuted ? 'Unmute' : 'Mute';

        Object.keys(peerConnections).forEach(roomName => {
            socket.emit(isMuted ? 'muteRoom' : 'unmuteRoom', { roomName });
        });
    });

    cameraButton.addEventListener('click', () => {
        isCameraOff = !isCameraOff;
        localStream.getVideoTracks()[0].enabled = !isCameraOff;
        cameraButton.textContent = isCameraOff ? 'Turn On Camera' : 'Turn Off Camera';
    });

    recordSessionButton.addEventListener('click', () => {
        if (isRecording) {
            mediaRecorder.stop();
            recordSessionButton.textContent = 'Record Session';
            isRecording = false;
        } else {
            startRecording();
            recordSessionButton.textContent = 'Stop Recording';
            isRecording = true;
        }
    });

    endMeetingButton.addEventListener('click', () => {
        Object.keys(peerConnections).forEach(roomName => {
            socket.emit('endRoom', { roomName, sessionId });
        });
        endSession(sessionId);
        window.close();
    });
}

// Start recording the session
function startRecording() {
    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(localStream, options);
    
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleRecordingStop;

    mediaRecorder.start();
}

function handleDataAvailable(event) {
    if (event.data.size > 0) {
        recordedChunks.push(event.data);
    }
}

async function handleRecordingStop() {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const recordingUrl = URL.createObjectURL(blob);

    await fetch('/api/meeting-sessions/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, recordingUrl })
    });

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = recordingUrl;
    a.download = `session-recording.webm`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(recordingUrl);
    recordedChunks = [];
}

// End the session
async function endSession(sessionId) {
    await fetch('/api/meeting-sessions/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
    });
}

socket.on('sessionEnded', ({ sessionId }) => {
    alert('The session has ended. The page will now close.');
    window.close(); // Close the session window
});

// Initialize
getLocalStream();
