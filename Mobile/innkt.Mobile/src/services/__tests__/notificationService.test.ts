import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService, Notification, NotificationPreferences, WebSocketMessage } from '../notifications/notificationService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
}));

// Mock WebSocket
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1, // WebSocket.OPEN
};

global.WebSocket = jest.fn(() => mockWebSocket) as any;

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset service state
    notificationService.disconnect();
  });

  describe('WebSocket connection management', () => {
    it('should connect to WebSocket successfully', () => {
      const mockUrl = 'ws://localhost:8080/notifications';
      const mockToken = 'mock-token';

      notificationService.connect(mockUrl, mockToken);

      expect(global.WebSocket).toHaveBeenCalledWith(mockUrl);
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle WebSocket open event', () => {
      const mockUrl = 'ws://localhost:8080/notifications';
      const mockToken = 'mock-token';

      notificationService.connect(mockUrl, mockToken);

      // Simulate WebSocket open event
      const openHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'open'
      )?.[1];
      
      if (openHandler) {
        openHandler();
        expect(notificationService.isConnected()).toBe(true);
      }
    });

    it('should handle WebSocket message event', () => {
      const mockUrl = 'ws://localhost:8080/notifications';
      const mockToken = 'mock-token';

      notificationService.connect(mockUrl, mockToken);

      // Simulate WebSocket message event
      const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];
      
      if (messageHandler) {
        const mockMessage: WebSocketMessage = {
          type: 'notification',
          data: {
            id: '1',
            type: 'post_like',
            title: 'New like',
            message: 'Someone liked your post',
            userId: 'user1',
            targetId: 'post1',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        };

        messageHandler({ data: JSON.stringify(mockMessage) });
        
        // Verify notification was added
        const notifications = notificationService.getNotifications();
        expect(notifications).toHaveLength(1);
        expect(notifications[0].id).toBe('1');
      }
    });

    it('should handle WebSocket close event', () => {
      const mockUrl = 'ws://localhost:8080/notifications';
      const mockToken = 'mock-token';

      notificationService.connect(mockUrl, mockToken);

      // Simulate WebSocket close event
      const closeHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'close'
      )?.[1];
      
      if (closeHandler) {
        closeHandler();
        expect(notificationService.isConnected()).toBe(false);
      }
    });

    it('should disconnect WebSocket', () => {
      const mockUrl = 'ws://localhost:8080/notifications';
      const mockToken = 'mock-token';

      notificationService.connect(mockUrl, mockToken);
      notificationService.disconnect();

      expect(mockWebSocket.close).toHaveBeenCalled();
      expect(notificationService.isConnected()).toBe(false);
    });

    it('should send heartbeat messages', () => {
      jest.useFakeTimers();
      
      const mockUrl = 'ws://localhost:8080/notifications';
      const mockToken = 'mock-token';

      notificationService.connect(mockUrl, mockToken);

      // Fast-forward time to trigger heartbeat
      jest.advanceTimersByTime(30000); // 30 seconds

      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'heartbeat',
        timestamp: expect.any(Number),
      }));

      jest.useRealTimers();
    });
  });

  describe('Notification management', () => {
    it('should add new notification', () => {
      const notification: Notification = {
        id: '1',
        type: 'post_like',
        title: 'New like',
        message: 'Someone liked your post',
        userId: 'user1',
        targetId: 'post1',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      notificationService.addNotification(notification);

      const notifications = notificationService.getNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toEqual(notification);
    });

    it('should mark notification as read', () => {
      const notification: Notification = {
        id: '1',
        type: 'post_like',
        title: 'New like',
        message: 'Someone liked your post',
        userId: 'user1',
        targetId: 'post1',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      notificationService.addNotification(notification);
      notificationService.markAsRead('1');

      const notifications = notificationService.getNotifications();
      expect(notifications[0].isRead).toBe(true);
    });

    it('should mark all notifications as read', () => {
      const notifications: Notification[] = [
        {
          id: '1',
          type: 'post_like',
          title: 'New like',
          message: 'Someone liked your post',
          userId: 'user1',
          targetId: 'post1',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'comment',
          title: 'New comment',
          message: 'Someone commented on your post',
          userId: 'user2',
          targetId: 'post1',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];

      notifications.forEach(n => notificationService.addNotification(n));
      notificationService.markAllAsRead();

      const allNotifications = notificationService.getNotifications();
      allNotifications.forEach(n => expect(n.isRead).toBe(true));
    });

    it('should archive notification', () => {
      const notification: Notification = {
        id: '1',
        type: 'post_like',
        title: 'New like',
        message: 'Someone liked your post',
        userId: 'user1',
        targetId: 'post1',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      notificationService.addNotification(notification);
      notificationService.archiveNotification('1');

      const notifications = notificationService.getNotifications();
      expect(notifications).toHaveLength(0);
    });

    it('should delete notification', () => {
      const notification: Notification = {
        id: '1',
        type: 'post_like',
        title: 'New like',
        message: 'Someone liked your post',
        userId: 'user1',
        targetId: 'post1',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      notificationService.addNotification(notification);
      notificationService.deleteNotification('1');

      const notifications = notificationService.getNotifications();
      expect(notifications).toHaveLength(0);
    });

    it('should get unread count', () => {
      const notifications: Notification[] = [
        {
          id: '1',
          type: 'post_like',
          title: 'New like',
          message: 'Someone liked your post',
          userId: 'user1',
          targetId: 'post1',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'comment',
          title: 'New comment',
          message: 'Someone commented on your post',
          userId: 'user2',
          targetId: 'post1',
          isRead: true,
          createdAt: new Date().toISOString(),
        },
      ];

      notifications.forEach(n => notificationService.addNotification(n));

      const unreadCount = notificationService.getUnreadCount();
      expect(unreadCount).toBe(1);
    });

    it('should filter notifications by type', () => {
      const notifications: Notification[] = [
        {
          id: '1',
          type: 'post_like',
          title: 'New like',
          message: 'Someone liked your post',
          userId: 'user1',
          targetId: 'post1',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'comment',
          title: 'New comment',
          message: 'Someone commented on your post',
          userId: 'user2',
          targetId: 'post1',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];

      notifications.forEach(n => notificationService.addNotification(n));

      const postLikeNotifications = notificationService.getNotificationsByType('post_like');
      expect(postLikeNotifications).toHaveLength(1);
      expect(postLikeNotifications[0].type).toBe('post_like');
    });
  });

  describe('Preferences management', () => {
    it('should update notification preferences', () => {
      const preferences: NotificationPreferences = {
        push: true,
        email: false,
        inApp: true,
        types: {
          post_like: true,
          comment: false,
          follow: true,
        },
      };

      notificationService.updatePreferences(preferences);

      const storedPreferences = notificationService.getPreferences();
      expect(storedPreferences).toEqual(preferences);
    });

    it('should get default preferences when none stored', () => {
      const preferences = notificationService.getPreferences();
      
      expect(preferences).toEqual({
        push: true,
        email: true,
        inApp: true,
        types: {
          post_like: true,
          comment: true,
          follow: true,
          mention: true,
          message: true,
        },
      });
    });
  });

  describe('Local storage', () => {
    it('should save notifications to storage', async () => {
      const notification: Notification = {
        id: '1',
        type: 'post_like',
        title: 'New like',
        message: 'Someone liked your post',
        userId: 'user1',
        targetId: 'post1',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      notificationService.addNotification(notification);
      await notificationService.saveToStorage();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'notifications',
        JSON.stringify([notification])
      );
    });

    it('should load notifications from storage', async () => {
      const storedNotifications: Notification[] = [
        {
          id: '1',
          type: 'post_like',
          title: 'New like',
          message: 'Someone liked your post',
          userId: 'user1',
          targetId: 'post1',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedNotifications));

      await notificationService.loadFromStorage();

      const notifications = notificationService.getNotifications();
      expect(notifications).toEqual(storedNotifications);
    });

    it('should handle empty storage gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await notificationService.loadFromStorage();

      const notifications = notificationService.getNotifications();
      expect(notifications).toHaveLength(0);
    });
  });

  describe('Event system', () => {
    it('should emit events when notifications change', () => {
      const mockListener = jest.fn();
      notificationService.on('notificationsChanged', mockListener);

      const notification: Notification = {
        id: '1',
        type: 'post_like',
        title: 'New like',
        message: 'Someone liked your post',
        userId: 'user1',
        targetId: 'post1',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      notificationService.addNotification(notification);

      expect(mockListener).toHaveBeenCalledWith([notification]);
    });

    it('should remove event listeners', () => {
      const mockListener = jest.fn();
      notificationService.on('notificationsChanged', mockListener);
      notificationService.off('notificationsChanged', mockListener);

      const notification: Notification = {
        id: '1',
        type: 'post_like',
        title: 'New like',
        message: 'Someone liked your post',
        userId: 'user1',
        targetId: 'post1',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      notificationService.addNotification(notification);

      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('Reconnection logic', () => {
    it('should attempt reconnection on connection loss', () => {
      jest.useFakeTimers();
      
      const mockUrl = 'ws://localhost:8080/notifications';
      const mockToken = 'mock-token';

      notificationService.connect(mockUrl, mockToken);

      // Simulate connection loss
      const closeHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'close'
      )?.[1];
      
      if (closeHandler) {
        closeHandler();
        
        // Fast-forward time to trigger reconnection
        jest.advanceTimersByTime(5000); // 5 seconds
        
        expect(global.WebSocket).toHaveBeenCalledTimes(2); // Initial + reconnection
      }

      jest.useRealTimers();
    });

    it('should limit reconnection attempts', () => {
      jest.useFakeTimers();
      
      const mockUrl = 'ws://localhost:8080/notifications';
      const mockToken = 'mock-token';

      notificationService.connect(mockUrl, mockToken);

      // Simulate multiple connection losses
      const closeHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'close'
      )?.[1];
      
      if (closeHandler) {
        // Trigger multiple reconnections
        for (let i = 0; i < 6; i++) {
          closeHandler();
          jest.advanceTimersByTime(5000);
        }
        
        // Should not exceed max reconnection attempts
        expect(global.WebSocket).toHaveBeenCalledTimes(6); // Initial + 5 reconnections
      }

      jest.useRealTimers();
    });
  });
});





