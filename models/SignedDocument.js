const mongoose = require('mongoose');

const signedDocumentSchema = new mongoose.Schema({
  documentName: { type: String, required: true },
  documentType: { type: String, required: true },
  signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: function() { return this.documentType !== 'Template'; } }, // Only required if not a template
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  signedAt: { type: Date, default: Date.now },
  signature: { type: String, required: function() { return this.documentType !== 'Template'; } }, // Only required if not a template
  pdfDocument: { type: String, required: function() { return this.documentType !== 'Template'; } }, // Only required if not a template
  template: { 
    data: Buffer, 
    contentType: String 
  }, // Store the template as binary data
  additionalInfo: {
    studentName: String,
    parentName: String,
    address: String,
  }
});

module.exports = mongoose.model('SignedDocument', signedDocumentSchema);
