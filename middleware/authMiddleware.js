const jwt = require('jsonwebtoken');
const User = require('../models/Users');

const auth = async (req, res, next) => {
  try {
    let token;

    // Check for the token in the Authorization header
    if (req.header('Authorization')) {
      token = req.header('Authorization').replace('Bearer ', '');
      //console.log('Token from Authorization header:', token);
    }

    // Check for the token in cookies if not found in the Authorization header
    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    //  console.log('Token from Cookie:', token);
    }

    // If no token is found, throw an error
    if (!token) {
      //console.log('No token found');
      throw new Error('Authentication token not provided');
    }

    // Verify the token
    const decoded = jwt.verify(token, 'your_jwt_secret');
   // console.log('Decoded token:', decoded);

    // Find the user associated with this token
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });
    //console.log('User found:', user);

    // If no user is found, throw an error
    if (!user) {
      //console.log('User not found with given token');
      throw new Error('User not found');
    }

    // Attach the token and user to the request object
    req.token = token;
    req.user = user;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error in auth middleware:', error.message);
    res.status(401).json({ error: 'Please authenticate.' });
  }
};



module.exports = auth;
