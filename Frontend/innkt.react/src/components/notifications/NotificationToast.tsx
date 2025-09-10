import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { notificationService } from '../../services/notification.service';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface NotificationToastProps {
  className?: string;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ className = '' }) => {
  const { settings } = useNotifications();
  const [toasts, setToasts] = useState<any[]>([]);

  useEffect(() => {
    const handleNewNotification = (notification: any) => {
      // Only show toast for certain notification types
      const showToastTypes = ['mention', 'group_invitation', 'follow'];
      
      if (showToastTypes.includes(notification.type) && (settings as any).desktopNotifications) {
        const toast = {
          id: notification.id,
          notification,
          timestamp: Date.now()
        };
        
        setToasts(prev => [...prev, toast]);
        
        // Auto-remove toast after 5 seconds
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, 5000);
      }
    };

    // notificationService.addNotificationHandler(handleNewNotification);

    return () => {
      // notificationService.removeNotificationHandler(handleNewNotification);
    };
  }, []);

  const removeToast = (toastId: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  };

  const handleToastClick = (notification: any) => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    removeToast(notification.id);
  };

  if (toasts.length === 0) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 ${className}`}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 animate-in slide-in-from-right duration-300"
        >
          <div className="flex items-start space-x-3">
            <div className={`text-lg ${(() => {
              const colorMap: { [key: string]: string } = {
                'message': 'text-blue-500',
                'mention': 'text-yellow-500',
                'group_invitation': 'text-green-500',
                'follow': 'text-purple-500',
                'like': 'text-red-500',
                'comment': 'text-blue-500',
                'post': 'text-gray-500',
                'system': 'text-gray-500'
              };
              return colorMap[toast.notification.type] || 'text-gray-500';
            })()}`}>
              {(() => {
                const iconMap: { [key: string]: string } = {
                  'message': '💬',
                  'mention': '@',
                  'group_invitation': '👥',
                  'follow': '👤',
                  'like': '❤️',
                  'comment': '💭',
                  'post': '📝',
                  'system': '⚙️'
                };
                return iconMap[toast.notification.type] || '🔔';
              })()}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {toast.notification.title}
              </p>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {toast.notification.body}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(() => {
                  const now = Date.now();
                  const diff = now - toast.notification.timestamp;
                  const seconds = Math.floor(diff / 1000);
                  const minutes = Math.floor(seconds / 60);
                  const hours = Math.floor(minutes / 60);
                  const days = Math.floor(hours / 24);
                  
                  if (seconds < 60) {
                    return 'Just now';
                  } else if (minutes < 60) {
                    return `${minutes}m ago`;
                  } else if (hours < 24) {
                    return `${hours}h ago`;
                  } else if (days < 7) {
                    return `${days}d ago`;
                  } else {
                    return new Date(toast.notification.timestamp).toLocaleDateString();
                  }
                })()}
              </p>
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => handleToastClick(toast.notification)}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
            >
              View
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
