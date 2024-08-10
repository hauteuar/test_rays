const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }],
    fee: { type: Number, required: true },
    discount: { type: Number, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    bannerImage: { type: String }, // Add bannerImage field
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }
});

const Package = mongoose.model('Package', PackageSchema);
module.exports = Package;
