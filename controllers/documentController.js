const fs = require('fs');
const mongoose = require('mongoose');
const Document = require('../models/Document');

exports.uploadDocument = async (req, res) => {
  try {
    const organizationId = req.headers.organizationid; // Access organizationId directly from headers
    const { title, category, description } = req.body;
    
    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'Organization ID is required.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const document = new Document({
      organizationId,
      title,
      category,
      description,
      file: {
        data: fs.readFileSync(req.file.path),
        contentType: req.file.mimetype,
      },
    });

    await document.save();

    // Delete the file from the server after saving it to the database
    fs.unlinkSync(req.file.path);

    res.status(201).json({ success: true, message: 'Document uploaded successfully.', document });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const organizationId = req.headers.organizationid; 

    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'Organization ID is required.' });
    }

    const documents = await Document.find({ organizationId });

    res.status(200).json({ success: true, documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    // Ensure 'id' is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid document ID.' });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    res.set('Content-Type', document.file.contentType);
    res.send(document.file.data);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const templates = await Document.find({ category: 'Templates' });

    if (!templates || templates.length === 0) {
      return res.status(404).json({ success: false, message: 'No templates found.' });
    }

    res.status(200).json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
