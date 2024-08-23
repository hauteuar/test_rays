const mongoose = require('mongoose');

const sessionParticipantSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, required: true },  // Timestamp when the student joined
  leftAt: { type: Date },                    // Timestamp when the student left
  totalTime: { type: Number },               // Total time spent in the session (in seconds)
  feedback: {                                // Feedback provided by the coach
    text: { type: String },
    audio: { type: String },                 // URL to the audio feedback file
    rating: { type: Number, min: 1, max: 5 } // Rating out of 5
  }
});

const meetingSessionSchema = new mongoose.Schema({
  roomName: { type: String, required: true },
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [sessionParticipantSchema],   // Array of participants (students)
  startedAt: { type: Date, required: true },  // When the session started
  endedAt: { type: Date },                    // When the session ended
  recordingUrl: { type: String },             // URL to the session recording
  notes: { type: String }                     // Any additional notes by the coach
}, { timestamps: true });

module.exports = mongoose.models.MeetingSession || mongoose.model('MeetingSession', meetingSessionSchema);
