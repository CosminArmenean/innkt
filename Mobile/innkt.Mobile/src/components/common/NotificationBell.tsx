import React, { useState, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Badge, IconButton, Menu, Divider, List, Text, Button } from 'react-native-paper';
import { useNotifications } from '../../contexts/NotificationContext';
import { Notification, NotificationType } from '../../services/notifications/notificationService';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface NotificationBellProps {
  size?: number;
  onPress?: () => void;
  showBadge?: boolean;
  showMenu?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  size = 24,
  onPress,
  showBadge = true,
  showMenu = true,
}) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const badgeScaleAnim = useRef(new Animated.Value(1)).current;
  
  // MARK: - Animation Methods
  
  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const animateBadge = () => {
    Animated.sequence([
      Animated.timing(badgeScaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(badgeScaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // MARK: - Event Handlers
  
  const handlePress = () => {
    animatePress();
    
    if (onPress) {
      onPress();
    } else if (showMenu) {
      setMenuVisible(true);
    }
  };
  
  const handleNotificationPress = async (notification: Notification) => {
    setSelectedNotification(notification);
    setMenuVisible(false);
    
    if (!notification.isRead) {
      await markAsRead(notification.id);
      animateBadge();
    }
    
    // Handle navigation based on notification type
    handleNotificationNavigation(notification);
  };
  
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    animateBadge();
    setMenuVisible(false);
  };
  
  const handleNotificationNavigation = (notification: Notification) => {
    // This would integrate with navigation
    // For now, just log the action
    console.log('Navigate to:', notification.actionUrl || notification.targetType, notification.targetId);
  };
  
  // MARK: - Render Methods
  
  const renderNotificationItem = (notification: Notification) => {
    const isUnread = !notification.isRead;
    const iconName = getNotificationIcon(notification.type);
    const timeAgo = getTimeAgo(notification.createdAt);
    
    return (
      <List.Item
        key={notification.id}
        title={notification.title}
        description={notification.message}
        left={(props) => (
          <List.Icon
            {...props}
            icon={iconName}
            color={isUnread ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
        )}
        right={(props) => (
          <View style={styles.notificationRight}>
            <Text {...props} variant="bodySmall" style={styles.timeText}>
              {timeAgo}
            </Text>
            {isUnread && (
              <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
            )}
          </View>
        )}
        onPress={() => handleNotificationPress(notification)}
        style={[
          styles.notificationItem,
          isUnread && { backgroundColor: theme.colors.surfaceVariant }
        ]}
        titleStyle={[
          styles.notificationTitle,
          isUnread && { fontWeight: 'bold' }
        ]}
        descriptionStyle={styles.notificationDescription}
      />
    );
  };
  
  const renderNotificationMenu = () => {
    if (!showMenu) return null;
    
    const recentNotifications = notifications.slice(0, 5);
    const hasUnread = unreadCount > 0;
    
    return (
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <TouchableOpacity onPress={handlePress} style={styles.bellContainer}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <IconButton
                icon="bell"
                size={size}
                iconColor={theme.colors.onSurface}
                onPress={handlePress}
              />
            </Animated.View>
            
            {showBadge && unreadCount > 0 && (
              <Animated.View
                style={[
                  styles.badgeContainer,
                  { transform: [{ scale: badgeScaleAnim }] }
                ]}
              >
                <Badge
                  size={Math.min(20, Math.max(16, unreadCount.toString().length * 8))}
                  style={[styles.badge, { backgroundColor: theme.colors.error }]}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              </Animated.View>
            )}
          </TouchableOpacity>
        }
        contentStyle={[styles.menuContent, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.menuHeader}>
          <Text variant="titleMedium" style={styles.menuTitle}>
            {t('notifications.title')}
          </Text>
          {hasUnread && (
            <Button
              mode="text"
              onPress={handleMarkAllAsRead}
              textColor={theme.colors.primary}
              compact
            >
              {t('notifications.markAllRead')}
            </Button>
          )}
        </View>
        
        <Divider />
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text variant="bodyMedium" style={styles.loadingText}>
              {t('common.loading')}
            </Text>
          </View>
        ) : recentNotifications.length > 0 ? (
          <View style={styles.notificationsList}>
            {recentNotifications.map(renderNotificationItem)}
            
            {notifications.length > 5 && (
              <View style={styles.viewAllContainer}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setMenuVisible(false);
                    // Navigate to full notifications screen
                    console.log('Navigate to notifications screen');
                  }}
                  style={styles.viewAllButton}
                >
                  {t('notifications.viewAll')} ({notifications.length})
                </Button>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text variant="bodyMedium" style={styles.emptyText}>
              {t('notifications.noNotifications')}
            </Text>
          </View>
        )}
      </Menu>
    );
  };
  
  // MARK: - Utility Methods
  
  const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.POST:
        return 'post';
      case NotificationType.COMMENT:
        return 'comment';
      case NotificationType.LIKE:
        return 'heart';
      case NotificationType.FOLLOW:
        return 'account-plus';
      case NotificationType.MENTION:
        return 'at';
      case NotificationType.SYSTEM:
        return 'cog';
      case NotificationType.SECURITY:
        return 'shield';
      default:
        return 'bell';
    }
  };
  
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return t('time.justNow');
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return t('time.minutesAgo', { count: minutes });
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return t('time.hoursAgo', { count: hours });
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return t('time.daysAgo', { count: days });
    }
  };
  
  // MARK: - Render
  
  if (showMenu) {
    return renderNotificationMenu();
  }
  
  return (
    <TouchableOpacity onPress={handlePress} style={styles.bellContainer}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <IconButton
          icon="bell"
          size={size}
          iconColor={theme.colors.onSurface}
          onPress={handlePress}
        />
      </Animated.View>
      
      {showBadge && unreadCount > 0 && (
        <Animated.View
          style={[
            styles.badgeContainer,
            { transform: [{ scale: badgeScaleAnim }] }
          ]}
        >
          <Badge
            size={Math.min(20, Math.max(16, unreadCount.toString().length * 8))}
            style={[styles.badge, { backgroundColor: theme.colors.error }]}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

// MARK: - Styles

const styles = StyleSheet.create({
  bellContainer: {
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  badge: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  menuContent: {
    width: 320,
    maxHeight: 500,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  menuTitle: {
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    opacity: 0.6,
  },
  notificationsList: {
    maxHeight: 400,
  },
  notificationItem: {
    paddingVertical: 8,
  },
  notificationTitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  notificationDescription: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.8,
  },
  notificationRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  timeText: {
    opacity: 0.6,
    fontSize: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  viewAllContainer: {
    padding: 16,
    alignItems: 'center',
  },
  viewAllButton: {
    width: '100%',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.6,
  },
});

export default NotificationBell;






