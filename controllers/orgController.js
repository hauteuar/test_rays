const Control = require('../models/Control');
const Organization = require('../models/Organizations');

// Add Organization
exports.addOrganization = async (req, res) => {
    try {
        const organization = new Organization(req.body);
        await organization.save();
        res.status(201).json(organization);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Edit Organization
exports.editOrganization = async (req, res) => {
    try {
        const organization = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(organization);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.renderEditOrganizationForm = async (req, res) => {
    try {
        const organizations = await Organization.find({});
        const selectedOrgId = req.params.id || null;
        const selectedOrg = selectedOrgId ? await Organization.findById(selectedOrgId) : null;

        res.render('corpAdminDashboard', {
            organizations,
            selectedOrgId,
            selectedOrg
        });
    } catch (error) {
        console.error('Error fetching organizations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Save Controls
exports.saveControls = async (req, res) => {
    try {
        const { role, controls } = req.body;
        const control = await Control.findOneAndUpdate(
            { role, organizationId: req.params.id },
            { controls },
            { upsert: true, new: true }
        );
        res.json(control);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Fetch Controls (to dynamically load sidebar based on role)
exports.fetchControls = async (req, res) => {
    try {
        const control = await Control.findOne({
            role: req.params.role,
            organizationId: req.params.id
        });
        res.json(control ? control.controls : []);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
