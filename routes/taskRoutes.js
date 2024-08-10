const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes for tasks


router.get('/student/:studentId/:organizationId', authMiddleware, taskController.getTasksForStudent);

router.post('/', authMiddleware, taskController.createTask);

router.get('/:coachId/:organizationId', authMiddleware, taskController.getTasksForCoachByOrg);

router.get('/coach/:coachId/:courseId/batch/:batchId/org/:organizationId', authMiddleware, taskController.getTasksForCoach);

router.get('/:taskId', authMiddleware,  taskController.getTaskDetails);
router.post('/submit', authMiddleware, taskController.submitTask);
router.put('/progress', authMiddleware,  taskController.updateTaskProgress);
router.put('/tasks/:taskId', authMiddleware, taskController.updateTask);

router.post('/student/submit-task', authMiddleware, taskController.submitTaskByStudent);

module.exports = router;
