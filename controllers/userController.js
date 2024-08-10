const User = require('../models/Users');
const mongoose = require('mongoose');

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
    const { studentIds, coachIds, batchId, courseId } = req.body;

    if (!batchId || !studentIds || !coachIds || !courseId) {
      return res.status(400).send({ error: 'Missing batchId, studentIds, coachIds, or courseId' });
    }

    const organizationId = req.headers.organizationid;

    if (!organizationId) {
      return res.status(400).send({ error: 'Missing organization ID' });
    }

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

    res.status(200).send({ message: 'Students and coaches successfully assigned to the batch.' });
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

// Create a new coach
exports.addCoach = async (req, res) => {
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
      
      organizationId,
      permissions
    } = req.body;

    // Check if a coach with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

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
      password: 'password123', // Ensure password hashing is done before saving
      role: 'coach',
      organizationId: organizationId, // Convert to ObjectId
      permissions,
    });

    await newCoach.save();

    res.status(201).json({ message: 'Coach added successfully', coach: newCoach });
  } catch (error) {
    console.error('Error adding coach:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
