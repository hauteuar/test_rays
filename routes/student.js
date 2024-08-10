const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const setDatabaseConnection = require('../middleware/setDatabaseConnection');
const StudentSchema = require('../models/Student').schema;
const BatchSchema = require('../models/Batch').schema;
const UserSchema = require('../models/User').schema;
const CourseSchema = require('../models/Course').schema;
const Organization = require('../models/Organization').schema;
const multer = require('multer');

// Helper function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const upload = multer({ dest: 'uploads/' }); // Set the destination for uploaded files

// Get students assigned to a specific course and coach
router.get('/students/assigned', setDatabaseConnection, async (req, res) => {
  try {
    const { courseId, coachId } = req.query;
    const organizationName = req.headers['organizationname'];

    if (!isValidObjectId(courseId) || !isValidObjectId(coachId)) {
      return res.status(400).send({ error: 'Invalid IDs' });
    }

    const Organization = req.db.model('Organization', OrganizationSchema);
    const Course = req.db.model('Course', CourseSchema);
    const Student = req.db.model('Student', StudentSchema);
    const User = req.db.model('User', UserSchema);

    // Find the organization by name
    const organization = await Organization.findOne({ name: organizationName });
    if (!organization) {
      return res.status(404).send({ error: 'Organization not found' });
    }

    // Find the course and populate students
    const course = await Course.findById(courseId).populate('students');
    if (!course) {
      return res.status(404).send({ error: 'Course not found' });
    }

    // Filter students based on the coach and organization
    const assignedStudents = await Student.find({
      _id: { $in: course.students },
      coach: coachId,
      organization: organization._id
    });

    res.send(assignedStudents);
  } catch (error) {
    console.error('Error fetching assigned students:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

// Add student to a batch and course
router.post('/students/enroll', setDatabaseConnection, async (req, res) => {
  try {
    const { studentId, courseId, batchId } = req.body;
    if (!isValidObjectId(studentId) || !isValidObjectId(courseId) || !isValidObjectId(batchId)) {
      return res.status(400).send({ error: 'Invalid IDs' });
    }

    const Student = req.db.model('Student', StudentSchema);
    const Batch = req.db.model('Batch', BatchSchema);
    const Course = req.db.model('Course', CourseSchema);

    let student = await Student.findById(studentId);
    if (!student) {
      student = new Student({
        ...req.body,
        organization: req.organization._id
      });
    }

    student.courses.addToSet(courseId);
    student.batches.addToSet(batchId);
    await student.save();

    await Batch.findByIdAndUpdate(batchId, { $addToSet: { students: studentId } });
    await Course.findByIdAndUpdate(courseId, { $addToSet: { students: studentId } });

    res.status(201).send(student);
  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

// Add an assignment to a student
router.post('/students/:id/assignments', setDatabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, coachId } = req.body;

    if (!isValidObjectId(id) || !isValidObjectId(coachId)) {
      return res.status(400).send({ error: 'Invalid IDs' });
    }

    const Student = req.db.model('Student', StudentSchema);
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).send({ error: 'Student not found' });
    }

    student.assignments.push({ title, description, dueDate, coach: coachId });
    await student.save();

    res.status(201).send(student);
  } catch (error) {
    console.error('Error adding assignment:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

// Update a student's fitness data
router.post('/students/:id/fitness', setDatabaseConnection, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, data } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).send({ error: 'Invalid student ID' });
    }

    const Student = req.db.model('Student', StudentSchema);
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).send({ error: 'Student not found' });
    }

    student.fitnessData.push({ date, data });
    await student.save();

    res.status(201).send(student);
  } catch (error) {
    console.error('Error updating fitness data:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

router.get('/students/enrolled/:courseId', setDatabaseConnection, async (req, res) => {
  try {
    const { courseId } = req.params;
   
    const Student = req.db.model('Student', StudentSchema);
    const Course = req.db.model('Course', CourseSchema);

    const course = await Course.findById(courseId).populate('students');

    if (!course) {
      return res.status(404).send('Course not found');
    }

    const enrolledStudentIds = course.students.map(student => student._id);
    const studentsEnrolled = await Student.find({ _id: { $in: enrolledStudentIds } });

    res.status(200).json(studentsEnrolled);
  } catch (error) {
    console.error('Error fetching enrolled students:', error);
    res.status(500).send('Server error');
  }
});

router.get('/students/not-enrolled/:courseId', setDatabaseConnection, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const Student = req.db.model('Student', StudentSchema);
    const Course = req.db.model('Course', CourseSchema);
    console.log('call came:');
    const course = await Course.findById(courseId).populate('students');
    
    if (!course) {
      return res.status(404).send('Course not found');
    }

    const enrolledStudentIds = course.students.map(student => student._id);
    const studentsNotEnrolled = await Student.find({ _id: { $nin: enrolledStudentIds } });

    res.status(200).json(studentsNotEnrolled);
  } catch (error) {
    console.error('Error fetching students not enrolled:', error);
    res.status(500).send('Server error');
  }
});



// Add a new student
router.post('/students', setDatabaseConnection, upload.single('profilePicture'), async (req, res) => {
  try {
    const Student = req.db.model('Student', StudentSchema);
    const studentData = req.body;
    if (req.file) {
      studentData.profilePicture = req.file.path;
    }

    const newStudent = new Student(studentData);
    await newStudent.save();

    res.status(201).send(newStudent);
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(400).send({ error: 'Invalid data provided' });
  }
});

// Get student details by ID
router.get('/students/:id', setDatabaseConnection, async (req, res) => {
  try {
    const Student = req.db.model('Student', StudentSchema);
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).send({ error: 'Student not found' });
    }

    res.send(student);
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

module.exports = router;
