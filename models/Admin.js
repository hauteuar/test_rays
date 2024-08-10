const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  dob: Date,
  gender: String,
  email: { type: String, unique: true },
  contactNumber: String,
  emergencyContactNumber: String,
  streetAddress: String,
  apartmentNumber: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
  password: String,
  role: { type: String, enum: ['corporateAdmin', 'orgAdmin'] },
  permissions: [String],
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }]
});

const Admin = mongoose.model('Admin', AdminSchema);
module.exports = Admin;
