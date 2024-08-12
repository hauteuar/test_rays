const User = require('../models/Users');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Category = require('../models/Category');
const batch = require('../models/Batch');

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('organizations.org_id').exec();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getStudentsById = async (req, res) => {
  const { organizationId, studentId } = req.params;

  //const organizationId = req.headers.organizationid;
  console.log(organizationId, studentId);
  try {
    // Find the student by ID and organization ID
    const student = await User.findOne({
      _id: studentId,
      role: 'student',
      'organizations.org_id': organizationId
    })
    .populate('organizations.org_id') // Populate the organization details
    .exec();

    if (!student) {
      return res.status(404).json({ error: 'Student not found in the specified organization' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all users
exports.getAllUsersByOrg = async (req, res) => {
  const organizationId = req.params.organizationId;
  try {
    const users = await User.find({'organizations.org_id': organizationId });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// Get a specific user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all coaches for a given organization
exports.getCoaches = async (req, res) => {
  const organizationId = req.params.organizationId;
  console.log('Organization ID from request:', organizationId);

  try {
    // Check the data in the database
    const coaches = await User.find({ role: 'coach', 'organizations.org_id': organizationId });
    console.log('Coaches found:', coaches);

    res.json(coaches);
  } catch (error) {
    console.error('Error fetching coaches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all coaches for a given organization
exports.getOrgStudents = async (req, res) => {
  const organizationId = req.params.organizationId;
  console.log('Organization ID from request:', organizationId);

  try {
    // Check the data in the database
    const students = await User.find({ role: 'student', 'organizations.org_id': organizationId });
    //console.log('Coaches found:', coaches);

    res.json(students);
  } catch (error) {
    console.error('Error fetching coaches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// Create a new user
exports.createUser = async (req, res) => {
  const userData = req.body;
  try {
    const newUser = new User(userData);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a user by ID
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a user by ID
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get students not enrolled in a specific course
exports.getStudentsNotEnrolled = async (req, res) => {
  const courseId = req.params.courseId;
  const organizationId = req.headers.organizationid; // Assuming organizationId is passed in headers

  try {
    const studentsNotEnrolled = await User.find({
      role: 'student',
      'organizations': {
        $elemMatch: {
          org_id: organizationId,
          'courses.course_id': { $ne: courseId }
        }
      }
    });

    res.json(studentsNotEnrolled);
  } catch (error) {
    console.error('Error fetching students not enrolled:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get coaches not assigned to a specific batch
exports.getCoachesNotAssigned = async (req, res) => {
  const batchId = req.params.batchId;
  const organizationId = req.headers.organizationid; // Assuming organizationId is passed in headers

  try {
    const coachesNotAssigned = await User.find({
      role: 'coach',
      'organizations': {
        $elemMatch: {
          org_id: organizationId,
          'courses.batches.batch_id': { $ne: batchId }
        }
      }
    });

    res.json(coachesNotAssigned);
  } catch (error) {
    console.error('Error fetching coaches not assigned:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.assignStudentsToCoach = async (req, res) => {
  try {
    const { studentIds, coachIds, batchId, courseId, paymentAmounts } = req.body;

    if (!batchId || !studentIds || !coachIds || !courseId || !paymentAmounts) {
      return res.status(400).send({ error: 'Missing batchId, studentIds, coachIds, courseId, or paymentAmounts' });
    }

    const organizationId = req.headers.organizationid;

    if (!organizationId) {
      return res.status(400).send({ error: 'Missing organization ID' });
    }

    // Update students in the batch and set payment status
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).send({ error: 'Batch not found' });
    }

    studentIds.forEach((studentId, index) => {
      // Check if student is already assigned to the batch
      const existingPayment = batch.studentPayments.find(sp => sp.studentId.toString() === studentId);
      if (!existingPayment) {
        batch.studentPayments.push({
          studentId,
          paymentAmount: paymentAmounts[index],
          paymentStatus: 'pending', // Start with pending status
        });
      }

      // Ensure the student is in the students array
      if (!batch.students.includes(studentId)) {
        batch.students.push(studentId);
      }
    });

    await batch.save();

    // Update User model for students
    await User.updateMany(
      { _id: { $in: studentIds }, 'organizations.org_id': organizationId },
      {
        $set: {
          'organizations.$[org].courses': {
            $cond: {
              if: { $isArray: "$organizations.$[org].courses" },
              then: "$organizations.$[org].courses",
              else: []
            }
          }
        }
      },
      {
        arrayFilters: [{ 'org.org_id': organizationId }]
      }
    );

    await User.updateMany(
      { _id: { $in: studentIds }, 'organizations.org_id': organizationId, 'organizations.courses.course_id': { $ne: courseId } },
      {
        $addToSet: { 'organizations.$[org].courses': { course_id: courseId, coach_id: coachIds[0], batches: [] } }
      },
      { arrayFilters: [{ 'org.org_id': organizationId }] }
    );

    const studentUpdateResult = await User.updateMany(
      { _id: { $in: studentIds }, 'organizations.org_id': organizationId, 'organizations.courses.course_id': courseId },
      {
        $addToSet: { 'organizations.$[org].courses.$[course].batches': { batch_id: batchId, role: 'student' } }
      },
      {
        arrayFilters: [
          { 'org.org_id': organizationId },
          { 'course.course_id': courseId }
        ]
      }
    );

    // Update User model for coaches
    await User.updateMany(
      { _id: { $in: coachIds }, 'organizations.org_id': organizationId },
      {
        $set: {
          'organizations.$[org].courses': {
            $cond: {
              if: { $isArray: "$organizations.$[org].courses" },
              then: "$organizations.$[org].courses",
              else: []
            }
          }
        }
      },
      {
        arrayFilters: [{ 'org.org_id': organizationId }]
      }
    );

    await User.updateMany(
      { _id: { $in: coachIds }, 'organizations.org_id': organizationId, 'organizations.courses.course_id': { $ne: courseId } },
      {
        $addToSet: { 'organizations.$[org].courses': { course_id: courseId, coach_id: coachIds[0], batches: [] } }
      },
      { arrayFilters: [{ 'org.org_id': organizationId }] }
    );

    const coachUpdateResult = await User.updateMany(
      { _id: { $in: coachIds }, 'organizations.org_id': organizationId, 'organizations.courses.course_id': courseId },
      {
        $addToSet: { 'organizations.$[org].courses.$[course].batches': { batch_id: batchId, role: 'coach', students: studentIds } }
      },
      {
        arrayFilters: [
          { 'org.org_id': organizationId },
          { 'course.course_id': courseId }
        ]
      }
    );

    res.status(200).send({ message: 'Students and coaches successfully assigned to the batch with payment status.' });
  } catch (error) {
    console.error('Error assigning students to coach:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
};

exports.getAssignedStudents = async (req, res) => {
  const { courseId, batchId } = req.params;
  const organizationId = req.headers.organizationid;

  try {
      const students = await User.find({
          role: 'student',
          'organizations': {
              $elemMatch: {
                  org_id: organizationId,
                  'courses.course_id': courseId,
                  'courses.batches.batch_id': batchId
              }
          }
      });

      res.json(students);
  } catch (error) {
      console.error('Error fetching assigned students:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAssignedCoaches = async (req, res) => {
  const { courseId, batchId } = req.params;
  const organizationId = req.headers.organizationid;

  try {
      const coaches = await User.find({
          role: 'coach',
          'organizations': {
              $elemMatch: {
                  org_id: organizationId,
                  'courses.course_id': courseId,
                  'courses.batches.batch_id': batchId
              }
          }
      });

      res.json(coaches);
  } catch (error) {
      console.error('Error fetching assigned coaches:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};




exports.getAssignedCoachesByCourseId = async (req, res) => {
  const { courseId, coachId } = req.params;
  const organizationId = req.headers.organizationid;

  try {
    const students = await User.find({
      role: 'student',
      'organizations': {
        $elemMatch: {
          org_id: organizationId,
          'courses.course_id': courseId,
          'courses.coach_id': coachId
        }
      }
    });

    res.json(students);
  } catch (error) {
    console.error('Error fetching assigned students for coach under course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.addCoach = async (req, res) => {
  const organizationId = req.params.organizationId;
  console.log(organizationId);

  try {
    const {
      firstName,
      lastName,
      dob,
      gender,
      email,
      contactNumber,
      emergencyContactNumber,
      address,
      permissions,
      category // Assuming the category name or ID is passed in the body
    } = req.body;

    // Check if a coach with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Find the category by name or ID
    let categoryDoc;
    if (mongoose.Types.ObjectId.isValid(category)) {
      categoryDoc = await Category.findById(category);
    } else {
      categoryDoc = await Category.findOne({ name: category });
    }

    if (!categoryDoc) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash('password123', 10); // Use a secure password policy
    
    // Create a new coach
    const newCoach = new User({
      firstName,
      lastName,
      dob,
      gender,
      email,
      contactNumber,
      emergencyContactNumber,
      address,
      password: hashedPassword, // Store the hashed password
      role: 'coach',
      permissions,
      organizations: [
        {
          org_id: organizationId,
          courses: [] // Initialize with empty courses, can be populated later
        }
      ]
    });

    await newCoach.save();

    // Add the coach to the specified category
    categoryDoc.coaches.push(newCoach._id);
    await categoryDoc.save();

    res.status(201).json({ message: 'Coach added successfully', coach: newCoach });
  } catch (error) {
    console.error('Error adding coach:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};