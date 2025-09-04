const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get user notifications
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;

    if (!global.notificationService) {
      return res.status(503).json({ error: 'Notification service not available' });
    }

    const offset = (page - 1) * limit;
    const notifications = await global.notificationService.getUserNotifications(userId, limit, offset);
    const unreadCount = await global.notificationService.getUnreadCount(userId);

    res.json({
      notifications,
      unreadCount,
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    if (!global.notificationService) {
      return res.status(503).json({ error: 'Notification service not available' });
    }

    await global.notificationService.markNotificationAsRead(userId, notificationId);

    res.json({ message: 'Notification marked as read' });

  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!global.notificationService) {
      return res.status(503).json({ error: 'Notification service not available' });
    }

    await global.notificationService.markAllNotificationsAsRead(userId);

    res.json({ message: 'All notifications marked as read' });

  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!global.notificationService) {
      return res.status(503).json({ error: 'Notification service not available' });
    }

    const unreadCount = await global.notificationService.getUnreadCount(userId);

    res.json({ unreadCount });

  } catch (error) {
    logger.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

module.exports = router;
