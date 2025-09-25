import React from 'react';
import { Notification } from '../../services/notification.service';
import './ParentNotificationCard.css';

interface ParentNotificationCardProps {
  notification: Notification;
  onApprove?: (notificationId: string) => void;
  onReject?: (notificationId: string) => void;
  onViewDetails?: (notificationId: string) => void;
}

const ParentNotificationCard: React.FC<ParentNotificationCardProps> = ({
  notification,
  onApprove,
  onReject,
  onViewDetails
}) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'kid_follow_request': return '👤';
      case 'kid_post': return '📝';
      case 'kid_message': return '💬';
      case 'kid_content_flagged': return '⚠️';
      case 'kid_time_limit': return '⏰';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'kid_follow_request': return '#3B82F6';
      case 'kid_post': return '#10B981';
      case 'kid_message': return '#8B5CF6';
      case 'kid_content_flagged': return '#EF4444';
      case 'kid_time_limit': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getActionButtons = () => {
    switch (notification.type) {
      case 'kid_follow_request':
        return (
          <div className="notification-actions">
            <button 
              className="approve-btn"
              onClick={() => onApprove?.(notification.id)}
            >
              ✅ Approve
            </button>
            <button 
              className="reject-btn"
              onClick={() => onReject?.(notification.id)}
            >
              ❌ Reject
            </button>
          </div>
        );
      case 'kid_content_flagged':
        return (
          <div className="notification-actions">
            <button 
              className="view-details-btn"
              onClick={() => onViewDetails?.(notification.id)}
            >
              👁️ View Details
            </button>
          </div>
        );
      default:
        return (
          <div className="notification-actions">
            <button 
              className="view-details-btn"
              onClick={() => onViewDetails?.(notification.id)}
            >
              👁️ View Details
            </button>
          </div>
        );
    }
  };

  const parseNotificationData = () => {
    try {
      return notification.data ? JSON.parse(notification.data) : {};
    } catch {
      return {};
    }
  };

  const data = parseNotificationData();

  return (
    <div className={`parent-notification-card ${notification.read ? 'read' : 'unread'}`}>
      <div className="notification-header">
        <div className="notification-icon" style={{ backgroundColor: getNotificationColor(notification.type) }}>
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="notification-content">
          <h4 className="notification-title">{notification.title}</h4>
          <p className="notification-body">{notification.body}</p>
          
          {data.kidDisplayName && (
            <div className="kid-info">
              <span className="kid-label">Kid:</span>
              <span className="kid-name">{data.kidDisplayName}</span>
            </div>
          )}
          
          {data.targetDisplayName && (
            <div className="target-info">
              <span className="target-label">Target:</span>
              <span className="target-name">{data.targetDisplayName}</span>
            </div>
          )}
          
          {data.reason && (
            <div className="reason-info">
              <span className="reason-label">Reason:</span>
              <span className="reason-text">{data.reason}</span>
            </div>
          )}
          
          {data.timeUsed && data.timeLimit && (
            <div className="time-info">
              <span className="time-label">Time Used:</span>
              <span className="time-text">{data.timeUsed}/{data.timeLimit} minutes</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="notification-footer">
        <span className="notification-time">
          {new Date(notification.timestamp).toLocaleString()}
        </span>
        
        {getActionButtons()}
      </div>
    </div>
  );
};

export default ParentNotificationCard;

