const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/Users');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate('organizations.org_id').exec();
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    console.log('User found:', user.email); // Debug log

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', passwordMatch); // Debug log
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

    // Handle undefined organization for corp_admin
    const organizationId = user.organizations.length > 0 ? user.organizations[0].org_id._id : null;

    res.json({ token, role: user.role, organization: organizationId });
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
  const { firstName, lastName, dob, gender, email, contactNumber, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      firstName,
      lastName,
      dob,
      gender,
      email,
      contactNumber,
      password: hashedPassword,
      role
    });
    await user.save();

    res.status(201).json({ message: 'User registered successfully.', user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
};
