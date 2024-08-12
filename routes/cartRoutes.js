const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const axios = require('axios');



router.post('/cart/add', async (req, res) => {
  const { userId, itemId, type, price, quantity, studentId, batchId } = req.body;

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      const newCart = new Cart({
        userId,
        items: [{
          itemId,
          type,
          price,
          quantity,
          studentId,
          batchId
        }],
        totalAmount: price * quantity
      });

      await newCart.save();
      return res.status(201).json(newCart);
    }

    cart.items.push({
      itemId,
      type,
      price,
      quantity,
      studentId,
      batchId
    });

    cart.totalAmount += price * quantity;

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item to cart.' });
  }
});


const PAYMENTS_BASE_URL = 'https://api-payments.rayssportsnetwork.com';

router.post('/cart/checkout', async (req, res) => {
  const { userId, callbackUrl, successUrl, cancelUrl } = req.body;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    const uniqueCode = 'your_unique_code'; // This should be fetched or stored for the user/organization

    const transactionId = `txn_${Date.now()}`;
    const productName = cart.items.map(item => item.type).join(', '); // List all items

    const paymentResponse = await axios.post(`${PAYMENTS_BASE_URL}/checkout`, {
      clientId: 'your_client_id',
      callbackUrl,
      transactionId,
      uniqueCode,
      productName,
      amount: cart.totalAmount,
      successUrl,
      cancelUrl,
      applicationFeePercent: 2.5,
      currency: 'usd'
    });

    const { checkoutSessionId, url } = paymentResponse.data;

    // Store the transactionId in the cart or user session for later tracking
    cart.items.forEach(item => {
      item.transactionId = transactionId;
    });

    await cart.save();

    res.status(200).json({ checkoutSessionId, url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initiate checkout.' });
  }
});

router.get('/payment/status/:transactionId', async (req, res) => {
    const { transactionId } = req.params;
  
    try {
      const paymentStatusResponse = await axios.get(`${PAYMENTS_BASE_URL}/get-transaction/${transactionId}`);
  
      const { status } = paymentStatusResponse.data;
  
      if (status === 'paid') {
        // Update cart items status to completed
        await Cart.updateMany(
          { 'items.transactionId': transactionId },
          { $set: { 'items.$.status': 'completed' } }
        );
      }
  
      res.status(200).json({ status });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check payment status.' });
    }
  });
  

module.exports = router;

