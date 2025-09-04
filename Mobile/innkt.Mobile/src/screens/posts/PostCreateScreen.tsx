import React, {useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  Chip,
  IconButton,
  FAB,
  Portal,
  Modal,
  List,
  Divider,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useAuth} from '../../contexts/AuthContext';
import {useLanguage} from '../../contexts/LanguageContext';
import {RootStackParamList} from '../../types/navigation';

type PostCreateScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PostCreate'>;

interface PostDraft {
  content: string;
  images: string[];
  location: string;
  category: string;
  tags: string[];
  isPublic: boolean;
}

const PostCreateScreen: React.FC = () => {
  const [postData, setPostData] = useState<PostDraft>({
    content: '',
    images: [],
    location: '',
    category: '',
    tags: [],
    isPublic: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);

  const navigation = useNavigation<PostCreateScreenNavigationProp>();
  const {user} = useAuth();
  const {t, isRTL} = useLanguage();
  const theme = useTheme();

  const categories = [
    {id: 'personal', name: 'Personal', icon: 'account'},
    {id: 'fitness', name: 'Fitness', icon: 'dumbbell'},
    {id: 'food', name: 'Food', icon: 'food'},
    {id: 'travel', name: 'Travel', icon: 'airplane'},
    {id: 'technology', name: 'Technology', icon: 'laptop'},
    {id: 'entertainment', name: 'Entertainment', icon: 'movie'},
    {id: 'work', name: 'Work', icon: 'briefcase'},
    {id: 'education', name: 'Education', icon: 'school'},
    {id: 'health', name: 'Health', icon: 'medical-bag'},
    {id: 'sports', name: 'Sports', icon: 'basketball'},
  ];

  const updatePostData = (field: keyof PostDraft, value: any) => {
    setPostData(prev => ({...prev, [field]: value}));
  };

  const handleAddImage = () => {
    // TODO: Implement image picker
    Alert.alert('Info', 'Image picker coming soon!');
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...postData.images];
    newImages.splice(index, 1);
    updatePostData('images', newImages);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !postData.tags.includes(newTag.trim())) {
      updatePostData('tags', [...postData.tags, newTag.trim()]);
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updatePostData('tags', postData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleSelectCategory = (category: string) => {
    updatePostData('category', category);
    setShowCategoryModal(false);
  };

  const handleSelectLocation = (location: string) => {
    updatePostData('location', location);
    setShowLocationModal(false);
  };

  const validatePost = (): boolean => {
    if (!postData.content.trim()) {
      Alert.alert(t('common.error'), t('posts.contentRequired'));
      return false;
    }

    if (postData.content.length < 10) {
      Alert.alert(t('common.error'), t('posts.contentTooShort'));
      return false;
    }

    if (postData.content.length > 1000) {
      Alert.alert(t('common.error'), t('posts.contentTooLong'));
      return false;
    }

    return true;
  };

  const handleCreatePost = async () => {
    if (!validatePost()) {
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual post creation API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      Alert.alert(
        t('common.success'),
        t('posts.postCreated'),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to create post:', error);
      Alert.alert(t('common.error'), t('posts.creationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = () => {
    // TODO: Implement draft saving
    Alert.alert(t('common.success'), t('posts.draftSaved'));
  };

  const handleDiscard = () => {
    if (postData.content.trim() || postData.images.length > 0) {
      Alert.alert(
        t('posts.discardTitle'),
        t('posts.discardMessage'),
        [
          {text: t('common.cancel'), style: 'cancel'},
          {
            text: t('common.discard'),
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const getCharacterCount = () => {
    return `${postData.content.length}/1000`;
  };

  const getCharacterCountColor = () => {
    const count = postData.content.length;
    if (count > 900) return theme.colors.error;
    if (count > 800) return theme.colors.warning;
    return theme.colors.onSurfaceVariant;
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: theme.colors.surface}]}>
        <IconButton
          icon="close"
          size={24}
          onPress={handleDiscard}
        />
        <Text style={[styles.headerTitle, {color: theme.colors.onSurface}]}>
          {t('posts.create')}
        </Text>
        <Button
          mode="text"
          onPress={handleSaveDraft}
          disabled={!postData.content.trim()}>
          {t('posts.saveDraft')}
        </Button>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Post Content */}
          <Card style={[styles.contentCard, {backgroundColor: theme.colors.surface}]}>
            <Card.Content>
              <View style={styles.authorSection}>
                <Text style={[styles.authorName, {color: theme.colors.onSurface}]}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <Chip
                  mode="outlined"
                  style={styles.publicChip}
                  textStyle={{fontSize: 12}}>
                  {postData.isPublic ? t('posts.public') : t('posts.private')}
                </Chip>
              </View>

              <TextInput
                mode="outlined"
                placeholder={t('posts.whatsOnYourMind')}
                value={postData.content}
                onChangeText={(text) => updatePostData('content', text)}
                multiline
                numberOfLines={6}
                style={styles.contentInput}
                theme={theme}
                right={
                  <TextInput.Affix
                    text={getCharacterCount()}
                    textStyle={{color: getCharacterCountColor()}}
                  />
                }
              />
            </Card.Content>
          </Card>

          {/* Images Section */}
          <Card style={[styles.imagesCard, {backgroundColor: theme.colors.surface}]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, {color: theme.colors.onSurface}]}>
                {t('posts.images')}
              </Text>
              
              {postData.images.length > 0 ? (
                <View style={styles.imagesGrid}>
                  {postData.images.map((image, index) => (
                    <View key={index} style={styles.imageContainer}>
                      <img
                        source={{uri: image}}
                        style={styles.postImage}
                        resizeMode="cover"
                      />
                      <IconButton
                        icon="close"
                        size={16}
                        mode="contained"
                        onPress={() => handleRemoveImage(index)}
                        style={styles.removeImageButton}
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <Button
                  mode="outlined"
                  icon="image-plus"
                  onPress={handleAddImage}
                  style={styles.addImageButton}>
                  {t('posts.addImage')}
                </Button>
              )}
            </Card.Content>
          </Card>

          {/* Category Section */}
          <Card style={[styles.categoryCard, {backgroundColor: theme.colors.surface}]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, {color: theme.colors.onSurface}]}>
                {t('posts.category')}
              </Text>
              
              <Button
                mode="outlined"
                icon="tag"
                onPress={() => setShowCategoryModal(true)}
                style={styles.categoryButton}>
                {postData.category
                  ? categories.find(cat => cat.id === postData.category)?.name
                  : t('posts.selectCategory')}
              </Button>
            </Card.Content>
          </Card>

          {/* Tags Section */}
          <Card style={[styles.tagsCard, {backgroundColor: theme.colors.surface}]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, {color: theme.colors.onSurface}]}>
                {t('posts.tags')}
              </Text>
              
              {postData.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {postData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      mode="outlined"
                      onClose={() => handleRemoveTag(tag)}
                      style={styles.tagChip}>
                      #{tag}
                    </Chip>
                  ))}
                </View>
              )}
              
              {showTagInput ? (
                <View style={styles.tagInputContainer}>
                  <TextInput
                    mode="outlined"
                    placeholder={t('posts.addTag')}
                    value={newTag}
                    onChangeText={setNewTag}
                    style={styles.tagInput}
                    theme={theme}
                    right={
                      <TextInput.Icon
                        icon="plus"
                        onPress={handleAddTag}
                      />
                    }
                  />
                </View>
              ) : (
                <Button
                  mode="outlined"
                  icon="plus"
                  onPress={() => setShowTagInput(true)}
                  style={styles.addTagButton}>
                  {t('posts.addTag')}
                </Button>
              )}
            </Card.Content>
          </Card>

          {/* Location Section */}
          <Card style={[styles.locationCard, {backgroundColor: theme.colors.surface}]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, {color: theme.colors.onSurface}]}>
                {t('posts.location')}
              </Text>
              
              <Button
                mode="outlined"
                icon="map-marker"
                onPress={() => setShowLocationModal(true)}
                style={styles.locationButton}>
                {postData.location || t('posts.addLocation')}
              </Button>
            </Card.Content>
          </Card>

          {/* Privacy Settings */}
          <Card style={[styles.privacyCard, {backgroundColor: theme.colors.surface}]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, {color: theme.colors.onSurface}]}>
                {t('posts.privacy')}
              </Text>
              
              <View style={styles.privacyOptions}>
                <Button
                  mode={postData.isPublic ? 'contained' : 'outlined'}
                  icon="earth"
                  onPress={() => updatePostData('isPublic', true)}
                  style={styles.privacyButton}>
                  {t('posts.public')}
                </Button>
                
                <Button
                  mode={!postData.isPublic ? 'contained' : 'outlined'}
                  icon="lock"
                  onPress={() => updatePostData('isPublic', false)}
                  style={styles.privacyButton}>
                  {t('posts.private')}
                </Button>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Create Post Button */}
      <View style={[styles.bottomBar, {backgroundColor: theme.colors.surface}]}>
        <Button
          mode="contained"
          onPress={handleCreatePost}
          loading={isLoading}
          disabled={isLoading || !postData.content.trim()}
          style={styles.createButton}
          contentStyle={styles.createButtonContent}>
          {isLoading ? t('common.loading') : t('posts.create')}
        </Button>
      </View>

      {/* Category Selection Modal */}
      <Portal>
        <Modal
          visible={showCategoryModal}
          onDismiss={() => setShowCategoryModal(false)}
          contentContainerStyle={[
            styles.modal,
            {backgroundColor: theme.colors.surface}
          ]}>
          <Text style={[styles.modalTitle, {color: theme.colors.onSurface}]}>
            {t('posts.selectCategory')}
          </Text>
          
          {categories.map(category => (
            <List.Item
              key={category.id}
              title={category.name}
              left={props => <List.Icon {...props} icon={category.icon} />}
              onPress={() => handleSelectCategory(category.id)}
              style={styles.modalItem}
            />
          ))}
        </Modal>
      </Portal>

      {/* Location Selection Modal */}
      <Portal>
        <Modal
          visible={showLocationModal}
          onDismiss={() => setShowLocationModal(false)}
          contentContainerStyle={[
            styles.modal,
            {backgroundColor: theme.colors.surface}
          ]}>
          <Text style={[styles.modalTitle, {color: theme.colors.onSurface}]}>
            {t('posts.selectLocation')}
          </Text>
          
          {['Home', 'Work', 'Gym', 'Restaurant', 'Park', 'Beach'].map(location => (
            <List.Item
              key={location}
              title={location}
              left={props => <List.Icon {...props} icon="map-marker" />}
              onPress={() => handleSelectLocation(location)}
              style={styles.modalItem}
            />
          ))}
          
          <Divider style={styles.modalDivider} />
          
          <List.Item
            title={t('posts.customLocation')}
            left={props => <List.Icon {...props} icon="plus" />}
            onPress={() => {
              setShowLocationModal(false);
              // TODO: Open custom location input
              Alert.alert('Info', 'Custom location input coming soon!');
            }}
            style={styles.modalItem}
          />
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  publicChip: {
    height: 24,
  },
  contentInput: {
    minHeight: 120,
  },
  imagesCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#f44336',
  },
  addImageButton: {
    borderRadius: 8,
  },
  categoryCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  categoryButton: {
    borderRadius: 8,
    justifyContent: 'flex-start',
  },
  tagsCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagChip: {
    marginBottom: 4,
  },
  tagInputContainer: {
    marginTop: 8,
  },
  tagInput: {
    marginBottom: 0,
  },
  addTagButton: {
    borderRadius: 8,
  },
  locationCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  locationButton: {
    borderRadius: 8,
    justifyContent: 'flex-start',
  },
  privacyCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  privacyOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  privacyButton: {
    flex: 1,
    borderRadius: 8,
  },
  bottomBar: {
    padding: 16,
    elevation: 4,
  },
  createButton: {
    borderRadius: 8,
  },
  createButtonContent: {
    height: 48,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 8,
  },
  modalDivider: {
    marginVertical: 16,
  },
});

export default PostCreateScreen;
