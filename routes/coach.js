const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const setDatabaseConnection = require('../middleware/setDatabaseConnection');
const CoachSchema = require('../models/Coach').schema;
const CategorySchema = require('../models/Category').schema;
const CourseSchema = require('../models/Course').schema;
const BatchSchema = require('../models/Batch').schema;
const UserSchema = require('../models/User').schema;
const OrganizationSchema = require('../models/Organization').schema;

// Helper function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get all coaches
router.get('/coaches', setDatabaseConnection, async (req, res) => {
  try {
    const Coach = req.db.model('Coach', CoachSchema);
    const coaches = await Coach.find({ organization: req.organization._id });
    res.send(coaches);
  } catch (error) {
    console.error('Error fetching coaches:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

// Get coaches by category
router.get('/coaches/category/:category', setDatabaseConnection, async (req, res) => {
  try {
    const Coach = req.db.model('Coach', CoachSchema);
    const coaches = await Coach.find({ category: req.params.category, organization: req.organization._id });
    res.send(coaches);
  } catch (error) {
    console.error('Error fetching coaches by category:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

// Add a new coach
router.post('/coaches', setDatabaseConnection, async (req, res) => {
  try {
    const Coach = req.db.model('Coach', CoachSchema);
    const Category = req.db.model('Category', CategorySchema);
    const newCoach = new Coach({ ...req.body, organization: req.organization._id });
    await newCoach.save();
    
    // Update the category coach count
    await Category.findOneAndUpdate(
      { name: newCoach.category },
      { $inc: { coachCount: 1 } },
      { new: true }
    );

    res.status(201).send(newCoach);
  } catch (error) {
    console.error('Error adding coach:', error);
    res.status(400).send({ error: 'Invalid data provided' });
  }
});

// Update coach details
router.patch('/coaches/:id', setDatabaseConnection, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).send({ error: 'Invalid coach ID' });
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'contactNumber', 'emergencyContactNumber', 'address', 'category', 'coachingCertifications', 'battingStyle', 'bowlingStyle', 'cricinfoLink', 'teamsPlayed', 'primaryLanguages', 'additionalLanguages', 'preferredCategory', 'coachingSpecialization', 'about', 'profilePhoto', 'availability'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' });
    }

    const Coach = req.db.model('Coach', CoachSchema);
    const Category = req.db.model('Category', CategorySchema);
    const coach = await Coach.findById(req.params.id);

    if (!coach) {
      return res.status(404).send();
    }

    const oldCategory = coach.category;

    updates.forEach((update) => coach[update] = req.body[update]);
    await coach.save();

    // Update category coach counts if category changed
    if (oldCategory !== coach.category) {
      await Category.findOneAndUpdate(
        { name: oldCategory },
        { $inc: { coachCount: -1 } }
      );
      await Category.findOneAndUpdate(
        { name: coach.category },
        { $inc: { coachCount: 1 } }
      );
    }

    res.send(coach);
  } catch (error) {
    console.error('Error updating coach:', error);
    res.status(400).send({ error: 'Invalid data provided' });
  }
});

// Get coaches not assigned to a course
router.get('/coaches/not-assigned/:batchId', setDatabaseConnection, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.batchId)) {
      return res.status(400).send({ error: 'Invalid batch ID' });
    }

    const Batch = req.db.model('Batch', BatchSchema);
    const Coach = req.db.model('Coach', CoachSchema);

    const course = await Batch.findById(req.params.batchId).populate('coaches');
    
    if (!course) {
      return res.status(404).send({ error: 'Course not found' });
    }

    const assignedCoaches = course.coaches.map(coach => coach._id);
    const coaches = await Coach.find({ _id: { $nin: assignedCoaches }, organization: req.organization._id });
    res.send(coaches);
  } catch (error) {
    console.error('Error fetching coaches not assigned:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

router.get('/coach/details', setDatabaseConnection, async (req, res) => {
  try {
    const { userId, organizationName } = req.query;
    

    const Organization = req.db.model('Organization', OrganizationSchema);
    const organization = await Organization.findOne({ name: organizationName });

    if (!organization) {
      return res.status(404).send({ error: 'Organization not found' });
    }

    const Coach = req.db.model('Coach', CoachSchema);
    const coach = await Coach.findOne({ user: userId, organization: organization._id });

    if (!coach) {
      return res.status(404).send({ error: 'Coach not found for this user in the given organization' });
    }

    res.send(coach);
  } catch (error) {
    console.error('Error fetching coach details:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});
module.exports = router;
