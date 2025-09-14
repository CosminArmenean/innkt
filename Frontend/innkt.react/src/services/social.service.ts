import { BaseApiService, socialApi, officerApi, groupsApi } from './api.service';

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

export interface UserBasicInfo {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isVerified: boolean;
  isKidAccount?: boolean;
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
  userId: string;
  authorId?: string;
  authorProfile?: UserProfile;
  author?: UserBasicInfo | null;
  content: string;
  media?: PostMedia[];
  mediaUrls?: string[];
  type: 'text' | 'image' | 'video' | 'link' | 'poll';
  visibility: 'public' | 'friends' | 'group' | 'private';
  groupId?: string;
  location?: PostLocation;
  tags?: string[];
  hashtags?: string[];
  mentions?: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount?: number;
  isLiked: boolean;
  isLikedByCurrentUser?: boolean;
  isShared: boolean;
  isBookmarked?: boolean;
  isPublic?: boolean;
  isPinned?: boolean;
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
      // Get user profile from Officer service (primary source)
      const response = await officerApi.get<UserProfile>(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user profile from Officer service:', error);
      
      // If Officer service fails, return a minimal profile with the provided userId
      return {
        id: userId,
          username: 'unknown-user',
          displayName: 'Unknown User',
          email: 'unknown@example.com',
          avatar: undefined,
          bio: 'User profile not available',
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
      }
    }
  }

  // Get current user profile (logged-in user)
  async getCurrentUserProfile(): Promise<UserProfile> {
    try {
      // Try to get current user from Social service first
      const response = await this.get<UserProfile>('/api/users/me');
      return response;
    } catch (error) {
      console.error('Failed to get current user profile from Social service:', error);
      
      // Fallback: try to get from Officer service
      try {
        const response = await officerApi.get<UserProfile>('/api/auth/me');
        return response.data;
      } catch (officerError) {
        console.error('Failed to get current user profile from Officer service:', officerError);
        throw officerError;
      }
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
  async createPost(postData: any): Promise<Post> {
    try {
      const response = await this.post<any>('/api/posts', postData);
      
      // Convert backend response to frontend Post format
      return {
        id: response.Id || response.id,
        userId: response.UserId || response.userId,
        content: response.Content || response.content,
        type: 'text' as const,
        visibility: (response.IsPublic ? 'public' : 'private') as 'public' | 'private',
        mediaUrls: response.MediaUrls || response.mediaUrls || [],
        hashtags: response.Hashtags || response.hashtags || [],
        mentions: response.Mentions || response.mentions || [],
        tags: response.Hashtags || response.hashtags || [],
        location: response.Location || response.location,
        isPublic: response.IsPublic !== undefined ? response.IsPublic : response.isPublic,
        isPinned: response.IsPinned || response.isPinned || false,
        likesCount: response.LikesCount || response.likesCount || 0,
        commentsCount: response.CommentsCount || response.commentsCount || 0,
        sharesCount: response.SharesCount || response.sharesCount || 0,
        viewsCount: response.ViewsCount || response.viewsCount || 0,
        isLiked: response.IsLikedByCurrentUser || response.isLiked || false,
        isShared: false,
        createdAt: response.CreatedAt || response.createdAt,
        updatedAt: response.UpdatedAt || response.updatedAt
      };
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
    hashtag?: string;
    location?: string;
  }): Promise<{ posts: Post[]; totalCount: number; hasMore: boolean }> {
    try {
      // If userId is provided, get user posts, otherwise get feed
      const endpoint = filters?.userId ? `/api/posts/user/${filters.userId}` : '/api/posts/feed';
      
      // Convert frontend parameters to backend format
      const params: any = {};
      if (filters?.page) params.Page = filters.page;
      if (filters?.limit) params.PageSize = filters.limit;
      if (filters?.hashtag) params.Hashtag = filters.hashtag;
      if (filters?.location) params.Location = filters.location;
      
      const response = await this.get<{ posts: Post[]; totalCount: number; hasNextPage: boolean }>(endpoint, params);
      
      // Convert backend response format to frontend format
      return {
        posts: response.posts || [],
        totalCount: response.totalCount || 0,
        hasMore: response.hasNextPage || false
      };
    } catch (error) {
      console.error('Failed to get posts:', error);
      throw error;
    }
  }

  async getPost(postId: string): Promise<Post> {
    try {
      const response = await this.get<Post>(`/api/posts/${postId}`);
      return response;
    } catch (error) {
      console.error('Failed to get post:', error);
      throw error;
    }
  }

  async updatePost(postId: string, updates: Partial<Post>): Promise<Post> {
    try {
      const response = await this.put<Post>(`/api/posts/${postId}`, updates);
      return response;
    } catch (error) {
      console.error('Failed to update post:', error);
      throw error;
    }
  }

  async deletePost(postId: string): Promise<void> {
    try {
      await this.delete(`/api/posts/${postId}`);
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
      const response = await this.upload<PostMedia[]>(`/api/posts/${postId}/media`, formData);
      return response;
    } catch (error) {
      console.error('Failed to upload post media:', error);
      throw error;
    }
  }

  // Comment Methods
  async createComment(postId: string, content: string, parentCommentId?: string): Promise<Comment> {
    try {
      const response = await this.post<Comment>(`/api/posts/${postId}/comments`, {
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
      const response = await this.get<{ comments: Comment[]; totalCount: number; hasMore: boolean }>(`/api/posts/${postId}/comments`, { page, limit });
      return response;
    } catch (error) {
      console.error('Failed to get comments:', error);
      throw error;
    }
  }

  // Group Methods
  async createGroup(groupData: Partial<Group>): Promise<Group> {
    try {
      const response = await this.post<Group>('/api/groups', groupData);
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
      // Call the Groups service public groups endpoint
      const response = await groupsApi.get<{ groups: Group[]; totalCount: number; hasMore: boolean }>('/api/groups/public', { 
        params: { 
          page: filters?.page || 1, 
          pageSize: filters?.limit || 50 
        } 
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get groups:', error);
      // Return empty groups as fallback
      return { groups: [], totalCount: 0, hasMore: false };
    }
  }

  async getGroup(groupId: string): Promise<Group> {
    try {
      // Call the Groups service instead of Social service
      const response = await groupsApi.get<Group>(`/api/groups/${groupId}`);
      return response.data;
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
      await this.post(`/api/posts/${postId}/like`);
    } catch (error) {
      console.error('Failed to like post:', error);
      throw error;
    }
  }

  async unlikePost(postId: string): Promise<void> {
    try {
      await this.delete(`/api/posts/${postId}/like`);
    } catch (error) {
      console.error('Failed to unlike post:', error);
      throw error;
    }
  }

  async sharePost(postId: string, shareData: Partial<Share>): Promise<Share> {
    try {
      const response = await this.post<Share>(`/api/posts/${postId}/share`, shareData);
      return response;
    } catch (error) {
      console.error('Failed to share post:', error);
      throw error;
    }
  }

  async followUser(userId: string): Promise<void> {
    try {
      await this.post(`/api/follows/follow/${userId}`);
    } catch (error) {
      console.error('Failed to follow user:', error);
      throw error;
    }
  }

  async unfollowUser(userId: string): Promise<void> {
    try {
      await this.post(`/api/follows/unfollow/${userId}`);
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      throw error;
    }
  }

  async getFollowers(userId: string, page?: number, limit?: number): Promise<{ followers: Follow[]; totalCount: number; hasMore: boolean }> {
    try {
      const response = await this.get<{ followers: Follow[]; totalCount: number; hasMore: boolean }>(`/api/follows/user/${userId}/followers`, { page, limit });
      return response;
    } catch (error) {
      console.error('Failed to get followers:', error);
      // Return empty followers as fallback
      return { followers: [], totalCount: 0, hasMore: false };
    }
  }

  async getFollowing(userId: string, page?: number, limit?: number): Promise<{ following: Follow[]; totalCount: number; hasMore: boolean }> {
    try {
      const response = await this.get<{ following: Follow[]; totalCount: number; hasMore: boolean }>(`/api/follows/user/${userId}/following`, { page, limit });
      return response;
    } catch (error) {
      console.error('Failed to get following:', error);
      // Return empty following as fallback
      return { following: [], totalCount: 0, hasMore: false };
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
      const response = await this.post<UserProfile>('/api/users', userData);
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
      const response = await this.get<SearchResult>('/api/search', filters);
      return response;
    } catch (error) {
      console.error('Failed to search:', error);
      throw error;
    }
  }

  async getTrendingTopics(): Promise<string[]> {
    try {
      const response = await this.get<string[]>('/api/trending/topics');
      return response;
    } catch (error) {
      console.error('Failed to get trending topics:', error);
      // Return empty array as fallback
      return [];
    }
  }

  async getRecommendedUsers(): Promise<UserProfile[]> {
    try {
      const response = await this.get<UserProfile[]>('/api/trending/recommendations/users');
      return response;
    } catch (error) {
      console.error('Failed to get recommended users:', error);
      // Return empty array as fallback
      return [];
    }
  }

  async getRecommendedGroups(): Promise<Group[]> {
    try {
      // TODO: Implement recommendations endpoint in backend
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to get recommended groups:', error);
      return [];
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
      const response = await this.post<UserProfile>('/api/users/kid-accounts', kidData);
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

  // Blockchain Integration - Disabled for now
  // async createBlockchainPost(postId: string, blockchainData: {
  //   network: 'hashgraph' | 'ethereum' | 'polygon';
  //   metadata: any;
  // }): Promise<{ transactionHash: string; blockchainUrl: string }> {
  //   try {
  //     const response = await this.post<{ transactionHash: string; blockchainUrl: string }>(`/posts/${postId}/blockchain`, blockchainData);
  //     return response;
  //   } catch (error) {
  //     console.error('Failed to create blockchain post:', error);
  //     throw error;
  //   }
  // }

  // async getBlockchainPosts(userId: string): Promise<Post[]> {
  //   try {
  //     const response = await this.get<Post[]>(`/users/${userId}/blockchain-posts`);
  //     return response;
  //   } catch (error) {
  //     console.error('Failed to get blockchain posts:', error);
  //     throw error;
  //   }
  // }
}

export const socialService = new SocialService();

