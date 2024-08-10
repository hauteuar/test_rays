const mongoose = require('mongoose');
const UserSchema = require('../models/Users').schema;
const OrganizationSchema = require('../models/Organizations').schema;
const SignedDocumentSchema = require('../models/SignedDocument').schema;
const BookingSchema = require('../models/Booking').schema;
const SportSchema = require('../models/Sport').schema;
const CourtSchema = require('../models/Court').schema;

const connectToDatabase = (dbName) => {
  console.log(`Connecting to database: ${dbName}`);
  const connection = mongoose.createConnection(`mongodb://admin:admin_password@34.136.91.130:27017/${dbName}?authSource=admin`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  });

  connection.on('error', (err) => {
    console.error(`Error connecting to database: ${dbName}`, err);
  });

  connection.once('open', () => {
    console.log(`Successfully connected to database: ${dbName}`);
  });

  connection.model('User', UserSchema);
  connection.model('Organization', OrganizationSchema);
  connection.model('SignedDocument', SignedDocumentSchema);
  connection.model('Booking', BookingSchema);
  connection.model('Sport', SportSchema);
  connection.model('Court', CourtSchema);

  return connection;
};

const corpConnection = connectToDatabase('hwzthat');

module.exports = { connectToDatabase, corpConnection };
