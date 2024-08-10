const express = require('express');
const router = express.Router();
const { adminConnection } = require('../db');
const Admin = adminConnection.model('Admin', require('../models/AdminSchema'));
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');

// Admin registration
router.post('/auth/register/admin', async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  const hashedPassword = await bcrypt.hash(password, 8);

  const admin = new Admin({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role
  });

  try {
    const savedAdmin = await admin.save();
    res.status(201).send(savedAdmin);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Admin login
router.post('/auth/login/admin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).send({ error: 'Invalid login credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(404).send({ error: 'Invalid login credentials' });
    }

    const token = await admin.generateAuthToken();
    res.send({ admin, token });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Fetch admin profile
router.get('/admin/profile', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).send({ error: 'Admin not found' });
    }
    res.send(admin);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
