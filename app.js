
const http = require('http');
const socketIo = require('socket.io');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const config = require('./config');
const authMiddleware = require('./middleware/authMiddleware');
const { Organization } = require('./models/Organizations');
const User = require('./models/Users');
const Course = require('./models/Course');
const Batch = require('./models/Batch');
const Category = require('./models/Category');
const Payment = require('./models/Payment');
const Booking = require('./models/Booking');
const session = require('express-session');
const Cart = require('./models/Cart');
const multer = require('multer');
//const http = require('http');
//const socketIo = require('socket.io');

// Create the Express app and HTTP server
const app = express();

const server = http.createServer(app);
const io = socketIo(server);

// Socket.io logic
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// MongoDB connection
mongoose.connect(config.mongodb.url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to MongoDB');
});

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set secure: true in production with HTTPS
}));

const storage = multer.memoryStorage();
const uploadMiddleware = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB limit for example
}).any(); // .any() allows any file type

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));


// Routes
const authRoutes = require('./routes/authRoutes');
const appRoutes = require('./routes/appRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const batchRoutes = require('./routes/batchRoutes');
const taskRoutes = require('./routes/taskRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const sportRoutes = require('./routes/sportRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const documentRoutes = require('./routes/documentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const cartRoutes = require('./routes/cartRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const orgRoutes = require('./routes/orgRoutes');
const waiverRoutes = require('./routes/waiverRoutes');
const itemRoutes = require('./routes/itemRoutes');
const sponsorRoutes = require('./routes/sponsorRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const meetingSessionRoutes = require('./routes/meetingSessionRoutes');
const scheduledMeetingRoutes = require('./routes/scheduledMeetingRoutes');
const packageRoutes = require('./routes/packageRoutes');



app.use('/api/meeting-sessions', meetingSessionRoutes);
app.use('/api/scheduled-meetings', scheduledMeetingRoutes);
app.use('/auth', authRoutes);
app.use('/app', appRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/user', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/tasks', uploadMiddleware, taskRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sport', sportRoutes);
app.use('/api/book', bookingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/waivers', waiverRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/package', packageRoutes);

// Chat Schema
const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('sendMessage', async ({ senderId, receiverId, message }) => {
    const newMessage = new Message({ senderId, receiverId, message });
    await newMessage.save();
    io.emit('receiveMessage', newMessage);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Endpoint to get chat messages for a user
app.get('/chat/:userId', async (req, res) => {
  const userId = req.params.userId;
  const messages = await Message.find({ $or: [{ senderId: userId }, { receiverId: userId }] }).sort({ timestamp: 1 });
  res.json(messages);
});

app.get('/chat/history/:userId/:receiverId', async (req, res) => {
  const { userId, receiverId } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId },
        { senderId: receiverId, receiverId: userId }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/notifications/unread-count/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    const unreadCount = user.notifications.filter(n => !n.read).length;
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/send-notification', async (req, res) => {
  const { userId, message } = req.body;
  try {
    await User.findByIdAndUpdate(userId, {
      $push: { notifications: { message, read: false } }
    });
    res.status(200).json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.redirect('/auth/login');
});

// Handle success route
app.get('/success', async (req, res) => {
  try {
    const transactionIds = req.query.transactionIds.split(','); // Get transaction IDs from query string
    
    // Iterate through each transaction ID and update the corresponding payment record
    for (let transactionId of transactionIds) {
      const payment = await Payment.findOne({ transactionId });
      
      if (payment) {
        payment.paymentStatus = 'completed';
        payment.updatedAt = new Date();
        await payment.save();

        // Update the corresponding item (booking, course, ecom) based on the payment's itemType
        switch (payment.itemType) {
          case 'booking':
            await Booking.findByIdAndUpdate(payment.itemId, { paymentStatus: 'completed' });
            break;
          case 'course':
            await Batch.updateOne(
              { 'studentPayments.paymentId': payment._id }, 
              { 
                $set: { 
                  'studentPayments.$.paymentStatus': 'completed', 
                  'studentPayments.$.paymentDate': new Date() 
                } 
              }
            );
            break;
          case 'ecom':
            // Update the e-commerce order/payment status accordingly
            // Assuming there's a similar pattern to update e-commerce orders
            await EcomOrder.findByIdAndUpdate(payment.itemId, { paymentStatus: 'completed' });
            break;
          default:
            console.warn(`Unknown itemType: ${payment.itemType}`);
            break;
        }

        // Remove the item from the cart
        await Cart.updateOne(
          { 'items.paymentId': payment._id },
          { $pull: { items: { paymentId: payment._id } } }
        );
      } else {
        console.warn(`Payment record not found for transactionId: ${transactionId}`);
      }
    }
    
    // Redirect to the booking management page or any success page
    res.redirect('/booking_management.html');
  } catch (error) {
    console.error('Error handling payment success:', error);
    res.status(500).send('An error occurred while processing your payment.');
  }
});

// Function to update the cart icon based on the number of items in the cart
function updateCartIcon() {
  const cart = JSON.parse(localStorage.getItem('cart')) || { items: [] };
  const cartCount = cart.items.length;
  $('#cart-icon').text(cartCount); // Assuming there's a cart icon with ID 'cart-icon'
}

app.get('/cancel', async (req, res) => {
  const { transactionId } = req.query;

  try {
    // Find the booking or course based on the transaction ID and update the payment status to 'failed'
    const booking = await Booking.findOneAndUpdate(
      { transactionId },
      { paymentStatus: 'failed' }
    );

    if (!booking) {
      return res.status(404).send('Booking not found.');
    }

    // Render cancellation page or redirect to a failure route
    res.redirect('/failure-page');
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Define the corporate admin dashboard route
app.get('/corp_admin/dashboard', authMiddleware, async (req, res) => {
  try {
    const organizations = await Organization.find({});
    const selectedOrgId = null; // or set a default value if needed
    const selectedOrg = null; // or set a default value if needed

    // Pass the variables to the view
    res.render('corpAdminDashboard', { organizations, selectedOrgId, selectedOrg });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle room creation
    socket.on('createRoom', ({ roomName, coachId }) => {
        socket.join(roomName);
        io.to(roomName).emit('roomCreated', { roomName, coachId });
        console.log(`${coachId} created and joined room: ${roomName}`);
    });

    // Handle joining room
    socket.on('joinRoom', ({ roomName, userId }) => {
        socket.join(roomName);
        io.to(roomName).emit('userJoined', { userId, roomName });
        console.log(`${userId} joined room: ${roomName}`);
    });

    // Handle muting/unmuting rooms
    socket.on('muteRoom', ({ roomName }) => {
        io.to(roomName).emit('muted', { roomName });
        console.log(`Room ${roomName} has been muted`);
    });

    socket.on('unmuteRoom', ({ roomName }) => {
        io.to(roomName).emit('unmuted', { roomName });
        console.log(`Room ${roomName} has been unmuted`);
    });

    // Handle signaling data for WebRTC
    socket.on('signal', (data) => {
        io.to(data.roomName).emit('signal', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
    // Handle student notifications
socket.on('notifyStudent', ({ studentId, roomName }) => {
  io.to(studentId).emit('newNotification', { roomName, senderName: socket.id }); // Assuming you have a way to get sender's name
});
// Server-side: Handling endAllSessions

socket.on('endAllSessions', async ({ meetingId }) => {
  try {
      // Fetch all sessions related to the meetingId
      const sessions = await MeetingSession.find({ meetingId });
      
      // End each session and notify clients
      for (let session of sessions) {
          session.endedAt = new Date();
          await session.save();
          
          socket.broadcast.to(session._id.toString()).emit('sessionEnded', { sessionId: session._id });
      }
  } catch (error) {
      console.error('Error ending all sessions:', error);
  }
});


});


app.get('/coach/dashboard', authMiddleware, (req, res) => {
  res.render('coachDashboard');
});

app.get('/user/dashboard', authMiddleware, (req, res) => {
  res.render('userDashboard');
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { db };
