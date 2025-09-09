const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');
const PushNotificationService = require('../services/pushNotificationService');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const pushNotificationService = new PushNotificationService();

// Subscribe to push notifications
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const { subscription, userAgent, deviceType } = req.body;
    const userId = req.user.id;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Check if subscription already exists
    const existingSubscription = await PushSubscription.findOne({
      userId,
      endpoint: subscription.endpoint
    });

    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.keys = subscription.keys;
      existingSubscription.userAgent = userAgent || '';
      existingSubscription.deviceType = deviceType || 'desktop';
      existingSubscription.isActive = true;
      existingSubscription.lastUsed = new Date();
      await existingSubscription.save();
    } else {
      // Create new subscription
      const newSubscription = new PushSubscription({
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent: userAgent || '',
        deviceType: deviceType || 'desktop',
        isActive: true
      });
      await newSubscription.save();
    }

    logger.info(`Push subscription ${existingSubscription ? 'updated' : 'created'} for user ${userId}`);
    res.json({ success: true, message: 'Push subscription saved successfully' });
  } catch (error) {
    logger.error('Error saving push subscription:', error);
    res.status(500).json({ error: 'Failed to save push subscription' });
  }
});

// Unsubscribe from push notifications
router.delete('/unsubscribe', authenticateToken, async (req, res) => {
  try {
    const { endpoint } = req.body;
    const userId = req.user.id;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    const result = await PushSubscription.findOneAndUpdate(
      { userId, endpoint },
      { isActive: false, updatedAt: new Date() }
    );

    if (result) {
      logger.info(`Push subscription deactivated for user ${userId}`);
      res.json({ success: true, message: 'Push subscription removed successfully' });
    } else {
      res.status(404).json({ error: 'Subscription not found' });
    }
  } catch (error) {
    logger.error('Error removing push subscription:', error);
    res.status(500).json({ error: 'Failed to remove push subscription' });
  }
});

// Get user's push subscriptions
router.get('/subscriptions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptions = await PushSubscription.find({
      userId,
      isActive: true
    }).select('deviceType userAgent lastUsed createdAt');

    res.json({ subscriptions });
  } catch (error) {
    logger.error('Error fetching push subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch push subscriptions' });
  }
});

// Send test push notification
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { message = 'Test notification from innkt!' } = req.body;

    const subscriptions = await PushSubscription.find({
      userId,
      isActive: true
    });

    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'No active push subscriptions found' });
    }

    const payload = {
      title: 'Test Notification',
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        url: '/notifications',
        timestamp: Date.now()
      }
    };

    const results = await pushNotificationService.sendToMultipleUsers(
      subscriptions.map(sub => ({
        endpoint: sub.endpoint,
        keys: sub.keys
      })),
      payload
    );

    res.json({
      success: true,
      message: 'Test notification sent',
      results
    });
  } catch (error) {
    logger.error('Error sending test push notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Get VAPID public key
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: pushNotificationService.vapidKeys.publicKey });
});

module.exports = router;
