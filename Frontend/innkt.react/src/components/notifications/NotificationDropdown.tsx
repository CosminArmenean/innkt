import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { notificationService } from '../../services/notification.service';
import PushNotificationSettings from './PushNotificationSettings';
import { 
  BellIcon, 
  XMarkIcon, 
  CheckIcon,
  TrashIcon,
  CogIcon
} from '@heroicons/react/24/outline';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  className = ''
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isLoading
  } = useNotifications();

  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate to notification action URL if available
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    
    onClose();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    return notificationService.getNotificationIcon(type);
  };

  const getNotificationColor = (type: string) => {
    return notificationService.getNotificationColor(type);
  };

  const formatTime = (timestamp: number) => {
    return notificationService.formatNotificationTime(timestamp);
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className={`absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <BellIcon className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Mark all as read"
            >
              <CheckIcon className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Notification settings"
          >
            <CogIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-gray-200 bg-gray-50 max-h-96 overflow-y-auto">
          <NotificationSettings />
          <div className="mt-6 pt-6 border-t border-gray-200">
            <PushNotificationSettings />
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BellIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`text-lg ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        <button
                          onClick={(e) => handleDeleteNotification(e, notification.id)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <button className="w-full text-center text-sm text-purple-600 hover:text-purple-700 font-medium">
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

// Notification Settings Component
const NotificationSettings: React.FC = () => {
  const { settings, updateSettings } = useNotifications();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSettingChange = async (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    await updateSettings({ [key]: value });
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900">Notification Settings</h4>
      
      <div className="space-y-2">
        {[
          { key: 'newFollowers', label: 'New Followers' },
          { key: 'newPosts', label: 'New Posts' },
          { key: 'mentions', label: 'Mentions' },
          { key: 'directMessages', label: 'Direct Messages' },
          { key: 'groupUpdates', label: 'Group Updates' },
          { key: 'desktopNotifications', label: 'Desktop Notifications' },
          { key: 'soundEnabled', label: 'Sound' }
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center justify-between">
            <span className="text-sm text-gray-700">{label}</span>
            <input
              type="checkbox"
              checked={localSettings[key as keyof typeof localSettings]}
              onChange={(e) => handleSettingChange(key as keyof typeof settings, e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
          </label>
        ))}
      </div>
    </div>
  );
};

export default NotificationDropdown;
