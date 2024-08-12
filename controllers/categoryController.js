const Category = require('../models/Category'); // Assuming you have a Category model
const User = require('../models/Users');

// Get all categories with coach count
exports.getCategoriesWithCoaches = async (req, res) => {
  try {
    const organizationId = req.headers.organizationid;

    const categories = await Category.find({ organizationId }).populate('coaches');
    const response = categories.map(category => ({
      _id: category._id,
      name: category.name,
      coachCount: category.coaches.length,
      coaches: category.coaches
    }));

    res.json(response);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get coaches by category
exports.getCoachesByCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const category = await Category.findById(categoryId).populate('coaches').exec();
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category.coaches);
  } catch (error) {
    console.error('Error fetching coaches by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const organizationId = req.headers.organizationid;

    const category = new Category({ name, organizationId });
    await category.save();

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add coach to category
exports.addCoachToCategory = async (req, res) => {
  try {
    const { coachId, categoryId } = req.body;
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const coach = await User.findById(coachId);

    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' });
    }

    category.coaches.push(coach._id);
    await category.save();

    res.status(200).json(category);
  } catch (error) {
    console.error('Error adding coach to category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
