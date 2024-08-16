const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// Create feedback with file uploads
router.post('/create', feedbackController.createFeedback);

// Get feedback by course and student
router.get('/:courseId/:studentId', feedbackController.getFeedbackByCourseAndStudent);

module.exports = router;
