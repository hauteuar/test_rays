const multer = require('multer');
const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images'); // Specify the folder to save images
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Create a unique file name
    }
});

const upload = multer({ storage: storage });

// Add a new package

// Route to add a package
router.post('/add-package', upload.single('bannerImage'), packageController.addPackage);

// Route to get the list of packages
router.get('/packages/:organizationId', packageController.getPackagesByOrganization);

router.get('/:packageId', packageController.getPackageById);

module.exports = router;
