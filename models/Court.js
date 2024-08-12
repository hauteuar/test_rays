const mongoose = require('mongoose');
const { Schema } = mongoose;

const PriceSchema = new Schema({
  day: {
    type: String,
    enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'All'],
  },
  startTime: {
    type: String, // Example: '08:00'
    required: true,
  },
  endTime: {
    type: String, // Example: '18:00'
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
});

const CourtSchema = new Schema({
  name: {
    type: String,
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
  courtType: {
    type: String,
    enum: ['indoor', 'outdoor'],
    required: true,
  },
  prices: [PriceSchema], // Array of price details based on days and times
  isActive: {
    type: Boolean,
    default: true,
  },
  statusTimes: [
    {
      startTime: {
        type: Date,
      },
      endTime: {
        type: Date,
      },
      status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Court', CourtSchema);
