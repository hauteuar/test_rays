const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Registration', 'Consent', 'Other'],
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  file: {
    data: Buffer,
    contentType: String,
  },
  status: {
    type: String,
    enum: ['Public', 'Unlisted'],
    default: 'Public',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Document', documentSchema);
