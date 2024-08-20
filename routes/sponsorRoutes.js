const express = require('express');
const router = express.Router();
const sponsorController = require('../controllers/sponsorController');
const multer = require('multer');

// Configure multer to handle file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Use a unique filename
  }
});

const upload = multer({ storage: storage });

// Add a sponsor with image upload
router.post('/:organizationId/sponsors', upload.single('imageUrl'), sponsorController.addSponsor);

// Delete a sponsor
router.delete('/:sponsorId', sponsorController.deleteSponsor);

// Update a sponsor
router.put('/:sponsorId', sponsorController.updateSponsor);

// Get all sponsors for an organization
router.get('/:organizationId/sponsors', sponsorController.getSponsors);

// Reorder sponsors
router.put('/:organizationId/sponsors/reorder', sponsorController.reorderSponsors);

module.exports = router;
