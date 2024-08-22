const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    studentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true // Each media file belongs to a student
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Organization',
        required: true // Each media file belongs to an organization
    },
    taskId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Task',
        required: false // A media file may be linked to a specific task
    },
    mediaType: { 
        type: String, 
        enum: ['video', 'audio', 'image', 'document'], 
        required: true // Type of the media
    },
    mediaPath: { 
        type: String, 
        required: true // Path where the media is stored
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Media', mediaSchema);
