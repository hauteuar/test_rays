const config = require('../config');

const generateAccessToken = (user) => {
  return jwt.sign(
    { _id: user._id, role: user.role },
    config.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const generateRefreshToken = () => {
  return jwt.sign(
    {},
    config.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};
