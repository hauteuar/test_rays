const socket = io();

// DOM Elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const roomNameInput = document.getElementById('roomName');
const createRoomButton = document.getElementById('createRoom');
const joinRoomButton = document.getElementById('joinRoom');
const muteRoomButton = document.getElementById('muteRoom');
const unmuteRoomButton = document.getElementById('unmuteRoom');
const recordSessionButton = document.getElementById('recordSession');
const endMeetingButton = document.getElementById('endMeeting');
const roomList = document.getElementById('roomList');
const studentList = document.getElementById('studentList');
const scheduleMeetingButton = document.getElementById('scheduleMeeting');
const scheduleModal = $('#scheduleModal');
const scheduleForm = document.getElementById('scheduleForm');
const inviteStudentsSelect = document.getElementById('inviteStudents');

let localStream;
let peerConnection;
let selectedStudents = []; // Array to keep track of selected students
let isRecording = false;
let mediaRecorder;
let recordedChunks = [];
let availableStudents = []; // To track students who haven't been added to a room yet

const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// Get user media
async function getLocalStream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
    } catch (error) {
        console.error('Error accessing media devices.', error);
    }
}

// Fetch students and populate the list
async function fetchStudents() {
    try {
        const response = await fetch(`/api/user/${localStorage.getItem('organizationId')}`);
        if (response.ok) {
            const users = await response.json();
            availableStudents = users.filter(user => user.role === 'student');
            renderStudentList();
        } else {
            console.error('Failed to fetch students:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching students:', error);
    }
}

function renderStudentList() {
    studentList.innerHTML = '';
    inviteStudentsSelect.innerHTML = '';
    availableStudents.forEach(user => {
        const listItem = document.createElement('li');
        listItem.textContent = `${user.firstName} ${user.lastName}`;
        listItem.classList.add('list-group-item');
        listItem.dataset.userId = user._id;

        listItem.addEventListener('click', () => {
            if (listItem.classList.contains('selected')) {
                listItem.classList.remove('selected');
                selectedStudents = selectedStudents.filter(id => id !== user._id);
            } else {
                listItem.classList.add('selected');
                selectedStudents.push(user._id);
            }
            listItem.classList.toggle('selected'); // Toggle highlight
        });
        studentList.appendChild(listItem);

        // Also populate the inviteStudents select
        const option = document.createElement('option');
        option.value = user._id;
        option.textContent = `${user.firstName} ${user.lastName}`;
        inviteStudentsSelect.appendChild(option);
    });
}

// Create room
createRoomButton.addEventListener('click', () => {
    const roomName = roomNameInput.value;
    if (roomName && selectedStudents.length > 0) {
        socket.emit('createRoom', { roomName, coachId: localStorage.getItem('userId'), students: selectedStudents });
    } else {
        alert('Please enter a room name and select students.');
    }
});

// Join room
joinRoomButton.addEventListener('click', () => {
    const roomName = roomNameInput.value;
    if (roomName) {
        window.open(`/live-session.html?roomName=${roomName}`, '_blank');
    } else {
        alert('Please enter a room name.');
    }
});

// Handle room creation
socket.on('roomCreated', ({ roomName, students }) => {
    if (!students) return; // Ensure students array is defined

    const roomItem = document.createElement('li');
    roomItem.innerHTML = `<strong>${roomName}</strong> - Students: ${students.map(id => {
        const student = availableStudents.find(s => s._id === id);
        return student ? `${student.firstName} ${student.lastName}` : 'Unknown';
    }).join(', ')}`;
    roomItem.classList.add('list-group-item');
    
    const connectButton = document.createElement('button');
    connectButton.textContent = 'Connect Now';
    connectButton.classList.add('btn', 'btn-primary', 'ml-2');
    connectButton.addEventListener('click', () => {
        window.open(`/live-session.html?roomName=${roomName}`, '_blank');
    });

    const endMeetingButton = document.createElement('button');
    endMeetingButton.textContent = 'End Meeting';
    endMeetingButton.classList.add('btn', 'btn-danger', 'ml-2');
    endMeetingButton.addEventListener('click', () => {
        socket.emit('endRoom', { roomName });
    });
    
    roomItem.appendChild(connectButton);
    roomItem.appendChild(endMeetingButton);
    roomList.appendChild(roomItem);

    // Remove selected students from available list
    selectedStudents.forEach(studentId => {
        availableStudents = availableStudents.filter(student => student._id !== studentId);
    });

    selectedStudents = []; // Clear selected students
    renderStudentList(); // Re-render the student list
});

// Schedule meeting
scheduleMeetingButton.addEventListener('click', () => {
    scheduleModal.modal('show');
});

// Handle schedule form submission
scheduleForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('meetingTitle').value;
    const date = document.getElementById('meetingDate').value;
    const time = document.getElementById('meetingTime').value;
    const roomName = document.getElementById('meetingRoom').value;
    const invitedStudents = Array.from(inviteStudentsSelect.selectedOptions).map(option => option.value);

    if (title && date && time && roomName && invitedStudents.length > 0) {
        socket.emit('scheduleMeeting', {
            title,
            date,
            time,
            roomName,
            invitedStudents,
            coachId: localStorage.getItem('userId')
        });
        scheduleModal.modal('hide');
        alert('Meeting scheduled successfully.');
    } else {
        alert('Please fill out all fields.');
    }
});

// Mute/unmute room
muteRoomButton.addEventListener('click', () => {
    const roomName = prompt('Enter room name to mute:');
    if (roomName) {
        socket.emit('muteRoom', { roomName });
    }
});

unmuteRoomButton.addEventListener('click', () => {
    const roomName = prompt('Enter room name to unmute:');
    if (roomName) {
        socket.emit('unmuteRoom', { roomName });
    }
});

// Handle recording
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

function startRecording() {
    if (localStream) {
        const options = { mimeType: 'video/webm; codecs=vp9' };
        mediaRecorder = new MediaRecorder(localStream, options);
        
        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.onstop = handleRecordingStop;

        mediaRecorder.start();
    } else {
        console.error('No local stream available to record.');
    }
}

// Function to handle data availability during recording
function handleDataAvailable(event) {
    if (event.data.size > 0) {
        recordedChunks.push(event.data);
    }
}

// Function to handle when recording stops
function handleRecordingStop() {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${roomNameInput.value}-recording.webm`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    recordedChunks = []; // Clear the recorded chunks after saving
}

// Close rooms/sessions when the page is closed or when there's inactivity
window.addEventListener('beforeunload', () => {
    socket.emit('closeRoom', { roomName: roomNameInput.value, userId: localStorage.getItem('userId') });
});

// Timeout if no users are present for 2 minutes
let timeout;
socket.on('userLeft', () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
        socket.emit('closeRoom', { roomName: roomNameInput.value });
    }, 2 * 60 * 1000); // 2 minutes
});

// Initialize the stream and fetch students
getLocalStream();
fetchStudents();

// Notification handling (Assuming topnav component has an element with id 'notification-icon')
socket.on('newNotification', ({ roomName, senderName }) => {
    const notificationIcon = document.getElementById('notification-icon');
    notificationIcon.classList.add('has-notification');
    notificationIcon.title = `New room "${roomName}" created by ${senderName}`;
});

// Restrict creation to coaches only
document.addEventListener('DOMContentLoaded', () => {
    const role = localStorage.getItem('userRole');
    if (role === 'student') {
        createRoomButton.style.display = 'none';
        scheduleMeetingButton.style.display = 'none';
    }
});
