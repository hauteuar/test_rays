const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const { connectToDatabase } = require('./db/db'); // Adjust the path as necessary

async function migrateStudents() {
  try {
    // Connect to the database
    const db = await connectToDatabase('hwzthat');
    console.log('Successfully connected to database: hwzthat');

    // Register the User and Student models with the connection
    const UserModel = db.model('User', User.schema);
    const StudentModel = db.model('Student', Student.schema);

    // Fetch all users with the role of 'student'
    const users = await UserModel.find({ role: 'student' });
    console.log(`Found ${users.length} student users.`);

    // Migrate each user to the Student schema
    for (const user of users) {
      if (user.organizationName) {
        const student = new StudentModel({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.contactNumber,
          courses: [],
          batches: [],
          assignments: [],
          fitnessData: [],
          organizationName: user.organizationName
        });

        await student.save();
        console.log(`Migrated user ${user.email} to student.`);
      } else {
        console.warn(`User ${user.email} does not have an organization assigned. Skipping migration.`);
      }
    }

    console.log('Migration complete');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    mongoose.connection.close();
  }
}

migrateStudents();
