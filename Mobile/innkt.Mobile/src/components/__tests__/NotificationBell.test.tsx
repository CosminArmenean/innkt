import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NotificationBell } from '../common/NotificationBell';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

// Mock the hooks
jest.mock('../../contexts/NotificationContext');
jest.mock('../../contexts/ThemeContext');
jest.mock('../../contexts/LanguageContext');

const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockUseLanguage = useLanguage as jest.MockedFunction<typeof useLanguage>;

describe('NotificationBell', () => {
  const defaultProps = {
    size: 24,
    showBadge: true,
    showMenu: true,
  };

  const mockNotifications = {
    notifications: [
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
    ],
    unreadCount: 1,
    isConnected: true,
    isLoading: false,
    preferences: {},
    markAsRead: jest.fn(),
    refreshNotifications: jest.fn(),
    updatePreferences: jest.fn(),
  };

  const mockTheme = {
    colors: {
      primary: '#007AFF',
      secondary: '#5856D6',
      background: '#FFFFFF',
      surface: '#F2F2F7',
      error: '#FF3B30',
      text: '#000000',
      onSurface: '#000000',
      onSurfaceVariant: '#6D6D70',
      tertiary: '#FF9500',
      outline: '#C7C7CC',
    },
    dark: false,
    roundness: 8,
  };

  const mockLanguage = {
    t: (key: string) => key,
    currentLanguage: 'en',
    changeLanguage: jest.fn(),
    isRTL: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseNotifications.mockReturnValue(mockNotifications);
    mockUseTheme.mockReturnValue(mockTheme);
    mockUseLanguage.mockReturnValue(mockLanguage);
  });

  it('renders notification bell with correct size', () => {
    const { getByTestId } = render(<NotificationBell {...defaultProps} />);
    
    const bellIcon = getByTestId('notification-bell-icon');
    expect(bellIcon).toBeTruthy();
  });

  it('shows badge when there are unread notifications', () => {
    const { getByTestId } = render(<NotificationBell {...defaultProps} />);
    
    const badge = getByTestId('notification-badge');
    expect(badge).toBeTruthy();
    expect(badge.props.children).toBe(1);
  });

  it('hides badge when showBadge is false', () => {
    const { queryByTestId } = render(
      <NotificationBell {...defaultProps} showBadge={false} />
    );
    
    const badge = queryByTestId('notification-badge');
    expect(badge).toBeNull();
  });

  it('hides badge when there are no unread notifications', () => {
    mockUseNotifications.mockReturnValue({
      ...mockNotifications,
      unreadCount: 0,
    });

    const { queryByTestId } = render(<NotificationBell {...defaultProps} />);
    
    const badge = queryByTestId('notification-badge');
    expect(badge).toBeNull();
  });

  it('shows menu when showMenu is true', () => {
    const { getByTestId } = render(<NotificationBell {...defaultProps} />);
    
    const bellButton = getByTestId('notification-bell-button');
    fireEvent.press(bellButton);
    
    const menu = getByTestId('notification-menu');
    expect(menu).toBeTruthy();
  });

  it('hides menu when showMenu is false', () => {
    const { getByTestId, queryByTestId } = render(
      <NotificationBell {...defaultProps} showMenu={false} />
    );
    
    const bellButton = getByTestId('notification-bell-button');
    fireEvent.press(bellButton);
    
    const menu = queryByTestId('notification-menu');
    expect(menu).toBeNull();
  });

  it('displays notifications in menu when opened', async () => {
    const { getByTestId, getByText } = render(<NotificationBell {...defaultProps} />);
    
    const bellButton = getByTestId('notification-bell-button');
    fireEvent.press(bellButton);
    
    await waitFor(() => {
      expect(getByText('New like')).toBeTruthy();
      expect(getByText('Someone liked your post')).toBeTruthy();
      expect(getByText('New comment')).toBeTruthy();
      expect(getByText('Someone commented on your post')).toBeTruthy();
    });
  });

  it('shows unread indicator for unread notifications', async () => {
    const { getByTestId } = render(<NotificationBell {...defaultProps} />);
    
    const bellButton = getByTestId('notification-bell-button');
    fireEvent.press(bellButton);
    
    await waitFor(() => {
      const unreadIndicator = getByTestId('notification-unread-1');
      expect(unreadIndicator).toBeTruthy();
    });
  });

  it('calls markAsRead when notification is pressed', async () => {
    const { getByTestId } = render(<NotificationBell {...defaultProps} />);
    
    const bellButton = getByTestId('notification-bell-button');
    fireEvent.press(bellButton);
    
    await waitFor(() => {
      const notificationItem = getByTestId('notification-item-1');
      fireEvent.press(notificationItem);
      
      expect(mockNotifications.markAsRead).toHaveBeenCalledWith('1');
    });
  });

  it('shows "View All" button in menu', async () => {
    const { getByTestId, getByText } = render(<NotificationBell {...defaultProps} />);
    
    const bellButton = getByTestId('notification-bell-button');
    fireEvent.press(bellButton);
    
    await waitFor(() => {
      const viewAllButton = getByText('notifications.viewAll');
      expect(viewAllButton).toBeTruthy();
    });
  });

  it('shows "Mark All Read" button in menu', async () => {
    const { getByTestId, getByText } = render(<NotificationBell {...defaultProps} />);
    
    const bellButton = getByTestId('notification-bell-button');
    fireEvent.press(bellButton);
    
    await waitFor(() => {
      const markAllReadButton = getByText('notifications.markAllRead');
      expect(markAllReadButton).toBeTruthy();
    });
  });

  it('calls markAsRead for all notifications when "Mark All Read" is pressed', async () => {
    const { getByTestId, getByText } = render(<NotificationBell {...defaultProps} />);
    
    const bellButton = getByTestId('notification-bell-button');
    fireEvent.press(bellButton);
    
    await waitFor(() => {
      const markAllReadButton = getByText('notifications.markAllRead');
      fireEvent.press(markAllReadButton);
      
      expect(mockNotifications.markAsRead).toHaveBeenCalledWith('1');
      expect(mockNotifications.markAsRead).toHaveBeenCalledWith('2');
    });
  });

  it('shows empty state when no notifications', async () => {
    mockUseNotifications.mockReturnValue({
      ...mockNotifications,
      notifications: [],
      unreadCount: 0,
    });

    const { getByTestId, getByText } = render(<NotificationBell {...defaultProps} />);
    
    const bellButton = getByTestId('notification-bell-button');
    fireEvent.press(bellButton);
    
    await waitFor(() => {
      const emptyState = getByText('notifications.noNotifications');
      expect(emptyState).toBeTruthy();
    });
  });

  it('shows loading state when notifications are loading', async () => {
    mockUseNotifications.mockReturnValue({
      ...mockNotifications,
      isLoading: true,
    });

    const { getByTestId, getByText } = render(<NotificationBell {...defaultProps} />);
    
    const bellButton = getByTestId('notification-bell-button');
    fireEvent.press(bellButton);
    
    await waitFor(() => {
      const loadingIndicator = getByText('common.loading');
      expect(loadingIndicator).toBeTruthy();
    });
  });

  it('shows connection status when offline', () => {
    mockUseNotifications.mockReturnValue({
      ...mockNotifications,
      isConnected: false,
    });

    const { getByTestId } = render(<NotificationBell {...defaultProps} />);
    
    const offlineIndicator = getByTestId('notification-offline-indicator');
    expect(offlineIndicator).toBeTruthy();
  });

  it('applies correct theme colors', () => {
    const { getByTestId } = render(<NotificationBell {...defaultProps} />);
    
    const bellIcon = getByTestId('notification-bell-icon');
    expect(bellIcon.props.color).toBe(mockTheme.colors.onSurface);
  });

  it('applies RTL layout when language is RTL', () => {
    mockUseLanguage.mockReturnValue({
      ...mockLanguage,
      isRTL: true,
    });

    const { getByTestId } = render(<NotificationBell {...defaultProps} />);
    
    const bellButton = getByTestId('notification-bell-button');
    expect(bellButton.props.style).toMatchObject({
      transform: [{ scaleX: -1 }],
    });
  });

  it('handles notification type icons correctly', async () => {
    const { getByTestId } = render(<NotificationBell {...defaultProps} />);
    
    const bellButton = getByTestId('notification-bell-button');
    fireEvent.press(bellButton);
    
    await waitFor(() => {
      const likeIcon = getByTestId('notification-type-icon-1');
      const commentIcon = getByTestId('notification-type-icon-2');
      
      expect(likeIcon).toBeTruthy();
      expect(commentIcon).toBeTruthy();
    });
  });

  it('formats notification timestamp correctly', async () => {
    const { getByTestId, getByText } = render(<NotificationBell {...defaultProps} />);
    
    const bellButton = getByTestId('notification-bell-button');
    fireEvent.press(bellButton);
    
    await waitFor(() => {
      const timestamp = getByTestId('notification-timestamp-1');
      expect(timestamp).toBeTruthy();
    });
  });

  it('closes menu when clicking outside', async () => {
    const { getByTestId, queryByTestId } = render(<NotificationBell {...defaultProps} />);
    
    const bellButton = getByTestId('notification-bell-button');
    fireEvent.press(bellButton);
    
    await waitFor(() => {
      expect(getByTestId('notification-menu')).toBeTruthy();
    });
    
    // Simulate clicking outside
    fireEvent.press(getByTestId('notification-bell-button'));
    
    await waitFor(() => {
      expect(queryByTestId('notification-menu')).toBeNull();
    });
  });

  it('handles notification press with navigation', async () => {
    const mockNavigate = jest.fn();
    const { getByTestId } = render(<NotificationBell {...defaultProps} />);
    
    const bellButton = getByTestId('notification-bell-button');
    fireEvent.press(bellButton);
    
    await waitFor(() => {
      const notificationItem = getByTestId('notification-item-1');
      fireEvent.press(notificationItem);
      
      // Should mark as read and potentially navigate
      expect(mockNotifications.markAsRead).toHaveBeenCalledWith('1');
    });
  });

  it('shows notification count in badge correctly', () => {
    mockUseNotifications.mockReturnValue({
      ...mockNotifications,
      unreadCount: 5,
    });

    const { getByTestId } = render(<NotificationBell {...defaultProps} />);
    
    const badge = getByTestId('notification-badge');
    expect(badge.props.children).toBe(5);
  });

  it('handles large notification counts gracefully', () => {
    mockUseNotifications.mockReturnValue({
      ...mockNotifications,
      unreadCount: 999,
    });

    const { getByTestId } = render(<NotificationBell {...defaultProps} />);
    
    const badge = getByTestId('notification-badge');
    expect(badge.props.children).toBe('99+');
  });

  it('applies accessibility labels correctly', () => {
    const { getByTestId } = render(<NotificationBell {...defaultProps} />);
    
    const bellButton = getByTestId('notification-bell-button');
    expect(bellButton.props.accessibilityLabel).toBe('notifications.bell');
    expect(bellButton.props.accessibilityHint).toBe('notifications.bellHint');
  });

  it('handles theme switching correctly', () => {
    // Test with dark theme
    mockUseTheme.mockReturnValue({
      ...mockTheme,
      dark: true,
    });

    const { getByTestId, rerender } = render(<NotificationBell {...defaultProps} />);
    
    let bellIcon = getByTestId('notification-bell-icon');
    expect(bellIcon.props.color).toBe(mockTheme.colors.onSurface);
    
    // Switch to light theme
    mockUseTheme.mockReturnValue({
      ...mockTheme,
      dark: false,
    });
    
    rerender(<NotificationBell {...defaultProps} />);
    
    bellIcon = getByTestId('notification-bell-icon');
    expect(bellIcon.props.color).toBe(mockTheme.colors.onSurface);
  });
});





