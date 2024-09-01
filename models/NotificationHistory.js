// models/NotificationHistory.js

const mongoose = require('mongoose');

const notificationHistorySchema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sentAt: { type: Date, default: Date.now },
    notificationType: { type: String, enum: ['payment_reminder', 'info', 'warning', 'error'], default: 'info' }, // New field for notification type
}, { timestamps: true });

module.exports = mongoose.model('NotificationHistory', notificationHistorySchema);
