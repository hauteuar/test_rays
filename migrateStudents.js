const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const User = require('./models/users');
const Organization = require('./models/organizations');

// Connect to MongoDB
mongoose.connect('mongodb://admin:admin_password@34.136.91.130:27017/rays_sport_db?authSource=admin');
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
  console.log('Connected to MongoDB');

  try {
    // Load the Excel file
    const workbook = xlsx.readFile("C:/Users/Admin/Documents/EliteCricketAcademyRegistration.xlsx");
    const sheet_name_list = workbook.SheetNames;
    const worksheet = workbook.Sheets[sheet_name_list[0]];

    // Parse the Excel file
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Find the organization ID for "Elite Academy"
    const eliteAcademy = await Organization.findOne({ name: 'Elite Academy' });
    if (!eliteAcademy) {
      throw new Error('Elite Academy organization not found!');
    }

    // Process each row in the Excel file
    for (const row of data) {
      // Extract and map data fields from the spreadsheet row
      const firstName = row['ParentContact_ParentName_First'];
      const lastName = row['ParentContact_ParentName_Last'];
      const email = row['ParentContact_ParentEmail'];
      const gender = 'Not Specified'; // Default to 'Not Specified' if not provided
      const contactNumber = row['ParentContact_ContactsPhone'];
      const dateOfBirth = '2001-01-01'; // Assuming the date of birth isn't provided in this sheet

      // Log the row for debugging
      console.log(row);

      // Validate and process the required fields
      if (!firstName || !lastName || !email) {
        console.warn(`Skipping row due to missing required fields: ${JSON.stringify(row)}`);
        continue; // Skip rows with missing required fields
      }

      // Check if the user already exists
      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        console.warn(`Skipping duplicate user: ${email}`);
        continue; // Skip this user if they already exist
      }

      // Hash the default password
      const password = await bcrypt.hash('default_password', 10);

      // Create a new user
      const user = new User({
        firstName: firstName,
        lastName: lastName,
        dob: new Date(dateOfBirth),
        gender: gender,
        email: email,
        contactNumber: contactNumber,
        password,
        role: 'parent', // Assuming roles are provided in the Excel file
        organizations: [
          {
            org_id: eliteAcademy._id,
            courses: []
          }
        ]
      });

      // Save the user to the database
      await user.save();
      console.log(`User ${firstName} ${lastName} inserted successfully.`);
    }

    console.log('All users inserted successfully.');
  } catch (error) {
    console.error('Error processing users:', error);
  } finally {
    mongoose.connection.close();
  }
});
