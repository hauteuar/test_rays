const mongoose = require('mongoose');

// Connect to MongoDB using Mongoose
mongoose.connect(`mongodb://admin:admin_password@34.136.91.130:27017/rays_sport_db?authSource=admin`, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function () {
  console.log('Connected to MongoDB');

  // Define schema for sidebar URLs list
  const sidebarUrlSchema = new mongoose.Schema({
    id: String,
    type: String,
    app_name: String,
    app_title: String,
    icon: String,
    bgimage: String,
    app_activity: String,
    app_url: String,
    icon_color: String
  });

  // Define schema for sidebar data
  const sidebarSchema = new mongoose.Schema({
    role: String,
    sidebar_urls_list: [sidebarUrlSchema]
  });

  const Sidebar = mongoose.model('Sidebar', sidebarSchema);

  // Sidebar details for students
  const studentSidebar = {
    role: 'student',
    sidebar_urls_list: [
      {
        id: '1',
        type: 'app',
        app_name: 'dashboard',
        app_title: 'Dashboard',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/dashboard.png',
        bgimage: '',
        app_activity: 'dashboard',
        icon_color: '#FF3366',
      },
      {
        id: '2',
        type: 'app',
        app_name: 'Assignments',
        app_title: 'Assignments',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/assignment.png',
        bgimage: '',
        app_activity: 'Assignments',
        icon_color: '#EFFF35',
      },
      {
        id: '3',
        type: 'app',
        app_name: 'LivePractice',
        app_title: 'Live Practice',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/live_practices.png',
        bgimage: '',
        app_activity: 'live_practice',
        icon_color: '#EFFF35',
      },
      {
        id: '4',
        type: 'app',
        app_name: 'LiveChat',
        app_title: 'Live Chat',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/message.png',
        bgimage: '',
        app_activity: 'live_chat',
        icon_color: '#EFFF35',
      },
      {
        id: '5',
        type: 'app',
        app_name: 'MyTeam',
        app_title: 'My Team',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/my_team.png',
        bgimage: '',
        app_activity: 'my_team',
        icon_color: '#EFFF35',
      },
      {
        id: '6',
        type: 'app',
        app_name: 'Courses',
        app_title: 'Courses',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/courses.png',
        bgimage: '',
        app_activity: 'courses',
        icon_color: '#EFFF35',
      },
      {
        id: '7',
        type: 'app',
        app_name: 'PlayerStats',
        app_title: 'Player Stats',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/my_stat.png',
        bgimage: '',
        app_activity: 'player_stats',
        icon_color: '#EFFF35',
      },
      {
        id: '8',
        type: 'app',
        app_name: 'FitnessTesting',
        app_title: 'Fitness Testing',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/fitness_icon.png',
        bgimage: '',
        app_activity: 'fitness_testing',
        icon_color: '#EFFF35',
      },
      {
        id: '9',
        type: 'app',
        app_name: 'MySchedule',
        app_title: 'My Schedule',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/schedule.png',
        bgimage: '',
        app_activity: 'my_schedule',
        icon_color: '#EFFF35',
      },
      {
        id: '10',
        type: 'app',
        app_name: 'logout',
        app_title: 'Logout',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/logout.png',
        bgimage: '',
        app_activity: 'logout',
        icon_color: '#EFFF35',
      }
    ]
  };

  // Sidebar details for coaches
  const coachSidebar = {
    role: 'coach',
    sidebar_urls_list: [
      {
        id: '1',
        type: 'app',
        app_name: 'dashboard',
        app_title: 'Dashboard',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/dashboard.png',
        bgimage: '',
        app_activity: 'dashboard',
        icon_color: '#3586FF',
      },
      {
        id: '2',
        type: 'app',
        app_name: 'Assignments',
        app_title: 'Assignments',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/assignment.png',
        bgimage: '',
        app_activity: 'Assignments',
        icon_color: '#3586FF',
      },
      {
        id: '3',
        type: 'app',
        app_name: 'LivePractice',
        app_title: 'Live Practice',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/live_practices.png',
        bgimage: '',
        app_activity: 'live_practice',
        icon_color: '#3586FF',
      },
      {
        id: '4',
        type: 'app',
        app_name: 'LiveChat',
        app_title: 'Live Chat',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/message.png',
        bgimage: '',
        app_activity: 'live_chat',
        icon_color: '#3586FF',
      },
      {
        id: '5',
        type: 'app',
        app_name: 'MyTeam',
        app_title: 'My Team',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/my_team.png',
        bgimage: '',
        app_activity: 'my_team',
        icon_color: '#3586FF',
      },
      {
        id: '6',
        type: 'app',
        app_name: 'Courses',
        app_title: 'Courses',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/courses.png',
        bgimage: '',
        app_activity: 'courses',
        icon_color: '#3586FF',
      },
      {
        id: '7',
        type: 'app',
        app_name: 'PlayerStats',
        app_title: 'Player Stats',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/my_stat.png',
        bgimage: '',
        app_activity: 'player_stats',
        icon_color: '#3586FF',
      },
      {
        id: '8',
        type: 'app',
        app_name: 'FitnessTesting',
        app_title: 'Fitness Testing',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/fitness_icon.png',
        bgimage: '',
        app_activity: 'fitness_testing',
        icon_color: '#3586FF',
      },
      {
        id: '9',
        type: 'app',
        app_name: 'MySchedule',
        app_title: 'My Schedule',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/schedule.png',
        bgimage: '',
        app_activity: 'my_schedule',
        icon_color: '#3586FF',
      },
      {
        id: '10',
        type: 'app',
        app_name: 'logout',
        app_title: 'Logout',
        icon: 'https://hwzthat-public.s3.ca-central-1.amazonaws.com/app-icons/logout.png',
        bgimage: '',
        app_activity: 'logout',
        icon_color: '#3586FF',
      }
    ]
  };

  try {
    // Insert sidebar details for students and coaches
    await Sidebar.create(studentSidebar);
    await Sidebar.create(coachSidebar);

    console.log('Sidebar details inserted successfully for both student and coach');
  } catch (err) {
    console.error('Error inserting sidebar details:', err);
  } finally {
    mongoose.connection.close();
  }
});
