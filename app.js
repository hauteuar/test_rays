const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const config = require('./config');
const authMiddleware = require('./middleware/authMiddleware');
const Organization = require('./models/organizations');
const User = require('./models/users');
const Course = require('./models/course');
const Batch = require('./models/batch');
const Category = require('./models/Category');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// MongoDB connection
mongoose.connect(config.mongodb.url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to MongoDB');
});

// Routes
const authRoutes = require('./routes/authRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const batchRoutes = require('./routes/batchRoutes');
const taskRoutes = require('./routes/taskRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

app.use('/auth', authRoutes);
app.use('/organizations', organizationRoutes);
app.use('/api/user', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/', (req, res) => {
  res.redirect('/auth/login');
});

// Define the corporate admin dashboard route
app.get('/corp_admin/dashboard', authMiddleware, async (req, res) => {
  console.log('Request passed through authMiddleware');
  try {
    const organizations = await Organization.find({});
    res.render('corpAdminDashboard', { organizations });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/org_admin/dashboard', authMiddleware, (req, res) => {
  res.redirect('/booking_management.html');
});

app.get('/coach/dashboard', authMiddleware, (req, res) => {
  res.render('coachDashboard');
});

app.get('/user/dashboard', authMiddleware, (req, res) => {
  res.render('userDashboard');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { db };
