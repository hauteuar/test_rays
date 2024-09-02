const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/auth/login', appController.appLogin);
router.post('/auth/refresh-token', authMiddleware, appController.refreshToken);
router.post('/auth/logout', authMiddleware, appController.applogout);

module.exports = router;