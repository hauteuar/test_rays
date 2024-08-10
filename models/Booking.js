const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sport: { type: mongoose.Schema.Types.ObjectId, ref: 'Sport', required: true },
  court: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
  bookingDate: { type: Date, required: true }, // Add bookingDate field
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Cancelled'], default: 'Pending' },
  refundAmount: Number,
  refundType: String,
  status: { type: String, enum: ['Active', 'Cancelled'], default: 'Active' }
});

const Booking = mongoose.model('Booking', BookingSchema);

module.exports = Booking;
