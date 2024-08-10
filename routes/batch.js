const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const setDatabaseConnection = require('../middleware/setDatabaseConnection');
const BatchSchema = require('../models/Batch').schema;
const CourseSchema = require('../models/Course').schema;
const StudentSchema = require('../models/Student').schema;
const CoachSchema = require('../models/Coach').schema;

// Helper function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Add a new batch
router.post('/batch', setDatabaseConnection, async (req, res) => {
  try {
    const Batch = req.db.model('Batch', BatchSchema);
    const Course = req.db.model('Course', CourseSchema);
    const newBatch = new Batch({
      ...req.body,
      organization: req.organization._id
    });
    await newBatch.save();

    // Update the course with the new batch
    await Course.findByIdAndUpdate(
      newBatch.course,
      { $push: { batches: newBatch._id } },
      { new: true }
    );

    res.status(201).send(newBatch);
  } catch (error) {
    console.error('Error adding batch:', error);
    res.status(400).send({ error: 'Invalid data provided' });
  }
});

// Assign students and coaches to a batch
router.post('/batch/assign', setDatabaseConnection, async (req, res) => {
  const { batchId, studentIds, coachIds } = req.body;

  try {
    const Batch = req.db.model('Batch', BatchSchema);
    const Student = req.db.model('Student', StudentSchema);
    const Coach = req.db.model('Coach', CoachSchema);

    const batch = await Batch.findById(batchId);

    if (!batch) {
      return res.status(404).send({ error: 'Batch not found' });
    }

    if (studentIds && studentIds.length) {
      batch.students.push(...studentIds);
      await Student.updateMany({ _id: { $in: studentIds } }, { $addToSet: { batches: batchId, courses: batch.course } });
    }

    if (coachIds && coachIds.length) {
      batch.coaches.push(...coachIds);
      await Coach.updateMany({ _id: { $in: coachIds } }, { $addToSet: { batches: batchId, courses: batch.course } });
    }

    await batch.save();

    res.send(batch);
  } catch (error) {
    console.error('Error assigning students/coaches:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

// Remove a student from a batch
router.delete('/batch/remove-student/:batchId/:studentId', setDatabaseConnection, async (req, res) => {
  try {
    const { batchId, studentId } = req.params;

    const Batch = req.db.model('Batch', BatchSchema);
    const Student = req.db.model('Student', StudentSchema);

    const batch = await Batch.findByIdAndUpdate(
      batchId,
      { $pull: { students: studentId } },
      { new: true }
    );

    if (!batch) {
      return res.status(404).send({ error: 'Batch not found' });
    }

    await Student.findByIdAndUpdate(studentId, { $pull: { batches: batchId } });

    res.send(batch);
  } catch (error) {
    console.error('Error removing student from batch:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

// Remove a coach from a batch
router.delete('/batch/remove-coach/:batchId/:coachId', setDatabaseConnection, async (req, res) => {
  try {
    const { batchId, coachId } = req.params;

    const Batch = req.db.model('Batch', BatchSchema);
    const Coach = req.db.model('Coach', CoachSchema);

    const batch = await Batch.findByIdAndUpdate(
      batchId,
      { $pull: { coaches: coachId } },
      { new: true }
    );

    if (!batch) {
      return res.status(404).send({ error: 'Batch not found' });
    }

    await Coach.findByIdAndUpdate(coachId, { $pull: { batches: batchId } });

    res.send(batch);
  } catch (error) {
    console.error('Error removing coach from batch:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

// Update a specific batch by ID
router.patch('/batch/:id', setDatabaseConnection, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).send({ error: 'Invalid batch ID' });
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'startDate', 'endDate', 'timeSlot', 'days', 'students', 'coaches'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' });
    }

    const Batch = req.db.model('Batch', BatchSchema);

    const batch = await Batch.findOneAndUpdate(
      { _id: req.params.id, organization: req.organization._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!batch) {
      return res.status(404).send({ error: 'Batch not found' });
    }

    res.send(batch);
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(400).send({ error: 'Invalid data provided' });
  }
});

// Delete a specific batch by ID
router.delete('/batch/:id', setDatabaseConnection, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).send({ error: 'Invalid batch ID' });
    }

    const Batch = req.db.model('Batch', BatchSchema);
    const Course = req.db.model('Course', CourseSchema);

    const batch = await Batch.findOneAndDelete({ _id: req.params.id, organization: req.organization._id });

    if (!batch) {
      return res.status(404).send({ error: 'Batch not found' });
    }

    // Update the course to remove the deleted batch
    await Course.findByIdAndUpdate(batch.course, { $pull: { batches: req.params.id } });

    res.send({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

// Get students and coaches for a batch and populate details
router.get('/batch/:id', setDatabaseConnection, async (req, res) => {
  try {
    const Batch = req.db.model('Batch', BatchSchema);
    const batch = await Batch.findById(req.params.id)
      .populate('students', 'firstName lastName image')
      .populate('coaches', 'firstName lastName image')
      .exec();

    if (!batch) {
      return res.status(404).send({ error: 'Batch not found' });
    }

    res.send(batch);
  } catch (error) {
    console.error('Error fetching batch details:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

module.exports = router;
