import { BaseApiService, socialApi, officerApi, groupsApi } from './api.service';

// User Profile Interfaces
export interface KidAccount {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  status: string;
  independenceDate?: string;
  isIndependent: boolean;
  profilePictureUrl?: string;
  createdAt: string;
  parentUserId: string;
  parentFullName: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatar?: string;
  profilePictureUrl?: string;
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
  linkedUser?: UserBasicInfo | null;
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
  postType: 'text' | 'image' | 'video' | 'link' | 'poll';
  visibility: 'public' | 'friends' | 'group' | 'private';
  groupId?: string;
  location?: PostLocation;
  tags?: string[];
  hashtags?: string[];
  mentions?: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  repostsCount?: number;
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
  
  // Poll fields
  pollOptions?: string[];
  pollDuration?: number;
  pollExpiresAt?: string;
}

export interface PollOptionResult {
  option: string;
  voteCount: number;
  percentage: number;
}

export interface PollResults {
  totalVotes: number;
  results: PollOptionResult[];
  isExpired: boolean;
  userVotedOptionIndex?: number;
  expiresAt?: string;
}

// MongoDB API Response Interfaces
export interface MongoPostResponse {
  id: string;
  userId: string;
  content: string;
  postType: string;
  mediaUrls: string[];
  hashtags: string[];
  mentions: string[];
  location?: string;
  isPublic: boolean;
  isPinned: boolean;
  pollOptions?: string[];
  pollDuration?: number;
  pollExpiresAt?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  repostsCount?: number; // NEW
  viewsCount: number;
  feedScore: number;
  createdAt: string;
  updatedAt: string;
  userProfile?: {
    userId: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
    isVerified: boolean;
    isActive: boolean;
    lastUpdated: string;
  };
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
  author?: UserBasicInfo; // Changed from authorProfile to author to match MongoDB response
  content: string;
  parentCommentId?: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[]; // Added for nested comments
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
  follower?: UserBasicInfo;
  following?: UserBasicInfo;
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

  // Helper method to extract username from email
  private extractUsernameFromEmail(emailOrUsername: string): string {
    if (!emailOrUsername) return 'unknown';
    
    // If it's already a username (doesn't contain @), return as is
    if (!emailOrUsername.includes('@')) {
      return emailOrUsername;
    }
    
    // Extract username from email (part before @)
    const username = emailOrUsername.split('@')[0];
    
    // Convert to proper username format (e.g., "charlie.kirk" from "charlie@innkt.com")
    // For now, just return the part before @, but we could enhance this logic
    return username;
  }

  // Helper method to map Officer service response to UserProfile
  private mapOfficerResponseToUserProfile(officerData: any): UserProfile {
    // Convert relative URLs to absolute URLs
    const getAbsoluteUrl = (url: string | undefined): string | undefined => {
      if (!url) return undefined;
      if (url.startsWith('http')) return url; // Already absolute
      if (url.startsWith('/')) return `http://localhost:5001${url}`; // Prepend base URL
      return url;
    };

    return {
      id: officerData.id,
      username: officerData.username || this.extractUsernameFromEmail(officerData.email), // Use actual username or extract from email
      displayName: officerData.fullName || `${officerData.firstName || ''} ${officerData.lastName || ''}`.trim() || officerData.email,
      email: officerData.email,
      firstName: officerData.firstName,
      lastName: officerData.lastName,
      fullName: officerData.fullName,
      avatar: getAbsoluteUrl(officerData.profilePictureUrl),
      profilePictureUrl: getAbsoluteUrl(officerData.profilePictureUrl),
      bio: officerData.bio,
      location: officerData.location,
      website: officerData.website,
      dateOfBirth: officerData.dateOfBirth,
      isVerified: officerData.isVerified || false,
      isKidAccount: officerData.isKidAccount || false,
      parentId: officerData.parentId,
      independenceDate: officerData.independenceDate,
      followersCount: officerData.followersCount || 0,
      followingCount: officerData.followingCount || 0,
      postsCount: officerData.postsCount || 0,
      createdAt: officerData.createdAt,
      updatedAt: officerData.updatedAt,
      preferences: officerData.preferences || {
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
          pushNotifications: true
        },
        theme: 'light',
        language: 'en',
        timezone: 'UTC'
      },
      socialLinks: officerData.socialLinks || {
        twitter: null,
        instagram: null,
        linkedIn: null,
        facebook: null,
        youTube: null
      },
      parentalControls: officerData.parentalControls,
      linkedUser: officerData.linkedUser
    };
  }

  // User Profile Methods
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      // Get user profile from Officer service (primary source)
      const response = await officerApi.get<any>(`/api/User/${userId}`);
      return this.mapOfficerResponseToUserProfile(response.data);
    } catch (error) {
      console.error('Failed to get user profile from Officer service:', error);
      
      // If Officer service fails, return a minimal profile with the provided userId
      // Extract username from userId if it's in the format "username-uuid-..."
      let username = 'unknown-user';
      let displayName = 'Unknown User';
      
      if (userId.includes('-uuid-')) {
        // Extract username from format like "alice.johnson-uuid-1234-5678-9abc-def012345681"
        username = userId.split('-uuid-')[0];
        displayName = username.split('.').map(part => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ');
      }
      
      return {
        id: userId,
        username: username,
        displayName: displayName,
        email: `${username}@example.com`,
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

  // Get current user profile (logged-in user)
  async getCurrentUserProfile(): Promise<UserProfile> {
    try {
      // Try to get current user from Officer service
      const response = await officerApi.get<any>('/api/auth/me');
      return this.mapOfficerResponseToUserProfile(response.data);
    } catch (error) {
      console.error('Failed to get current user profile from Officer service:', error);
      throw error;
    }
  }

  async uploadAvatar(userId: string, file: File): Promise<{ avatarUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await officerApi.post<{ avatarUrl: string }>(`/api/User/${userId}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw error;
    }
  }

  // Post Methods
  async createPost(postData: any): Promise<Post> {
    try {
      const response = await this.post<MongoPostResponse>('/api/v2/mongoposts', postData);
      
      // Convert backend response to frontend Post format
      return {
        id: response.id,
        userId: response.userId,
        content: response.content,
        postType: response.postType as 'text' | 'image' | 'video' | 'link' | 'poll',
        visibility: (response.isPublic ? 'public' : 'private') as 'public' | 'private',
        mediaUrls: response.mediaUrls || [],
        hashtags: response.hashtags || [],
        mentions: response.mentions || [],
        tags: response.hashtags || [],
        location: response.location ? { name: response.location, coordinates: undefined } : undefined,
        isPublic: response.isPublic,
        isPinned: response.isPinned,
        likesCount: response.likesCount,
        commentsCount: response.commentsCount,
        sharesCount: response.sharesCount,
        viewsCount: response.viewsCount,
        isLiked: false, // TODO: Implement like status from MongoDB
        isShared: false,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        
        // Poll fields
        pollOptions: response.pollOptions,
        pollDuration: response.pollDuration,
        pollExpiresAt: response.pollExpiresAt,
        
        // Use cached user profile from MongoDB - simplified for now
        authorProfile: undefined // TODO: Fix UserProfile interface mismatch
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
      // Use MongoDB API for better performance with cached user profiles
      const endpoint = filters?.userId ? `/api/v2/mongoposts/user/${filters.userId}` : '/api/v2/mongoposts/feed';
      
      // Convert frontend parameters to backend format
      const params: any = {};
      if (filters?.page) params.Page = filters.page;
      if (filters?.limit) params.PageSize = filters.limit;
      if (filters?.hashtag) params.Hashtag = filters.hashtag;
      if (filters?.location) params.Location = filters.location;
      
      const response = await this.get<{ posts: MongoPostResponse[]; page: number; pageSize: number; hasMore: boolean; totalCachedProfiles: number }>(endpoint, params);
      
      // MongoDB API returns posts with cached user profiles - NO N+1 queries needed!
      const postsWithProfiles = (response.posts || []).map((post) => {
        return {
          // Convert MongoDB response to frontend format
          id: post.id,
          userId: post.userId,
          content: post.content,
          postType: post.postType as 'text' | 'image' | 'video' | 'link' | 'poll',
          visibility: (post.isPublic ? 'public' : 'private') as 'public' | 'private',
          mediaUrls: post.mediaUrls || [],
          hashtags: post.hashtags || [],
          mentions: post.mentions || [],
          tags: post.hashtags || [],
          location: post.location ? { name: post.location, coordinates: undefined } : undefined,
          isPublic: post.isPublic,
          isPinned: post.isPinned,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          sharesCount: post.sharesCount,
          repostsCount: post.repostsCount || 0,
          viewsCount: post.viewsCount,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          isLiked: false, // TODO: Implement like status from MongoDB
          isShared: false, // Default value
          // Poll fields
          pollOptions: post.pollOptions,
          pollDuration: post.pollDuration,
          pollExpiresAt: post.pollExpiresAt,
          // Use cached user profile from MongoDB for both author and authorProfile
          authorProfile: post.userProfile ? {
            id: post.userProfile.userId,
            username: post.userProfile.username,
            displayName: post.userProfile.displayName,
            email: '', // Not available in cached profile
            firstName: post.userProfile.displayName.split(' ')[0] || '',
            lastName: post.userProfile.displayName.split(' ').slice(1).join(' ') || '',
            fullName: post.userProfile.displayName,
            avatar: this.convertToFullAvatarUrl(post.userProfile.avatarUrl),
            profilePictureUrl: this.convertToFullAvatarUrl(post.userProfile.avatarUrl),
            bio: '',
            location: '',
            website: '',
            dateOfBirth: '',
            isVerified: post.userProfile.isVerified,
            isKidAccount: false,
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            createdAt: '',
            updatedAt: post.userProfile.lastUpdated || '',
            preferences: {} as any,
            socialLinks: {} as any,
            linkedUser: null
          } : undefined,
          author: post.userProfile ? {
            id: post.userProfile.userId,
            username: post.userProfile.username,
            displayName: post.userProfile.displayName,
            avatarUrl: this.convertToFullAvatarUrl(post.userProfile.avatarUrl),
            isVerified: post.userProfile.isVerified,
            isKidAccount: false // MongoDB doesn't track this, default to false
          } : {
            id: post.userId,
            username: 'Unknown',
            displayName: 'Unknown User',
            avatarUrl: undefined,
            isVerified: false,
            isKidAccount: false
          }
        };
      });

      console.log(`🚀 MongoDB Feed Performance: ${response.totalCachedProfiles} cached profiles, ${response.posts?.length} posts loaded with ZERO N+1 queries!`);

      return {
        posts: postsWithProfiles,
        totalCount: response.posts?.length || 0,
        hasMore: response.hasMore || false
      };
    } catch (error) {
      console.error('Failed to get posts:', error);
      throw error;
    }
  }

  async getPost(postId: string): Promise<Post> {
    try {
      const response = await this.get<MongoPostResponse>(`/api/v2/mongoposts/${postId}`);
      // Convert MongoDB response to frontend Post format
      return {
        id: response.id,
        userId: response.userId,
        content: response.content,
        postType: response.postType as 'text' | 'image' | 'video' | 'link' | 'poll',
        visibility: (response.isPublic ? 'public' : 'private') as 'public' | 'private',
        mediaUrls: response.mediaUrls || [],
        hashtags: response.hashtags || [],
        mentions: response.mentions || [],
        tags: response.hashtags || [],
        location: response.location ? { name: response.location, coordinates: undefined } : undefined,
        isPublic: response.isPublic,
        isPinned: response.isPinned,
        likesCount: response.likesCount,
        commentsCount: response.commentsCount,
        sharesCount: response.sharesCount,
        viewsCount: response.viewsCount,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        isLiked: false, // TODO: Implement like status from MongoDB
        isShared: false,
        pollOptions: response.pollOptions,
        pollDuration: response.pollDuration,
        pollExpiresAt: response.pollExpiresAt,
        authorProfile: undefined, // TODO: Fix UserProfile interface mismatch
        author: response.userProfile ? {
          id: response.userProfile.userId,
          username: response.userProfile.username,
          displayName: response.userProfile.displayName,
          avatarUrl: response.userProfile.avatarUrl,
          isVerified: response.userProfile.isVerified,
          isKidAccount: false
        } : {
          id: response.userId,
          username: 'Unknown',
          displayName: 'Unknown User',
          avatarUrl: undefined,
          isVerified: false,
          isKidAccount: false
        }
      };
    } catch (error) {
      console.error('Failed to get post:', error);
      throw error;
    }
  }

  async updatePost(postId: string, updates: Partial<Post>): Promise<Post> {
    try {
      const response = await this.put<MongoPostResponse>(`/api/v2/mongoposts/${postId}`, updates);
      // Convert MongoDB response to frontend Post format (same as getPost)
      return {
        id: response.id,
        userId: response.userId,
        content: response.content,
        postType: response.postType as 'text' | 'image' | 'video' | 'link' | 'poll',
        visibility: (response.isPublic ? 'public' : 'private') as 'public' | 'private',
        mediaUrls: response.mediaUrls || [],
        hashtags: response.hashtags || [],
        mentions: response.mentions || [],
        tags: response.hashtags || [],
        location: response.location ? { name: response.location, coordinates: undefined } : undefined,
        isPublic: response.isPublic,
        isPinned: response.isPinned,
        likesCount: response.likesCount,
        commentsCount: response.commentsCount,
        sharesCount: response.sharesCount,
        viewsCount: response.viewsCount,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        isLiked: false,
        isShared: false,
        pollOptions: response.pollOptions,
        pollDuration: response.pollDuration,
        pollExpiresAt: response.pollExpiresAt,
        authorProfile: undefined,
        author: response.userProfile ? {
          id: response.userProfile.userId,
          username: response.userProfile.username,
          displayName: response.userProfile.displayName,
          avatarUrl: response.userProfile.avatarUrl,
          isVerified: response.userProfile.isVerified,
          isKidAccount: false
        } : {
          id: response.userId,
          username: 'Unknown',
          displayName: 'Unknown User',
          avatarUrl: undefined,
          isVerified: false,
          isKidAccount: false
        }
      };
    } catch (error) {
      console.error('Failed to update post:', error);
      throw error;
    }
  }

  async deletePost(postId: string): Promise<void> {
    try {
      await this.delete(`/api/v2/mongoposts/${postId}`);
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
      const response = await this.upload<PostMedia[]>(`/api/v2/mongoposts/${postId}/media`, formData);
      return response;
    } catch (error) {
      console.error('Failed to upload post media:', error);
      throw error;
    }
  }

  // Comment Methods
  async createComment(postId: string, content: string, parentCommentId?: string): Promise<Comment> {
    try {
      const response = await this.post<Comment>(`/api/mongo/comments/post/${postId}`, {
        content,
        parentCommentId
      });
      return response;
    } catch (error) {
      console.error('Failed to create comment:', error);
      throw error;
    }
  }

  // Poll Methods
  async voteOnPoll(postId: string, selectedOption: string, optionIndex: number): Promise<void> {
    try {
      await this.post(`/api/v2/mongoposts/${postId}/vote`, {
        selectedOption,
        optionIndex
      });
    } catch (error) {
      console.error('Failed to vote on poll:', error);
      throw error;
    }
  }

  async getPollResults(postId: string): Promise<PollResults> {
    try {
      const response = await this.get<PollResults>(`/api/v2/mongoposts/${postId}/poll-results`);
      return response;
    } catch (error) {
      console.error('Failed to get poll results:', error);
      throw error;
    }
  }

  async getComments(postId: string, page?: number, limit?: number): Promise<{ comments: Comment[]; totalCount: number; hasMore: boolean }> {
    try {
      console.log('🔍 SocialService: Getting comments for post:', postId, 'page:', page, 'limit:', limit);
      console.log('🔍 SocialService: API base URL:', this.api.defaults.baseURL);
      console.log('🔍 SocialService: Full URL:', `${this.api.defaults.baseURL}/api/mongo/comments/post/${postId}`);
      
      const response = await this.get<{ comments: Comment[]; totalCount: number; hasMore: boolean }>(`/api/mongo/comments/post/${postId}`, { page, limit });
      console.log('🔍 SocialService: Response received:', response);
      return response;
    } catch (error: any) {
      console.error('❌ SocialService: Failed to get comments:', error);
      console.error('❌ SocialService: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  }

  async getNestedComments(parentCommentId: string, page?: number, limit?: number): Promise<{ comments: Comment[]; totalCount: number; hasMore: boolean }> {
    try {
      console.log('🔍 SocialService: Getting nested comments for parent:', parentCommentId, 'page:', page, 'limit:', limit);
      
      const response = await this.get<{ comments: Comment[]; totalCount: number; hasMore: boolean }>(`/api/mongo/comments/parent/${parentCommentId}`, { page, limit });
      console.log('🔍 SocialService: Nested comments response received:', response);
      return response;
    } catch (error: any) {
      console.error('❌ SocialService: Failed to get nested comments:', error);
      console.error('❌ SocialService: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  }

  async getNestedCommentsCount(parentCommentId: string): Promise<number> {
    try {
      console.log('🔍 SocialService: Getting nested comments count for parent:', parentCommentId);
      
      const response = await this.get<number>(`/api/mongo/comments/parent/${parentCommentId}/count`);
      console.log('🔍 SocialService: Nested comments count response received:', response);
      return response;
    } catch (error: any) {
      console.error('❌ SocialService: Failed to get nested comments count:', error);
      console.error('❌ SocialService: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      return 0; // Return 0 on error to prevent UI issues
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
      await this.post(`/api/v2/mongoposts/${postId}/like`);
    } catch (error) {
      console.error('Failed to like post:', error);
      throw error;
    }
  }

  async unlikePost(postId: string): Promise<void> {
    try {
      await this.delete(`/api/v2/mongoposts/${postId}/unlike`);
    } catch (error) {
      console.error('Failed to unlike post:', error);
      throw error;
    }
  }

  async sharePost(postId: string, shareData: Partial<Share>): Promise<Share> {
    try {
      const response = await this.post<Share>(`/api/v2/mongoposts/${postId}/share`, shareData);
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

  async reportUser(userId: string, reportData: { reason: string; description?: string }): Promise<void> {
    try {
      await this.post(`/api/follows/report/${userId}`, reportData);
    } catch (error) {
      console.error('Failed to report user:', error);
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
      const response = await this.get(`/api/users/${userId}/wallet`);
      return response;
    } catch (error) {
      console.error('Failed to get wallet info:', error);
      throw error;
    }
  }

  async connectWallet(userId: string, network: string): Promise<any> {
    try {
      const response = await this.post(`/api/users/${userId}/wallet/connect`, { network });
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
      const response = await officerApi.put<UserProfile>(`/api/User/${userId}`, profileData);
      return response.data;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }

  // Kid Accounts
  async getKidAccounts(): Promise<KidAccount[]> {
    try {
      const response = await officerApi.get<KidAccount[]>('/api/KidAccount/parent-accounts');
      return response.data;
    } catch (error) {
      console.error('Failed to get kid accounts:', error);
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

  /**
   * Convert relative avatar URLs to full URLs pointing to Officer service
   */
  private convertToFullAvatarUrl(avatarUrl?: string): string | undefined {
    if (!avatarUrl) {
      return undefined;
    }

    // If it's already a full URL, return as-is
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
      return avatarUrl;
    }

    // If it's a relative path, convert to full Officer service URL
    if (avatarUrl.startsWith('/')) {
      const officerBaseUrl = 'http://localhost:5001'; // TODO: Get from config
      const fullUrl = `${officerBaseUrl}${avatarUrl}`;
      
      console.log(`🔗 Converting avatar URL: ${avatarUrl} → ${fullUrl}`);
      return fullUrl;
    }

    // Return as-is if it doesn't match expected patterns
    return avatarUrl;
  }
}

export const socialService = new SocialService();

