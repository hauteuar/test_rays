const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

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

module.exports = router;
