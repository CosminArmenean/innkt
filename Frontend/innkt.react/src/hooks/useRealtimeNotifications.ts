import { useState, useCallback } from 'react';

export interface RealtimeNotification {
  id: string;
  type: 'new_post' | 'post_liked' | 'poll_voted' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
  authors?: Array<{
    userId: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
  }>; // For grouped notifications
  count?: number; // Number of posts/events
}

export const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);

  const addNotification = useCallback((notification: Omit<RealtimeNotification, 'id' | 'timestamp'>) => {
    setNotifications(prev => {
      // Check if we can merge with existing notification of same type
      const existingIndex = prev.findIndex(n => 
        n.type === notification.type && 
        Date.now() - n.timestamp.getTime() < 10000 // Within 10 seconds
      );

      if (existingIndex !== -1 && notification.type === 'new_post') {
        // Merge with existing notification
        const existing = prev[existingIndex];
        const authorProfile = notification.data?.authorProfile;
        
        if (authorProfile) {
          const newAuthors = existing.authors || [];
          const authorExists = newAuthors.some(a => a.userId === authorProfile.userId);
          
          if (!authorExists) {
            newAuthors.push({
              userId: authorProfile.userId,
              displayName: authorProfile.displayName,
              username: authorProfile.username,
              avatarUrl: authorProfile.avatarUrl
            });
          }

          const updatedNotification = {
            ...existing,
            authors: newAuthors,
            count: (existing.count || 1) + 1,
            message: newAuthors.length === 1 
              ? `New post from ${newAuthors[0].displayName}` 
              : `${newAuthors.length} new posts`,
            timestamp: new Date() // Update timestamp
          };

          const newNotifications = [...prev];
          newNotifications[existingIndex] = updatedNotification;
          return newNotifications;
        }
      }

      // Create new notification
      const newNotification: RealtimeNotification = {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date(),
        count: 1,
        authors: notification.data?.authorProfile ? [{
          userId: notification.data.authorProfile.userId,
          displayName: notification.data.authorProfile.displayName,
          username: notification.data.authorProfile.username,
          avatarUrl: notification.data.authorProfile.avatarUrl
        }] : undefined
      };

      return [newNotification, ...prev.slice(0, 3)]; // Keep only 4 most recent
    });

    // Auto-remove after 8 seconds (longer for grouped notifications)
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => Date.now() - n.timestamp.getTime() < 8000));
    }, 8000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  };
};
