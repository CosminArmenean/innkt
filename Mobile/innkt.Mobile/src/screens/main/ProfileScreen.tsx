import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Avatar,
  Chip,
  useTheme,
  IconButton,
  Divider,
  List,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useAuth} from '../../contexts/AuthContext';
import {useLanguage} from '../../contexts/LanguageContext';
import {useTheme as useAppTheme} from '../../contexts/ThemeContext';
import {RootStackParamList} from '../../types/navigation';
import LinearGradient from 'react-native-linear-gradient';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

interface ProfileStats {
  posts: number;
  followers: number;
  following: number;
  likes: number;
}

const ProfileScreen: React.FC = () => {
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    posts: 156,
    followers: 89,
    following: 67,
    likes: 1247,
  });
  const [isEditing, setIsEditing] = useState(false);

  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const {user, logout, updateUserProfile} = useAuth();
  const {t, isRTL} = useLanguage();
  const {themeMode} = useAppTheme();
  const theme = useTheme();

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      t('auth.logoutConfirm'),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {text: t('auth.logout'), onPress: logout, style: 'destructive'},
      ]
    );
  };

  const navigateToSettings = () => {
    // TODO: Navigate to settings screen
    Alert.alert('Info', 'Settings screen coming soon!');
  };

  const navigateToFriends = () => {
    // TODO: Navigate to friends screen
    Alert.alert('Info', 'Friends screen coming soon!');
  };

  const navigateToPosts = () => {
    navigation.navigate('PostList');
  };

  const handleEditProfile = () => {
    setIsEditing(!isEditing);
    // TODO: Implement profile editing
    Alert.alert('Info', 'Profile editing coming soon!');
  };

  const handleChangeProfilePicture = () => {
    // TODO: Implement profile picture change
    Alert.alert('Info', 'Profile picture change coming soon!');
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            iconColor="white"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
          <IconButton
            icon="cog"
            iconColor="white"
            size={24}
            onPress={navigateToSettings}
          />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Info Card */}
        <Card style={[styles.profileCard, {backgroundColor: theme.colors.surface}]}>
          <Card.Content style={styles.profileContent}>
            {/* Profile Picture Section */}
            <View style={styles.profilePictureSection}>
              <Avatar.Image
                size={120}
                source={{
                  uri: user?.profilePicture || 'https://via.placeholder.com/120',
                }}
              />
              <IconButton
                icon="camera"
                size={20}
                mode="contained"
                onPress={handleChangeProfilePicture}
                style={styles.cameraButton}
              />
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={[styles.userName, {color: theme.colors.onSurface}]}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={[styles.userEmail, {color: theme.colors.onSurfaceVariant}]}>
                {user?.email}
              </Text>
              {user?.isJointAccount && (
                <Chip
                  icon="account-group"
                  mode="outlined"
                  style={styles.jointAccountChip}>
                  {t('profile.jointAccount')}
                </Chip>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={handleEditProfile}
                style={styles.editButton}>
                {isEditing ? t('common.save') : t('profile.edit')}
              </Button>
              <Button
                mode="outlined"
                onPress={navigateToFriends}
                style={styles.friendsButton}>
                {t('profile.friends')}
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statCard, {backgroundColor: theme.colors.surface}]}>
            <Card.Content style={styles.statContent}>
              <Text style={[styles.statNumber, {color: theme.colors.primary}]}>
                {profileStats.posts}
              </Text>
              <Text style={[styles.statLabel, {color: theme.colors.onSurfaceVariant}]}>
                {t('profile.posts')}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, {backgroundColor: theme.colors.surface}]}>
            <Card.Content style={styles.statContent}>
              <Text style={[styles.statNumber, {color: theme.colors.secondary}]}>
                {profileStats.followers}
              </Text>
              <Text style={[styles.statLabel, {color: theme.colors.onSurfaceVariant}]}>
                {t('profile.followers')}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, {backgroundColor: theme.colors.surface}]}>
            <Card.Content style={styles.statContent}>
              <Text style={[styles.statNumber, {color: theme.colors.tertiary}]}>
                {profileStats.following}
              </Text>
              <Text style={[styles.statLabel, {color: theme.colors.onSurfaceVariant}]}>
                {t('profile.following')}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, {backgroundColor: theme.colors.surface}]}>
            <Card.Content style={styles.statContent}>
              <Text style={[styles.statNumber, {color: theme.colors.error}]}>
                {profileStats.likes}
              </Text>
              <Text style={[styles.statLabel, {color: theme.colors.onSurfaceVariant}]}>
                {t('profile.likes')}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <Card style={[styles.actionsCard, {backgroundColor: theme.colors.surface}]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, {color: theme.colors.onSurface}]}>
              {t('profile.quickActions')}
            </Text>
            
            <List.Item
              title={t('posts.create')}
              description={t('posts.createDescription')}
              left={props => <List.Icon {...props} icon="plus" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('PostCreate')}
              style={styles.listItem}
            />
            
            <Divider />
            
            <List.Item
              title={t('profile.viewPosts')}
              description={t('profile.viewPostsDescription')}
              left={props => <List.Icon {...props} icon="view-list" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={navigateToPosts}
              style={styles.listItem}
            />
            
            <Divider />
            
            <List.Item
              title={t('profile.photos')}
              description={t('profile.photosDescription')}
              left={props => <List.Icon {...props} icon="image" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Info', 'Photos screen coming soon!')}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Account Info */}
        <Card style={[styles.accountCard, {backgroundColor: theme.colors.surface}]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, {color: theme.colors.onSurface}]}>
              {t('profile.accountInfo')}
            </Text>
            
            <List.Item
              title={t('profile.memberSince')}
              description={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              left={props => <List.Icon {...props} icon="calendar" />}
              style={styles.listItem}
            />
            
            <Divider />
            
            <List.Item
              title={t('profile.language')}
              description={user?.language === 'en' ? 'English' : user?.language === 'he' ? 'עברית' : 'العربية'}
              left={props => <List.Icon {...props} icon="translate" />}
              style={styles.listItem}
            />
            
            <Divider />
            
            <List.Item
              title={t('profile.lastLogin')}
              description={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'N/A'}
              left={props => <List.Icon {...props} icon="clock" />}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={[styles.logoutButton, {borderColor: theme.colors.error}]}
            textColor={theme.colors.error}>
            {t('auth.logout')}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: 16,
    borderRadius: 16,
    elevation: 4,
  },
  profileContent: {
    alignItems: 'center',
    padding: 24,
  },
  profilePictureSection: {
    position: 'relative',
    marginBottom: 20,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#667eea',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 12,
  },
  jointAccountChip: {
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    borderRadius: 8,
  },
  friendsButton: {
    flex: 1,
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  actionsCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  listItem: {
    paddingVertical: 8,
  },
  accountCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    elevation: 2,
  },
  logoutContainer: {
    padding: 16,
    marginBottom: 32,
  },
  logoutButton: {
    borderRadius: 8,
    borderWidth: 2,
  },
});

export default ProfileScreen;
