const mongoose = require('mongoose');

const SponsorSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    logoUrl: {
        type: String,
        required: true
    },
    webAddress: {
        type: String,
        required: true
    },
    highlight: {
        type: Boolean,
        default: false
    },
    displayOrder: {
        type: Number,
        required: true
    },
    displayTime: {
        type: Number, // in seconds
        default: 5
    },
    slideDirection: {
        type: String,
        enum: ['left', 'right'],
        default: 'right'
    },
    slideSpeed: {
        type: String,
        enum: ['slow', 'medium', 'fast'],
        default: 'medium'
    }
});

module.exports = mongoose.model('Sponsor', SponsorSchema);
