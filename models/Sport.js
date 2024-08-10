const mongoose = require('mongoose');

const SportSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true } // Add organization field
});

module.exports = mongoose.model('Sport', SportSchema);
