const Package = require('../models/Package');
const { Organization } = require('../models/Organizations');

// Controller to add a package
exports.addPackage = async (req, res) => {
    try {
        const { name, courses, items, fee, discount, description, startDate, endDate } = req.body;
        console.log(req.body);
        const organizationId = req.headers['Organizationid'] || req.headers['OrganizationId'] || req.headers['organizationId'] || req.headers['organizationid'];
        console.log(courses);
        // Validate that the organization exists
        const organization = await Organization.findById(organizationId);
        console.log(organizationId);
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Create a new package
        const newPackage = new Package({
            name,
            courses: JSON.parse(courses), // Expecting an array of course IDs
            items: JSON.parse(items),     // Expecting an array of item IDs
            fee,
            discount,
            description,
            startDate,
            endDate,
            organization: organizationId
        });

        // If there's a file upload (bannerImage)
        if (req.file) {
            newPackage.bannerImage = req.file.filename; // Assuming filename is stored after file upload
        }

        // Save the package to the database
        await newPackage.save();

        // Respond with the newly created package
        res.status(201).json(newPackage);
    } catch (error) {
        console.error('Error adding package:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Controller to get all packages by organization
exports.getPackagesByOrganization = async (req, res) => {
    try {
        const { organizationId } = req.params;

        // Find all packages related to the specified organization
        const packages = await Package.find({ organization: organizationId })
            .populate('courses') // Populate courses to get course details
            .populate('items');  // Populate items to get item details

        if (!packages) {
            return res.status(404).json({ error: 'No packages found for this organization' });
        }

        // Respond with the list of packages
        res.status(200).json(packages);
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getPackageById = async (req, res) => {
    try {
        const { packageId } = req.params;

        // Find the package by ID and populate the courses and items
        const package = await Package.findById(packageId)
            .populate('courses')  // Populate the courses to get detailed information
            .populate('items');    // Populate the items to get detailed information
        console.log(package)
        if (!package) {
            return res.status(404).json({ error: 'Package not found' });
        }

        // Respond with the package details
        res.status(200).json(package);
    } catch (error) {
        console.error('Error fetching package:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
