const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  documents: [{
    type: String // URLs to the documents
  }],
  videos: [{
    type: String // URLs to the videos
  }],
  audio: [{
    type: String // URLs to the audio files
  }],
  images: [{
    type: String // URLs to the images
  }],
  status: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submitted: {
      type: Boolean,
      default: false
    },
    progressReport: {
      type: String,
      default: ''
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
