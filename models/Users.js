const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contactNumber: { type: String, required: true },
  emergencyContactNumber: { type: String },
  address: {
    street: String,
    apartment: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  password: { type: String, required: true },
  role: { type: String, enum: ['corp_admin', 'org_admin', 'freelance_coach', 'coach', 'student', 'parent'], required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  organizationName: { type: String }, // New field to store organization name
  permissions: [String],
  tokens: [{
    token: { type: String, required: true }
  }],
  signedDocuments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SignedDocument' }],
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  age: Number,
  organizations: [
    {
      org_id: mongoose.Schema.Types.ObjectId,
      courses: [
        {
          course_id: mongoose.Schema.Types.ObjectId,
          coach_id: mongoose.Schema.Types.ObjectId, // Added coach_id
          batches: [
            {
              batch_id: mongoose.Schema.Types.ObjectId,
              role: { type: String, enum: ['coach', 'student'] },
              tasks: [
                {
                  task_id: mongoose.Schema.Types.ObjectId,
                  submission: String,
                  feedback: String,
                  status: { type: String, enum: ['assigned', 'submitted', 'completed'] },
                  created_at: { type: Date, default: Date.now },
                  updated_at: { type: Date, default: Date.now }
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  notifications: [
    {
      message: String,
      type: { type: String, enum: ['info', 'warning', 'error'] },
      read: { type: Boolean, default: false },
      created_at: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
