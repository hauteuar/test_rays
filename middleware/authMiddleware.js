const jwt = require('jsonwebtoken');
const User = require('../models/Users');

const auth = async (req, res, next) => {
  try {
    let token;

    if (req.header('Authorization')) {
      token = req.header('Authorization').replace('Bearer ', '');
      console.log('Token from Authorization header:', token);
    }

    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
      console.log('Token from Cookie:', token);
    }

    if (!token) {
      console.log('No token found');
      throw new Error('Authentication token not provided');
    }

    // Verify the token and catch any errors
    let decoded;
    try {
      decoded = jwt.verify(token, 'your_jwt_secret');
    } catch (err) {
      console.error('Token verification failed:', err);
      throw new Error('Invalid token');
    }

    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

    if (!user) {
      console.log('User not found with given token');
      throw new Error('User not found');
    }

    req.token = token;
    req.user = user;

    next();
  } catch (error) {
    console.error('Error in auth middleware:', error.message);
    res.status(401).json({ error: 'Please authenticate.' });
  }
};


module.exports = auth;
