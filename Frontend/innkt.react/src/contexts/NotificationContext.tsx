import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationService, Notification, NotificationSettings, NotificationStats } from '../services/notification.service';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  isConnected: boolean;
  isLoading: boolean;
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings>({
    newFollowers: true,
    newPosts: true,
    mentions: true,
    directMessages: true,
    groupUpdates: true,
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: true,
    desktopNotifications: true
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load notifications from API
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setIsLoading(true);
      const response = await notificationService.getNotifications(0, 50);
      setNotifications(response.notifications);
      
      // Also load unread count
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Fallback to stored notifications
      const stored = notificationService.getStoredNotifications();
      setNotifications(stored);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load notification settings
  const loadSettings = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const notificationSettings = await notificationService.getNotificationSettings();
      setSettings(notificationSettings);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }, [isAuthenticated, user]);

  // Connect to WebSocket
  const connectWebSocket = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      await notificationService.connect(user.id, token);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect notification WebSocket:', error);
      setIsConnected(false);
    }
  }, [isAuthenticated, user]);

  // Handle new notifications
  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if notification was unread
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [notifications]);

  // Update notification settings
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = await notificationService.updateNotificationSettings(newSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    try {
      const permission = await notificationService.requestNotificationPermission();
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    notificationService.clearStoredNotifications();
  }, []);

  // Initialize on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications();
      loadSettings();
      connectWebSocket();
      
      // Add notification handler
      notificationService.addNotificationHandler(handleNewNotification);
      
      // Request notification permission
      requestPermission();
    } else {
      // Clean up when user logs out
      notificationService.disconnect();
      setIsConnected(false);
      setNotifications([]);
      setUnreadCount(0);
    }

    return () => {
      notificationService.removeNotificationHandler(handleNewNotification);
    };
  }, [isAuthenticated, user, loadNotifications, loadSettings, connectWebSocket, handleNewNotification, requestPermission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      notificationService.disconnect();
    };
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    settings,
    isConnected,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateSettings,
    requestPermission,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
