const jwt = require('jsonwebtoken');
const User = require('../models/users');

const auth = async (req, res, next) => {
  try {
    let token;

    // Check the Authorization header
    if (req.header('Authorization')) {
      token = req.header('Authorization').replace('Bearer ', '');
      console.log('Token from Authorization header:', token);
    }

    // Check the Cookie header if Authorization header is not present
    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
      console.log('Token from Cookie:', token);
    }

    if (!token) {
      console.log('No token found');
      throw new Error();
    }

    const decoded = jwt.verify(token, 'your_jwt_secret');
    console.log('Decoded token:', decoded);

    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });
    console.log('User found:', user);

    if (!user) {
      console.log('User not found with given token');
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

module.exports = auth;
