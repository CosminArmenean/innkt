import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { notificationService, Notification, NotificationCounts } from '../services/notification.service';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import './NotificationsPage.css';

const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { notifications, counts, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
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
    // Listeners are already set up in NotificationContext
    // No need to duplicate them here
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      await refreshNotifications();
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
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
          <h1>{t('notifications.title')}</h1>
        </div>
        <div className="notifications-loading">
          <p>{t('notifications.pleaseLoginToView')}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="notifications-header">
          <h1>{t('notifications.title')}</h1>
        </div>
        <div className="notifications-loading">
          <div className="loading-spinner"></div>
          <p>{t('notifications.loadingNotifications')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>{t('notifications.title')}</h1>
        <div className="notifications-actions">
          <button 
            className="mark-all-read-btn"
            onClick={handleMarkAllAsRead}
            disabled={notifications.every(n => n.read)}
          >
            {t('notifications.markAllAsRead')}
          </button>
        </div>
      </div>

      <div className="notifications-filters">
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            {t('notifications.all')} ({notifications.length})
          </button>
          <button 
            className={filter === 'unread' ? 'active' : ''}
            onClick={() => setFilter('unread')}
          >
            {t('notifications.unread')} ({notifications.filter(n => !n.read).length})
          </button>
          <button 
            className={filter === 'read' ? 'active' : ''}
            onClick={() => setFilter('read')}
          >
            {t('notifications.read')} ({notifications.filter(n => n.read).length})
          </button>
        </div>

        <div className="type-filter">
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">{t('notifications.allTypes')}</option>
            <option value="comment">{t('notifications.comments')}</option>
            <option value="like">{t('notifications.likes')}</option>
            <option value="follow">{t('notifications.follows')}</option>
            <option value="message">{t('notifications.messages')}</option>
            <option value="grok_response">{t('notifications.aiResponses')}</option>
          </select>
        </div>
      </div>

      <div className="notifications-list">
        {error && (
          <div className="notifications-error">
            <p>{error}</p>
            <button onClick={loadNotifications}>{t('notifications.retry')}</button>
          </div>
        )}

        {filteredNotifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="empty-icon">🔔</div>
            <h3>{t('notifications.noNotificationsFound')}</h3>
            <p>{t('notifications.allCaughtUp')}</p>
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
