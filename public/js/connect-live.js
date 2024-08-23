const socket = io();

// DOM Elements
const meetingNameInput = document.getElementById('meetingName');
const roomNameInput = document.getElementById('roomName');
const createMeetingButton = document.getElementById('createMeeting');
const createRoomButton = document.getElementById('createRoom');
const roomList = document.getElementById('roomList');
const studentList = document.getElementById('studentList');
const meetingList = document.getElementById('meetingList');

let selectedStudents = []; // Array to keep track of selected students for rooms
let availableStudents = []; // To track all students
let assignedStudents = []; // To track students already in rooms
let currentMeetingId = null; // Track the current meeting

// Fetch students initially
async function fetchStudents() {
    try {
        const response = await fetch(`/api/user/${localStorage.getItem('organizationId')}`);
        if (response.ok) {
            availableStudents = await response.json();
            renderStudentList(); // Initial render with no disabled students
        } else {
            console.error('Failed to fetch students:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching students:', error);
    }
}

// Fetch rooms and disable assigned students
async function fetchRoomsAndDisableStudents() {
    try {
        if (!currentMeetingId) return;

        const response = await fetch(`/api/meeting-sessions/${currentMeetingId}/rooms`);
        if (response.ok) {
            const rooms = await response.json();
            assignedStudents = rooms.flatMap(room => room.participants.map(p => p.studentId));
            renderStudentList(); // Re-render with disabled students
        } else {
            console.error('Failed to fetch rooms:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching rooms:', error);
    }
}

// Render student list with appropriate disabled students
function renderStudentList() {
    studentList.innerHTML = '';
    availableStudents.forEach(user => {
        const listItem = document.createElement('li');
        listItem.textContent = `${user.firstName} ${user.lastName}`;
        listItem.classList.add('list-group-item');
        listItem.dataset.userId = user._id;

        // Disable students who are already in a room
        const isStudentAssigned = assignedStudents.includes(user._id);
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.disabled = isStudentAssigned;
        checkbox.checked = isStudentAssigned;
        if (isStudentAssigned) {
            listItem.classList.add('assigned'); // Add assigned class for styling
            listItem.textContent += ` (Already in a Room)`;
        }
        checkbox.addEventListener('change', (event) => {
            if (event.target.checked) {
                selectedStudents.push(user._id);
            } else {
                selectedStudents = selectedStudents.filter(id => id !== user._id);
            }
            listItem.classList.toggle('selected', event.target.checked); // Toggle highlight
        });

        listItem.insertBefore(checkbox, listItem.firstChild);
        studentList.appendChild(listItem);
    });
}

// Apply CSS to disabled checkboxes
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.innerHTML = `
        .assigned {
            color: #aaa; /* Gray out the assigned students */
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
});

// Create a new meeting
createMeetingButton.addEventListener('click', async () => {
    const meetingName = meetingNameInput.value;
    if (meetingName) {
        try {
            const response = await fetch('/api/meeting-sessions/meetings/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    meetingName,
                    coachId: localStorage.getItem('userId')
                })
            });
            if (response.ok) {
                const meeting = await response.json();
                currentMeetingId = meeting._id;
                addMeetingToList(meeting);
                meetingNameInput.value = '';
                createRoomButton.disabled = false; // Enable the Create Room button after creating a meeting
                fetchRoomsAndDisableStudents(); // Fetch rooms and disable assigned students
            } else {
                console.error('Failed to create meeting');
            }
        } catch (error) {
            console.error('Error creating meeting:', error);
        }
    } else {
        alert('Please enter a meeting name.');
    }
});

// Create room within the current meeting
createRoomButton.addEventListener('click', async () => {
    const roomName = roomNameInput.value;
    if (roomName && selectedStudents.length > 0 && currentMeetingId) {
        try {
            const response = await fetch('/api/meeting-sessions/rooms/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomName,
                    meetingId: currentMeetingId,
                    coachId: localStorage.getItem('userId'),
                    participants: selectedStudents
                })
            });
            if (response.ok) {
                const session = await response.json();
                addRoomToList(session);
                selectedStudents = []; // Clear the selected students array
                roomNameInput.value = ''; // Clear room name input field
                fetchRoomsAndDisableStudents(); // Re-fetch rooms and update student list
                alert(`Room ${roomName} created successfully`);
            } else {
                console.error('Failed to start session');
            }
        } catch (error) {
            console.error('Error starting session:', error);
        }
    } else {
        alert('Please enter a room name and select students.');
    }
});

function addMeetingToList(meeting) {
    const meetingItem = document.createElement('li');
    meetingItem.textContent = `${meeting.meetingName}`;
    meetingItem.classList.add('list-group-item');
    meetingList.appendChild(meetingItem);
}

function addRoomToList(session) {
    const { roomName, participants } = session;

    const roomItem = document.createElement('li');
    roomItem.innerHTML = `<strong>${roomName}</strong> - Students: ${participants.map(p => {
        const student = availableStudents.find(s => s._id === p.studentId);
        return student ? `${student.firstName} ${student.lastName}` : 'Unknown';
    }).join(', ')}`;
    roomItem.classList.add('list-group-item');
    
    const connectButton = document.createElement('button');
    connectButton.textContent = 'Connect Now';
    connectButton.classList.add('btn', 'btn-primary', 'ml-2');
    connectButton.addEventListener('click', () => {
        window.open(`/live-session.html?roomName=${roomName}&sessionId=${session._id}`, '_blank');
    });

    const endMeetingButton = document.createElement('button');
    endMeetingButton.textContent = 'End Meeting';
    endMeetingButton.classList.add('btn', 'btn-danger', 'ml-2');
    endMeetingButton.addEventListener('click', async () => {
        try {
            const response = await fetch(`/api/meeting-sessions/end`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: session._id })
            });
            if (response.ok) {
                roomItem.remove();
                // Close all associated sessions for this meeting
                socket.emit('endAllSessions', { meetingId: currentMeetingId });
                fetchRoomsAndDisableStudents(); // Re-fetch rooms and update student list
            } else {
                console.error('Failed to end session');
            }
        } catch (error) {
            console.error('Error ending session:', error);
        }
    });
    
    roomItem.appendChild(connectButton);
    roomItem.appendChild(endMeetingButton);
    roomList.appendChild(roomItem);
}

// Restrict creation to coaches only
document.addEventListener('DOMContentLoaded', () => {
    const role = localStorage.getItem('userRole');
    if (role === 'student') {
        createRoomButton.style.display = 'none';
        createMeetingButton.style.display = 'none';
    } else {
        createRoomButton.disabled = true; // Disable Create Room button until a meeting is created
    }
});

// Create a button to join all rooms
const joinAllRoomsButton = document.createElement('button');
joinAllRoomsButton.textContent = 'Join All Rooms';
joinAllRoomsButton.classList.add('btn', 'btn-success', 'mt-4');
roomList.parentElement.appendChild(joinAllRoomsButton); // Append below the available rooms

joinAllRoomsButton.addEventListener('click', async () => {
    try {
        window.open(`/live-session.html?sessionId=${currentMeetingId}`, '_blank'); // Open a new tab for the live session
    } catch (error) {
        console.error('Error joining all rooms:', error);
    }
});

// Initialize
fetchStudents();
