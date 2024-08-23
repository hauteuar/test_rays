const MeetingSession = require('../models/MeetingSession');
const Meeting = require('../models/Meeting'); // New Meeting model
const User = require('../models/Users');

// Create a new meeting
exports.createMeeting = async (req, res) => {
    try {
        const { meetingName, coachId } = req.body;
        const meeting = new Meeting({
            meetingName,
            coachId,
            createdAt: new Date()
        });

        await meeting.save();
        res.status(201).json(meeting);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a room within a meeting
exports.createRoom = async (req, res) => {
    try {
        const { roomName, coachId, meetingId, participants } = req.body;

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        const session = new MeetingSession({
            roomName,
            coachId,
            meetingId,
            startedAt: new Date(),
            participants: participants.map(id => ({ studentId: id, joinedAt: new Date() })) // Adding joinedAt here
        });

        await session.save();
        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Other existing methods remain unchanged...

// Start a new session
exports.startSession = async (req, res) => {
    try {
        const { roomName, coachId } = req.body;
        const session = new MeetingSession({
            roomName,
            coachId,
            startedAt: new Date(),
            participants: []
        });

        await session.save();
        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// End a session
exports.endSession = async (req, res) => {
    try {
        const { sessionId, recordingUrl } = req.body;

        const session = await MeetingSession.findByIdAndUpdate(
            sessionId,
            { endedAt: new Date(), recordingUrl },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.status(200).json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Track when a student joins a session
exports.joinSession = async (req, res) => {
    try {
        const { sessionId, studentId } = req.body;

        const session = await MeetingSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        session.participants.push({
            studentId,
            joinedAt: new Date()
        });

        await session.save();
        res.status(200).json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Track when a student leaves a session
exports.leaveSession = async (req, res) => {
    try {
        const { sessionId, studentId } = req.body;

        const session = await MeetingSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const participant = session.participants.find(p => p.studentId.toString() === studentId);
        if (participant) {
            participant.leftAt = new Date();
            participant.totalTime = Math.floor((participant.leftAt - participant.joinedAt) / 1000); // in seconds
            await session.save();
            res.status(200).json(session);
        } else {
            res.status(404).json({ error: 'Participant not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Provide feedback for a session participant
exports.provideFeedback = async (req, res) => {
    try {
        const { sessionId, studentId, feedback } = req.body;

        const session = await MeetingSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const participant = session.participants.find(p => p.studentId.toString() === studentId);
        if (participant) {
            participant.feedback = feedback;
            await session.save();
            res.status(200).json(session);
        } else {
            res.status(404).json({ error: 'Participant not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get the meeting history for a user
exports.getMeetingHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        const sessions = await MeetingSession.find({ 'participants.studentId': userId })
            .populate('participants.studentId', 'firstName lastName')
            .populate('coachId', 'firstName lastName');
        res.status(200).json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Get all rooms associated with a meeting
exports.getAllRoomsInSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const rooms = await MeetingSession.find({ meetingId: sessionId });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
