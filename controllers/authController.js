const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const Organization = require('../models/Organizations'); 
const Course = require('../models/Course');  // Correctly import the Course model
const Batch = require('../models/Batch');    
const Payment = require('../models/Payment'); 
const Cart = require('../models/Cart');
const axios = require('axios');

exports.login = async (req, res) => {
  // Check for both `email` and `username` in the request body
  const emailOrUsername = req.body.email || req.body.username;
  const password = req.body.password;

  try {
    // Find the user by email or username
    const user = await User.findOne({ email: emailOrUsername }).populate('organizations.org_id').exec();
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid email/username or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log('Password mismatch');
      return res.status(401).json({ error: 'Invalid email/username or password.' });
    }

    const token = jwt.sign({ _id: user._id, role: user.role }, 'your_jwt_secret');
    user.tokens = user.tokens.concat({ token });
    await user.save();

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });

    const organizationIds = user.organizations.map(org => org.org_id._id);

    res.json({
      token,
      role: user.role,              // For web
      rollCode: user.role,          // For app, mimicking the old format
      organizations: organizationIds
    });
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
  const { firstName, lastName, dob, gender, email, contactNumber, emergencyContactNumber, streetAddress, apartmentNumber, city, state, postalCode, country, password, organizationId, batchDays, batchTiming, subscriptionPlan } = req.body;

  try {
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required.' });
    }

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
      organizations: [{ org_id: organizationId }]
    });

    await user.save();

    // Find the default practice course for the organization
    const defaultCourse = await Course.findOne({ organization: organizationId, isDefaultPractice: true });
    if (!defaultCourse) {
      return res.status(404).json({ error: 'Default course not found for this organization.' });
    }

    // Create the batch with the provided batch days and timing
    const batch = new Batch({
      name: `${defaultCourse.title} - Batch`,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      timeSlot: batchTiming,
      days: batchDays,
      repeatInterval: 'Weekly',
      course: defaultCourse._id,
      students: [user._id],
      coaches: defaultCourse.coaches
    });

    await batch.save();

    // Update course with the new batch
    defaultCourse.batches.push(batch._id);
    await defaultCourse.save();

    // Calculate the price based on the subscription plan
    const price = 300;
    const discount = subscriptionPlan === 'annual' ? 0.1 : 0;
    const totalAmount = subscriptionPlan === 'annual'
      ? price * 12 * (1 - discount)
      : subscriptionPlan === 'quarterly'
        ? price * 3
        : price;

    // Create a payment record with status 'pending'
    const payment = new Payment({
      transactionId: `trans_${Date.now()}`,
      userId: user._id,
      organizationId: organizationId,
      itemType: 'course',
      itemId: defaultCourse._id,
      amount: totalAmount,
      paymentMethod: 'Card', // Placeholder, should be dynamic based on actual method used
      paymentStatus: 'pending'
    });

    await payment.save();

    // Add the payment to the cart
    const cart = await Cart.findOne({ userId: user._id }) || new Cart({ userId: user._id, items: [] });
    cart.items.push({
      userId: user._id,
      paymentId: payment._id,
      organizationId: organizationId,
      itemType: 'course',
      itemId: defaultCourse._id,
      price: totalAmount,
      status: 'pending',
      subscriptionPlan: subscriptionPlan, // e.g., "monthly", "quarterly", "annual"
      recurringIntervalType: getRecurringIntervalType(subscriptionPlan), // "month", "quarter", "year"
      recurringIntervalCount: getRecurringIntervalCount(subscriptionPlan) // 1 for month/year, 3 for quarterly
    });

    await cart.save();

    res.status(201).json({ message: 'Child registered successfully as a student and added to default course.', user });
  } catch (error) {
    console.error('Error during registration:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message, details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error.', details: error });
  }
};

function getRecurringIntervalType(subscriptionPlan) {
  switch (subscriptionPlan) {
    case 'monthly':
      return 'month';
    case 'quarterly':
      return 'month';
    case 'annual':
      return 'year';
    default:
      return 'month';
  }
}

function getRecurringIntervalCount(subscriptionPlan) {
  switch (subscriptionPlan) {
    case 'monthly':
      return 1;
    case 'quarterly':
      return 3;
    case 'annual':
      return 1;
    default:
      return 1;
  }
}


const generateAccessToken = (user) => {
  return jwt.sign(
    { _id: user._id, role: user.role },
    'your_jwt_secret',
    { expiresIn: '1h' } // Access token valid for 1 hour
  );
};

const generateRefreshToken = () => {
  return jwt.sign(
    {}, // You can include minimal payload or leave it empty
    'your_refresh_jwt_secret',
    { expiresIn: '7d' } // Refresh token valid for 7 days
  );
};

exports.appLogin = async (req, res) => {
  const emailOrUsername = req.body.email || req.body.username;
  const password = req.body.password;

  try {
    // Find the user by email or username
    const user = await User.findOne({ email: emailOrUsername }).populate('organizations.org_id').exec();
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ status: false, error: 'Invalid email/username or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log('Password mismatch');
      return res.status(401).json({ status: false, error: 'Invalid email/username or password.' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Save refresh token to the user
    user.refreshToken = refreshToken;
    await user.save();

    // Calculate token expiration
    const decodedAccess = jwt.decode(accessToken);
    const expiresAt = new Date(decodedAccess.exp * 1000).toISOString();

    // Prepare userData
    const userData = {
      first_name: user.firstName,
      last_name: user.lastName,
      official_email_id: user.email,
      phone_number: user.contactNumber,
      employee_id: user.employee_id || '', // Ensure this field exists
      gender: user.gender,
      slug: user.slug || '', // Ensure this field exists
    };

    // Respond with the expected format
    res.json({
      status: true,
      userData,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      roll_code: user.role.toUpperCase(),
      expires_at: expiresAt
    });

  } catch (error) {
    console.error('Error during app login:', error);
    res.status(500).json({ status: false, error: 'Internal server error.' });
  }
};

exports.refreshToken = async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ status: false, error: 'Refresh token is required.' });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refresh_token, 'your_refresh_jwt_secret');

    // Find user with the provided refresh token
    const user = await User.findOne({ refreshToken: refresh_token });
    if (!user) {
      return res.status(401).json({ status: false, error: 'Invalid refresh token.' });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);
    const decodedAccess = jwt.decode(newAccessToken);
    const expiresAt = new Date(decodedAccess.exp * 1000).toISOString();

    res.json({
      status: true,
      access_token: newAccessToken,
      token_type: "Bearer",
      expires_at: expiresAt
    });

  } catch (error) {
    console.error('Error during token refresh:', error);
    return res.status(401).json({ status: false, error: 'Invalid or expired refresh token.' });
  }
};
