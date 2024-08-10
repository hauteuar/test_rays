// models/SignedDocument.js
const mongoose = require('mongoose');

const SignedDocumentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  documentName: { type: String, required: true },
  signedDate: { type: Date, default: Date.now },
  // Add any other fields you need
});

module.exports = mongoose.model('SignedDocument', SignedDocumentSchema);
