const express = require('express');
const router = express.Router();
const coachController = require('../controllers/categoryController');

// Routes for categories and coaches
router.get('/', coachController.getCategoriesWithCoaches);
router.get('/:categoryId/coaches', coachController.getCoachesByCategory);
router.post('/', coachController.createCategory);
router.post('/add-coach', coachController.addCoachToCategory);

module.exports = router;
