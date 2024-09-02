const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const Organization = require('../models/Organizations'); 
const Course = require('../models/Course');  // Correctly import the Course model
const Batch = require('../models/Batch');    
const Payment = require('../models/Payment'); 
const Cart = require('../models/Cart');
const axios = require('axios');


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
  
  exports.applogout = async (req, res) => {
    const { refresh_token } = req.body;
  
    if (!refresh_token) {
      return res.status(400).json({ status: false, error: 'Refresh token is required.' });
    }
  
    try {
      // Find user with the provided refresh token
      const user = await User.findOne({ refreshToken: refresh_token });
      if (!user) {
        return res.status(400).json({ status: false, error: 'Invalid refresh token.' });
      }
  
      // Remove refresh token
      user.refreshToken = null;
      await user.save();
  
      res.json({ status: true, message: 'Logged out successfully.' });
  
    } catch (error) {
      console.error('Error during logout:', error);
      res.status(500).json({ status: false, error: 'Internal server error.' });
    }
  };
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
    