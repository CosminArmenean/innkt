import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { notificationService, Notification, NotificationCounts, NotificationSettings } from '../services/notification.service';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  counts: NotificationCounts;
  isConnected: boolean;
  settings: NotificationSettings;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({
    total: 0,
    unread: 0,
    byType: {
      follow: 0,
      like: 0,
      comment: 0,
      message: 0,
      group_invite: 0,
      post_mention: 0,
      system: 0,
    },
  });
  const [settings, setSettings] = useState<NotificationSettings>({
    newFollowers: true,
    newPosts: true,
    mentions: true,
    directMessages: true,
    groupUpdates: true,
    desktopNotifications: true,
    soundEnabled: true,
    pushNotifications: true,
    emailNotifications: true
  });
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Handle new notifications
  const handleNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    
    // Update counts
    setCounts(prev => ({
      total: prev.total + 1,
      unread: prev.unread + 1,
      byType: {
        ...prev.byType,
        [notification.type]: prev.byType[notification.type] + 1,
      },
    }));
  }, []);

  // Handle count updates
  const handleCounts = useCallback((newCounts: NotificationCounts) => {
    setCounts(newCounts);
  }, []);

  // Handle follow count updates
  const handleFollowCount = useCallback((count: number) => {
    setCounts(prev => ({
      ...prev,
      byType: {
        ...prev.byType,
        follow: count,
      },
    }));
  }, []);

  // Handle message count updates
  const handleMessageCount = useCallback((count: number) => {
    setCounts(prev => ({
      ...prev,
      byType: {
        ...prev.byType,
        message: count,
      },
    }));
  }, []);

  // Handle group invite count updates
  const handleGroupInviteCount = useCallback((count: number) => {
    setCounts(prev => ({
      ...prev,
      byType: {
        ...prev.byType,
        group_invite: count,
      },
    }));
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    
    setCounts(prev => ({
      ...prev,
      unread: Math.max(0, prev.unread - 1),
    }));

    notificationService.markAsRead(notificationId);
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    
    setCounts(prev => ({
      ...prev,
      unread: 0,
    }));

    notificationService.markAllAsRead();
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(() => {
    // This would typically fetch notifications from the API
    // For now, we'll just log that refresh was requested
    console.log('Refreshing notifications...');
  }, []);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    try {
      await notificationService.updateNotificationSettings(newSettings);
      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update counts if the deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setCounts(prev => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
          byType: {
            ...prev.byType,
            [deletedNotification.type]: Math.max(0, prev.byType[deletedNotification.type] - 1),
          },
        }));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [notifications]);

  // Setup notification service listeners
  useEffect(() => {
    notificationService.on('connected', () => {
      setIsConnected(true);
      console.log('🔔 Notification service connected');
    });

    notificationService.on('disconnected', () => {
      setIsConnected(false);
      console.log('🔔 Notification service disconnected');
    });

    notificationService.on('notification', handleNotification);
    notificationService.on('counts', handleCounts);
    notificationService.on('follow_count', handleFollowCount);
    notificationService.on('message_count', handleMessageCount);
    notificationService.on('group_invite_count', handleGroupInviteCount);

    return () => {
      notificationService.off('connected', () => {});
      notificationService.off('disconnected', () => {});
      notificationService.off('notification', handleNotification);
      notificationService.off('counts', handleCounts);
      notificationService.off('follow_count', handleFollowCount);
      notificationService.off('message_count', handleMessageCount);
      notificationService.off('group_invite_count', handleGroupInviteCount);
    };
  }, [handleNotification, handleCounts, handleFollowCount, handleMessageCount, handleGroupInviteCount]);

  // Authenticate and subscribe when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        notificationService.authenticate(user.id, token);
        notificationService.subscribeToUser(user.id);
      }
    }
  }, [isAuthenticated, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      notificationService.destroy();
    };
  }, []);

  const value: NotificationContextType = {
    notifications,
    counts,
    isConnected,
    settings,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    updateSettings,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};