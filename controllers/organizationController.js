const { Organization } = require('../models/Organizations');
const User = require('../models/Users');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Define your server's base URL for public access
const BASE_URL = 'http://34.44.163.124:4000'; // Replace with your actual domain

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

      const logo_url = `${BASE_URL}/images/${req.file.filename}`;
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

exports.saveOrganization = async (req, res) => {
  upload.single('logo')(req, res, async function (err) {
    if (err) {
      return res.status(500).json({ error: 'Error uploading file.' });
    }

    const { organizationId, name, domain, theme_color } = req.body;

    try {
      let organization;

      // Determine the logo_url to use: either the new uploaded file or retain the existing one
      const logo_url = req.file ? `${BASE_URL}/images/${req.file.filename}` : undefined;

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
              updateData.logo_url = `${BASE_URL}/images/${req.file.filename}`;
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

exports.appGetUserOrganizations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Log the user ID from the request
    console.log(`User ID from request: ${userId}`);

    // Find the user and populate the organizations
    const user = await User.findById(userId)
      .populate({
        path: 'organizations.org_id',  // Populating organization data
        select: 'name org_code org_email connected_pg_payouts_enabled is_default_template logo_url theme_color domain address connected_pg_unique_code org_license_number contact_person_name contact_person_number org_color_code org_type_id', // Select specific fields
        populate: {
          path: 'org_type_id',
          select: 'org_type_name description',  // Populate organization type data
        }
      })
      .exec();

    // Log the fetched user data
    console.log('User data fetched from DB:', JSON.stringify(user, null, 2));

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

      // Log the organization data
      console.log('Organization data:', JSON.stringify(organization, null, 2));

      return {
        id: org._id ? parseInt(org._id, 10) : null,  // Convert to integer
        user_id: user._id ? parseInt(user._id, 10) : null,  // Convert to integer
        organization_id: organization._id ? parseInt(organization._id, 10) : null,  // Convert to integer
        branch_id: null,  // Keep null as in the old response
        role_id: user.role || null,  // Keep role as string
        status: org.status || 'Active',
        created_at: org.created_at,
        updated_at: org.updated_at,
        organization: {
          id: organization._id ? parseInt(organization._id, 10) : null,  // Convert to integer
          connected_pg_unique_code: organization.connected_pg_unique_code || "", // Use empty string as default
          connected_pg_payouts_enabled: organization.connected_pg_payouts_enabled ? 1 : 0, // Convert boolean to integer (0 or 1)
          name: organization.name || "",
          org_code: organization.org_code || "",
          org_email: organization.org_email || "",
          org_license_number: organization.org_license_number || "",
          contact_person_name: organization.contact_person_name || "",
          contact_person_number: organization.contact_person_number || "",
          street: organization.address ? organization.address.street : "",
          city: organization.address ? organization.address.city : "",
          state: organization.address ? organization.address.state : "",
          zip_code: organization.address ? parseInt(organization.address.zip_code, 10) : null,
          country: organization.address ? parseInt(organization.address.country, 10) : null,
          is_default_template: organization.is_default_template ? 1 : 0, // Convert boolean to integer (0 or 1)
          template_path: organization.template_path || "", // Use empty string as default
          organization_logo: `${BASE_URL}${organization.logo_url}`, // Construct public URL for the logo
          deleted_at: organization.deleted_at || null,
          created_at: organization.createdAt,
          updated_at: organization.updatedAt,
          org_color_code: organization.org_color_code || "{}", // Assuming this is a JSON string
          organization_type: organization.org_type_id ? {
            id: organization.org_type_id._id ? parseInt(organization.org_type_id._id, 10) : null,  // Convert to integer
            org_type_name: organization.org_type_id.org_type_name || "",
            description: organization.org_type_id.description || "",
            deleted_at: null,
            created_at: organization.createdAt,
            updated_at: organization.updatedAt
          } : null
        }
      };
    }).filter(data => data !== null);  // Filter out null values to avoid errors

    // Log the final response data
    console.log('Final organization data response:', JSON.stringify(organizationData, null, 2));

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


exports.renderDashboard = async (req, res) => {
  try {
    const organizations = await Organization.find().exec();
    res.render('corpAdminDashboard', { organizations, org: null }); // Pass 'org: null' or {} for a new organization
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    res.status(500).send('Server error');
  }
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


