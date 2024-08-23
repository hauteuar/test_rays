const Organization = require('../models/Organizations');
const User = require('../models/Users');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images'); // Directory to save the uploaded files
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique filename
  }
});

// Set up multer with the configured storage
const upload = multer({ storage });

exports.createOrganization = async (req, res) => {
  upload.single('logo')(req, res, async function (err) {
    if (err) {
      return res.status(500).json({ error: 'Error uploading file.' });
    }

    const { name, theme_color, domain, email, password, firstName, lastName, dob, gender, contactNumber } = req.body;

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Logo is required when creating an organization.' });
      }

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
      console.error('Error creating organization:', error);
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

exports.getOrganizationThemeColor = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id).select('theme_color');
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.json({ theme_color: organization.theme_color });
  } catch (error) {
    console.error('Error fetching organization theme color:', error);
    res.status(500).json({ error: 'Internal server error' });
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

exports.saveOrganization = async (req, res) => {
  upload.single('logo')(req, res, async function (err) {
    if (err) {
      return res.status(500).json({ error: 'Error uploading file.' });
    }

    const { organizationId, name, domain, theme_color } = req.body;

    try {
      let organization;

      // Determine the logo_url to use: either the new uploaded file or retain the existing one
      const logo_url = req.file ? `/images/${req.file.filename}` : undefined;

      if (organizationId) {
        // Update existing organization
        const updateData = { name, domain, theme_color };
        if (logo_url) {
          updateData.logo_url = logo_url;
        }
        organization = await Organization.findByIdAndUpdate(
          organizationId,
          updateData,
          { new: true }
        );
      } else {
        // Add new organization
        if (!logo_url) {
          return res.status(400).json({ error: 'Logo is required when creating an organization.' });
        }
        organization = new Organization({ name, domain, logo_url, theme_color });
        await organization.save();
      }

      res.redirect('/corp_admin/dashboard');
    } catch (error) {
      console.error('Error saving organization:', error);
      res.status(500).send('Server error');
    }
  });
};

exports.renderDashboard = async (req, res) => {
  try {
    const organizations = await Organization.find().exec();
    res.render('corpAdminDashboard', { organizations, org: null }); // Pass 'org: null' or {} for a new organization
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    res.status(500).send('Server error');
  }
};

exports.editOrganizations = async (req, res) => {
  upload.single('logo')(req, res, async function (err) {
      if (err) {
          console.error('Error uploading file:', err);
          return res.status(500).json({ error: 'Error uploading file.' });
      }

      try {
          const { id } = req.params;
          const { name, domain, theme_color } = req.body;

          const updateData = { name, domain, theme_color };

          // Only update the logo if a new file was uploaded
          if (req.file) {
              updateData.logo_url = `/images/${req.file.filename}`;
          }

          const organization = await Organization.findByIdAndUpdate(id, updateData, { new: true });
          if (!organization) {
              return res.status(404).json({ error: 'Organization not found.' });
          }

          console.log('Updated organization:', organization);
          res.json(organization);
      } catch (error) {
          console.error('Error updating organization:', error);
          res.status(500).json({ error: 'Server error' });
      }
  });
};

exports.getOrganizationLogo = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id).select('logo_url');
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.json({ logo_url: organization.logo_url });
  } catch (error) {
    console.error('Error fetching organization logo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
