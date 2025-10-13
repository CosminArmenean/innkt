import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Shield, AlertTriangle, Bot, BookOpen, Calendar, X, Check } from 'lucide-react';
import { enhancedNotificationService, BaseNotification, KidNotification, ParentNotification, SafetyAlertNotification, GrokResponseNotification } from '../../services/enhancedNotification.service';
import { useAuth } from '../../contexts/AuthContext';

interface RealTimeNotificationCenterProps {
  isKidAccount?: boolean;
  kidAccountId?: string;
  onEmergencyAlert?: (alert: SafetyAlertNotification) => void;
}

export const RealTimeNotificationCenter: React.FC<RealTimeNotificationCenterProps> = ({
  isKidAccount = false,
  kidAccountId,
  onEmergencyAlert,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<BaseNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      initializeNotifications();
      subscribeToRealTimeNotifications();
    }

    return () => {
      enhancedNotificationService.disconnect();
    };
  }, [user?.id]);

  const initializeNotifications = async () => {
    try {
      setIsLoading(true);
      const userNotifications = await enhancedNotificationService.getNotifications(1, 50);
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToRealTimeNotifications = () => {
    // Subscribe to general notifications
    enhancedNotificationService.subscribe('notification', (notification: BaseNotification) => {
      console.log('📥 New notification received:', notification.type);
      
      setNotifications(prev => [notification, ...prev]);
      if (!notification.isRead) {
        setUnreadCount(prev => prev + 1);
      }

      // Show toast notification for important types
      if (notification.priority === 'high' || notification.priority === 'urgent') {
        showToastNotification(notification);
      }
    });

    // Subscribe to kid-specific notifications
    if (isKidAccount) {
      enhancedNotificationService.subscribe('kid_notification', (notification: KidNotification) => {
        console.log('🛡️ Kid-safe notification received:', notification.type);
        handleKidNotification(notification);
      });
    }

    // Subscribe to parent notifications
    enhancedNotificationService.subscribe('parent_notification', (notification: ParentNotification) => {
      console.log('👨‍👩‍👧‍👦 Parent notification received:', notification.requestType);
      handleParentNotification(notification);
    });

    // Subscribe to safety alerts
    enhancedNotificationService.subscribe('safety_alert', (alert: SafetyAlertNotification) => {
      console.log('🚨 SAFETY ALERT:', alert.alertType, alert.severity);
      handleSafetyAlert(alert);
    });

    // Subscribe to Grok responses
    enhancedNotificationService.subscribe('grok_response', (response: GrokResponseNotification) => {
      console.log('🤖 Grok response notification:', response.originalQuestion);
      handleGrokResponse(response);
    });

    // Subscribe to emergency alerts
    enhancedNotificationService.subscribe('emergency_alert', (alert: SafetyAlertNotification) => {
      console.log('🚨 EMERGENCY ALERT:', alert.alertType);
      handleEmergencyAlert(alert);
    });
  };

  const handleKidNotification = (notification: KidNotification) => {
    // Special handling for kid notifications
    if (!notification.safetyChecked || notification.safetyScore < 0.8) {
      console.log('🛡️ Notification blocked for kid safety');
      return;
    }

    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const handleParentNotification = (notification: ParentNotification) => {
    // High priority for parent approval requests
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    if (notification.requiresAction) {
      showToastNotification(notification, 'Parent Action Required');
    }
  };

  const handleSafetyAlert = (alert: SafetyAlertNotification) => {
    setNotifications(prev => [alert, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Immediately show safety alerts
    showToastNotification(alert, '🚨 Safety Alert');
    onEmergencyAlert?.(alert);
  };

  const handleGrokResponse = (response: GrokResponseNotification) => {
    setNotifications(prev => [response, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    showToastNotification(response, '🤖 Grok AI Responded');
  };

  const handleEmergencyAlert = (alert: SafetyAlertNotification) => {
    // CRITICAL: Emergency alerts bypass all filters
    setNotifications(prev => [alert, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show urgent emergency notification
    showEmergencyAlert(alert);
    onEmergencyAlert?.(alert);
  };

  const showToastNotification = (notification: BaseNotification, customTitle?: string) => {
    // This would integrate with a toast notification system
    console.log('🔔 Toast notification:', customTitle || notification.title);
  };

  const showEmergencyAlert = (alert: SafetyAlertNotification) => {
    // This would show a modal or urgent alert
    console.log('🚨 EMERGENCY ALERT DISPLAY:', alert.alertType);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const success = await enhancedNotificationService.markAsRead(notificationId);
      if (success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const success = await enhancedNotificationService.markAllAsRead();
      if (success) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (notification: BaseNotification) => {
    switch (notification.type) {
      case 'safety_alert':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'parent_approval_request':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'grok_response':
        return <Bot className="w-4 h-4 text-purple-500" />;
      case 'educational_content':
        return <BookOpen className="w-4 h-4 text-green-500" />;
      case 'independence_day':
        return <Calendar className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (notification: BaseNotification) => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-red-300 bg-red-50';
      case 'high':
        return 'border-orange-300 bg-orange-50';
      case 'medium':
        return 'border-blue-300 bg-blue-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const renderNotification = (notification: BaseNotification) => (
    <div
      key={notification.id}
      className={`p-3 border-l-4 ${getNotificationColor(notification)} ${
        !notification.isRead ? 'bg-white' : 'bg-gray-50'
      } cursor-pointer hover:bg-gray-100 transition-colors`}
      onClick={() => markAsRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        {getNotificationIcon(notification)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
              {notification.title}
            </h4>
            <span className="text-xs text-gray-500">
              {new Date(notification.createdAt).toLocaleTimeString()}
            </span>
          </div>
          <p className={`text-sm mt-1 ${!notification.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
            {notification.message}
          </p>
          
          {/* Kid Safety Badge */}
          {notification.type.includes('kid') && (
            <div className="flex items-center gap-1 mt-2">
              <Shield className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600 font-medium">Kid Safe</span>
            </div>
          )}
          
          {/* Educational Badge */}
          {notification.type === 'educational_content' && (
            <div className="flex items-center gap-1 mt-2">
              <BookOpen className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-blue-600 font-medium">Educational</span>
            </div>
          )}
        </div>
        
        {!notification.isRead && (
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              Notifications {isKidAccount && '(Kid Safe)'}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map(renderNotification)}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800">
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeNotificationCenter;

