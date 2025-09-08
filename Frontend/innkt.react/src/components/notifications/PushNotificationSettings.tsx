import React, { useState, useEffect } from 'react';
import { pushNotificationService } from '../../services/pushNotification.service';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  BellIcon, 
  CheckIcon, 
  XMarkIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon
} from '@heroicons/react/24/outline';

interface PushNotificationSettingsProps {
  className?: string;
}

const PushNotificationSettings: React.FC<PushNotificationSettingsProps> = ({ className = '' }) => {
  const { updateSettings } = useNotifications();
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkPushSupport();
    loadSubscriptions();
  }, []);

  const checkPushSupport = () => {
    const supported = pushNotificationService.isPushNotificationSupported();
    const permission = pushNotificationService.getPermissionStatus();
    setIsSupported(supported);
    setPermissionStatus(permission);
  };

  const loadSubscriptions = async () => {
    try {
      const subs = await pushNotificationService.getSubscriptions();
      setSubscriptions(subs);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!isSupported) {
      setMessage({ type: 'error', text: 'Push notifications are not supported in this browser' });
      return;
    }

    setIsSubscribing(true);
    setMessage(null);

    try {
      await pushNotificationService.subscribeToPushNotifications();
      setMessage({ type: 'success', text: 'Successfully subscribed to push notifications!' });
      checkPushSupport();
      loadSubscriptions();
      
      // Update notification settings
      await updateSettings({ pushNotifications: true });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to subscribe to push notifications' });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribe = async (endpoint: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      await pushNotificationService.unsubscribeFromPushNotifications(endpoint);
      setMessage({ type: 'success', text: 'Successfully unsubscribed from push notifications' });
      loadSubscriptions();
      
      if (subscriptions.length <= 1) {
        await updateSettings({ pushNotifications: false });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to unsubscribe from push notifications' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      await pushNotificationService.sendTestNotification('This is a test notification from innkt!');
      setMessage({ type: 'success', text: 'Test notification sent successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to send test notification' });
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <DevicePhoneMobileIcon className="w-5 h-5" />;
      case 'tablet':
        return <DeviceTabletIcon className="w-5 h-5" />;
      default:
        return <ComputerDesktopIcon className="w-5 h-5" />;
    }
  };

  const getPermissionStatusColor = (status: NotificationPermission) => {
    switch (status) {
      case 'granted':
        return 'text-green-600';
      case 'denied':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getPermissionStatusText = (status: NotificationPermission) => {
    switch (status) {
      case 'granted':
        return 'Allowed';
      case 'denied':
        return 'Blocked';
      default:
        return 'Not requested';
    }
  };

  if (!isSupported) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <BellIcon className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-800">Push notifications are not supported in this browser</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Push Notifications</h3>
          <p className="text-sm text-gray-600">Receive notifications even when the app is closed</p>
        </div>
        <div className={`flex items-center space-x-2 ${getPermissionStatusColor(permissionStatus)}`}>
          <div className={`w-2 h-2 rounded-full ${
            permissionStatus === 'granted' ? 'bg-green-500' : 
            permissionStatus === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
          }`} />
          <span className="text-sm font-medium">{getPermissionStatusText(permissionStatus)}</span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckIcon className="w-5 h-5" />
          ) : (
            <XMarkIcon className="w-5 h-5" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        {permissionStatus === 'granted' && subscriptions.length === 0 && (
          <button
            onClick={handleSubscribe}
            disabled={isSubscribing}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BellIcon className="w-4 h-4" />
            <span>{isSubscribing ? 'Subscribing...' : 'Enable Push Notifications'}</span>
          </button>
        )}

        {permissionStatus === 'default' && (
          <button
            onClick={handleSubscribe}
            disabled={isSubscribing}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BellIcon className="w-4 h-4" />
            <span>{isSubscribing ? 'Requesting Permission...' : 'Request Permission'}</span>
          </button>
        )}

        {subscriptions.length > 0 && (
          <button
            onClick={handleTestNotification}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isLoading ? 'Sending...' : 'Send Test Notification'}</span>
          </button>
        )}
      </div>

      {/* Subscriptions */}
      {subscriptions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Active Subscriptions</h4>
          {subscriptions.map((subscription, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getDeviceIcon(subscription.deviceType)}
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {subscription.deviceType} Device
                  </p>
                  <p className="text-xs text-gray-500">
                    Last used: {new Date(subscription.lastUsed).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleUnsubscribe(subscription.endpoint)}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500">
        <p>Push notifications allow you to receive updates even when the app is not open. You can manage these settings in your browser's notification preferences.</p>
      </div>
    </div>
  );
};

export default PushNotificationSettings;
