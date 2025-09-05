const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get message analytics
router.get('/messages', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.userId;

    if (!global.analyticsService) {
      return res.status(503).json({ error: 'Analytics service not available' });
    }

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();

    const analytics = await global.analyticsService.getMessageAnalytics(start, end);

    res.json({ analytics });

  } catch (error) {
    logger.error('Error getting message analytics:', error);
    res.status(500).json({ error: 'Failed to get message analytics' });
  }
});

// Get user analytics
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    const currentUserId = req.user.userId;

    // Users can only view their own analytics
    if (userId !== currentUserId) {
      return res.status(403).json({ error: 'Not authorized to view this user\'s analytics' });
    }

    if (!global.analyticsService) {
      return res.status(503).json({ error: 'Analytics service not available' });
    }

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();

    const analytics = await global.analyticsService.getUserAnalytics(userId, start, end);

    res.json({ analytics });

  } catch (error) {
    logger.error('Error getting user analytics:', error);
    res.status(500).json({ error: 'Failed to get user analytics' });
  }
});

// Get conversation analytics
router.get('/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { startDate, endDate } = req.query;
    const userId = req.user.userId;

    if (!global.analyticsService) {
      return res.status(503).json({ error: 'Analytics service not available' });
    }

    // Verify user has access to conversation
    // This would be implemented with proper conversation access check

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();

    const analytics = await global.analyticsService.getConversationAnalytics(conversationId, start, end);

    res.json({ analytics });

  } catch (error) {
    logger.error('Error getting conversation analytics:', error);
    res.status(500).json({ error: 'Failed to get conversation analytics' });
  }
});

// Get system metrics
router.get('/system', async (req, res) => {
  try {
    if (!global.analyticsService) {
      return res.status(503).json({ error: 'Analytics service not available' });
    }

    const metrics = await global.analyticsService.getSystemMetrics();

    res.json({ metrics });

  } catch (error) {
    logger.error('Error getting system metrics:', error);
    res.status(500).json({ error: 'Failed to get system metrics' });
  }
});

// Get real-time metrics
router.get('/realtime', async (req, res) => {
  try {
    if (!global.analyticsService) {
      return res.status(503).json({ error: 'Analytics service not available' });
    }

    const metrics = await global.analyticsService.getRealTimeMetrics();

    res.json({ metrics });

  } catch (error) {
    logger.error('Error getting real-time metrics:', error);
    res.status(500).json({ error: 'Failed to get real-time metrics' });
  }
});

module.exports = router;

