const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const Organization = require('../models/Organizations'); // Assuming you have an Organization model
const axios = require('axios');


exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate('organizations.org_id').exec();
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log('Password mismatch');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ _id: user._id, role: user.role }, 'your_jwt_secret');
    user.tokens = user.tokens.concat({ token });
    await user.save();

    // Set token as HttpOnly cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' // Ensure this is true in production
    });

    // Map the organizations array to get all the organization IDs
    const organizationIds = user.organizations.map(org => org.org_id._id);

    res.json({ token, role: user.role, organizations: organizationIds });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.logout = async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
};


exports.register = async (req, res) => {
  const { firstName, lastName, dob, gender, email, contactNumber, emergencyContactNumber, streetAddress, apartmentNumber, city, state, postalCode, country, password, role, organizationId } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      firstName,
      lastName,
      dob,
      gender,
      email,
      contactNumber,
      emergencyContactNumber,
      address: {
        street: streetAddress,
        apartment: apartmentNumber,
        city,
        state,
        postalCode,
        country
      },
      password: hashedPassword,
      role
    });

    // Create the user in the database first
    await user.save();
    console.log('user saved sucessfully');
    // Assuming organizationId is an array of organization IDs if the user is part of multiple organizations
    for (let orgId of organizationId) {
      const organization = await Organization.findById(orgId);

      if (organization) {
        // Call the payment API to create a customer ID
        const paymentResponse = await axios.post('https://api-payments.rayssportsnetwork.com/create-customer', {
          name: `${firstName} ${lastName}`,
          email: email,
          clientId: `HWZTHAT202401` // Unique clientId for each organization
        });

        const paymentCustomerId = paymentResponse.data.customerId;

        // Update the user with the payment customer ID for the specific organization
        user.organizations.push({
          org_id: orgId,
          paymentCustomerId: paymentCustomerId
        });
      }
    }

    await user.save();

    res.status(201).json({ message: 'User registered successfully.', user });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message, details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error.', details: error });
  }
};

exports.registerChild = async (req, res) => {
  const { firstName, lastName, dob, gender, email, contactNumber, emergencyContactNumber, streetAddress, apartmentNumber, city, state, postalCode, country, password, organizationId } = req.body;

  try {
    console.log('Received organizationId:', organizationId);

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required.' });
    }

    // If organizationId is a string, convert it to an array to maintain consistency
    const organizationIds = Array.isArray(organizationId) ? organizationId : [organizationId];
    console.log('Organization IDs:', organizationIds);

    // Convert each organizationId to ObjectId with error handling
    const validOrganizationIds = organizationIds.map(id => {
      try {
        return id;
      } catch (err) {
        console.error('Invalid ObjectId:', id, err);
        throw new Error(`Invalid Organization ID: ${id}`);
      }
    });

    console.log('Valid Organization IDs:', validOrganizationIds);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      firstName,
      lastName,
      dob,
      gender,
      email,
      contactNumber,
      emergencyContactNumber,
      address: {
        street: streetAddress,
        apartment: apartmentNumber,
        city,
        state,
        postalCode,
        country
      },
      password: hashedPassword,
      role: 'student',
      organizations: validOrganizationIds.map(orgId => ({ org_id: orgId, courses: [] }))
    });

    // Save the user in the database first
    await user.save();
    console.log('User saved successfully');

    for (let orgId of validOrganizationIds) {
      const organization = await Organization.findById(orgId);
      console.log('Organization found:', organization);

      if (organization) {
        // Call the payment API to create a customer ID
        const paymentResponse = await axios.post('https://api-payments.rayssportsnetwork.com/create-customer', {
          name: `${firstName} ${lastName}`,
          email: email,
          clientId: `HWZTHAT202401` // Unique clientId for each organization
        });
        console.log('Payment Response:', paymentResponse.data);
        const paymentCustomerId = paymentResponse.data.customerId;

        // Update the user with the payment customer ID for the specific organization
        user.organizations.push({
          org_id: orgId,
          paymentCustomerId: paymentCustomerId
        });
      }
    }

    await user.save();

    res.status(201).json({ message: 'Child registered successfully as a student.', user });
  } catch (error) {
    console.error('Error during registration:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message, details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error.', details: error });
  }
};