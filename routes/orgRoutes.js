const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');

// Route to add organization
router.post('/', orgController.addOrganization);

// Route to edit organization
router.put('/:id', orgController.editOrganization);

// Route to save controls
router.post('/:id/controls', orgController.saveControls);

// Route to fetch controls
router.get('/:id/controls/:role', orgController.fetchControls);

router.get('/edit-organization/:id?', orgController.renderEditOrganizationForm);


module.exports = router;
