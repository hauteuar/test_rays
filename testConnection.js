const mongoose = require('mongoose');

const testConnection = async () => {
  try {
    await mongoose.connect('mongodb://admin:admin_password@34.136.91.130:27017/Org_Elite_Cricket_Academy?authSource=admin', {
      useNewUrlParser: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    mongoose.connection.close();
  }
};

testConnection();
