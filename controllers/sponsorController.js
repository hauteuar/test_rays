const Sponsor = require('../models/Sponsor');

// Add a new sponsor
exports.addSponsor = async (req, res) => {
    try {
      const { organizationId } = req.params;
      const { name, webAddress, highlight } = req.body;
  
      // Get the logo URL from the uploaded file
      const logoUrl = req.file ? `/uploads/${req.file.filename}` : null;
  
      if (!logoUrl) {
        return res.status(400).json({ success: false, message: 'Logo is required' });
      }
  
      // Calculate the display order based on the number of existing sponsors
      const existingSponsors = await Sponsor.find({ organizationId });
      const displayOrder = existingSponsors.length + 1;
  
      // Create a new sponsor
      const newSponsor = new Sponsor({
        name,
        webAddress,
        highlight,
        logoUrl,
        organizationId,
        displayOrder
      });
  
      await newSponsor.save();
  
      return res.status(201).json({ success: true, sponsor: newSponsor });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };// Delete a sponsor
exports.deleteSponsor = async (req, res) => {
    try {
        const { sponsorId } = req.params;

        await Sponsor.findByIdAndDelete(sponsorId);
        res.status(200).json({ success: true, message: 'Sponsor deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update sponsor details
exports.updateSponsor = async (req, res) => {
    try {
        const { sponsorId } = req.params;
        const updateData = req.body;

        const sponsor = await Sponsor.findByIdAndUpdate(sponsorId, updateData, { new: true });

        if (!sponsor) {
            return res.status(404).json({ success: false, message: 'Sponsor not found' });
        }

        res.status(200).json({ success: true, sponsor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all sponsors for an organization
exports.getSponsors = async (req, res) => {
    try {
        const { organizationId } = req.params;

        const sponsors = await Sponsor.find({ organizationId }).sort({ displayOrder: 1 });
        res.status(200).json({ success: true, sponsors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Reorder sponsors
exports.reorderSponsors = async (req, res) => {
    try {
        const { sponsors } = req.body;

        for (const sponsor of sponsors) {
            await Sponsor.findByIdAndUpdate(sponsor._id, { displayOrder: sponsor.displayOrder });
        }

        res.status(200).json({ success: true, message: 'Sponsors reordered successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
