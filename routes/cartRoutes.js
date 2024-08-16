const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Get cart items for a user
router.get('/:userId', cartController.getCartItems);

router.get('/org/:organizationId', cartController.getCartItemsByOrg);

// Add item to cart
router.post('/:userId/add-item/:organizationId', cartController.addItemToCart);

//router.post('/add-item', cartController.addItemToCart);

// Update item quantity in cart
router.post('/:userId/update-quantity', cartController.updateItemQuantity);

// Remove item from cart
router.post('/:userId/remove-item', cartController.removeItemFromCart);

module.exports = router;
