const Organization = require('../models/Organizations');

// Create a new item
exports.createItem = async (req, res) => {
    try {
      const { name, description, price, size, stock } = req.body;
      const { organizationId } = req.params;
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  
      if (!name || !price || !imageUrl) {
        return res.status(400).json({ error: 'Name, price, and imageUrl are required fields.' });
      }
  
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
      }
  
      const newItem = {
        name,
        description,
        price,
        size,
        stock,
        imageUrl,
        organizationId,
      };
  
      organization.items.push(newItem);
      await organization.save();
  
      res.status(201).json(newItem);
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  };
    

// Fetch all items for an organization
exports.getItems = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const organization = await Organization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.status(200).json(organization.items);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Fetch a single item by ID
exports.getItemById = async (req, res) => {
  try {
    const { organizationId, itemId } = req.params;
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const item = organization.items.id(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Update an item
exports.updateItem = async (req, res) => {
  try {
    const { organizationId, itemId } = req.params;
    const { name, description, price, size, stock, imageUrl } = req.body;

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const item = organization.items.id(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    item.name = name || item.name;
    item.description = description || item.description;
    item.price = price || item.price;
    item.size = size || item.size;
    item.stock = stock || item.stock;
    item.imageUrl = imageUrl || item.imageUrl;

    await organization.save();

    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete an item
exports.deleteItem = async (req, res) => {
  try {
    const { organizationId, itemId } = req.params;

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const item = organization.items.id(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    item.remove();
    await organization.save();

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
