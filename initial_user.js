const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/Users');
const Organization = require('./models/Organizations');
const Course = require('./models/Course');
const Batch = require('./models/Batch');
const Payment = require('./models/Payment');

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
    await Course.deleteMany({});
    await Batch.deleteMany({});
    await Payment.deleteMany({});

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

    const mississaugaRamblers = new Organization({
      name: "Mississauga Ramblers",
      logo_url: 'path/to/ramblers_logo.png',
      theme_color: '#3399FF',
      domain: 'mississauga_ramblers.rayssport.com',
      courses: []
    });

    await eliteAcademy.save();
    await tjsSports.save();
    await mississaugaRamblers.save();

    // Create Default Courses
    const defaultCourseElite = new Course({
      title: 'Elite Cricket Basics',
      description: 'Basic cricket training for beginners.',
      duration: '6 Months',
      price: 300,
      location: 'Elite Academy Ground',
      mode: 'Offline',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
      bannerImage: 'path/to/elite_course_banner.png',
      isDefaultPractice: true,
      organization: eliteAcademy._id
    });

    const defaultCourseTJS = new Course({
      title: 'TJS Sports Basics',
      description: 'Basic sports training for beginners.',
      duration: '6 Months',
      price: 300,
      location: 'TJS Academy Ground',
      mode: 'Offline',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
      bannerImage: 'path/to/tjs_course_banner.png',
      isDefaultPractice: true,
      organization: tjsSports._id
    });

    const defaultCourseRamblers = new Course({
      title: 'Ramblers Cricket Basics',
      description: 'Basic cricket training for beginners.',
      duration: '6 Months',
      price: 300,
      location: 'Mississauga Ramblers Ground',
      mode: 'Offline',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
      bannerImage: 'path/to/ramblers_course_banner.png',
      isDefaultPractice: true,
      organization: mississaugaRamblers._id
    });

    await defaultCourseElite.save();
    await defaultCourseTJS.save();
    await defaultCourseRamblers.save();

    // Hash passwords
    const corpAdminPassword = await bcrypt.hash('corp_admin_password', 10);
    const eliteAdminPassword = await bcrypt.hash('elite_admin_password', 10);
    const tjsAdminPassword = await bcrypt.hash('tjs_admin_password', 10);
    const ramblersAdminPassword = await bcrypt.hash('ramblers_admin_password', 10);
    const headCoachPassword = await bcrypt.hash('head_coach_password', 10);
    const freelanceCoachPassword = await bcrypt.hash('freelance_coach_password', 10);

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
          courses: [defaultCourseElite._id] // Ensure the course ID is correctly referenced
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
          courses: [defaultCourseTJS._id] // Ensure the course ID is correctly referenced
        }
      ]
    });

    const ramblersAdmin = new User({
      firstName: 'Ramblers',
      lastName: 'Admin',
      dob: new Date('1980-01-01'),
      gender: 'M',
      email: 'ramblers_admin@rayssport.com',
      contactNumber: '1234567895',
      password: ramblersAdminPassword,
      role: 'org_admin',
      organizations: [
        {
          org_id: mississaugaRamblers._id,
          courses: [defaultCourseRamblers._id] // Ensure the course ID is correctly referenced
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
          courses: [defaultCourseElite._id]
        },
        {
          org_id: tjsSports._id,
          courses: [defaultCourseTJS._id]
        },
        {
          org_id: mississaugaRamblers._id,
          courses: [defaultCourseRamblers._id]
        }
      ]
    });

    const freelanceCoach = new User({
      firstName: 'Freelance',
      lastName: 'Coach',
      dob: new Date('1985-01-01'),
      gender: 'F',
      email: 'freelance_coach@rayssport.com',
      contactNumber: '1234567894',
      password: freelanceCoachPassword,
      role: 'freelance_coach',
      organizations: [
        {
          org_id: eliteAcademy._id,
          courses: [defaultCourseElite._id]
        },
        {
          org_id: tjsSports._id,
          courses: [defaultCourseTJS._id]
        },
        {
          org_id: mississaugaRamblers._id,
          courses: [defaultCourseRamblers._id]
        }
      ]
    });

    await corpAdmin.save();
    await eliteAdmin.save();
    await tjsAdmin.save();
    await ramblersAdmin.save();
    await headCoach.save();
    await freelanceCoach.save();

    // Create additional users (coaches and students)
    const eliteCoachPasswords = await Promise.all(
      Array.from({ length: 3 }).map(() => bcrypt.hash('elite_coach_password', 10))
    );
    const tjsCoachPassword = await bcrypt.hash('tjs_coach_password', 10);
    const ramblersCoachPassword = await bcrypt.hash('ramblers_coach_password', 10);

    const eliteCoaches = await User.insertMany(eliteCoachPasswords.map((password, index) => ({
      firstName: `EliteCoach${index + 1}`,
      lastName: `Last${index + 1}`,
      dob: new Date('1985-01-01'),
      gender: 'M',
      email: `elite_coach${index + 1}@rayssport.com`,
      contactNumber: `12345678${index + 4}`,
      password,
      role: 'coach',
      organizations: [{ org_id: eliteAcademy._id, courses: [defaultCourseElite._id] }] // Correctly reference course ID
    })));

    const tjsCoach = await new User({
      firstName: 'TJSCoach',
      lastName: 'Last1',
      dob: new Date('1985-01-01'),
      gender: 'M',
      email: 'tjs_coach1@rayssport.com',
      contactNumber: '1234567897',
      password: tjsCoachPassword,
      role: 'coach',
      organizations: [{ org_id: tjsSports._id, courses: [defaultCourseTJS._id] }] // Correctly reference course ID
    }).save();

    const ramblersCoach = await new User({
      firstName: 'RamblersCoach',
      lastName: 'Last1',
      dob: new Date('1985-01-01'),
      gender: 'M',
      email: 'ramblers_coach1@rayssport.com',
      contactNumber: '1234567898',
      password: ramblersCoachPassword,
      role: 'coach',
      organizations: [{ org_id: mississaugaRamblers._id, courses: [defaultCourseRamblers._id] }] // Correctly reference course ID
    }).save();

    const eliteStudentPasswords = await Promise.all(
      Array.from({ length: 10 }).map(() => bcrypt.hash('elite_student_password', 10))
    );
    const tjsStudentPasswords = await Promise.all(
      Array.from({ length: 5 }).map(() => bcrypt.hash('tjs_student_password', 10))
    );
    const ramblersStudentPasswords = await Promise.all(
      Array.from({ length: 8 }).map(() => bcrypt.hash('ramblers_student_password', 10))
    );

    const eliteStudents = await User.insertMany(eliteStudentPasswords.map((password, index) => ({
      firstName: `EliteStudent${index + 1}`,
      lastName: `Last${index + 1}`,
      dob: new Date('2000-01-01'),
      gender: 'F',
      email: `elite_student${index + 1}@rayssport.com`,
      contactNumber: `12345678${index + 8}`,
      password,
      role: 'student',
      organizations: [{ org_id: eliteAcademy._id, courses: [defaultCourseElite._id] }] // Correctly reference course ID
    })));

    const tjsStudents = await User.insertMany(tjsStudentPasswords.map((password, index) => ({
      firstName: `TJSStudent${index + 1}`,
      lastName: `Last${index + 1}`,
      dob: new Date('2000-01-01'),
      gender: 'F',
      email: `tjs_student${index + 1}@rayssport.com`,
      contactNumber: `12345679${index + 8}`,
      password,
      role: 'student',
      organizations: [{ org_id: tjsSports._id, courses: [defaultCourseTJS._id] }] // Correctly reference course ID
    })));

    const ramblersStudents = await User.insertMany(ramblersStudentPasswords.map((password, index) => ({
      firstName: `RamblersStudent${index + 1}`,
      lastName: `Last${index + 1}`,
      dob: new Date('2000-01-01'),
      gender: 'F',
      email: `ramblers_student${index + 1}@rayssport.com`,
      contactNumber: `12345680${index + 8}`,
      password,
      role: 'student',
      organizations: [{ org_id: mississaugaRamblers._id, courses: [defaultCourseRamblers._id] }] // Correctly reference course ID
    })));

    // Create Batches and Assign Users
    const createBatch = async (course, students, coaches) => {
      const batch = new Batch({
        name: `${course.title} - Batch 1`,
        startDate: course.startDate,
        endDate: course.endDate,
        timeSlot: '15:00 - 16:00',
        days: ['Monday', 'Wednesday', 'Friday'],
        repeatInterval: 'Weekly',
        course: course._id, // Correctly link the batch to the course
        students: students.map(student => student._id),
        coaches: coaches.map(coach => coach._id)
      });

      await batch.save();

      // Assign the batch to students and coaches
      await Promise.all(
        students.map(student =>
          User.updateOne(
            { _id: student._id },
            { $push: { 'organizations.$[org].courses.$[course].batches': { batch_id: batch._id, role: 'student' } } },
            { arrayFilters: [{ 'org.org_id': course.organization }, { 'course._id': course._id }] } // Ensure correct course ID is used in filters
          )
        )
      );

      await Promise.all(
        coaches.map(coach =>
          User.updateOne(
            { _id: coach._id },
            { $push: { 'organizations.$[org].courses.$[course].batches': { batch_id: batch._id, role: 'coach' } } },
            { arrayFilters: [{ 'org.org_id': course.organization }, { 'course._id': course._id }] } // Ensure correct course ID is used in filters
          )
        )
      );

      return batch;
    };

    // Create Batches and Assign to the Correct Courses and Users
    const eliteBatch = await createBatch(defaultCourseElite, eliteStudents, eliteCoaches);
    const tjsBatch = await createBatch(defaultCourseTJS, tjsStudents, [tjsCoach]);
    const ramblersBatch = await createBatch(defaultCourseRamblers, ramblersStudents, [ramblersCoach]);

    console.log('Database initialized successfully with users, courses, and batches for all organizations.');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    mongoose.connection.close();
  }
});
