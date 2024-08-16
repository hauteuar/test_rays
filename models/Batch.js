const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the schema for tracking student payments within a batch
const studentPaymentSchema = new Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending' 
  },
  paymentAmount: { 
    type: Number, 
    required: true 
  },
  paymentDate: { 
    type: Date 
  },
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment', // Reference to the Payment schema
    required: true,
  },
}, { _id: false });

const batchSchema = new Schema({
  name: { type: String, required: true }, // Name for the batch
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  timeSlot: { type: String, required: true }, // Example: "15:00 - 16:00"
  days: [String], // Example: ["Monday", "Wednesday", "Friday"]
  repeatInterval: { type: String, enum: ['Weekly', 'Monthly', 'Yearly'], required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  students: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }], // Reference to User model for students
  coaches: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }], // Reference to User model for coaches

  // Array of payment statuses for each student in the batch
  studentPayments: [studentPaymentSchema],
}, { timestamps: true });

module.exports = mongoose.models.Batch || mongoose.model('Batch', batchSchema);
