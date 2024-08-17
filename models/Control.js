const mongoose = require('mongoose');

const controlSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['admin', 'coach', 'student', 'parent'],
        required: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    controls: [{
        type: String
    }]
});

const Control = mongoose.model('Control', controlSchema);

module.exports = Control;
