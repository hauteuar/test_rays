const User = require('../models/Users');
const NotificationHistory = require('../models/NotificationHistory');

// Controller function to send notifications to selected users
exports.sendNotification = async (req, res) => {
    try {
        const { userIds, title, message } = req.body;
        const organizationId = req.headers.organizationid; // Retrieve the organizationId from the headers

        // Validate request body
        if (!organizationId) {
            return res.status(400).json({ success: false, message: 'Organization ID is required.' });
        }
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ success: false, message: 'User IDs are required.' });
        }
        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Notification title and message are required.' });
        }

        // Construct the notification object
        const notification = {
            message: `${title}: ${message}`,
            type: 'info',
            read: false,
            created_at: new Date()
        };

        // Update notifications for each selected user
        const result = await User.updateMany(
            { _id: { $in: userIds } },
            { $push: { notifications: notification } }
        );

        // Check if any users were updated
        if (result.nModified === 0) {
            return res.status(404).json({ success: false, message: 'No users found with the provided IDs.' });
        }
        
        // Create a new notification history record
        const notificationHistory = new NotificationHistory({
            organizationId,  // include the organizationId here
            title,
            message,
            recipients: userIds,
        });

        await notificationHistory.save();

        // Send success response
        res.status(200).json({ success: true, message: 'Notifications sent successfully and history saved.', modifiedCount: result.nModified });
    } catch (error) {
        console.error('Error sending notifications:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

exports.getUnreadNotificationsCount = async (req, res) => {
    try {
        const { userId } = req.params;
        //console.log(userId);
        const organizationId = req.headers.organizationid;
        //console.log(organizationId);
        //const userId = req.params; // Assuming req.user is populated by authentication middleware

        if (!organizationId) {
            return res.status(400).json({ success: false, message: 'Missing organization ID' });
        }

        // Find the user and count the unread notifications
        const user = await User.findOne({
            _id: userId,
            
            'organizations.org_id': organizationId
          })
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const unreadCount = user.notifications.filter(notification => !notification.read).length;

        res.status(200).json({ success: true, unreadCount });
    } catch (error) {
        console.error('Error fetching unread notifications count:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.getNotificationHistory = async (req, res) => {
    try {
        const organizationId = req.headers.organizationid;

        if (!organizationId) {
            return res.status(400).json({ success: false, message: 'Missing organization ID' });
        }

        // Fetch the notification history for the organization
        const history = await NotificationHistory.find({ organizationId }).sort({ sentAt: -1 }).populate('recipients', 'firstName lastName');

        res.status(200).json({ success: true, history });
    } catch (error) {
        console.error('Error fetching notification history:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.sendNotificationByUser = async (req, res) => {
    const { userId, message, type } = req.body;
  
    try {
      const user = await User.findByIdAndUpdate(userId, {
        $push: { notifications: { message, type, read: false } }
      }, { new: true });
  
      // Emit notification to the user's socket
      io.to(user.socketId).emit('notification', { message, type });
  
      res.status(200).json({ message: 'Notification sent successfully' });
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  