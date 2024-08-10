const express = require('express');
const router = express.Router();
const Sport = require('../models/Sport');
const Court = require('../models/Court');
const Slot = require('../models/Slot');

// Get all sports with courts
router.get('/get_sports', async (req, res) => {
  try {
    const sports = await Sport.find({}).populate('courts');
    res.json({ success: true, sports });
  } catch (err) {
    console.error('Error fetching sports:', err);
    res.json({ success: false, message: 'Error fetching sports.' });
  }
});

// Get all courts for a sport
router.post('/get_courts', async (req, res) => {
  try {
    const { sport_id } = req.body;
    const sport = await Sport.findById(sport_id).populate('courts');
    if (!sport) {
      return res.json({ success: false, message: 'Sport not found.' });
    }
    res.json({ success: true, result: sport.courts });
  } catch (err) {
    console.error('Error fetching courts:', err);
    res.json({ success: false, message: 'Error fetching courts.' });
  }
});

// Add new sport
router.post('/add_sport', async (req, res) => {
  try {
    const { sportName } = req.body;
    const newSport = new Sport({ name: sportName });
    await newSport.save();
    res.json({ success: true, message: 'Sport added successfully.' });
  } catch (err) {
    console.error('Error adding sport:', err);
    res.json({ success: false, message: 'Error adding sport.' });
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
router.post('/add_slot', async (req, res) => {
  try {
    const { court_id, start_time, end_time, date, slot_title, booked } = req.body;
    console.log('Received data:', req.body);

    if (!court_id || !start_time || !end_time || !date || !slot_title) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const newSlot = new Slot({
      court: court_id,
      start_time,
      end_time,
      date,
      slot_title,
      booked: booked || false
    });

    await newSlot.save();

    const court = await Court.findById(court_id);
    if (!court) {
      console.error('Court not found:', court_id);
      return res.json({ success: false, message: 'Court not found.' });
    }

    court.slots.push(newSlot);
    await court.save();

    res.json({ success: true, message: 'Slot added successfully.', result: newSlot });
  } catch (err) {
    console.error('Error adding slot:', err);
    res.json({ success: false, message: 'Error adding slot.' });
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

module.exports = router;
