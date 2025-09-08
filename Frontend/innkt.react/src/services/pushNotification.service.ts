import { BaseApiService } from './base-api.service';
import { apiConfig } from './api.config';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class PushNotificationService extends BaseApiService {
  private vapidPublicKey: string | null = null;
  private isSupported: boolean = false;

  constructor() {
    super(apiConfig.messagingApi);
    this.checkSupport();
  }

  private checkSupport(): void {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async getVapidPublicKey(): Promise<string> {
    if (!this.vapidPublicKey) {
      try {
        const response = await this.get<{ publicKey: string }>('/push-notifications/vapid-key');
        this.vapidPublicKey = response.publicKey;
      } catch (error) {
        console.error('Failed to get VAPID public key:', error);
        throw error;
      }
    }
    return this.vapidPublicKey;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported in this browser');
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  async subscribeToPushNotifications(userAgent?: string, deviceType?: string): Promise<PushSubscriptionData | null> {
    try {
      if (!this.isSupported) {
        throw new Error('Push notifications are not supported');
      }

      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = await this.getVapidPublicKey();
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      // Send subscription to server
      await this.post('/push-notifications/subscribe', {
        subscription: subscriptionData,
        userAgent: userAgent || navigator.userAgent,
        deviceType: deviceType || this.detectDeviceType()
      });

      return subscriptionData;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  async unsubscribeFromPushNotifications(endpoint: string): Promise<void> {
    try {
      await this.delete('/push-notifications/unsubscribe', { endpoint });
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  async getSubscriptions(): Promise<any[]> {
    try {
      const response = await this.get<{ subscriptions: any[] }>('/push-notifications/subscriptions');
      return response.subscriptions;
    } catch (error) {
      console.error('Failed to get push subscriptions:', error);
      return [];
    }
  }

  async sendTestNotification(message?: string): Promise<void> {
    try {
      await this.post('/push-notifications/test', { message });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private detectDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
      return 'mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  isPushNotificationSupported(): boolean {
    return this.isSupported;
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

export const pushNotificationService = new PushNotificationService();
