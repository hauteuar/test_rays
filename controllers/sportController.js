const Sport = require('../models/Sport');
const Court = require('../models/Court');
// Create a new sport
exports.createSport = async (req, res) => {

  try {
    const { name } = req.body;
    const organizationId = req.headers['Organizationid'] || req.headers['OrganizationId'] || req.headers['organizationId'] || req.headers['organizationid'];

    console.log(name, organizationId);
    if (!name || !organizationId) {
      return res.status(400).json({ message: 'Sport name and organization name are required.' });
    }

    const newSport = new Sport({
      name,
      organizationId: organizationId, // Assuming organizationName is actually organizationId
    });

    const savedSport = await newSport.save();
    res.status(201).json(savedSport);
  } catch (error) {
    res.status(500).json({ message: 'Error creating sport', error });
  }
};

// Get all sports for an organization
exports.getSports = async (req, res) => {
  try {
    const organizationId = req.headers['Organizationid'] || req.headers['OrganizationId'] || req.headers['organizationId'] || req.headers['organizationid'];

    if (!organizationId) {
      return res.status(400).json({ message: 'Organization name is required.' });
    }

    const sports = await Sport.find({ organizationId: organizationId });
    res.status(200).json(sports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sports', error });
  }
};




// Create a new court
exports.createCourt = async (req, res) => {
  try {
    const { sportId, name, price, startTime, endTime, courtType } = req.body;
    const organizationId = req.headers['Organizationid'] || req.headers['OrganizationId'] || req.headers['organizationId'] || req.headers['organizationid'];

    if (!sportId || !name || !price || !startTime || !endTime || !courtType || !organizationId) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const newCourt = new Court({
      sportId,
      organizationId: organizationId,
      name,
      courtType, // Set the courtType
      prices: [{
        day: 'All', // Default to apply for all days
        startTime,
        endTime,
        price,
      }],
      isActive: true,
    });

    const savedCourt = await newCourt.save();
    res.status(201).json(savedCourt);
  } catch (error) {
    res.status(500).json({ message: 'Error creating court', error });
  }
};

// Get all courts for a sport
exports.getCourtsBySport = async (req, res) => {
  try {
    const { sportId } = req.params;
    const organizationId = req.headers['Organizationid'] || req.headers['OrganizationId'] || req.headers['organizationId'] || req.headers['organizationid'];

    if (!sportId || !organizationId) {
      return res.status(400).json({ message: 'Sport ID and organization name are required.' });
    }

    const courts = await Court.find({ sportId, organizationId: organizationId });
    res.status(200).json(courts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courts', error });
  }
};

// Get all courts for an organization
exports.getAllCourts = async (req, res) => {
  try {
    const organizationId = req.headers['Organizationid'] || req.headers['OrganizationId'] || req.headers['organizationId'] || req.headers['organizationid'];

    if (!organizationId) {
      return res.status(400).json({ message: 'Organization Id is required.' });
    }

    const courts = await Court.find({ organizationId: organizationId });
    res.status(200).json(courts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courts', error });
  }
};

// Update court status (active/inactive)
exports.updateCourtStatus = async (req, res) => {
  try {
    const { courtId } = req.params;
    const { isActive } = req.body;
    const organizationId = req.headers['Organizationid'] || req.headers['OrganizationId'] || req.headers['organizationId'] || req.headers['organizationid'];

    if (!courtId || isActive === undefined || !organizationId) {
      return res.status(400).json({ message: 'Court ID, active status, and organization name are required.' });
    }

    const updatedCourt = await Court.findOneAndUpdate(
      { _id: courtId, organizationId: organizationId },
      { isActive },
      { new: true }
    );

    if (!updatedCourt) {
      return res.status(404).json({ message: 'Court not found.' });
    }

    res.status(200).json(updatedCourt);
  } catch (error) {
    res.status(500).json({ message: 'Error updating court status', error });
  }
};
