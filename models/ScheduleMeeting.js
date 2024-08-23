const mongoose = require('mongoose');

const scheduledMeetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  roomName: { type: String, required: true },
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invitedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of invited student IDs
  scheduledDateTime: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'completed', 'canceled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.ScheduledMeeting || mongoose.model('ScheduledMeeting', scheduledMeetingSchema);
