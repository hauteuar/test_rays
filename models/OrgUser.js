const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
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
  permissions: [String],
  tokens: [{
    token: { type: String, required: true }
  }],
  signedDocuments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SignedDocument' }],
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // Reference to parent if the user is below 16
  age: Number  // Age of the user
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
