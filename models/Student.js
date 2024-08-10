const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  batches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
  assignments: [
    {
      title: String,
      description: String,
      dueDate: Date,
      completed: { type: Boolean, default: false },
      coach: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach' }
    }
  ],
  fitnessData: [
    {
      date: Date,
      data: mongoose.Schema.Types.Mixed // Store any kind of fitness data
    }
  ],
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }
});

const Student = mongoose.model('Student', StudentSchema);
module.exports = Student;
