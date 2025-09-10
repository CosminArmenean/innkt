import { BaseApiService, socialApi, officerApi, neurosparkApi } from './api.service';

// User Profile Interfaces
export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  dateOfBirth?: string;
  isVerified: boolean;
  isKidAccount: boolean;
  parentId?: string;
  independenceDate?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
  socialLinks: SocialLinks;
  parentalControls?: ParentalControls;
}

export interface UserPreferences {
  privacyLevel: 'public' | 'friends' | 'private';
  allowDirectMessages: boolean;
  allowMentions: boolean;
  notificationSettings: NotificationSettings;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
}

export interface NotificationSettings {
  newFollowers: boolean;
  newPosts: boolean;
  mentions: boolean;
  directMessages: boolean;
  groupUpdates: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  youtube?: string;
}

export interface ParentalControls {
  canPost: boolean;
  canMessage: boolean;
  canJoinGroups: boolean;
  canViewContent: 'all' | 'filtered' | 'restricted';
  timeRestrictions: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  contentFilters: string[];
  allowedContacts: string[];
}

// Post Interfaces
export interface Post {
  id: string;
  authorId: string;
  authorProfile: UserProfile;
  content: string;
  media?: PostMedia[];
  type: 'text' | 'image' | 'video' | 'link' | 'poll';
  visibility: 'public' | 'friends' | 'group' | 'private';
  groupId?: string;
  location?: PostLocation;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isShared: boolean;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
  blockchainHash?: string; // For verified users
}

export interface PostMedia {
  id: string;
  type: 'image' | 'video' | 'file';
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  caption?: string;
  metadata?: any;
}

export interface PostLocation {
  name: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorProfile: UserProfile;
  content: string;
  parentCommentId?: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

// Group Interfaces
export interface Group {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  type: 'public' | 'private' | 'secret';
  category: string;
  tags: string[];
  memberCount: number;
  postCount: number;
  isMember: boolean;
  memberRole: 'admin' | 'moderator' | 'member' | 'guest';
  createdAt: string;
  updatedAt: string;
  rules: GroupRule[];
  admins: GroupMember[];
  moderators: GroupMember[];
}

export interface GroupRule {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
}

export interface GroupMember {
  id: string;
  profile: UserProfile;
  role: 'admin' | 'moderator' | 'member' | 'guest';
  joinedAt: string;
  isActive: boolean;
}

// Social Interaction Interfaces
export interface Like {
  id: string;
  userId: string;
  targetType: 'post' | 'comment';
  targetId: string;
  createdAt: string;
}

export interface Share {
  id: string;
  userId: string;
  originalPostId: string;
  originalPost: Post;
  shareText?: string;
  visibility: 'public' | 'friends' | 'group' | 'private';
  groupId?: string;
  createdAt: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  followerProfile: UserProfile;
  followingProfile: UserProfile;
  isMutual: boolean;
  createdAt: string;
}

// Search and Discovery Interfaces
export interface SearchFilters {
  query: string;
  type?: 'users' | 'posts' | 'groups' | 'all';
  category?: string;
  tags?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  location?: string;
  verifiedOnly?: boolean;
}

export interface SearchResult {
  users: UserProfile[];
  posts: Post[];
  groups: Group[];
  totalResults: number;
  hasMore: boolean;
}

export class SocialService extends BaseApiService {
  constructor() {
    super(socialApi);
  }

  // User Profile Methods
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      // TODO: Implement user profile endpoint in Officer service
      // For now, return a mock profile
      return {
        id: userId,
        username: 'demo-user',
        displayName: 'Demo User',
        email: 'demo@example.com',
        avatar: undefined,
        bio: 'Demo user profile',
        location: undefined,
        website: undefined,
        dateOfBirth: undefined,
        isVerified: false,
        isKidAccount: false,
        parentId: undefined,
        independenceDate: undefined,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: {
          privacyLevel: 'public',
          allowDirectMessages: true,
          allowMentions: true,
          notificationSettings: {
            newFollowers: true,
            newPosts: true,
            mentions: true,
            directMessages: true,
            groupUpdates: true,
            emailNotifications: true,
            pushNotifications: true,
          },
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
        },
        socialLinks: {},
        parentalControls: undefined,
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }



  async uploadAvatar(userId: string, file: File): Promise<{ avatarUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await this.upload<{ avatarUrl: string }>(`/users/${userId}/avatar`, formData);
      return response;
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw error;
    }
  }

  // Post Methods
  async createPost(postData: Partial<Post>): Promise<Post> {
    try {
      const response = await this.post<Post>('/posts', postData);
      return response;
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  }

  async getPosts(filters?: {
    userId?: string;
    groupId?: string;
    visibility?: string;
    page?: number;
    limit?: number;
  }): Promise<{ posts: Post[]; totalCount: number; hasMore: boolean }> {
    try {
      // If userId is provided, get user posts, otherwise get feed
      const endpoint = filters?.userId ? `/posts/user/${filters.userId}` : '/posts/feed';
      const response = await this.get<{ posts: Post[]; totalCount: number; hasMore: boolean }>(endpoint, filters);
      return response;
    } catch (error) {
      console.error('Failed to get posts:', error);
      throw error;
    }
  }

  async getPost(postId: string): Promise<Post> {
    try {
      const response = await this.get<Post>(`/posts/${postId}`);
      return response;
    } catch (error) {
      console.error('Failed to get post:', error);
      throw error;
    }
  }

  async updatePost(postId: string, updates: Partial<Post>): Promise<Post> {
    try {
      const response = await this.put<Post>(`/posts/${postId}`, updates);
      return response;
    } catch (error) {
      console.error('Failed to update post:', error);
      throw error;
    }
  }

  async deletePost(postId: string): Promise<void> {
    try {
      await this.delete(`/posts/${postId}`);
    } catch (error) {
      console.error('Failed to delete post:', error);
      throw error;
    }
  }

  async uploadPostMedia(postId: string, files: File[]): Promise<PostMedia[]> {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`media[${index}]`, file);
      });
      const response = await this.upload<PostMedia[]>(`/posts/${postId}/media`, formData);
      return response;
    } catch (error) {
      console.error('Failed to upload post media:', error);
      throw error;
    }
  }

  // Comment Methods
  async createComment(postId: string, content: string, parentCommentId?: string): Promise<Comment> {
    try {
      const response = await this.post<Comment>(`/posts/${postId}/comments`, {
        content,
        parentCommentId
      });
      return response;
    } catch (error) {
      console.error('Failed to create comment:', error);
      throw error;
    }
  }

  async getComments(postId: string, page?: number, limit?: number): Promise<{ comments: Comment[]; totalCount: number; hasMore: boolean }> {
    try {
      const response = await this.get<{ comments: Comment[]; totalCount: number; hasMore: boolean }>(`/posts/${postId}/comments`, { page, limit });
      return response;
    } catch (error) {
      console.error('Failed to get comments:', error);
      throw error;
    }
  }

  // Group Methods
  async createGroup(groupData: Partial<Group>): Promise<Group> {
    try {
      const response = await this.post<Group>('/groups', groupData);
      return response;
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  }

  async getGroups(filters?: {
    category?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ groups: Group[]; totalCount: number; hasMore: boolean }> {
    try {
      const response = await this.get<{ groups: Group[]; totalCount: number; hasMore: boolean }>('/groups', filters);
      return response;
    } catch (error) {
      console.error('Failed to get groups:', error);
      throw error;
    }
  }

  async getGroup(groupId: string): Promise<Group> {
    try {
      const response = await this.get<Group>(`/groups/${groupId}`);
      return response;
    } catch (error) {
      console.error('Failed to get group:', error);
      throw error;
    }
  }

  async joinGroup(groupId: string): Promise<void> {
    try {
      await this.post(`/groups/${groupId}/join`);
    } catch (error) {
      console.error('Failed to join group:', error);
      throw error;
    }
  }

  async leaveGroup(groupId: string): Promise<void> {
    try {
      await this.post(`/groups/${groupId}/leave`);
    } catch (error) {
      console.error('Failed to leave group:', error);
      throw error;
    }
  }

  // Social Interaction Methods
  async likePost(postId: string): Promise<void> {
    try {
      await this.post(`/posts/${postId}/like`);
    } catch (error) {
      console.error('Failed to like post:', error);
      throw error;
    }
  }

  async unlikePost(postId: string): Promise<void> {
    try {
      await this.delete(`/posts/${postId}/like`);
    } catch (error) {
      console.error('Failed to unlike post:', error);
      throw error;
    }
  }

  async sharePost(postId: string, shareData: Partial<Share>): Promise<Share> {
    try {
      const response = await this.post<Share>(`/posts/${postId}/share`, shareData);
      return response;
    } catch (error) {
      console.error('Failed to share post:', error);
      throw error;
    }
  }

  async followUser(userId: string): Promise<void> {
    try {
      await this.post(`/users/${userId}/follow`);
    } catch (error) {
      console.error('Failed to follow user:', error);
      throw error;
    }
  }

  async unfollowUser(userId: string): Promise<void> {
    try {
      await this.delete(`/users/${userId}/follow`);
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      throw error;
    }
  }

  async getFollowers(userId: string, page?: number, limit?: number): Promise<{ followers: Follow[]; totalCount: number; hasMore: boolean }> {
    try {
      const response = await this.get<{ followers: Follow[]; totalCount: number; hasMore: boolean }>(`/users/${userId}/followers`, { page, limit });
      return response;
    } catch (error) {
      console.error('Failed to get followers:', error);
      throw error;
    }
  }

  async getFollowing(userId: string, page?: number, limit?: number): Promise<{ following: Follow[]; totalCount: number; hasMore: boolean }> {
    try {
      const response = await this.get<{ following: Follow[]; totalCount: number; hasMore: boolean }>(`/users/${userId}/following`, { page, limit });
      return response;
    } catch (error) {
      console.error('Failed to get following:', error);
      throw error;
    }
  }



  async getWalletInfo(userId: string): Promise<any> {
    try {
      const response = await this.get(`/users/${userId}/wallet`);
      return response;
    } catch (error) {
      console.error('Failed to get wallet info:', error);
      throw error;
    }
  }

  async connectWallet(userId: string, network: string): Promise<any> {
    try {
      const response = await this.post(`/users/${userId}/wallet/connect`, { network });
      return response;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  // Kid Account Methods
  async createUser(userData: any): Promise<UserProfile> {
    try {
      const response = await this.post<UserProfile>('/users', userData);
      return response;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await this.put<UserProfile>(`/users/${userId}`, profileData);
      return response;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }

  // QR Code Methods
  async generateQRCode(data: string): Promise<string> {
    try {
      const response = await this.post('/qr/generate', { data });
      return (response as any).qrCodeUrl;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw error;
    }
  }

  // Search and Discovery Methods
  async search(filters: SearchFilters): Promise<SearchResult> {
    try {
      const response = await this.get<SearchResult>('/search', filters);
      return response;
    } catch (error) {
      console.error('Failed to search:', error);
      throw error;
    }
  }

  async getTrendingTopics(): Promise<string[]> {
    try {
      // TODO: Implement trending topics endpoint in backend
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to get trending topics:', error);
      throw error;
    }
  }

  async getRecommendedUsers(): Promise<UserProfile[]> {
    try {
      // TODO: Implement recommendations endpoint in backend
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to get recommended users:', error);
      throw error;
    }
  }

  async getRecommendedGroups(): Promise<Group[]> {
    try {
      // TODO: Implement recommendations endpoint in backend
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to get recommended groups:', error);
      throw error;
    }
  }

  // Kid Account Specific Methods
  async createKidAccount(kidData: {
    username: string;
    displayName: string;
    dateOfBirth: string;
    parentId: string;
    independenceDate?: string;
  }): Promise<UserProfile> {
    try {
      const response = await this.post<UserProfile>('/users/kid-accounts', kidData);
      return response;
    } catch (error) {
      console.error('Failed to create kid account:', error);
      throw error;
    }
  }

  async approveKidFollowRequest(requestId: string, approved: boolean): Promise<void> {
    try {
      await this.put(`/kid-accounts/follow-requests/${requestId}`, { approved });
    } catch (error) {
      console.error('Failed to approve kid follow request:', error);
      throw error;
    }
  }

  // Blockchain Integration for Verified Users
  async createBlockchainPost(postId: string, blockchainData: {
    network: 'hashgraph' | 'ethereum' | 'polygon';
    metadata: any;
  }): Promise<{ transactionHash: string; blockchainUrl: string }> {
    try {
      const response = await this.post<{ transactionHash: string; blockchainUrl: string }>(`/posts/${postId}/blockchain`, blockchainData);
      return response;
    } catch (error) {
      console.error('Failed to create blockchain post:', error);
      throw error;
    }
  }

  async getBlockchainPosts(userId: string): Promise<Post[]> {
    try {
      const response = await this.get<Post[]>(`/users/${userId}/blockchain-posts`);
      return response;
    } catch (error) {
      console.error('Failed to get blockchain posts:', error);
      throw error;
    }
  }
}

export const socialService = new SocialService();

