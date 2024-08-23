const express = require('express');
const router = express.Router();
const scheduledMeetingController = require('../controllers/scheduledMeetingController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, scheduledMeetingController.createMeeting);
router.get('/:userId', authMiddleware, scheduledMeetingController.getUserScheduledMeetings);

module.exports = router;
