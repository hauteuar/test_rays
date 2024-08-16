const mongoose = require('mongoose');
const { Schema } = mongoose;

const BookingSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courtId: {
    type: Schema.Types.ObjectId,
    ref: 'Court',
    required: true,
  },
  sportId: {
    type: Schema.Types.ObjectId,
    ref: 'Sport',
    required: true,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  paymentType: {
    type: String,
    enum: ['Cash', 'UPI', 'Card'],
    required: true,
  },
  bookingNote: {
    type: String,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['confirmed', 'canceled'],
    default: 'confirmed',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment', // Reference to the Payment schema
  },
});

module.exports = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
