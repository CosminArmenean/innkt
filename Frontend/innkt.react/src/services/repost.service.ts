import { BaseApiService, socialApi } from './api.service';

// Repost Interfaces
export interface Repost {
  id: string;
  repostId: string;
  userId: string;
  originalPostId: string;
  repostType: 'simple' | 'quote';
  quoteText?: string;
  visibility: 'public' | 'friends' | 'private';
  createdAt: string;
  updatedAt: string;
  
  // Cached user data
  userSnapshot?: {
    userId: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
    isVerified: boolean;
    isActive: boolean;
    lastUpdated: string;
  };
  
  // Cached original post data
  originalPostSnapshot?: {
    postId: string;
    content: string;
    postType: string;
    mediaUrls: string[];
    authorId: string;
    authorSnapshot?: {
      userId: string;
      displayName: string;
      username: string;
      avatarUrl?: string;
      isVerified: boolean;
    };
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    repostsCount: number;
    viewsCount: number;
    createdAt: string;
    feedScore: number;
    // Poll properties
    pollOptions?: string[];
    pollDuration?: number;
    pollExpiresAt?: string;
  };
  
  // Engagement metrics
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  feedScore: number;
  
  // Metadata
  repostChainLength: number;
  originalAuthorId: string;
  isApproved: boolean;
  isActive: boolean;
  isDeleted: boolean;
}

export interface CreateRepostRequest {
  originalPostId: string;
  repostType: 'simple' | 'quote';
  quoteText?: string;
  visibility?: 'public' | 'friends' | 'private';
  tags?: string[];
}

export interface CreateRepostResponse {
  repost: Repost;
  updatedOriginalPost?: any;
  analytics?: any;
  message: string;
}

export interface RepostListResponse {
  reposts: Repost[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CanRepostResponse {
  canRepost: boolean;
  hasAlreadyReposted: boolean;
  repostCountLastHour: number;
  maxRepostsPerHour: number;
  reason: string;
}

export interface UpdateRepostRequest {
  quoteText: string;
  tags?: string[];
}

export class RepostService extends BaseApiService {
  constructor() {
    super(socialApi);
  }

  // Core repost operations
  async createRepost(request: CreateRepostRequest): Promise<CreateRepostResponse> {
    try {
      console.log('🔄 Creating repost:', request);
      const response = await this.post<CreateRepostResponse>('/api/v2/reposts', request);
      console.log('✅ Repost created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to create repost:', error);
      throw error;
    }
  }

  async createQuickRepost(postId: string, request: CreateRepostRequest): Promise<CreateRepostResponse> {
    try {
      console.log('🚀 Creating quick repost for post:', postId);
      const response = await this.post<CreateRepostResponse>(`/api/v2/mongoposts/${postId}/repost`, request);
      console.log('✅ Quick repost created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to create quick repost:', error);
      throw error;
    }
  }

  async getRepost(repostId: string): Promise<Repost> {
    try {
      const response = await this.get<Repost>(`/api/v2/reposts/${repostId}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get repost:', error);
      throw error;
    }
  }

  async deleteRepost(repostId: string): Promise<{ message: string }> {
    try {
      console.log('🗑️ Deleting repost:', repostId);
      const response = await this.delete<{ message: string }>(`/api/v2/reposts/${repostId}`);
      console.log('✅ Repost deleted successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to delete repost:', error);
      throw error;
    }
  }

  async updateQuoteText(repostId: string, request: UpdateRepostRequest): Promise<{ message: string }> {
    try {
      console.log('✏️ Updating quote text for repost:', repostId);
      const response = await this.put<{ message: string }>(`/api/v2/reposts/${repostId}/quote`, request);
      console.log('✅ Quote text updated successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to update quote text:', error);
      throw error;
    }
  }

  // Repost queries
  async getUserReposts(userId: string, page: number = 1, pageSize: number = 20, type: 'all' | 'simple' | 'quote' = 'all'): Promise<RepostListResponse> {
    try {
      const response = await this.get<RepostListResponse>(`/api/v2/reposts/user/${userId}`, { page, pageSize, type });
      console.log(`📚 Loaded ${response.reposts.length} reposts for user ${userId}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get user reposts:', error);
      throw error;
    }
  }

  async getPostReposts(postId: string, page: number = 1, pageSize: number = 20): Promise<RepostListResponse> {
    try {
      const response = await this.get<RepostListResponse>(`/api/v2/mongoposts/${postId}/reposts`, { page, pageSize });
      console.log(`📊 Loaded ${response.reposts.length} reposts for post ${postId}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get post reposts:', error);
      throw error;
    }
  }

  async getRepostsForFeed(page: number = 1, pageSize: number = 20): Promise<RepostListResponse> {
    try {
      const response = await this.get<RepostListResponse>('/api/v2/reposts/feed', { page, pageSize });
      console.log(`🚀 Loaded ${response.reposts.length} reposts for feed`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get reposts for feed:', error);
      throw error;
    }
  }

  // Repost eligibility and status
  async canRepost(postId: string): Promise<CanRepostResponse> {
    try {
      const response = await this.get<CanRepostResponse>(`/api/v2/mongoposts/${postId}/can-repost`);
      return response;
    } catch (error) {
      console.error('❌ Failed to check repost eligibility:', error);
      throw error;
    }
  }

  // Repost engagement
  async likeRepost(repostId: string): Promise<{ message: string }> {
    try {
      console.log('❤️ Liking repost:', repostId);
      const response = await this.post<{ message: string }>(`/api/v2/reposts/${repostId}/like`, {});
      console.log('✅ Repost liked successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to like repost:', error);
      throw error;
    }
  }

  async unlikeRepost(repostId: string): Promise<{ message: string }> {
    try {
      console.log('💔 Unliking repost:', repostId);
      const response = await this.delete<{ message: string }>(`/api/v2/reposts/${repostId}/like`);
      console.log('✅ Repost unliked successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to unlike repost:', error);
      throw error;
    }
  }

  // Helper methods
  async hasUserReposted(postId: string): Promise<boolean> {
    try {
      const canRepostResponse = await this.canRepost(postId);
      return canRepostResponse.hasAlreadyReposted;
    } catch (error) {
      console.error('❌ Failed to check if user has reposted:', error);
      return false;
    }
  }

  // Utility methods
  getRepostDisplayText(repost: Repost): string {
    if (repost.repostType === 'quote' && repost.quoteText) {
      return repost.quoteText;
    }
    return `${repost.userSnapshot?.displayName || 'User'} reposted`;
  }

  getRepostIcon(repost: Repost): string {
    return repost.repostType === 'quote' ? '💬' : '🔄';
  }

  formatRepostDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

// Export singleton instance
export const repostService = new RepostService();
