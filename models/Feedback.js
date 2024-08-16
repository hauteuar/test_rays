const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    feedbackCycle: { type: String, enum: ['Weekly', 'Monthly', 'End of Course'], required: true },
    rating: { type: Number, enum: [1, 2, 3, 4], required: true }, // 1: Needs Improvement, 2: Meets Needs, 3: Good Performance, 4: Excellent Performance
    text: { type: String },
    audio: { data: Buffer, contentType: String }, // Store audio as binary data
    video: { data: Buffer, contentType: String }, // Store video as binary data
    image: { data: Buffer, contentType: String }, // Store image as binary data
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
