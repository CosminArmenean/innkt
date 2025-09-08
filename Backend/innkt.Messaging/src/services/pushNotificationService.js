const webpush = require('web-push');
const logger = require('../utils/logger');

class PushNotificationService {
  constructor() {
    this.vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI8F7j7wOD7K4BwK5BQj7h2_dFv44BrnFkDz6BfFjQqOJfQx4gB1nVxlI',
      privateKey: process.env.VAPID_PRIVATE_KEY || 'K0X2pE2mHFhtESDN0KiXxYgUz0Icu6bkVVzltF6AZy0'
    };
    
    webpush.setVapidDetails(
      'mailto:admin@innkt.com',
      this.vapidKeys.publicKey,
      this.vapidKeys.privateKey
    );
  }

  async sendPushNotification(subscription, payload) {
    try {
      const result = await webpush.sendNotification(subscription, JSON.stringify(payload));
      logger.debug('Push notification sent successfully');
      return result;
    } catch (error) {
      logger.error('Failed to send push notification:', error);
      throw error;
    }
  }

  async sendToMultipleUsers(userSubscriptions, payload) {
    const results = await Promise.allSettled(
      userSubscriptions.map(sub => this.sendPushNotification(sub, payload))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    logger.info(`Push notifications sent: ${successful} successful, ${failed} failed`);
    return { successful, failed };
  }
}

module.exports = PushNotificationService;
