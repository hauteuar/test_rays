const ScheduledMeeting = require('../models/ScheduleMeeting');
const User = require('../models/Users');

// Schedule a new meeting
exports.createMeeting = async (req, res) => {
    try {
        const { title, roomName, coachId, invitedStudents, scheduledDateTime } = req.body;

        const meeting = new ScheduledMeeting({
            title,
            roomName,
            coachId,
            invitedStudents,
            scheduledDateTime
        });

        await meeting.save();

        // Send notifications to invited students
        invitedStudents.forEach(async (studentId) => {
            await User.findByIdAndUpdate(studentId, {
                $push: {
                    notifications: {
                        message: `You have been invited to a meeting titled "${title}"`,
                        type: 'info'
                    }
                }
            });
        });

        res.status(201).json(meeting);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a user's scheduled meetings
exports.getUserScheduledMeetings = async (req, res) => {
    try {
        const { userId } = req.params;

        const meetings = await ScheduledMeeting.find({ invitedStudents: userId })
            .populate('coachId', 'firstName lastName')
            .populate('invitedStudents', 'firstName lastName');

        res.status(200).json(meetings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
