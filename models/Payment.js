const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaymentSchema = new Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization', // Reference to the Organization schema
    required: true,
  },
  itemType: {
    type: String,
    enum: ['booking', 'course', 'ecom'],
    required: true,
  },
  itemId: {
    type: Schema.Types.ObjectId,
    required: true,
    // References the booking, course, or e-commerce item
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['Card', 'GooglePay', 'ApplePay'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Payment', PaymentSchema);
