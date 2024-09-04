const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');
const authMiddleware = require('../middleware/authMiddleware');
const organizationController = require('../controllers/organizationController');
const sidebarController = require('../controllers/sidebarController');

// Route to get app settings for a specific role
router.get('/get-app-settings', sidebarController.getAppSettings);

// Route to initialize sidebar settings
router.post('/initialize-sidebar', sidebarController.initializeSidebar);

router.post('/auth/login', appController.appLogin);
router.post('/auth/refresh-token', authMiddleware, appController.refreshToken);
router.post('/auth/logout', authMiddleware, appController.applogout);

router.post('/create', authMiddleware, organizationController.createOrganization);
router.get('/get-user-organizations', authMiddleware, organizationController.appGetUserOrganizations);
router.get('/:id', authMiddleware, organizationController.getOrganization);
router.post('/save', organizationController.saveOrganization);
router.get('/edit/get/:id', organizationController.getOrganization);
router.post('/test/edit/:id', organizationController.editOrganizations);
router.get('/:id/theme', authMiddleware, organizationController.getOrganizationThemeColor);
router.get('/:id/logo', authMiddleware, organizationController.getOrganizationLogo);

module.exports = router;