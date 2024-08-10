const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const setDatabaseConnection = require('../middleware/setDatabaseConnection');
const { ensureAuthenticated } = require('../config/auth');

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Create a new assignment with file uploads
router.post('/assignments', setDatabaseConnection, ensureAuthenticated, upload.array('files'), async (req, res) => {
  const { course, students, title, description, organization } = req.body;
  const files = req.files;

  try {
    const Assignment = req.db.model('Assignment');

    const documents = files.filter(file => file.mimetype.includes('document')).map(file => file.path);
    const videos = files.filter(file => file.mimetype.includes('video')).map(file => file.path);
    const audio = files.filter(file => file.mimetype.includes('audio')).map(file => file.path);
    const images = files.filter(file => file.mimetype.includes('image')).map(file => file.path);

    const assignment = new Assignment({
      course,
      students: JSON.parse(students),
      title,
      description,
      documents,
      videos,
      audio,
      images,
      organization,
      status: JSON.parse(students).map(student => ({ student, submitted: false }))
    });

    await assignment.save();

    // Create tasks for each student
    const Task = req.db.model('Task');
    JSON.parse(students).forEach(async studentId => {
      const task = new Task({
        student: studentId,
        assignment: assignment._id,
        organization,
        status: 'Pending'
      });
      await task.save();
    });

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Error creating assignment' });
  }
});

// Get assignments for a coach
router.get('/coach/:coachId', setDatabaseConnection, ensureAuthenticated, async (req, res) => {
  try {
    const Assignment = req.db.model('Assignment');
    const assignments = await Assignment.find({ coach: req.params.coachId }).populate('course').populate('students');
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching assignments' });
  }
});

// Get assignments for a student
router.get('/student/:studentId', setDatabaseConnection, ensureAuthenticated, async (req, res) => {
  try {
    const Assignment = req.db.model('Assignment');
    const assignments = await Assignment.find({ students: req.params.studentId }).populate('course').populate('coach');
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching assignments' });
  }
});

// Get a specific assignment
router.get('/:id', setDatabaseConnection, ensureAuthenticated, async (req, res) => {
  try {
    const Assignment = req.db.model('Assignment');
    const assignment = await Assignment.findById(req.params.id).populate('course').populate('students').populate('coach');
    res.status(200).json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching assignment' });
  }
});

// Update assignment status
router.put('/status/:assignmentId', setDatabaseConnection, ensureAuthenticated, async (req, res) => {
  const { studentId, submitted } = req.body;
  try {
    const Assignment = req.db.model('Assignment');
    const assignment = await Assignment.findById(req.params.assignmentId);
    const statusIndex = assignment.status.findIndex(status => status.student.toString() === studentId);
    if (statusIndex >= 0) {
      assignment.status[statusIndex].submitted = submitted;
    } else {
      assignment.status.push({ student: studentId, submitted });
    }
    await assignment.save();

    // Update the task status
    const Task = req.db.model('Task');
    const task = await Task.findOne({ student: studentId, assignment: req.params.assignmentId });
    if (task) {
      task.status = submitted ? 'Submitted' : 'Pending';
      task.submittedAt = submitted ? new Date() : null;
      await task.save();
    }

    res.status(200).json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Error updating status' });
  }
});

module.exports = router;
