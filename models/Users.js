const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  dayOfWeek: { type: String, required: true }, // Example: "Monday"
  isAvailable: { type: Boolean, default: false },
  timeSlots: [
    {
      start: { type: String, required: true }, // Example: "09:00"
      end: { type: String, required: true }    // Example: "11:00"
    }
  ]
});

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
          coach_id: mongoose.Schema.Types.ObjectId,
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
  ],
  profilePhoto: { type: String }, // URL to the profile photo
  coachingCertifications: String, // Certifications for coaches
  about: String, // About me section for coaches
  availability: [availabilitySchema], // Availability for coaches
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
