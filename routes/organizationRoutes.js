const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, organizationController.createOrganization);
router.get('/', authMiddleware, organizationController.getOrganizations);
router.get('/:id', authMiddleware, organizationController.getOrganization);

module.exports = router;
