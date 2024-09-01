const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    courseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course' 
    }, // Optional, can be null for individual tasks
    studentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    coachId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    taskId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Task' 
    }, // Optional, can be null if feedback is course-based
    organizationId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Organization', 
        required: true 
    },
    feedbackCycle: { 
        type: String, 
        enum: ['Weekly', 'Monthly', 'End of Course'], 
        required: true 
    },
    rating: { 
        type: Number, 
        enum: [1, 2, 3, 4], 
        required: true 
    },
    text: { type: String },
    audio: { data: Buffer, contentType: String },
    video: { data: Buffer, contentType: String },
    image: { data: Buffer, contentType: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
