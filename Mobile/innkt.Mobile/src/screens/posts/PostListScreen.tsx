import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Avatar,
  Chip,
  useTheme,
  Searchbar,
  FAB,
  IconButton,
  Menu,
  Divider,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useAuth} from '../../contexts/AuthContext';
import {useLanguage} from '../../contexts/LanguageContext';
import {RootStackParamList} from '../../types/navigation';

type PostListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PostList'>;

interface Post {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  likes: number;
  comments: number;
  shares: number;
  image?: string;
  category: string;
  tags: string[];
  isLiked: boolean;
  isBookmarked: boolean;
}

const PostListScreen: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [menuVisible, setMenuVisible] = useState(false);

  const navigation = useNavigation<PostListScreenNavigationProp>();
  const {user} = useAuth();
  const {t, isRTL} = useLanguage();
  const theme = useTheme();

  // Mock data for development
  useEffect(() => {
    loadMockPosts();
  }, []);

  useEffect(() => {
    filterAndSortPosts();
  }, [posts, searchQuery, selectedCategory, sortBy]);

  const loadMockPosts = () => {
    const mockPosts: Post[] = [
      {
        id: '1',
        content: 'Just finished an amazing workout! 💪 Feeling energized and ready for the day. The new gym equipment is fantastic!',
        author: {
          id: '1',
          name: 'John Doe',
          avatar: 'https://via.placeholder.com/50',
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        likes: 24,
        comments: 8,
        shares: 3,
        image: 'https://via.placeholder.com/400x300',
        category: 'fitness',
        tags: ['workout', 'fitness', 'motivation'],
        isLiked: false,
        isBookmarked: false,
      },
      {
        id: '2',
        content: 'Beautiful sunset at the beach today. Nature never fails to amaze me! 🌅 Perfect weather for a relaxing evening.',
        author: {
          id: '2',
          name: 'Jane Smith',
          avatar: 'https://via.placeholder.com/50',
        },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        likes: 42,
        comments: 12,
        shares: 7,
        image: 'https://via.placeholder.com/400x300',
        category: 'nature',
        tags: ['sunset', 'beach', 'nature'],
        isLiked: true,
        isBookmarked: false,
      },
      {
        id: '3',
        content: 'Working on some exciting new features for our app. Can\'t wait to share them with you all! 🚀 The team has been incredible.',
        author: {
          id: '3',
          name: 'Mike Johnson',
          avatar: 'https://via.placeholder.com/50',
        },
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        likes: 18,
        comments: 5,
        shares: 2,
        category: 'technology',
        tags: ['development', 'app', 'innovation'],
        isLiked: false,
        isBookmarked: true,
      },
      {
        id: '4',
        content: 'Delicious homemade pasta for dinner tonight! 🍝 Nothing beats a good Italian meal with family.',
        author: {
          id: '4',
          name: 'Sarah Wilson',
          avatar: 'https://via.placeholder.com/50',
        },
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        likes: 31,
        comments: 9,
        shares: 4,
        image: 'https://via.placeholder.com/400x300',
        category: 'food',
        tags: ['pasta', 'cooking', 'family'],
        isLiked: false,
        isBookmarked: false,
      },
    ];

    setPosts(mockPosts);
    setIsLoading(false);
  };

  const filterAndSortPosts = () => {
    let filtered = [...posts];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(post =>
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // Sort posts
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'trending':
        filtered.sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares));
        break;
    }

    setFilteredPosts(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      loadMockPosts();
    } catch (error) {
      console.error('Failed to refresh posts:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLike = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
              isLiked: !post.isLiked,
            }
          : post
      )
    );
  };

  const handleBookmark = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {...post, isBookmarked: !post.isBookmarked}
          : post
      )
    );
  };

  const handleComment = (postId: string) => {
    // TODO: Navigate to post detail or open comment modal
    console.log('Comment on post:', postId);
  };

  const handleShare = (postId: string) => {
    // TODO: Implement share functionality
    console.log('Share post:', postId);
  };

  const navigateToCreatePost = () => {
    navigation.navigate('PostCreate');
  };

  const navigateToPostDetail = (postId: string) => {
    // TODO: Navigate to post detail screen
    console.log('Navigate to post:', postId);
  };

  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const renderPost = ({item}: {item: Post}) => (
    <Card
      style={[styles.postCard, {backgroundColor: theme.colors.surface}]}
      onPress={() => navigateToPostDetail(item.id)}>
      <Card.Content style={styles.postContent}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            <Avatar.Image
              size={40}
              source={{uri: item.author.avatar || 'https://via.placeholder.com/40'}}
            />
            <View style={styles.authorText}>
              <Text style={[styles.authorName, {color: theme.colors.onSurface}]}>
                {item.author.name}
              </Text>
              <Text style={[styles.postTime, {color: theme.colors.onSurfaceVariant}]}>
                {formatTimestamp(item.timestamp)}
              </Text>
            </View>
          </View>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={() => setMenuVisible(true)}
              />
            }>
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                // TODO: Implement edit functionality
              }}
              title="Edit"
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                // TODO: Implement delete functionality
              }}
              title="Delete"
              leadingIcon="delete"
            />
          </Menu>
        </View>

        {/* Post Content */}
        <Text style={[styles.postText, {color: theme.colors.onSurface}]}>
          {item.content}
        </Text>

        {/* Post Image */}
        {item.image && (
          <View style={styles.imageContainer}>
            <img
              source={{uri: item.image}}
              style={styles.postImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Post Tags */}
        {item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.map((tag, index) => (
              <Chip
                key={index}
                mode="outlined"
                style={styles.tagChip}
                textStyle={{fontSize: 12}}>
                #{tag}
              </Chip>
            ))}
          </View>
        )}

        {/* Post Actions */}
        <View style={styles.postActions}>
          <View style={styles.actionButton}>
            <IconButton
              icon={item.isLiked ? 'heart' : 'heart-outline'}
              size={20}
              iconColor={item.isLiked ? theme.colors.error : theme.colors.onSurfaceVariant}
              onPress={() => handleLike(item.id)}
            />
            <Text style={[styles.actionText, {color: theme.colors.onSurfaceVariant}]}>
              {item.likes}
            </Text>
          </View>

          <View style={styles.actionButton}>
            <IconButton
              icon="comment-outline"
              size={20}
              iconColor={theme.colors.onSurfaceVariant}
              onPress={() => handleComment(item.id)}
            />
            <Text style={[styles.actionText, {color: theme.colors.onSurfaceVariant}]}>
              {item.comments}
            </Text>
          </View>

          <View style={styles.actionButton}>
            <IconButton
              icon="share-outline"
              size={20}
              iconColor={theme.colors.onSurfaceVariant}
              onPress={() => handleShare(item.id)}
            />
            <Text style={[styles.actionText, {color: theme.colors.onSurfaceVariant}]}>
              {item.shares}
            </Text>
          </View>

          <View style={styles.actionButton}>
            <IconButton
              icon={item.isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              iconColor={item.isBookmarked ? theme.colors.primary : theme.colors.onSurfaceVariant}
              onPress={() => handleBookmark(item.id)}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const categories = [
    {id: 'all', name: 'All Posts', icon: 'view-list'},
    {id: 'fitness', name: 'Fitness', icon: 'dumbbell'},
    {id: 'nature', name: 'Nature', icon: 'tree'},
    {id: 'technology', name: 'Technology', icon: 'laptop'},
    {id: 'food', name: 'Food', icon: 'food'},
  ];

  const sortOptions = [
    {id: 'recent', name: 'Recent', icon: 'clock'},
    {id: 'popular', name: 'Popular', icon: 'fire'},
    {id: 'trending', name: 'Trending', icon: 'trending-up'},
  ];

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, {backgroundColor: theme.colors.background}]}>
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: theme.colors.surface}]}>
        <Text style={[styles.headerTitle, {color: theme.colors.onSurface}]}>
          {t('posts.title')}
        </Text>
        <IconButton
          icon="tune"
          size={24}
          onPress={() => setMenuVisible(!menuVisible)}
        />
      </View>

      {/* Search and Filters */}
      <View style={[styles.filtersContainer, {backgroundColor: theme.colors.surface}]}>
        <Searchbar
          placeholder={t('posts.searchPosts')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={theme.colors.onSurfaceVariant}
        />

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({item}) => (
              <Chip
                mode={selectedCategory === item.id ? 'flat' : 'outlined'}
                selected={selectedCategory === item.id}
                onPress={() => setSelectedCategory(item.id)}
                style={[
                  styles.categoryChip,
                  selectedCategory === item.id && {backgroundColor: theme.colors.primary},
                ]}
                textStyle={{
                  color: selectedCategory === item.id ? 'white' : theme.colors.onSurface,
                }}>
                {item.name}
              </Chip>
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <Text style={[styles.sortLabel, {color: theme.colors.onSurfaceVariant}]}>
            {t('posts.sortBy')}:
          </Text>
          <View style={styles.sortButtons}>
            {sortOptions.map(option => (
              <Chip
                key={option.id}
                mode={sortBy === option.id ? 'flat' : 'outlined'}
                selected={sortBy === option.id}
                onPress={() => setSortBy(option.id as any)}
                style={[
                  styles.sortChip,
                  sortBy === option.id && {backgroundColor: theme.colors.secondary},
                ]}
                textStyle={{
                  color: sortBy === option.id ? 'white' : theme.colors.onSurface,
                }}>
                {option.name}
              </Chip>
            ))}
          </View>
        </View>
      </View>

      {/* Posts List */}
      <FlatList
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.postsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, {color: theme.colors.onSurfaceVariant}]}>
              {searchQuery || selectedCategory !== 'all'
                ? t('posts.noPostsFound')
                : t('posts.noPostsYet')}
            </Text>
            <Button
              mode="contained"
              onPress={navigateToCreatePost}
              style={styles.createFirstPostButton}>
              {t('posts.createFirstPost')}
            </Button>
          </View>
        }
      />

      {/* Create Post FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, {backgroundColor: theme.colors.primary}]}
        onPress={navigateToCreatePost}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  filtersContainer: {
    padding: 16,
    elevation: 1,
  },
  searchBar: {
    marginBottom: 16,
    elevation: 0,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesList: {
    paddingHorizontal: 4,
  },
  categoryChip: {
    marginRight: 8,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortChip: {
    marginLeft: 8,
  },
  postsList: {
    padding: 16,
  },
  postCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  postContent: {
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorText: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
  },
  postText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 200,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  tagChip: {
    marginBottom: 4,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  createFirstPostButton: {
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default PostListScreen;
