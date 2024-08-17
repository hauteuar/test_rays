const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, organizationController.createOrganization);
router.get('/', authMiddleware, organizationController.getOrganizations);
router.get('/:id', authMiddleware, organizationController.getOrganization);
router.post('/save', organizationController.saveOrganization);
router.get('/edit/get/:id', organizationController.getOrganization);
router.post('/test/edit/:id', organizationController.editOrganizations);
router.get('/:id/theme', authMiddleware, organizationController.getOrganizationThemeColor);
router.get('/:id/logo', authMiddleware, organizationController.getOrganizationLogo);


module.exports = router;
