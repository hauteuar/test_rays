const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    studentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    submissionType: { 
        type: String, 
        enum: ['video', 'audio', 'image', 'text'], 
        required: true 
    },
    submissionContent: { 
        type: String, 
        required: true 
    }, 
    media: {
        type: Map,
        of: String, 
    },
    progressNotes: { type: String },
    status: { 
        type: String, 
        enum: ['assigned', 'submitted', 'completed'], 
        default: 'assigned' 
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // Optional, can be null for individual tasks
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }, // Optional, can be null for individual tasks
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // List of students assigned
    media: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }], // Reference to media files
    submissions: [submissionSchema], 
    taskType: { 
        type: String, 
        enum: ['coach-initiated', 'student-initiated'], 
        default: 'coach-initiated' 
    }, // New field to define the task type
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Task', taskSchema);
