const express = require('express');
const router = express.Router();
const meetingSessionController = require('../controllers/meetingSessionController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/meetings/create', authMiddleware, meetingSessionController.createMeeting);
router.post('/rooms/create', authMiddleware, meetingSessionController.createRoom);
router.post('/start', authMiddleware, meetingSessionController.startSession);
router.post('/end', authMiddleware, meetingSessionController.endSession);
router.post('/join', authMiddleware, meetingSessionController.joinSession);
router.post('/leave', authMiddleware, meetingSessionController.leaveSession);
router.post('/feedback', authMiddleware, meetingSessionController.provideFeedback);
router.get('/history/:userId', authMiddleware, meetingSessionController.getMeetingHistory);
router.get('/:meetingId/rooms', authMiddleware, meetingSessionController.getAllRoomsInSession);


module.exports = router;
