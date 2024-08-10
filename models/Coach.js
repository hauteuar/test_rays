const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CoachSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contactNumber: { type: String, required: true },
  emergencyContactNumber: { type: String, required: true },
  address: {
    street: String,
    apartment: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  category: { type: String, required: true },
  coachingCertifications: String,
  battingStyle: String,
  bowlingStyle: String,
  cricinfoLink: String,
  teamsPlayed: String,
  primaryLanguages: [String],
  additionalLanguages: [String],
  preferredCategory: String,
  coachingSpecialization: String,
  about: String,
  profilePhoto: String,
  availability: [
    {
      dayOfWeek: String,
      weekOfMonth: Number,
      timeSlots: [{ start: String, end: String }]
    }
  ],
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true } // Added organization ID
});

module.exports = mongoose.model('Coach', CoachSchema);
