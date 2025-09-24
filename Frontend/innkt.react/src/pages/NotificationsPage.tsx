import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService, Notification, NotificationCounts } from '../services/notification.service';
import { useAuth } from '../contexts/AuthContext';
import './NotificationsPage.css';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      setupNotificationListeners();
    }
  }, [user?.id]);

  const setupNotificationListeners = () => {
    notificationService.on('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    notificationService.on('counts', (newCounts: NotificationCounts) => {
      setCounts(newCounts);
    });
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Use user ID from auth context (same as NotificationContext)
      const userId = user?.id;
      console.log('📱 Loading notifications for user:', userId);
      console.log('📱 User from context:', user);
      
      // Use real notifications from the service with userId
      const response = await notificationService.getNotifications(0, 50, userId);
      console.log('📱 Notifications response:', response);
      setNotifications(response.notifications);
      
      // Get real counts with userId
      const unreadCount = await notificationService.getUnreadCount(userId);
      console.log('📱 Unread count:', unreadCount);
      setCounts({
        total: response.notifications.length,
        unread: unreadCount,
        byType: {
          follow: 0,
          like: 0,
          comment: 0,
          message: 0,
          group_invite: 0,
          post_mention: 0,
          system: 0,
          grok_response: 0,
          kid_follow_request: 0,
          kid_post: 0,
          kid_message: 0,
          kid_content_flagged: 0,
          kid_time_limit: 0,
          comment_notification: 0,
          like_notification: 0,
          follow_notification: 0,
        }
      });
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    console.log('🔔 Notification clicked:', notification);
    
    // Mark as read first
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Use the notification service's navigation method with React Router
    notificationService.navigateToNotification(notification, navigate);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment': return '💬';
      case 'like': return '❤️';
      case 'follow': return '👤';
      case 'message': return '📧';
      case 'grok_response': return '🤖';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'comment': return '#3B82F6';
      case 'like': return '#EF4444';
      case 'follow': return '#10B981';
      case 'message': return '#8B5CF6';
      case 'grok_response': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'read' && !notification.read) return false;
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    return true;
  });

  if (!user?.id) {
    return (
      <div className="notifications-page">
        <div className="notifications-header">
          <h1>Notifications</h1>
        </div>
        <div className="notifications-loading">
          <p>Please log in to view notifications...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="notifications-header">
          <h1>Notifications</h1>
        </div>
        <div className="notifications-loading">
          <div className="loading-spinner"></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <div className="notifications-actions">
          <button 
            className="mark-all-read-btn"
            onClick={handleMarkAllAsRead}
            disabled={notifications.every(n => n.read)}
          >
            Mark All as Read
          </button>
        </div>
      </div>

      <div className="notifications-filters">
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button 
            className={filter === 'unread' ? 'active' : ''}
            onClick={() => setFilter('unread')}
          >
            Unread ({notifications.filter(n => !n.read).length})
          </button>
          <button 
            className={filter === 'read' ? 'active' : ''}
            onClick={() => setFilter('read')}
          >
            Read ({notifications.filter(n => n.read).length})
          </button>
        </div>

        <div className="type-filter">
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="comment">Comments</option>
            <option value="like">Likes</option>
            <option value="follow">Follows</option>
            <option value="message">Messages</option>
            <option value="grok_response">AI Responses</option>
          </select>
        </div>
      </div>

      <div className="notifications-list">
        {error && (
          <div className="notifications-error">
            <p>{error}</p>
            <button onClick={loadNotifications}>Retry</button>
          </div>
        )}

        {filteredNotifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="empty-icon">🔔</div>
            <h3>No notifications found</h3>
            <p>You're all caught up! Check back later for new notifications.</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div 
              key={notification.id}
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-icon" style={{ backgroundColor: getNotificationColor(notification.type) }}>
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="notification-content">
                <div className="notification-header">
                  <h4 className="notification-title">{notification.title}</h4>
                  <span className="notification-time">
                    {new Date(notification.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <p className="notification-body">{notification.body}</p>
                
                {!notification.read && (
                  <div className="notification-unread-indicator"></div>
                )}
              </div>

              <div className="notification-actions">
                {!notification.read && (
                  <button 
                    className="mark-read-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification.id);
                    }}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
