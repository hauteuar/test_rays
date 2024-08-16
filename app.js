const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const config = require('./config');
const authMiddleware = require('./middleware/authMiddleware');
const Organization = require('./models/Organizations');
const User = require('./models/Users');
const Course = require('./models/Course');
const Batch = require('./models/Batch');
const Category = require('./models/Category');
const Payment = require('./models/Payment');
const Booking = require('./models/Booking');
const session = require('express-session');
const Cart = require('./models/Cart');
const multer = require('multer');



const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
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

// Routes
const authRoutes = require('./routes/authRoutes');
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

app.use('/auth', authRoutes);
app.use('/organizations', organizationRoutes);
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

function removeItemFromCart(req, transactionId) {
  let cart = req.session.cart || { items: [], totalAmount: 0 };
  
  // Find the index of the item with the given transactionId
  const index = cart.items.findIndex(item => item.transactionId === transactionId);
  
  if (index !== -1) {
    const item = cart.items[index];
    cart.totalAmount -= item.price * item.quantity; // Deduct the amount of the removed item
    cart.items.splice(index, 1); // Remove the item from the cart
    
    req.session.cart = cart; // Save the updated cart back to the session
    const cartCount = cart.items.length;
  $('#cart-icon').text(cartCount); 

  }
}

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
  //console.log('Request passed through authMiddleware');
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
