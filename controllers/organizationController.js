const Organization = require('../models/Organizations');
const User = require('../models/Users');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage }).single('logo');

exports.createOrganization = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(500).json({ error: 'Error uploading file.' });
    }

    const { name, theme_color, domain, email, password, firstName, lastName, dob, gender, contactNumber } = req.body;

    try {
      const logo_url = `/images/${req.file.filename}`;
      const organization = new Organization({ name, logo_url, theme_color, domain });
      await organization.save();

      const hashedPassword = await bcrypt.hash(password, 10);
      const orgAdmin = new User({
        firstName,
        lastName,
        dob,
        gender,
        email,
        contactNumber,
        password: hashedPassword,
        role: 'org_admin',
        organization: organization._id,
        organizationName: name
      });
      await orgAdmin.save();

      res.status(201).json({ message: 'Organization and admin created successfully.', organization, orgAdmin });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error.' });
    }
  });
};

exports.getOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find().exec();
    res.json(organizations);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getOrganization = async (req, res) => {
  const { id } = req.params;

  try {
    const organization = await Organization.findById(id).exec();
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found.' });
    }
    res.json(organization);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
};
