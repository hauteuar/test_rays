const { Organization } = require('../models/Organizations');

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

    const {
      name, 
      org_code,
      org_email,
      org_license_number,
      contact_person_name,
      contact_person_number,
      street,
      city,
      state,
      zip_code,
      country,
      theme_color,
      domain,
      org_type_id,
      email, 
      password, 
      firstName, 
      lastName, 
      dob, 
      gender, 
      contactNumber 
    } = req.body;

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Logo is required when creating an organization.' });
      }

      const logo_url = `/images/${req.file.filename}`;
      const organization = new Organization({
        name,
        org_code,
        org_email,
        org_license_number,
        contact_person_name,
        contact_person_number,
        address: {
          street,
          city,
          state,
          zip_code,
          country
        },
        theme_color,
        domain,
        org_type_id,
        logo_url
      });
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
    console.error('Error fetching organizations:', error);
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



exports.appGetUserOrganizations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find the user and populate the organizations
    const user = await User.findById(userId)
      .populate({
        path: 'organizations.org_id',  // Populating organization data
        select: 'name org_code org_email connected_pg_payouts_enabled is_default_template logo_url theme_color domain address', // Select specific fields
      })
      .exec();

    if (!user) {
      return res.status(404).json({ errorcode: 1, errormessage: 'User not found' });
    }

    const organizationData = user.organizations.map(org => {
      // Ensure org and org_id exist before accessing their properties
      if (!org || !org.org_id) {
        console.error('Missing organization or organization_id for user:', userId);
        return null;  // Skip the current organization if undefined
      }

      const organization = org.org_id;

      return {
        id: org._id,
        user_id: user._id,
        organization_id: organization._id,
        branch_id: null,
        role_id: user.role,
        status: org.status || 'Active',
        created_at: org.created_at,
        updated_at: org.updated_at,
        organization: {
          id: organization._id,
          connected_pg_unique_code: organization.connected_pg_unique_code || null, // Assuming this field exists in the schema
          connected_pg_payouts_enabled: organization.connected_pg_payouts_enabled || false,
          name: organization.name,
          org_code: organization.org_code || null,
          org_email: organization.org_email || null,
          org_license_number: organization.org_license_number || null, // Assuming this field exists in the schema
          contact_person_name: organization.contact_person_name || null, // Assuming this field exists in the schema
          contact_person_number: organization.contact_person_number || null, // Assuming this field exists in the schema
          street: organization.address ? organization.address.street : null,
          city: organization.address ? organization.address.city : null,
          state: organization.address ? organization.address.state : null,
          zip_code: organization.address ? organization.address.zip_code : null,
          country: organization.address ? organization.address.country : null,
          is_default_template: organization.is_default_template || false,
          template_path: organization.template_path || null, // Assuming this field exists in the schema
          organization_logo: organization.logo_url,
          deleted_at: organization.deleted_at || null,
          created_at: organization.createdAt,
          updated_at: organization.updatedAt,
          org_color_code: organization.org_color_code || '{}', // Assuming this field exists in the schema
          organization_type: null // Since the organization type is not in the schema data provided, it's set to null
        }
      };
    }).filter(data => data !== null);  // Filter out null values to avoid errors

    res.json({
      errorcode: 0,
      errormessage: 'success',
      data: organizationData
    });

  } catch (error) {
    console.error('Error fetching user organizations:', error);
    res.status(500).json({ errorcode: 1, errormessage: 'Internal server error' });
  }
};
