const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const setDatabaseConnection = require('../middleware/setDatabaseConnection');
const PackageSchema = require('../models/Package').schema;

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
router.post('/add-package', setDatabaseConnection, upload.single('bannerImage'), async (req, res) => {
    try {
        console.log('Received data:', req.body);
        console.log('Received file:', req.file);

        const { name, courses, fee, discount, description, startDate, endDate } = req.body;
        const bannerImage = req.file ? req.file.filename : '';

        const courseIds = JSON.parse(courses); // Parse courses string to array

        const Package = req.db.model('Package', PackageSchema);

        const newPackage = new Package({
            name,
            courses: courseIds.map(courseId => new mongoose.Types.ObjectId(courseId)),
            fee,
            discount,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            bannerImage,
            organization: req.organization._id
        });

        await newPackage.save();
        res.status(201).json(newPackage);
    } catch (error) {
        console.error('Error creating package:', error);
        res.status(400).json({ message: error.message });
    }
});

// Get all packages for an organization
router.get('/packages', setDatabaseConnection, async (req, res) => {
    try {
        const Package = req.db.model('Package', PackageSchema);
        const packages = await Package.find({ organization: req.organization._id }).populate('courses');
        res.status(200).json(packages);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get a package by ID
router.get('/packages/:id', setDatabaseConnection, async (req, res) => {
    try {
        const Package = req.db.model('Package', PackageSchema);
        const package = await Package.findById(req.params.id).populate('courses');
        if (!package) {
            return res.status(404).json({ message: 'Package not found' });
        }
        res.status(200).json(package);
    } catch (error) {
        console.error('Error fetching package:', error);
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
