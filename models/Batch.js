const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Name for the batch
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  timeSlot: { type: String, required: true }, // Example: "15:00 - 16:00"
  days: [String], // Example: ["Monday", "Wednesday", "Friday"]
  repeatInterval: { type: String, enum: ['Weekly', 'Monthly', 'Yearly'], required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Reference to User model for students
  coaches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Reference to User model for coaches
}, { timestamps: true });

module.exports = mongoose.models.Batch || mongoose.model('Batch', batchSchema);
