import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  IconButton,
  useTheme,
  Chip,
  Divider,
} from 'react-native-paper';
import {useAuth} from '../../contexts/AuthContext';
import {useLanguage} from '../../contexts/LanguageContext';
import {useNotifications} from '../../contexts/NotificationContext';
import {useAnalytics} from '../../contexts/AnalyticsContext';
import {NotificationBell} from '../../components/common/NotificationBell';

// Mock data for demonstration
const mockStats = {
  posts: 42,
  followers: 128,
  following: 89,
  notifications: 7,
};

const mockRecentPosts = [
  {
    id: '1',
    title: 'Amazing sunset today!',
    author: 'John Doe',
    likes: 24,
    comments: 8,
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    title: 'New coffee shop discovery',
    author: 'Jane Smith',
    likes: 18,
    comments: 5,
    timestamp: '4 hours ago',
  },
  {
    id: '3',
    title: 'Weekend hiking adventure',
    author: 'Mike Johnson',
    likes: 31,
    comments: 12,
    timestamp: '1 day ago',
  },
];

const DashboardScreen = ({navigation}: any) => {
  const theme = useTheme();
  const {t} = useLanguage();
  const {user} = useAuth();
  const {unreadCount, isConnected} = useNotifications();
  const {trackScreenView, trackEvent, trackUserBehavior} = useAnalytics();

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(mockStats);

  // Analytics tracking
  useEffect(() => {
    // Track screen view
    trackScreenView('Dashboard', {
      userId: user?.id,
      timestamp: new Date().toISOString(),
    });

    // Track user behavior
    trackUserBehavior({
      screenName: 'Dashboard',
      timeSpent: 0,
      interactions: 0,
      features: ['stats_view', 'recent_posts', 'navigation'],
    });
  }, [trackScreenView, trackUserBehavior, user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Track refresh event
    trackEvent('dashboard_refresh', {
      userId: user?.id,
      timestamp: new Date().toISOString(),
    });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStats({...mockStats, notifications: unreadCount});
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleNavigation = (screen: string) => {
    // Track navigation events
    trackEvent('navigation_click', {
      userId: user?.id,
      fromScreen: 'Dashboard',
      toScreen: screen,
      timestamp: new Date().toISOString(),
    });

    navigation.navigate(screen);
  };

  const handlePostInteraction = (postId: string, action: string) => {
    // Track post interactions
    trackEvent('post_interaction', {
      userId: user?.id,
      postId,
      action,
      timestamp: new Date().toISOString(),
    });
  };

  const handleStatCardPress = (statType: string) => {
    // Track stat card interactions
    trackEvent('stat_card_press', {
      userId: user?.id,
      statType,
      value: stats[statType as keyof typeof stats],
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.welcomeText, {color: theme.colors.onBackground}]}>
            {t('dashboard.welcome')}, {user?.firstName || 'User'}!
          </Text>
          <Text style={[styles.subtitle, {color: theme.colors.onSurfaceVariant}]}>
            {t('dashboard.subtitle')}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <NotificationBell
            size={24}
            showBadge={true}
            showMenu={true}
          />
          <IconButton
            icon={theme.themeMode === 'dark' ? 'weather-sunny' : 'weather-night'}
            size={24}
            onPress={() => {
              trackEvent('theme_toggle', {
                userId: user?.id,
                newTheme: theme.themeMode === 'dark' ? 'light' : 'dark',
                timestamp: new Date().toISOString(),
              });
            }}
          />
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card
          style={[styles.statCard, {backgroundColor: theme.colors.surface}]}
          onPress={() => handleStatCardPress('posts')}>
          <Card.Content style={styles.statContent}>
            <Text style={[styles.statNumber, {color: theme.colors.primary}]}>
              {stats.posts}
            </Text>
            <Text style={[styles.statLabel, {color: theme.colors.onSurfaceVariant}]}>
              {t('dashboard.posts')}
            </Text>
          </Card.Content>
        </Card>

        <Card
          style={[styles.statCard, {backgroundColor: theme.colors.surface}]}
          onPress={() => handleStatCardPress('followers')}>
          <Card.Content style={styles.statContent}>
            <Text style={[styles.statNumber, {color: theme.colors.secondary}]}>
              {stats.followers}
            </Text>
            <Text style={[styles.statLabel, {color: theme.colors.onSurfaceVariant}]}>
              {t('dashboard.followers')}
            </Text>
          </Card.Content>
        </Card>

        <Card
          style={[styles.statCard, {backgroundColor: theme.colors.surface}]}
          onPress={() => handleStatCardPress('following')}>
          <Card.Content style={styles.statContent}>
            <Text style={[styles.statNumber, {color: theme.colors.tertiary}]}>
              {stats.following}
            </Text>
            <Text style={[styles.statLabel, {color: theme.colors.onSurfaceVariant}]}>
              {t('dashboard.following')}
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, {backgroundColor: theme.colors.surface}]}>
          <Card.Content style={styles.statContent}>
            <Text style={[styles.statNumber, {color: theme.colors.tertiary}]}>
              {unreadCount}
            </Text>
            <Text style={[styles.statLabel, {color: theme.colors.onSurfaceVariant}]}>
              {t('dashboard.notifications')}
            </Text>
            {!isConnected && (
              <Text style={[styles.connectionStatus, {color: theme.colors.error}]}>
                {t('common.offline')}
              </Text>
            )}
          </Card.Content>
        </Card>
      </View>

      {/* Quick Actions */}
      <Card style={[styles.quickActionsCard, {backgroundColor: theme.colors.surface}]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, {color: theme.colors.onSurface}]}>
            {t('dashboard.quickActions')}
          </Text>
          <View style={styles.quickActions}>
            <Button
              mode="contained"
              onPress={() => handleNavigation('PostCreate')}
              style={styles.actionButton}
              icon="plus">
              {t('dashboard.createPost')}
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleNavigation('PostList')}
              style={styles.actionButton}
              icon="format-list-bulleted">
              {t('dashboard.viewPosts')}
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Recent Posts */}
      <Card style={[styles.recentPostsCard, {backgroundColor: theme.colors.surface}]}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: theme.colors.onSurface}]}>
              {t('dashboard.recentPosts')}
            </Text>
            <Button
              mode="text"
              onPress={() => handleNavigation('PostList')}
              compact>
              {t('dashboard.viewAll')}
            </Button>
          </View>
          
          {mockRecentPosts.map((post, index) => (
            <View key={post.id}>
              <View style={styles.postItem}>
                <View style={styles.postContent}>
                  <Text style={[styles.postTitle, {color: theme.colors.onSurface}]}>
                    {post.title}
                  </Text>
                  <Text style={[styles.postAuthor, {color: theme.colors.onSurfaceVariant}]}>
                    {post.author} • {post.timestamp}
                  </Text>
                  <View style={styles.postStats}>
                    <Chip
                      icon="heart"
                      compact
                      onPress={() => handlePostInteraction(post.id, 'like')}>
                      {post.likes}
                    </Chip>
                    <Chip
                      icon="comment"
                      compact
                      onPress={() => handlePostInteraction(post.id, 'comment')}>
                      {post.comments}
                    </Chip>
                  </View>
                </View>
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => {
                    trackEvent('post_menu_open', {
                      userId: user?.id,
                      postId: post.id,
                      timestamp: new Date().toISOString(),
                    });
                  }}
                />
              </View>
              {index < mockRecentPosts.length - 1 && (
                <Divider style={styles.postDivider} />
              )}
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Connection Status */}
      {!isConnected && (
        <Card style={[styles.connectionCard, {backgroundColor: theme.colors.errorContainer}]}>
          <Card.Content>
            <Text style={[styles.connectionText, {color: theme.colors.onErrorContainer}]}>
              {t('dashboard.offlineMode')}
            </Text>
            <Text style={[styles.connectionSubtext, {color: theme.colors.onErrorContainer}]}>
              {t('dashboard.offlineDescription')}
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  connectionStatus: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  quickActionsCard: {
    marginBottom: 24,
    elevation: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  recentPostsCard: {
    marginBottom: 24,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  postItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  postContent: {
    flex: 1,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  postAuthor: {
    fontSize: 14,
    marginBottom: 8,
  },
  postStats: {
    flexDirection: 'row',
    gap: 8,
  },
  postDivider: {
    marginVertical: 8,
  },
  connectionCard: {
    marginBottom: 16,
  },
  connectionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  connectionSubtext: {
    fontSize: 14,
    opacity: 0.8,
  },
});

export default DashboardScreen;
