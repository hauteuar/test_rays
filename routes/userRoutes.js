const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const notificationController = require('../controllers/notificationController');

// Route to get user profile
router.get('/profile', authMiddleware, userController.getUserProfile);

//router.get('/coach/:organizationId', authMiddleware, userController.getCoachesforOrg);

router.get('/', authMiddleware,  userController.getAllUsers);

router.get('/:organizationId', authMiddleware,  userController.getAllUsersByOrg);



// Get a specific user by ID
router.get('/:id', authMiddleware, userController.getUserById);

// Get all coaches for a given organization

router.get('/organization/:organizationId/coaches', authMiddleware, userController.getCoaches);

// Create a new user
router.post('/', authMiddleware, userController.createUser);

// Update a user by ID
router.put('/:id', authMiddleware, userController.updateUser);

// Delete a user by IDs
router.delete('/:id', authMiddleware, userController.deleteUser);

// Get students not enrolled in a specific course
router.get('/not-enrolled/:courseId',  authMiddleware, userController.getStudentsNotEnrolled);

// Get coaches not assigned to a specific batch
router.get('/not-assigned/:batchId', authMiddleware, userController.getCoachesNotAssigned);

router.post('/assign', authMiddleware, userController.assignStudentsToCoach);
router.post('/organization/:organizationId/add-coach', userController.addCoach);

// Route to get students assigned to a specific batch
router.get('/assigned-students/:courseId/:batchId',authMiddleware,  userController.getAssignedStudents);

// Route to get coaches assigned to a specific batch
router.get('/assigned-coaches/:courseId/:batchId', authMiddleware, userController.getAssignedCoaches);

router.get('/assigned-student/:courseId/:coachId', authMiddleware, userController.getAssignedCoachesByCourseId);

router.get('/student/:organizationId/:studentId', authMiddleware, userController.getStudentsById);
// Get all students for a given organization

router.get('/organization/:organizationId/students', authMiddleware, userController.getOrgStudents);

router.get('/organization/:organizationId/parents', authMiddleware, userController.getOrgParents);

// Route to fetch coach details
router.get('/coach/:coachId', userController.getCoachDetails);

// Route to fetch the calendar of schedules for the coach
router.get('/:coachId/calendar', userController.getCoachCalendar);

// Route to fetch the schedule for a specific day
router.get('/:coachId/schedule/:date', userController.getCoachScheduleByDate);

// Route to fetch the coach's availability schedule
router.get('/:coachId/availability', userController.getCoachAvailability);

router.post('/:coachId/availability', userController.updateCoachAvailability);

router.post('/send-notification', notificationController.sendNotification);

router.get('/notifications/unread-count/:userId', authMiddleware, notificationController.getUnreadNotificationsCount);

router.get('/notifications/history', authMiddleware, notificationController.getNotificationHistory);

module.exports = router;
