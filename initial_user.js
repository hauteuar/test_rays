const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/users');
const Organization = require('./models/organizations');

// Connect to MongoDB
mongoose.connect(`mongodb://admin:admin_password@34.136.91.130:27017/rays_sport_db?authSource=admin`);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
  console.log('Connected to MongoDB');

  try {
    // Clear existing data
    await User.deleteMany({});
    await Organization.deleteMany({});

    // Create Organizations
    const eliteAcademy = new Organization({
      name: 'Elite Academy',
      logo_url: 'path/to/elite_logo.png',
      theme_color: '#FF5733',
      domain: 'elite_academy.rayssport.com',
      courses: []
    });

    const tjsSports = new Organization({
      name: "TJ's Sports",
      logo_url: 'path/to/tjs_logo.png',
      theme_color: '#33FF57',
      domain: 'tjs_sports.rayssport.com',
      courses: []
    });

    await eliteAcademy.save();
    await tjsSports.save();

    // Hash passwords
    const corpAdminPassword = await bcrypt.hash('corp_admin_password', 10);
    const eliteAdminPassword = await bcrypt.hash('elite_admin_password', 10);
    const tjsAdminPassword = await bcrypt.hash('tjs_admin_password', 10);
    const headCoachPassword = await bcrypt.hash('head_coach_password', 10);

    // Create Users
    const corpAdmin = new User({
      firstName: 'Corp',
      lastName: 'Admin',
      dob: new Date('1980-01-01'),
      gender: 'M',
      email: 'corp_admin@rayssport.com',
      contactNumber: '1234567890',
      password: corpAdminPassword,
      role: 'corp_admin',
      organizations: []
    });

    const eliteAdmin = new User({
      firstName: 'Elite',
      lastName: 'Admin',
      dob: new Date('1980-01-01'),
      gender: 'M',
      email: 'elite_admin@rayssport.com',
      contactNumber: '1234567891',
      password: eliteAdminPassword,
      role: 'org_admin',
      organizations: [
        {
          org_id: eliteAcademy._id,
          courses: []
        }
      ]
    });

    const tjsAdmin = new User({
      firstName: 'TJS',
      lastName: 'Admin',
      dob: new Date('1980-01-01'),
      gender: 'M',
      email: 'tjs_admin@rayssport.com',
      contactNumber: '1234567892',
      password: tjsAdminPassword,
      role: 'org_admin',
      organizations: [
        {
          org_id: tjsSports._id,
          courses: []
        }
      ]
    });

    const headCoach = new User({
      firstName: 'Head',
      lastName: 'Coach',
      dob: new Date('1980-01-01'),
      gender: 'M',
      email: 'head_coach@rayssport.com',
      contactNumber: '1234567893',
      password: headCoachPassword,
      role: 'coach',
      organizations: [
        {
          org_id: eliteAcademy._id,
          courses: []
        },
        {
          org_id: tjsSports._id,
          courses: []
        }
      ]
    });

    await corpAdmin.save();
    await eliteAdmin.save();
    await tjsAdmin.save();
    await headCoach.save();

    // Create additional users
    const eliteCoachPasswords = await Promise.all(
      Array.from({ length: 3 }).map(() => bcrypt.hash('elite_coach_password', 10))
    );
    const tjsCoachPassword = await bcrypt.hash('tjs_coach_password', 10);

    const eliteCoaches = eliteCoachPasswords.map((password, index) => new User({
      firstName: `EliteCoach${index + 1}`,
      lastName: `Last${index + 1}`,
      dob: new Date('1985-01-01'),
      gender: 'M',
      email: `elite_coach${index + 1}@rayssport.com`,
      contactNumber: `12345678${index + 4}`,
      password,
      role: 'coach',
      organizations: [{ org_id: eliteAcademy._id, courses: [] }]
    }));

    const tjsCoach = new User({
      firstName: 'TJSCoach',
      lastName: 'Last1',
      dob: new Date('1985-01-01'),
      gender: 'M',
      email: 'tjs_coach1@rayssport.com',
      contactNumber: '1234567897',
      password: tjsCoachPassword,
      role: 'coach',
      organizations: [{ org_id: tjsSports._id, courses: [] }]
    });

    const eliteStudentPasswords = await Promise.all(
      Array.from({ length: 10 }).map(() => bcrypt.hash('elite_student_password', 10))
    );
    const tjsStudentPasswords = await Promise.all(
      Array.from({ length: 5 }).map(() => bcrypt.hash('tjs_student_password', 10))
    );

    const eliteStudents = eliteStudentPasswords.map((password, index) => new User({
      firstName: `EliteStudent${index + 1}`,
      lastName: `Last${index + 1}`,
      dob: new Date('2000-01-01'),
      gender: 'F',
      email: `elite_student${index + 1}@rayssport.com`,
      contactNumber: `12345678${index + 8}`,
      password,
      role: 'student',
      organizations: [{ org_id: eliteAcademy._id, courses: [] }]
    }));

    const tjsStudents = tjsStudentPasswords.map((password, index) => new User({
      firstName: `TJSStudent${index + 1}`,
      lastName: `Last${index + 1}`,
      dob: new Date('2000-01-01'),
      gender: 'F',
      email: `tjs_student${index + 1}@rayssport.com`,
      contactNumber: `12345679${index + 8}`,
      password,
      role: 'student',
      organizations: [{ org_id: tjsSports._id, courses: [] }]
    }));

    await User.insertMany([...eliteCoaches, tjsCoach, ...eliteStudents, ...tjsStudents]);

    console.log('Database initialized successfully with additional users');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    mongoose.connection.close();
  }
});
