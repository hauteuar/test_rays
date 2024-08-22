const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController'); // Assuming you have a mediaController
const { authenticate } = require('../middleware/authMiddleware'); // Assuming you have an auth middleware for authentication

// Route to upload new media files
router.post('/students/upload-media', mediaController.uploadNewMedia);

// Route to get media files for a specific student in an organization
router.get('/students/:studentId/organizations/:organizationId/media',  mediaController.getStudentMedia);

module.exports = router;
