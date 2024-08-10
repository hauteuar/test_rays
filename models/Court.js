// models/Court.js
const mongoose = require('mongoose');

const CourtSchema = new mongoose.Schema({
  sport: { type: mongoose.Schema.Types.ObjectId, ref: 'Sport', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true } // Add organization field
});

module.exports = mongoose.model('Court', CourtSchema);
