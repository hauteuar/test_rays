const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  court: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  date: { type: String, required: true },
  slot_title: { type: String, required: true },
  booked: { type: Boolean, default: false }
});

const Slot = mongoose.model('Slot', slotSchema);

module.exports = Slot;
