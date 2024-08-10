const { connectToDatabase } = require('../db/db');
const SportSchema = require('../models/Sport').schema;
const CourtSchema = require('../models/Court').schema;
const BookingSchema = require('../models/Booking').schema;
const UserSchema = require('../models/Users').schema;
const OrganizationSchema = require('../models/Organizations').schema;
const CoachSchema = require('../models/Coach').schema;
const CategorySchema = require('../models/Category').schema;
const CourseSchema = require('../models/Course').schema;
const BatchSchema = require('../models/Batch').schema;
const PackageSchema = require('../models/Package').schema;
const AssignmentSchema = require('../models/Assignment').schema;
const TaskSchema = require('../models/Task').schema;
const StudentSchema = require('../models/Student').schema;

const setDatabaseConnection = async (req, res, next) => {
  try {
    const corpDbConnection = connectToDatabase('hwzthat');
    corpDbConnection.model('User', UserSchema); 
    corpDbConnection.model('Organization', OrganizationSchema);
    const Organization = corpDbConnection.model('Organization');

    const organizationName = req.get('organizationName');
    console.log('Received organization name:', organizationName);

    if (!organizationName) {
      console.log('No organization name provided in headers.');
      return res.status(400).send({ message: 'Organization name is required' });
    }

    console.log('Searching for organization:', organizationName);
    const organization = await Organization.findOne({ name: organizationName }).exec();
    if (!organization) {
      console.log(`Organization not found: ${organizationName}`);
      return res.status(404).send({ message: 'Organization not found' });
    }

    console.log(`Found organization: ${organizationName}`);
    req.db = connectToDatabase(organizationName);
    console.log(`Database connection established for organization: ${organizationName}`);

    req.db.model('Sport', SportSchema);
    req.db.model('Court', CourtSchema);
    req.db.model('Booking', BookingSchema);
    req.db.model('User', UserSchema);
    req.db.model('Coach', CoachSchema);
    req.db.model('Category', CategorySchema);
    req.db.model('Course', CourseSchema);
    req.db.model('Batch', BatchSchema);
    req.db.model('Package', PackageSchema);
    req.db.model('Assignment', AssignmentSchema);
    req.db.model('Task', TaskSchema);
    req.db.model('Student', StudentSchema);

    req.organization = organization;
    next();
  } catch (error) {
    console.error('Error setting database connection:', error);
    res.status(500).send({ message: 'Error setting database connection', error });
  }
};

module.exports = setDatabaseConnection;
