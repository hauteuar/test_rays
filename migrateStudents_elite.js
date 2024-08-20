const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const csv = require('csv-parser');
const fs = require('fs');
const User = require('./models/users');
const Organization = require('./models/organizations');

// Connect to MongoDB
mongoose.connect('mongodb://admin:admin_password@34.136.91.130:27017/rays_sport_db?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,  // Timeout after 5 seconds if no servers are found
  socketTimeoutMS: 45000,          // Timeout after 45 seconds of inactivity
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function () {
  console.log('Connected to MongoDB');

  try {
    const eliteAcademy = await Organization.findOne({ name: 'Elite Academy' });
    if (!eliteAcademy) {
      throw new Error('Elite Cricket Academy organization not found!');
    }

    const stream = fs.createReadStream("C:/Users/Admin/Downloads/EliteCricketAcademyReg.csv")
      .pipe(csv());

    for await (const row of stream) {
      try {
        const firstName = row['Name_First'];
        const lastName = row['Name_Last'];
        let email = row['StudentEmail'];
        let contactNumber = row['StudentPhoneNumber'];
        const gender = row['Gender'] || 'Not Specified';
        const dateOfBirth = row['DateOfBirth'] || '2001-01-01'; // Placeholder date if DOB is missing

        // Use parent's contact number if student's contact number is missing
        if (!contactNumber) {
          contactNumber = row['ParentContact_ContactsPhone'];
          console.log('Student contact number not found, using parent contact number:', contactNumber);
        }

        if (!email) {
          email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@rayssport.com`;
        }

        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
          console.warn(`Skipping duplicate user: ${email}`);
          continue;
        }

        const password = await bcrypt.hash('default_password', 10);

        const user = new User({
          firstName: firstName,
          lastName: lastName,
          dob: new Date(dateOfBirth),
          gender: gender,
          email: email,
          contactNumber: contactNumber,
          password,
          role: 'student',
          address: {
            street: row['Address_Line1'],
            apartment: row['Address_Apartment'] || '',
            city: row['Address_City'],
            state: row['Address_State'],
            postalCode: row['Address_PostalCode'],
            country: row['Address_Country']
          },
          organizations: [
            {
              org_id: eliteAcademy._id,
              courses: []
            }
          ]
        });

        await user.save();
        console.log(`User ${firstName} ${lastName} inserted successfully.`);
      } catch (err) {
        console.error('Error processing row:', err);
        // Exit the loop on the first error
        break;
      }
    }

    console.log('CSV file processed successfully.');
  } catch (error) {
    console.error('Error processing users:', error);
  } finally {
    mongoose.connection.close();
  }
});
