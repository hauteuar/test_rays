const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');

router.post('/', batchController.createBatch);
router.patch('/:batchId', batchController.updateBatch);
router.delete('/:batchId', batchController.deleteBatch);
router.get('/', batchController.getBatches);  // Add this line to handle GET requests for all batches
router.get('/:batchId', batchController.getBatchById);  // Add this line to handle GET requests by batch ID

router.get('/', batchController.getBatches);


// Assign students and coaches to a batch
router.post('/assign', batchController.assignStudentCoach);

// Remove a student from a batch
router.delete('/remove-student/:batchId/:studentId', batchController.removeStudentFromBatch);

// Remove a coach from a batch
router.delete('/remove-coach/:batchId/:coachId', batchController.removeCoachFromBatch);

module.exports = router;
