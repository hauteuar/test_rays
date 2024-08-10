const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// RESTful endpoints
router.get('/login', (req, res) => res.render('login'));
router.post('/login', authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.post('/register', authController.register);

module.exports = router;
