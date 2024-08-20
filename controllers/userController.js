const User = require('../models/Users');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Category = require('../models/Category');
const Batch = require('../models/Batch');
const Payment = require('../models/Payment');
const Cart = require('../models/Cart');


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
  //console.log(organizationId, studentId);
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
  //console.log('Organization ID from request:', organizationId);

  try {
    // Check the data in the database
    const coaches = await User.find({ role: 'coach', 'organizations.org_id': organizationId });
    //console.log('Coaches found:', coaches);

    res.json(coaches);
  } catch (error) {
    console.error('Error fetching coaches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all coaches for a given organization
exports.getOrgStudents = async (req, res) => {
  const organizationId = req.params.organizationId;
 // console.log('Organization ID from request:', organizationId);

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

exports.getOrgParents = async (req, res) => {
  const organizationId = req.params.organizationId;
 // console.log('Organization ID from request:', organizationId);

  try {
    // Check the data in the database
    const students = await User.find({ role: 'parent', 'organizations.org_id': organizationId });
    //console.log('Coaches found:', coaches);

    res.json(students);
  } catch (error) {
    console.error('Error fetching parents:', error);
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
    const { studentIds, coachIds, batchId, courseId, paymentAmounts, paymentMethod, transactionId } = req.body;

    if (!batchId || !studentIds || !coachIds || !courseId || !paymentAmounts || !transactionId) {
      console.log(batchId, studentIds, coachIds, courseId, paymentAmounts, transactionId);
      return res.status(400).send({ error: 'Missing batchId, studentIds, coachIds, courseId, or paymentAmounts' });
    }

    const organizationId = req.headers.organizationid;
    if (!organizationId) {
      return res.status(400).send({ error: 'Missing organization ID' });
    }

    const batch = await Batch.findById(batchId); 
    if (!batch) {
      return res.status(404).send({ error: 'Batch not found' });
    }

    for (let i = 0; i < studentIds.length; i++) {
      const studentId = studentIds[i];
      const paymentAmount = paymentAmounts[i];

      // Create a Payment record for each student
      const payment = new Payment({
        transactionId: generateTransactionId('course'),
        userId: studentId,
        organizationId,
        itemType: 'course',
        itemId: courseId,
        amount: paymentAmount,
        paymentMethod,
        paymentStatus: 'pending'
      });

      await payment.save();

      // Add the payment to the cart
      let cart = await Cart.findOne({ userId: studentId });

      if (!cart) {
        cart = new Cart({ userId: studentId, items: [] });
      }

      cart.items.push({
        userId: studentId,
        paymentId: payment._id,
        organizationId,
        itemType: 'course',
        itemId: courseId,
        price: paymentAmount,
        quantity: 1,
        status: 'pending'
      });

      await cart.save();

      // Check if student is already assigned to the batch
      const existingPayment = batch.studentPayments.find(sp => sp.studentId.toString() === studentId);
      if (!existingPayment) {
        batch.studentPayments.push({
          studentId,
          paymentAmount,
          paymentStatus: 'pending',
          paymentId: payment._id // Link to the created Payment document
        });
      }

      // Ensure the student is in the students array
      if (!batch.students.includes(studentId)) {
        batch.students.push(studentId);
      }
    }

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

    res.status(200).send({ message: 'Students and coaches successfully assigned to the batch with payment status and added to cart.' });
  } catch (error) {
    console.error('Error assigning students to coach:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
};

function generateTransactionId(itemType) {
  let prefix = '';

  switch (itemType) {
    case 'booking':
      prefix = 'bki_';
      break;
    case 'course':
      prefix = 'crs_';
      break;
    case 'ecom':
      prefix = 'com_';
      break;
    case 'combined':
      prefix = 'cmd_';
      break;
    default:
      prefix = 'txn_';
      break;
  }

  return prefix + Math.random().toString(36).substr(2, 9);
}

exports.getAssignedStudents = async (req, res) => {
  const { courseId, batchId } = req.params;
  const organizationId = req.headers.organizationid;

  try {
    // Fetch the batch with the student payments
    const batch = await Batch.findOne({ _id: batchId, course: courseId })
      .populate({
        path: 'studentPayments.studentId',
        select: 'firstName lastName email profilePhoto' // Select relevant fields from the User model
      })
      .exec();

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Prepare the list of students with their payment status
    const studentsWithPaymentStatus = batch.studentPayments.map(payment => ({
      studentId: payment.studentId._id,
      firstName: payment.studentId.firstName,
      lastName: payment.studentId.lastName,
      email: payment.studentId.email,
      profilePhoto: payment.studentId.profilePhoto,
      paymentStatus: payment.paymentStatus,
      paymentAmount: payment.paymentAmount,
      paymentDate: payment.paymentDate,
    }));

    res.json(studentsWithPaymentStatus);
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
  //console.log(organizationId);

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

// Controller to fetch coach details
exports.getCoachDetails = async (req, res) => {
  try {
    const coachId = req.params.coachId;
    const coach = await User.findById(coachId)
      .populate('organizations.org_id', 'name')
      .exec();

    if (!coach || coach.role !== 'coach') {
      return res.status(404).json({ message: 'Coach not found' });
    }

    res.status(200).json(coach);
  } catch (error) {
    console.error('Error fetching coach details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Controller to fetch the schedule for a specific day
exports.getCoachScheduleByDate = async (req, res) => {
  try {
    const { coachId, date } = req.params;
    const selectedDate = new Date(date);
    const batches = await Batch.find({
      coaches: coachId,
      startDate: { $lte: selectedDate },
      endDate: { $gte: selectedDate }
    })
      .populate('course', 'name')
      .exec();

    if (!batches.length) {
      return res.status(404).json({ message: 'No schedules found for this date' });
    }

    const schedule = batches.map(batch => ({
      courseName: batch.course.name,
      batchName: batch.name,
      timeSlot: batch.timeSlot,
      studentsCount: batch.students.length,
      days: batch.days
    }));

    res.status(200).json({ schedule });
  } catch (error) {
    console.error('Error fetching schedule for the date:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Controller to fetch the coach calendar for a specific month
exports.getCoachCalendar = async (req, res) => {
  try {
    const { coachId } = req.params;
    const { month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const batches = await Batch.find({
      coaches: coachId,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    }).populate('course');

    if (!batches) {
      return res.status(404).json({ error: 'No batches found' });
    }

    const calendar = generateCalendar(batches, month, year);

    res.status(200).json({ calendar });
  } catch (error) {
    console.error('Error fetching coach calendar:', error);
    res.status(500).json({ error: 'Failed to fetch coach calendar' });
  }
};

function generateCalendar(batches, month, year) {
  const weeksInMonth = [];
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  let currentDay = new Date(firstDayOfMonth);

  while (currentDay <= lastDayOfMonth) {
    const week = new Array(7).fill(null);
    for (let i = 0; i < 7; i++) {
      if (currentDay.getDay() === i && currentDay <= lastDayOfMonth) {
        week[i] = {
          date: currentDay.getDate(),
          hasSchedule: false,
          schedule: []
        };
        currentDay.setDate(currentDay.getDate() + 1);
      }
    }
    weeksInMonth.push(week);
  }

  batches.forEach(batch => {
    batch.days.forEach(day => {
      const dayIndex = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(day);
      weeksInMonth.forEach(week => {
        if (week[dayIndex]) {
          week[dayIndex].hasSchedule = true;
          week[dayIndex].schedule.push({
            courseName: batch.course.name,
            batchName: batch.name,
            timeSlot: batch.timeSlot,
            studentsCount: batch.students.length
          });
        }
      });
    });
  });

  return weeksInMonth;
}
// Get coach availability
exports.getCoachAvailability = async (req, res) => {
  try {
    const { coachId } = req.params;

    const coach = await User.findById(coachId).select('availability');

    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' });
    }

    res.status(200).json({ availability: coach.availability || [] });
  } catch (error) {
    console.error('Error fetching coach availability:', error);
    res.status(500).json({ error: 'Failed to fetch coach availability' });
  }
};

exports.updateCoachAvailability = async (req, res) => {
  try {
    const { coachId } = req.params;
    let { availability } = req.body;
    initializeAvailability();
    // Ensure every entry has dayOfWeek and at least one valid timeSlot
    availability = availability.filter(a => a.dayOfWeek && a.timeSlots.length > 0);
    // console.log('availability:', availability);
    const coach = await User.findById(coachId);
    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' });
    }

    coach.availability = availability;
    await coach.save();

    res.status(200).json({ message: 'Availability updated successfully' });
  } catch (error) {
    console.error('Error updating coach availability:', error);
    res.status(500).json({ error: 'Failed to update coach availability' });
  }
};
function initializeAvailability() {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return daysOfWeek.map(day => ({
    dayOfWeek: day,
    isAvailable: false,
    timeSlots: []
  }));
}
