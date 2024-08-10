const Batch = require('../models/Batch');
const Course = require('../models/Course');
const Student = require('../models/Student');
const Coach = require('../models/Coach');

// Create a new batch
exports.createBatch = async (req, res) => {
  const { name, startDate, endDate, timeSlot, days, repeatInterval, course, students, coaches } = req.body;

  try {
    const batch = new Batch({
      name,
      startDate,
      endDate,
      timeSlot,
      days,
      repeatInterval,
      course,
      students,
      coaches
    });

    await batch.save();

    const courseDoc = await Course.findById(course);
    if (courseDoc) {
      courseDoc.batches.push(batch._id);
      await courseDoc.save();
    }

    res.status(201).json(batch);
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update an existing batch
exports.updateBatch = async (req, res) => {
  const { batchId } = req.params;
  const { name, startDate, endDate, timeSlot, days, repeatInterval, students, coaches } = req.body;

  try {
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    batch.name = name || batch.name;
    batch.startDate = startDate || batch.startDate;
    batch.endDate = endDate || batch.endDate;
    batch.timeSlot = timeSlot || batch.timeSlot;
    batch.days = days || batch.days;
    batch.repeatInterval = repeatInterval || batch.repeatInterval;
    batch.students = students || batch.students;
    batch.coaches = coaches || batch.coaches;

    await batch.save();
    res.json(batch);
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a batch
exports.deleteBatch = async (req, res) => {
  const { batchId } = req.params;

  try {
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const course = await Course.findById(batch.course);
    if (course) {
      course.batches.pull(batch._id);
      await course.save();
    }

    await batch.remove();
    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all batches
exports.getBatches = async (req, res) => {
  try {
    const batches = await Batch.find();
    res.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a specific batch by ID
exports.getBatchById = async (req, res) => {
  const { batchId } = req.params;
  console.log( batchId);
  try {
    const batch = await Batch.findById(batchId).populate('students coaches');
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    res.json(batch);
  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Assign students and coaches to a batch
exports.assignStudentCoach = async (req, res) => {
  const { studentIds, coachIds, batchId } = req.body;

  try {
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const students = await Student.find({ _id: { $in: studentIds } });
    const coaches = await Coach.find({ _id: { $in: coachIds } });

    batch.students.push(...students.map(student => student._id));
    batch.coaches.push(...coaches.map(coach => coach._id));

    await batch.save();

    res.json(batch);
  } catch (error) {
    console.error('Error assigning students/coaches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove a student from a batch
exports.removeStudentFromBatch = async (req, res) => {
  const { batchId, studentId } = req.params;

  try {
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    batch.students.pull(studentId);
    await batch.save();

    res.json({ message: 'Student removed from batch' });
  } catch (error) {
    console.error('Error removing student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove a coach from a batch
exports.removeCoachFromBatch = async (req, res) => {
  const { batchId, coachId } = req.params;

  try {
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    batch.coaches.pull(coachId);
    await batch.save();

    res.json({ message: 'Coach removed from batch' });
  } catch (error) {
    console.error('Error removing coach:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
