const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Batch = require('../models/Batch');

// Create a new payment
exports.createPayment = async (req, res) => {
  try {
    const { transactionId, userId, organizationId, itemType, itemId, amount, paymentMethod, paymentStatus } = req.body;
    console.log(req.body);

    const payment = new Payment({
      transactionId,
      userId,
      organizationId,
      itemType,
      itemId,
      amount,
      paymentMethod,
      paymentStatus
    });

    await payment.save();

    res.status(201).json({ success: true, payment });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { transactionId, paymentStatus } = req.body;

    const payment = await Payment.findOne({ transactionId });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }

    payment.paymentStatus = paymentStatus;
    payment.updatedAt = new Date();

    await payment.save();

    // Update the corresponding item (booking, course, ecom) based on the payment's itemType
    switch (payment.itemType) {
      case 'booking':
        await Booking.findByIdAndUpdate(payment.itemId, { paymentStatus });
        break;
      case 'course':
        await Batch.updateOne({ 'studentPayments.paymentId': payment._id }, 
                              { $set: { 'studentPayments.$.paymentStatus': paymentStatus, 'studentPayments.$.paymentDate': new Date() } });
        break;
      case 'ecom':
        // Update the e-commerce order/payment status accordingly
        break;
      default:
        break;
    }

    res.status(200).json({ success: true, message: 'Payment status updated successfully.' });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Retrieve payment information
exports.getPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const payment = await Payment.findOne({ transactionId }).populate('userId').populate('organizationId');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }

    res.status(200).json({ success: true, payment });
  } catch (error) {
    console.error('Error retrieving payment information:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Retrieve all payments for a specific user
exports.getPaymentsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const payments = await Payment.find({ userId }).populate('organizationId');

    if (!payments || payments.length === 0) {
      return res.status(404).json({ success: false, message: 'No payments found for this user.' });
    }

    res.status(200).json({ success: true, payments });
  } catch (error) {
    console.error('Error retrieving payments:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
