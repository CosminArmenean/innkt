import React, { useState, useEffect } from 'react';
import { notificationService, AppNotification } from '../../services/notification.service';
import NotificationCenter from './NotificationCenter';

const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<AppNotification[]>([]);

  // Load initial notification count
  useEffect(() => {
    const loadNotificationCount = async () => {
      try {
        const result = await notificationService.getNotifications({ limit: 1 });
        setUnreadCount(result.unreadCount);
      } catch (error) {
        console.error('Failed to load notification count:', error);
      }
    };

    loadNotificationCount();
  }, []);

  // Subscribe to real-time notifications
  useEffect(() => {
    const handleNotification = (notification: AppNotification) => {
      setUnreadCount(prev => prev + 1);
      setRecentNotifications(prev => [notification, ...prev.slice(0, 4)]);
      
      // Show browser notification if permission is granted
      if (Notification.permission === 'granted' && !document.hasFocus()) {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id,
        });
      }
    };

    const handleError = (error: Event) => {
      console.error('Notification stream error:', error);
    };

    notificationService.subscribeToNotifications(handleNotification, handleError);

    return () => {
      notificationService.unsubscribeFromNotifications();
    };
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleBellClick = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={handleBellClick}
          className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
          title="Notifications"
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Quick preview dropdown */}
        {recentNotifications.length > 0 && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
            <div className="p-3 border-b">
              <h3 className="text-sm font-medium text-gray-900">Recent Notifications</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {recentNotifications.slice(0, 3).map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">
                      {notification.type === 'like' ? '❤️' :
                       notification.type === 'comment' ? '💬' :
                       notification.type === 'follow' ? '👥' :
                       notification.type === 'mention' ? '📢' :
                       notification.type === 'group_invite' ? '👥' :
                       notification.type === 'system' ? '⚙️' :
                       notification.type === 'security' ? '🔒' : '📢'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t">
              <button
                onClick={handleBellClick}
                className="w-full text-sm text-innkt-primary hover:text-innkt-dark font-medium"
              >
                View all notifications
              </button>
            </div>
          </div>
        )}
      </div>

      <NotificationCenter isOpen={isOpen} onClose={handleClose} />
    </>
  );
};

export default NotificationBell;

