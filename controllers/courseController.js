const mongoose = require('mongoose');
const Course = require('../models/Course');
const Organization = require('../models/Organizations'); 
const User = require('../models/Users');


const Batch = require('../models/Batch');    // Add this line
const Payment = require('../models/Payment'); // Add this line
const Cart = require('../models/Cart');

exports.createCourse = async (req, res) => {
  const { title, description, duration, price, location, mode, startDate, endDate, bannerImage, coaches, groundBookings, discounts } = req.body;
  const organizationId = req.headers.organizationid;

  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const course = new Course({
      title,
      description,
      duration,
      price,
      location,
      mode,
      startDate,
      endDate,
      bannerImage,
      coaches,
      groundBookings,
      discounts,
      organization: organization._id
    });

    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateCourse = async (req, res) => {
  const { courseId } = req.params;
  const { batches } = req.body;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    course.batches = batches;
    await course.save();
    res.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getCourses = async (req, res) => {
  const organizationId = req.headers.organizationid;

  try {
    const courses = await Course.find({ organization: organizationId });
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getCourseById = async (req, res) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
exports.getCoursesForCoach = async (req, res) => {
  const { coachId } = req.params;  // This is coming from the query parameters
  const organizationId = req.headers.organizationid;  // The organization ID from headers
  //console.log('coachId', coachId);
  try {
    // Ensure coachId is a valid ObjectId
    if (!coachId) {
      return res.status(400).json({ error: 'Invalid coach ID' });
    }

    // Find courses by coach ID and organization ID
    const courses = await Course.find({
      organization: organizationId,
      coaches: coachId // Ensuring coachId is converted to ObjectId
    });

    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses for coach:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getUnassignedCourses = async (req, res) => {
  const userId = req.params.userId;
  const organizationId = req.headers.organizationid;
  console.log(userId, organizationId);

  try {
      // Fetch user to get assigned courses
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      const orgData = user.organizations.find(org =>
          org.org_id && org.org_id.toString() === organizationId.toString()
      );

      if (!orgData) {
          return res.status(404).json({ message: 'Organization not found for this user' });
      }

      // Ensure courses exist and have course_id defined
      const assignedCourseIds = orgData.courses
          ? orgData.courses
              .filter(course => course && course.course_id) // Filter out undefined or null courses
              .map(course => course.course_id.toString())
          : [];
       
      // Fetch courses not assigned to the user
      const courses = await Course.find({
          organization: organizationId,
          _id: { $nin: assignedCourseIds } // Exclude assigned courses
      }).populate('batches');
     console.log(courses);
      res.json(courses);
  } catch (error) {
      console.error('Error fetching unassigned courses:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};


exports.getAssignedCourses = async (req, res) => {
  const userId = req.params.userId;
  const organizationId = req.headers.organizationid;
  console.log(userId, organizationId);

  try {
      // Fetch user to get assigned courses
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      const orgData = user.organizations.find(org =>
          org.org_id && org.org_id.toString() === organizationId.toString()
      );

      if (!orgData) {
          return res.status(404).json({ message: 'Organization not found for this user' });
      }

      // Ensure courses exist and have course_id defined
      const assignedCourseIds = orgData.courses
          ? orgData.courses
              .filter(course => course && course.course_id) // Filter out undefined or null courses
              .map(course => course.course_id.toString())
          : [];

      // Fetch only assigned courses
      const courses = await Course.find({
          organization: organizationId,
          _id: { $in: assignedCourseIds } // Only include assigned courses
      }).populate('batches');

      console.log(courses); // Log the fetched courses
      res.json(courses);
  } catch (error) {
      console.error('Error fetching assigned courses:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};
