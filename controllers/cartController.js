const Cart = require('../models/Cart');

exports.getCartItems = async (req, res) => {
  try {
    const userId = req.params.userId;
    const cart = await Cart.findOne({ userId }).populate('items.paymentId');

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error('Error retrieving cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getCartItemsByOrg = async (req, res) => {
    try {
        const organizationId = req.params.organizationId;
        
        // Find all cart items associated with the organization that have pending payments
        const cartItems = await Cart.find({
            'items.organizationId': organizationId,
            'items.status': 'pending'
        }).populate('items.paymentId');

        if (!cartItems || cartItems.length === 0) {
            return res.status(404).json({ error: 'No pending items found in the cart for this organization' });
        }

        res.status(200).json(cartItems);
    } catch (error) {
        console.error('Error retrieving cart items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.addItemToCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    const organizationId = req.params.organizationId;
    const { paymentId, itemType, itemId, price, quantity } = req.body;
    //const organizationId = req.headers.organizationId;
    console.log('initial', paymentId, itemType, itemId, price, quantity);
    

    // Validate required fields
    if (!userId || !organizationId || !paymentId || !itemType || !price) {
      console.log('later', paymentId, organizationId, userId); 
      return res.status(400).json({ error: 'Missing required fields: userId, organizationId, or paymentId' });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    cart.items.push({ 
      userId, // Ensure userId is added here
      organizationId, // Ensure organizationId is added here
      paymentId, 
      itemType, 
      itemId, 
      price, 
      quantity: quantity || 1, // Default to 1 if quantity is not provided
      status: 'pending' 
    });

    await cart.save();
    res.status(200).json({ message: 'Item added to cart' });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.updateItemQuantity = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { itemId, quantity } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (item) {
      item.quantity = quantity;
      await cart.save();
      res.status(200).json({ message: 'Cart item quantity updated' });
    } else {
      res.status(404).json({ error: 'Item not found in cart' });
    }
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.removeItemFromCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { itemId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items.id(itemId).remove();
    await cart.save();

    res.status(200).json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
