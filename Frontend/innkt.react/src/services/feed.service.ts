import { socialService, Post } from './social.service';
import { repostService, Repost } from './repost.service';

export interface FeedItem {
  type: 'post' | 'repost';
  id: string;
  createdAt: string;
  feedScore: number;
  post?: Post;
  repost?: Repost;
}

export interface FeedResponse {
  items: FeedItem[];
  totalCount: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

export class FeedService {
  
  /**
   * Get unified feed with both posts and reposts
   */
  async getUnifiedFeed(options: {
    groupId?: string;
    userId?: string;
    page?: number;
    limit?: number;
    includeReposts?: boolean;
  } = {}): Promise<FeedResponse> {
    try {
      const {
        groupId,
        userId,
        page = 1,
        limit = 20,
        includeReposts = true
      } = options;

      console.log('🚀 Loading unified feed:', { page, limit, includeReposts });

      // Load posts and reposts in parallel
      const [postsResponse, repostsResponse] = await Promise.all([
        socialService.getPosts({ groupId, userId, page, limit }),
        includeReposts ? repostService.getRepostsForFeed(page, Math.ceil(limit / 2)) : Promise.resolve({ reposts: [], hasMore: false })
      ]);

      // Convert posts to feed items
      const postItems: FeedItem[] = (postsResponse.posts || []).map(post => ({
        type: 'post' as const,
        id: `post-${post.id}`,
        createdAt: post.createdAt,
        feedScore: this.calculatePostFeedScore(post),
        post
      }));

      // Convert reposts to feed items
      const repostItems: FeedItem[] = (repostsResponse.reposts || []).map(repost => ({
        type: 'repost' as const,
        id: `repost-${repost.repostId}`,
        createdAt: repost.createdAt,
        feedScore: repost.feedScore,
        repost
      }));

      // Combine and sort by feed score and recency
      const allItems = [...postItems, ...repostItems];
      const sortedItems = allItems.sort((a, b) => {
        // Primary sort: feed score (higher is better)
        if (Math.abs(a.feedScore - b.feedScore) > 0.1) {
          return b.feedScore - a.feedScore;
        }
        // Secondary sort: recency (newer is better)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Take only the requested limit
      const limitedItems = sortedItems.slice(0, limit);

      console.log(`📚 Unified feed loaded: ${postItems.length} posts + ${repostItems.length} reposts = ${limitedItems.length} items`);

      return {
        items: limitedItems,
        totalCount: allItems.length,
        hasMore: postsResponse.hasMore || repostsResponse.hasMore,
        page,
        pageSize: limit
      };
    } catch (error) {
      console.error('❌ Failed to load unified feed:', error);
      throw error;
    }
  }

  /**
   * Calculate feed score for posts (consistent with backend algorithm)
   */
  private calculatePostFeedScore(post: Post): number {
    const now = new Date();
    const createdAt = new Date(post.createdAt);
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    const engagementScore = 
      (post.likesCount * 1.0) + 
      (post.commentsCount * 2.0) + 
      (post.sharesCount * 1.5) + 
      ((post.repostsCount || 0) * 3.0); // Reposts are highly valuable
    
    const recencyScore = Math.max(0, 100 - hoursSinceCreation); // Decay over time
    
    return engagementScore + recencyScore;
  }

  /**
   * Get only posts (no reposts) - for backward compatibility
   */
  async getPostsOnly(options: {
    groupId?: string;
    userId?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ posts: Post[]; hasMore: boolean }> {
    return await socialService.getPosts(options);
  }

  /**
   * Get only reposts - for reposts tab in profile
   */
  async getRepostsOnly(userId?: string, page: number = 1, limit: number = 20): Promise<{ reposts: Repost[]; hasMore: boolean }> {
    try {
      if (userId) {
        const response = await repostService.getUserReposts(userId, page, limit);
        return {
          reposts: response.reposts,
          hasMore: response.hasMore
        };
      } else {
        const response = await repostService.getRepostsForFeed(page, limit);
        return {
          reposts: response.reposts,
          hasMore: response.hasMore
        };
      }
    } catch (error) {
      console.error('❌ Failed to load reposts:', error);
      return { reposts: [], hasMore: false };
    }
  }

  /**
   * Create a repost with smart type detection
   */
  async createSmartRepost(postId: string, quoteText?: string): Promise<any> {
    try {
      const repostType: 'simple' | 'quote' = quoteText && quoteText.trim() ? 'quote' : 'simple';
      
      const request = {
        originalPostId: postId,
        repostType,
        quoteText: repostType === 'quote' ? quoteText : undefined,
        visibility: 'public' as const
      };

      console.log(`🔄 Creating ${repostType} repost for post ${postId}`);
      
      const response = await repostService.createQuickRepost(postId, request);
      
      console.log(`✅ ${repostType} repost created successfully:`, response);
      return response;
    } catch (error) {
      console.error('❌ Failed to create smart repost:', error);
      throw error;
    }
  }

  /**
   * Check if user can repost a post
   */
  async canUserRepost(postId: string): Promise<boolean> {
    try {
      const response = await repostService.canRepost(postId);
      return response.canRepost;
    } catch (error) {
      console.error('❌ Failed to check repost eligibility:', error);
      return false;
    }
  }

  /**
   * Delete a repost
   */
  async deleteRepost(repostId: string): Promise<boolean> {
    try {
      await repostService.deleteRepost(repostId);
      console.log('✅ Repost deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to delete repost:', error);
      return false;
    }
  }
}

// Export singleton instance
export const feedService = new FeedService();
