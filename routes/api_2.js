const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');

// Get all sports
router.post('/get_sports', async (req, res) => {
  try {
    const sports = await Sport.find({}).populate('courts');
    res.json({ success: true, sports: sports });
  } catch (err) {
    console.error('Error fetching sports:', err);
    res.json({ success: false, message: 'Error fetching sports.' });
  }
});

// Add new court to a sport
router.post('/add_court', async (req, res) => {
  try {
    const { sportId, courtName } = req.body;
    if (!sportId || !courtName) {
      return res.json({ success: false, message: 'Sport ID and court name are required.' });
    }

    const court = new Court({ name: courtName });
    await court.save();

    const sport = await Sport.findById(sportId);
    if (!sport) {
      return res.json({ success: false, message: 'Sport not found.' });
    }

    sport.courts.push(court._id);
    await sport.save();

    res.json({ success: true, message: 'Court added successfully.' });
  } catch (err) {
    console.error('Error adding court:', err);
    res.json({ success: false, message: 'Error adding court.' });
  }
});

// Add new slot to a court
// Add new slot to a court
router.post('/add_slot', async (req, res) => {
  try {
    const { court_id, start_time, end_time, date, booked } = req.body;
    console.log('Received data:', req.body); // Log the incoming request data

    // Generate slot_title
    const slot_title = `${start_time} - ${end_time}`;

    const newSlot = new Slot({ court: court_id, start_time, end_time, date, slot_title, booked });
    await newSlot.save();

    const court = await Court.findById(court_id);
    if (!court) {
      console.error('Court not found:', court_id); // Log error if court not found
      res.json({ success: false, message: 'Court not found.' });
      return;
    }
    
    court.slots.push(newSlot);
    await court.save();

    res.json({ success: true, message: 'Slot added successfully.', slot_id: newSlot._id });
  } catch (err) {
    console.error('Error adding slot:', err);
    res.json({ success: false, message: 'Error adding slot.' });
  }
});


async function createSlotsForWeek(courtId, bookingDate) {
  const slots = [];
  const startDate = new Date(bookingDate);
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    for (let hour = 7; hour <= 21; hour++) {
      const startTime = `${hour < 10 ? '0' : ''}${hour}:00`;
      const endTime = `${hour < 9 ? '0' : ''}${hour + 1}:00`;
      slots.push({ court: courtId, date: dateString, start_time: startTime, end_time: endTime, booked: false });
    }
  }
  await Slot.insertMany(slots);
}

router.post('/get_available_slots', async (req, res) => {
  try {
    const { court_id, booking_date } = req.body;
    console.log(`Fetching slots for court: ${court_id} on date: ${booking_date}`);

    // Check if slots already exist
    let slots = await Slot.find({ court: court_id, date: booking_date, booked: false });
    console.log('Fetched slots:', slots);

    // If no slots found, create default slots for the day
    if (slots.length === 0) {
      const defaultSlots = [];
      for (let hour = 7; hour <= 21; hour++) {
        defaultSlots.push({
          court: court_id,
          date: booking_date,
          slot_title: `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'} - ${(hour + 1) % 12 || 12} ${hour + 1 < 12 ? 'AM' : 'PM'}`,
          start_time: `${hour < 10 ? '0' : ''}${hour}:00`,
          end_time: `${hour < 9 ? '0' : ''}${hour + 1}:00`,
          booked: false
        });
      }

      // Insert default slots into the database
      slots = await Slot.insertMany(defaultSlots);
      console.log('Inserted default slots:', slots);
    }

    res.json({ success: true, result: slots });
  } catch (err) {
    console.error('Error fetching available slots:', err);
    res.json({ success: false, message: 'Error fetching available slots.' });
  }
});


// Book a slot
const { ObjectId } = require('mongoose').Types;

router.post('/book_slot', async (req, res) => {
  try {
    const { slot_id, user_id, booked } = req.body;

    if (!ObjectId.isValid(slot_id)) {
      return res.json({ success: false, message: 'Invalid slot ID.' });
    }

    const slot = await Slot.findById(slot_id);

    if (!slot) {
      return res.json({ success: false, message: 'Slot not found.' });
    }

    slot.booked = booked;
    await slot.save();

    res.json({ success: true });
  } catch (err) {
    console.error('Error booking slot:', err);
    res.json({ success: false, message: 'Error booking slot.' });
  }
});
// Get user bookings

router.post('/get_user_bookings', async (req, res) => {
  try {
    let { date } = req.body;
    
    if (!date) {
      date = new Date().toISOString().split('T')[0]; // Default to the current date
      console.log('No date provided. Using current date:', date);
    } else {
      console.log('Fetching bookings on date:', date);
    }

    const query = { date: date };

    console.log('Query:', query);

    const bookings = await Booking.find(query);

    console.log('Bookings fetched:', bookings);

    res.json({ success: true, bookings });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// get user
router.get('/users', async (req, res) => {
  try {
      const users = await User.find();
      res.status(200).json(users);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching users', error });
  }
});


// Change court status

router.post('/change_court_status', async (req, res) => {
  try {
    const { court_id, status } = req.body;
    const court = await Court.findById(court_id);
    if (!court) {
      return res.json({ success: false, message: 'Court not found.' });
    }
    court.status = status;
    await court.save();

    res.json({ success: true, message: 'Court status updated successfully.' });
  } catch (err) {
    console.error('Error updating court status:', err);
    res.json({ success: false, message: 'Error updating court status.' });
  }
});

// Get all courts for a sport
router.post('/get_courts', async (req, res) => {
  try {
    const { sport_id } = req.body; // Ensure this matches the frontend data key
    if (!sport_id || !mongoose.Types.ObjectId.isValid(sport_id)) {
      return res.json({ success: false, message: 'Invalid Sport ID.' });
    }

    const sport = await Sport.findById(sport_id).populate('courts');
    if (!sport) {
      return res.json({ success: false, message: 'Sport not found.' });
    }

    res.json({ success: true, courts: sport.courts });
  } catch (err) {
    console.error('Error fetching courts:', err);
    res.json({ success: false, message: 'Error fetching courts.' });
  }
});

module.exports = router;


