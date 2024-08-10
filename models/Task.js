const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }, // Added organization ID
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Coach who assigned the task
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // List of students assigned
    media: {
        type: Map,
        of: String, // Could be file paths, URLs, or base64 strings
    },
    submissions: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        submissionType: { type: String, enum: ['video', 'audio', 'image', 'text'], required: true },
        submissionContent: { type: String, required: true }, // URL or base64 string
        progressNotes: { type: String },
        status: { type: String, enum: ['assigned', 'submitted', 'completed'], default: 'assigned' },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Task', taskSchema);
