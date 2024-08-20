// routes/waiverRoutes.js
const express = require('express');
const router = express.Router();
const waiverController = require('../controllers/waiverController');
const multer = require('multer');

const storage = multer.memoryStorage(); // Use memory storage
const upload = multer({ storage: storage });

// Route to create a new signed waiver form
router.post('/create', waiverController.createWaiver);

router.post('/uploads', upload.single('document'), waiverController.uploadTemplate);

// Route to get documents
router.get('/documents', waiverController.getDocuments);

router.get('/templates', waiverController.getTemplates);

router.get('/documents/:id', waiverController.getDocumentById);

module.exports = router;
