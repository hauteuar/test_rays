const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadDocument, getDocuments, getDocumentById } = require('../controllers/documentController');

// Set up multer for file upload
const upload = multer({ dest: 'uploads/' }); // Temporary storage before saving to MongoDB

// Route to upload a document
router.post('/upload', upload.single('document'), uploadDocument);

// Route to get all documents for an organization
router.get('/', getDocuments);

// Route to get a specific document by its ID
router.get('/:id', getDocumentById);

module.exports = router;
 