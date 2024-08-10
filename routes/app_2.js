require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { corpConnection, connectToDatabase } = require('../db/db');
const UserSchema = require('../models/User').schema;
const OrganizationSchema = require('../models/Organization').schema;
const StudentSchema = require('../models/Student').schema; // Import the student schema

// Define models using schemas
corpConnection.model('User', UserSchema);
corpConnection.model('Organization', OrganizationSchema);
const User = corpConnection.model('User');
const Organization = corpConnection.model('Organization');

async function createCorpAdmin() {
  try {
    const password = await bcrypt.hash('Password@123', 8);
    const admin = new User({
      firstName: 'Rays',
      lastName: 'Admin',
      dob: new Date(),
      gender: 'Male',
      email: 'hwzthatadmin@hwzthat.com',
      contactNumber: '1234567890',
      password,
      role: 'corp_admin',
      organizationName: null
    });
    await admin.save();
    const token = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET);
    admin.tokens.push({ token });
    await admin.save();
    console.log('Corporate admin created:', admin);
  } catch (error) {
    console.error('Error creating corporate admin:', error);
  }
}

async function createOrgAdmin() {
  try {
    const password = await bcrypt.hash('Password@123', 8);
    const org = new Organization({
      name: 'Org_Elite_Cricket_Academy',
      address: '123 Main St, City, Country',
      contactNumber: '1234567890',
      email: 'eliteadmin@hwzthat.com'
    });
    await org.save();

    const orgConnection = connectToDatabase(org.name);
    orgConnection.model('User', UserSchema);
    const OrgUser = orgConnection.model('User');
    const admin = new OrgUser({
      firstName: 'Elite',
      lastName: 'Admin',
      dob: new Date(),
      gender: 'Female',
      email: 'eliteadmin@hwzthat.com',
      contactNumber: '1234567890',
      password,
      role: 'org_admin',
      organization: org._id,
      organizationName: org.name
    });
    await admin.save();
    const token = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET);
    admin.tokens.push({ token });
    await admin.save();
    org.admins.push(admin._id);
    await org.save();
    console.log('Organization admin created:', admin);
  } catch (error) {
    console.error('Error creating organization admin:', error);
  }
}

async function createFreelanceCoach() {
  try {
    const password = await bcrypt.hash('password123', 8);
    const coach = new User({
      firstName: 'Freelance',
      lastName: 'Coach',
      dob: new Date(),
      gender: 'Female',
      email: 'freelancecoach02@hwzthat.com',
      contactNumber: '1234567890',
      password,
      role: 'freelance_coach',
      organizationName: null
    });
    await coach.save();
    const token = jwt.sign({ userId: coach._id }, process.env.JWT_SECRET);
    coach.tokens.push({ token });
    await coach.save();
    console.log('Freelance coach created:', coach);
  } catch (error) {
    console.error('Error creating freelance coach:', error);
  }
}

async function createEliteCoach() {
  try {
    const password = await bcrypt.hash('Password@123', 8);
    const org = await Organization.findOne({ name: 'Org_Elite_Cricket_Academy' });

    if (!org) {
      throw new Error('Organization not found');
    }

    const orgConnection = connectToDatabase(org.name);
    orgConnection.model('User', UserSchema);
    const OrgUser = orgConnection.model('User');
    const coach = new OrgUser({
      firstName: 'Elite',
      lastName: 'Coach',
      dob: new Date(),
      gender: 'Male',
      email: 'elitecoach@hwzthat.com',
      contactNumber: '1234567890',
      password,
      role: 'coach',
      organization: org._id,
      organizationName: org.name
    });
    await coach.save();
    const token = jwt.sign({ userId: coach._id }, process.env.JWT_SECRET);
    coach.tokens.push({ token });
    await coach.save();
    org.coaches.push(coach._id);
    await org.save();
    console.log('Elite coach created:', coach);
  } catch (error) {
    console.error('Error creating elite coach:', error);
  }
}

async function createStudent() {
  try {
    const org = await Organization.findOne({ name: 'Org_Elite_Cricket_Academy' });

    if (!org) {
      throw new Error('Organization not found');
    }

    const orgConnection = connectToDatabase(org.name);
    orgConnection.model('Student', StudentSchema);
    const Student = orgConnection.model('Student');
    const student = new Student({
      firstName: 'John',
      lastName: 'Doe',
      email: 'student@hwzthat.com',
      phone: '1234567890',
      courses: [], // Assign course IDs here
      batches: [], // Assign batch IDs here
      assignments: [],
      fitnessData: [],
      organization: org._id,
      organizationName: org.name
    });
    await student.save();
    console.log('Student created:', student);
  } catch (error) {
    console.error('Error creating student:', error);
  }
}

async function createUsers() {
  try {
    //await createCorpAdmin();
    //await createOrgAdmin();
    //await createFreelanceCoach();
    //await createEliteCoach();
    await createStudent(); // Add this line to create a student
  } catch (err) {
    console.error('Error creating users:', err);
  }
}

createUsers();
