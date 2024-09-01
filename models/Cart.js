const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartItemSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
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
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  subscriptionPlan: {
    type: String,
    enum: ['monthly', 'quarterly', 'annual'],
    required: false, // This will only be required if the item is a subscription
  },
  recurringIntervalType: {
    type: String,
    enum: ['day', 'week', 'month', 'year'],
    required: false,
  },
  recurringIntervalCount: {
    type: Number,
    default: 1,
    required: false,
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

const CartSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [cartItemSchema],
});

module.exports = mongoose.model('Cart', CartSchema);
