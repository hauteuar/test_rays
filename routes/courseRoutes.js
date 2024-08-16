const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, courseController.createCourse);
router.patch('/:courseId', courseController.updateCourse);
router.get('/', courseController.getCourses);
router.get('/:courseId', courseController.getCourseById);
router.get('/coach/:coachId', authMiddleware, courseController.getCoursesForCoach);
router.get('/assigned/:userId', authMiddleware, courseController.getAssignedCourses);
router.get('/unassigned/:userId', authMiddleware, courseController.getUnassignedCourses);

module.exports = router;
