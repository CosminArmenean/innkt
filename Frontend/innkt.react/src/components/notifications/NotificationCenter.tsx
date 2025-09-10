import React, { useState, useEffect, useCallback } from 'react';
import { notificationService, Notification as AppNotification, NotificationSettings } from '../../services/notification.service';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await notificationService.getNotifications(0, 50);
      setNotifications(result.notifications);
      const unreadCount = await notificationService.getUnreadCount();
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  // Load notification settings
  const loadSettings = useCallback(async () => {
    try {
      const notificationSettings = await notificationService.getNotificationSettings();
      setSettings(notificationSettings);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }, []);

  // Handle real-time notifications
  useEffect(() => {
    if (!isOpen) return;

    const handleNotification = (notification: AppNotification) => {
      setNotifications(prev => [notification, ...prev]);
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);
      }
    };

    const handleError = (error: Event) => {
      console.error('Notification stream error:', error);
    };

    // TODO: Implement WebSocket subscription when backend is ready
    // notificationService.subscribeToNotifications(handleNotification, handleError);

    return () => {
      // TODO: Implement WebSocket unsubscription when backend is ready
      // notificationService.unsubscribeFromNotifications();
    };
  }, [isOpen]);

  // Load data when component mounts or tab changes
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadSettings();
    }
  }, [isOpen, loadNotifications, loadSettings]);

  // Mark notification as read
  const handleMarkAsRead = async (notification: AppNotification) => {
    if (notification.read) return;

    try {
      await notificationService.markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Update notification settings
  const handleUpdateSettings = async (updatedSettings: Partial<NotificationSettings>) => {
    if (!settings) return;

    try {
      const newSettings = { ...settings, ...updatedSettings };
      await notificationService.updateNotificationSettings(updatedSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👥';
      case 'mention': return '📢';
      case 'group_invite': return '👥';
      case 'system': return '⚙️';
      case 'security': return '🔒';
      default: return '📢';
    }
  };

  // Get notification priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-gray-300 bg-gray-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-innkt-primary text-white text-xs font-medium px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Settings"
            >
              ⚙️
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-innkt-primary border-b-2 border-innkt-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'unread'
                ? 'text-innkt-primary border-b-2 border-innkt-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && settings && (
          <div className="p-6 border-b bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Push Notifications</span>
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) => handleUpdateSettings({ pushNotifications: e.target.checked })}
                  className="rounded border-gray-300 text-innkt-primary focus:ring-innkt-primary"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Email Notifications</span>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleUpdateSettings({ emailNotifications: e.target.checked })}
                  className="rounded border-gray-300 text-innkt-primary focus:ring-innkt-primary"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">In-App Notifications</span>
                <input
                  type="checkbox"
                  checked={settings.desktopNotifications}
                  onChange={(e) => handleUpdateSettings({ desktopNotifications: e.target.checked })}
                  className="rounded border-gray-300 text-innkt-primary focus:ring-innkt-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-innkt-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <span className="text-4xl mb-2">📭</span>
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleMarkAsRead(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(new Date(notification.timestamp).toISOString())}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
                      {notification.data?.senderName && (
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-600">
                              {notification.data.senderName.charAt(0)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {notification.data.senderName}
                          </span>
                        </div>
                      )}
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-innkt-primary rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <button
              onClick={handleMarkAllAsRead}
              className="w-full py-2 px-4 text-sm font-medium text-innkt-primary hover:bg-innkt-primary hover:text-white rounded-md transition-colors"
            >
              Mark All as Read
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;

