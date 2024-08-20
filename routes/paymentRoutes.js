const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Route to create a new payment
router.post('/save-transaction', paymentController.createPayment);

// Route to update payment status
router.post('/update-payment-status', paymentController.updatePaymentStatus);

// Route to retrieve payment information
router.get('/payment/:transactionId', paymentController.getPayment);

router.get('/user/:userId', paymentController.getPaymentsByUserId);

module.exports = router;
