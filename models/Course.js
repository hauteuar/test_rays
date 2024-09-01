const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: String, required: true }, // Example: "1 Year", "6 Month", "3 Month"
  price: { type: Number, required: true },
  location: { type: String, required: true },
  mode: { type: String, enum: ['Offline', 'Online'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  bannerImage: { type: String, required: true },
  coaches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Reference to User model for coaches
  isDefaultPractice: { type: Boolean, default: false }, // To identify default practice courses
  sessionFee: { type: Number, default: 50 }, // Default fee per session
  baseCurrency: { type: String, default: 'USD' }, // Currency used for payments
  groundBookings: [{
    sport: { type: String, required: true },
    court: { type: String, required: true },
    lanes: [String]
  }],
  discounts: [{
    title: { type: String, required: true },
    value: { type: String, required: true } // This can be a percentage or a fixed amount
  }],
  batches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }
}, { timestamps: true });

module.exports = mongoose.models.Course || mongoose.model('Course', courseSchema);
