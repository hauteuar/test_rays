const express = require('express');
const router = express.Router();
const { connectToDatabase } = require('../db/db');
const SportSchema = require('../models/Sport').schema;
const CourtSchema = require('../models/Court').schema;
const BookingSchema = require('../models/Booking').schema;
const UserSchema = require('../models/User').schema;
const Organization = require('../models/Organization').schema;
const setDatabaseConnection = require('../middleware/setDatabaseConnection');

// Add Sport
router.post('/add-sport', setDatabaseConnection, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Sport name is required' });
    }
    const Sport = req.db.model('Sport');
    const newSport = new Sport({ name, organization: req.organization._id });
    await newSport.save();
    req.organization.sports.push(newSport._id);
    await req.organization.save();
    res.status(201).json(newSport);
  } catch (error) {
    console.error('Error adding sport:', error);
    res.status(500).json({ message: 'Error adding sport', error });
  }
});


// Add Court
router.post('/add-court', setDatabaseConnection, async (req, res) => {
  try {
    const { sportId, name, price, isActive } = req.body;
    const Sport = req.db.model('Sport');
    const Court = req.db.model('Court');
    const sport = await Sport.findById(sportId);
    if (!sport) {
      return res.status(400).json({ message: 'Invalid sport ID' });
    }
    const newCourt = new Court({ sport: sportId, name, price, isActive, organization: req.organization._id });
    await newCourt.save();
    req.organization.courts.push(newCourt._id);
    await req.organization.save();
    res.status(201).json(newCourt);
  } catch (error) {
    console.error('Error adding court:', error);
    res.status(500).json({ message: 'Error adding court', error });
  }
});

// Get all sports
router.get('/sports', setDatabaseConnection, async (req, res) => {
  try {
    const Sport = req.db.model('Sport');
    console.log('Fetching sports for organization:', req.organization._id);
    const sports = await Sport.find({ organization: req.organization._id });
    console.log('Fetched sports:', sports);
    res.status(200).json(sports);
  } catch (error) {
    console.error('Error fetching sports:', error);
    res.status(500).json({ message: 'Error fetching sports', error });
  }
});

// Get courts by sport ID
router.get('/courts/:sportId', setDatabaseConnection, async (req, res) => {
  try {
    const { sportId } = req.params;
    const Court = req.db.model('Court');
    const courts = await Court.find({ sport: sportId, organization: req.organization._id });
    res.status(200).json(courts);
  } catch (error) {
    console.error('Error fetching courts:', error);
    res.status(500).json({ message: 'Error fetching courts', error });
  }
});

// Get all courts
router.get('/courts', setDatabaseConnection, async (req, res) => {
  try {
    const Court = req.db.model('Court');
    const courts = await Court.find({ organization: req.organization._id }).populate('sport', 'name');
    res.status(200).json(courts);
  } catch (error) {
    console.error('Error fetching courts:', error);
    res.status(500).json({ message: 'Error fetching courts', error });
  }
});

// Get all bookings
router.get('/bookings', setDatabaseConnection, async (req, res) => {
  try {
    const Booking = req.db.model('Booking');
    const bookings = await Booking.find({ organization: req.organization._id }).populate('user sport court');
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings', error });
  }
});

// Get all users
router.get('/users', setDatabaseConnection, async (req, res) => {
  try {
    const User = req.db.model('User');
    const users = await User.find({ organization: req.organization._id });
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error });
  }
});

// Get bookings by court ID
router.get('/bookings/:courtId', setDatabaseConnection, async (req, res) => {
  try {
    const { courtId } = req.params;
    const Booking = req.db.model('Booking');
    const bookings = await Booking.find({ court: courtId, organization: req.organization._id }).populate('user sport court');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error });
  }
});

// Add Booking
router.post('/add-booking', setDatabaseConnection, async (req, res) => {
  try {
    const { userId, sportId, courtId, bookingDate, startTime, endTime, paymentStatus } = req.body;

    if (!userId || !sportId || !courtId || !bookingDate || !startTime || !endTime) {
      console.log(courtId, userId, sportId, bookingDate, startTime, endTime);
      return res.status(400).json({ message: 'All fields are required' });
    }

    const Court = req.db.model('Court');
    const court = await Court.findById(courtId);
    if (!court) {
      return res.status(400).json({ message: 'Court not available' });
    }

    // Combine bookingDate with startTime and endTime to form complete Date objects
    const startDateTime = new Date(`${bookingDate}T${startTime}:00Z`);
    const endDateTime = new Date(`${bookingDate}T${endTime}:00Z`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return res.status(400).json({ message: 'Invalid time format' });
    }

    const Booking = req.db.model('Booking');
    const newBooking = new Booking({
      user: userId,
      sport: sportId,
      court: courtId,
      bookingDate: new Date(bookingDate), // Store booking date
      startTime: startDateTime,
      endTime: endDateTime,
      paymentStatus,
      organization: req.organization._id
    });

    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (error) {
    console.error('Error adding booking:', error);
    res.status(500).json({ message: 'Error adding booking', error });
  }
});


// Cancel Booking
router.post('/cancel-booking', setDatabaseConnection, async (req, res) => {
  try {
    const { bookingId, refundAmount, refundType } = req.body;
    const Booking = req.db.model('Booking');
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    booking.status = 'Cancelled';
    booking.refundAmount = refundAmount;
    booking.refundType = refundType;
    await booking.save();
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling booking', error });
  }
});

// Update Court Active State
router.put('/update-court/:courtId', setDatabaseConnection, async (req, res) => {
  try {
    const { courtId } = req.params;
    const { isActive } = req.body;
    const Court = req.db.model('Court');
    const court = await Court.findByIdAndUpdate(courtId, { isActive }, { new: true });
    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }
    res.status(200).json(court);
  } catch (error) {
    res.status(500).json({ message: 'Error updating court', error });
  }
});

module.exports = router;
