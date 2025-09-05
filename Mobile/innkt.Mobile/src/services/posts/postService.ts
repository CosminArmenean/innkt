import {frontierApiClient} from '../api/apiClient';
import {API_ENDPOINTS, ERROR_MESSAGES} from '../../config/environment';
import {
  Post,
  PostCreateRequest,
  PostUpdateRequest,
  PostSearchRequest,
  PostSearchResponse,
  PostFeedRequest,
  PostFeedResponse,
  PostComment,
  PostCommentRequest,
  PostLikeRequest,
  PostShareRequest,
  PostAnalytics,
  PostCategory,
  MediaType,
  PostVisibility,
  FeedType,
  createEmptyPost,
  createEmptyPostComment,
} from '../../models/post';
import {AppUser} from '../../models/user';

// Post service interface
export interface IPostService {
  // Post CRUD operations
  createPost(postData: PostCreateRequest): Promise<Post>;
  getPost(postId: string): Promise<Post>;
  updatePost(postId: string, postData: PostUpdateRequest): Promise<Post>;
  deletePost(postId: string): Promise<void>;
  
  // Post feed and search
  getPostFeed(feedRequest: PostFeedRequest): Promise<PostFeedResponse>;
  searchPosts(searchRequest: PostSearchRequest): Promise<PostSearchResponse>;
  getUserPosts(userId: string, page: number, pageSize: number): Promise<PostFeedResponse>;
  
  // Post interactions
  likePost(postId: string): Promise<void>;
  unlikePost(postId: string): Promise<void>;
  addComment(postId: string, commentData: PostCommentRequest): Promise<PostComment>;
  deleteComment(commentId: string): Promise<void>;
  sharePost(postId: string, shareData: PostShareRequest): Promise<void>;
  bookmarkPost(postId: string): Promise<void>;
  unbookmarkPost(postId: string): Promise<void>;
  
  // Post analytics
  getPostAnalytics(postId: string): Promise<PostAnalytics>;
  
  // Media handling
  uploadMedia(file: File | Blob, mediaType: MediaType): Promise<string>;
  deleteMedia(mediaId: string): Promise<void>;
}

/**
 * Post service that integrates with backend for social media functionality
 * Handles posts, comments, likes, and social interactions
 */
export class PostService implements IPostService {
  /**
   * Create a new post
   */
  async createPost(postData: PostCreateRequest): Promise<Post> {
    try {
      // Handle media uploads first if any
      if (postData.media && postData.media.length > 0) {
        const uploadedMedia = await Promise.all(
          postData.media.map(async (mediaItem) => {
            const mediaUrl = await this.uploadMedia(mediaItem.file, mediaItem.mediaType);
            return {
              ...mediaItem,
              url: mediaUrl,
              file: undefined, // Remove file from request
            };
          })
        );
        
        postData.media = uploadedMedia;
      }

      const response = await frontierApiClient.post(API_ENDPOINTS.CREATE_POST, postData);

      if (!response.success || !response.data) {
        throw new Error(response.message || ERROR_MESSAGES.VALIDATION_ERROR);
      }

      return response.data as Post;
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  }

  /**
   * Get a specific post by ID
   */
  async getPost(postId: string): Promise<Post> {
    try {
      const response = await frontierApiClient.get(`${API_ENDPOINTS.POSTS}/${postId}`);

      if (!response.success || !response.data) {
        throw new Error(response.message || ERROR_MESSAGES.NOT_FOUND);
      }

      return response.data as Post;
    } catch (error) {
      console.error('Failed to get post:', error);
      throw error;
    }
  }

  /**
   * Update an existing post
   */
  async updatePost(postId: string, postData: PostUpdateRequest): Promise<Post> {
    try {
      // Handle media uploads for updates
      if (postData.media && postData.media.length > 0) {
        const uploadedMedia = await Promise.all(
          postData.media.map(async (mediaItem) => {
            const mediaUrl = await this.uploadMedia(mediaItem.file, mediaItem.mediaType);
            return {
              ...mediaItem,
              url: mediaUrl,
              file: undefined,
            };
          })
        );
        
        postData.media = uploadedMedia;
      }

      const response = await frontierApiClient.put(
        `${API_ENDPOINTS.UPDATE_POST.replace(':id', postId)}`,
        postData
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || ERROR_MESSAGES.VALIDATION_ERROR);
      }

      return response.data as Post;
    } catch (error) {
      console.error('Failed to update post:', error);
      throw error;
    }
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<void> {
    try {
      const response = await frontierApiClient.delete(
        `${API_ENDPOINTS.DELETE_POST.replace(':id', postId)}`
      );

      if (!response.success) {
        throw new Error(response.message || ERROR_MESSAGES.FORBIDDEN);
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      throw error;
    }
  }

  /**
   * Get post feed based on feed type and filters
   */
  async getPostFeed(feedRequest: PostFeedRequest): Promise<PostFeedResponse> {
    try {
      const response = await frontierApiClient.post('/api/posts/feed', feedRequest);

      if (!response.success || !response.data) {
        throw new Error(response.message || ERROR_MESSAGES.SERVER_ERROR);
      }

      return response.data as PostFeedResponse;
    } catch (error) {
      console.error('Failed to get post feed:', error);
      throw error;
    }
  }

  /**
   * Search posts with filters and pagination
   */
  async searchPosts(searchRequest: PostSearchRequest): Promise<PostSearchResponse> {
    try {
      const response = await frontierApiClient.post('/api/posts/search', searchRequest);

      if (!response.success || !response.data) {
        throw new Error(response.message || ERROR_MESSAGES.SERVER_ERROR);
      }

      return response.data as PostSearchResponse;
    } catch (error) {
      console.error('Failed to search posts:', error);
      throw error;
    }
  }

  /**
   * Get posts by a specific user
   */
  async getUserPosts(userId: string, page: number, pageSize: number): Promise<PostFeedResponse> {
    try {
      const response = await frontierApiClient.get(
        `/api/users/${userId}/posts?page=${page}&pageSize=${pageSize}`
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || ERROR_MESSAGES.NOT_FOUND);
      }

      return response.data as PostFeedResponse;
    } catch (error) {
      console.error('Failed to get user posts:', error);
      throw error;
    }
  }

  /**
   * Like a post
   */
  async likePost(postId: string): Promise<void> {
    try {
      const response = await frontierApiClient.post(
        `${API_ENDPOINTS.LIKE_POST.replace(':id', postId)}`
      );

      if (!response.success) {
        throw new Error(response.message || ERROR_MESSAGES.SERVER_ERROR);
      }
    } catch (error) {
      console.error('Failed to like post:', error);
      throw error;
    }
  }

  /**
   * Unlike a post
   */
  async unlikePost(postId: string): Promise<void> {
    try {
      const response = await frontierApiClient.delete(
        `${API_ENDPOINTS.UNLIKE_POST.replace(':id', postId)}`
      );

      if (!response.success) {
        throw new Error(response.message || ERROR_MESSAGES.SERVER_ERROR);
      }
    } catch (error) {
      console.error('Failed to unlike post:', error);
      throw error;
    }
  }

  /**
   * Add a comment to a post
   */
  async addComment(postId: string, commentData: PostCommentRequest): Promise<PostComment> {
    try {
      // Handle media uploads for comments
      if (commentData.media && commentData.media.length > 0) {
        const uploadedMedia = await Promise.all(
          commentData.media.map(async (mediaItem) => {
            const mediaUrl = await this.uploadMedia(mediaItem.file, mediaItem.mediaType);
            return {
              ...mediaItem,
              url: mediaUrl,
              file: undefined,
            };
          })
        );
        
        commentData.media = uploadedMedia;
      }

      const response = await frontierApiClient.post(
        `${API_ENDPOINTS.COMMENT_POST.replace(':id', postId)}`,
        commentData
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || ERROR_MESSAGES.VALIDATION_ERROR);
      }

      return response.data as PostComment;
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    try {
      const response = await frontierApiClient.delete(`/api/comments/${commentId}`);

      if (!response.success) {
        throw new Error(response.message || ERROR_MESSAGES.FORBIDDEN);
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      throw error;
    }
  }

  /**
   * Share a post
   */
  async sharePost(postId: string, shareData: PostShareRequest): Promise<void> {
    try {
      const response = await frontierApiClient.post(
        `${API_ENDPOINTS.POSTS}/${postId}/share`,
        shareData
      );

      if (!response.success) {
        throw new Error(response.message || ERROR_MESSAGES.SERVER_ERROR);
      }
    } catch (error) {
      console.error('Failed to share post:', error);
      throw error;
    }
  }

  /**
   * Bookmark a post
   */
  async bookmarkPost(postId: string): Promise<void> {
    try {
      const response = await frontierApiClient.post(`/api/posts/${postId}/bookmark`);

      if (!response.success) {
        throw new Error(response.message || ERROR_MESSAGES.SERVER_ERROR);
      }
    } catch (error) {
      console.error('Failed to bookmark post:', error);
      throw error;
    }
  }

  /**
   * Remove bookmark from a post
   */
  async unbookmarkPost(postId: string): Promise<void> {
    try {
      const response = await frontierApiClient.delete(`/api/posts/${postId}/bookmark`);

      if (!response.success) {
        throw new Error(response.message || ERROR_MESSAGES.SERVER_ERROR);
      }
    } catch (error) {
      console.error('Failed to unbookmark post:', error);
      throw error;
    }
  }

  /**
   * Get post analytics
   */
  async getPostAnalytics(postId: string): Promise<PostAnalytics> {
    try {
      const response = await frontierApiClient.get(`/api/posts/${postId}/analytics`);

      if (!response.success || !response.data) {
        throw new Error(response.message || ERROR_MESSAGES.NOT_FOUND);
      }

      return response.data as PostAnalytics;
    } catch (error) {
      console.error('Failed to get post analytics:', error);
      throw error;
    }
  }

  /**
   * Upload media file
   */
  async uploadMedia(file: File | Blob, mediaType: MediaType): Promise<string> {
    try {
      const response = await frontierApiClient.uploadFile(API_ENDPOINTS.UPLOAD_MEDIA, file);

      if (!response.success || !response.data) {
        throw new Error(response.message || ERROR_MESSAGES.INVALID_MEDIA);
      }

      return response.data as string;
    } catch (error) {
      console.error('Failed to upload media:', error);
      throw error;
    }
  }

  /**
   * Delete media file
   */
  async deleteMedia(mediaId: string): Promise<void> {
    try {
      const response = await frontierApiClient.delete(
        `${API_ENDPOINTS.DELETE_MEDIA.replace(':id', mediaId)}`
      );

      if (!response.success) {
        throw new Error(response.message || ERROR_MESSAGES.FORBIDDEN);
      }
    } catch (error) {
      console.error('Failed to delete media:', error);
      throw error;
    }
  }

  /**
   * Get trending posts
   */
  async getTrendingPosts(page: number = 1, pageSize: number = 20): Promise<PostFeedResponse> {
    try {
      const response = await frontierApiClient.get(
        `/api/posts/trending?page=${page}&pageSize=${pageSize}`
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || ERROR_MESSAGES.SERVER_ERROR);
      }

      return response.data as PostFeedResponse;
    } catch (error) {
      console.error('Failed to get trending posts:', error);
      throw error;
    }
  }

  /**
   * Get posts by category
   */
  async getPostsByCategory(
    category: PostCategory,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PostFeedResponse> {
    try {
      const response = await frontierApiClient.get(
        `/api/posts/category/${category}?page=${page}&pageSize=${pageSize}`
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || ERROR_MESSAGES.SERVER_ERROR);
      }

      return response.data as PostFeedResponse;
    } catch (error) {
      console.error('Failed to get posts by category:', error);
      throw error;
    }
  }

  /**
   * Get posts by tags
   */
  async getPostsByTags(
    tags: string[],
    page: number = 1,
    pageSize: number = 20
  ): Promise<PostFeedResponse> {
    try {
      const response = await frontierApiClient.post('/api/posts/tags', {
        tags,
        page,
        pageSize,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || ERROR_MESSAGES.SERVER_ERROR);
      }

      return response.data as PostFeedResponse;
    } catch (error) {
      console.error('Failed to get posts by tags:', error);
      throw error;
    }
  }

  /**
   * Get recommended posts for user
   */
  async getRecommendedPosts(page: number = 1, pageSize: number = 20): Promise<PostFeedResponse> {
    try {
      const response = await frontierApiClient.get(
        `/api/posts/recommended?page=${page}&pageSize=${pageSize}`
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || ERROR_MESSAGES.SERVER_ERROR);
      }

      return response.data as PostFeedResponse;
    } catch (error) {
      console.error('Failed to get recommended posts:', error);
      throw error;
    }
  }

  /**
   * Report a post
   */
  async reportPost(postId: string, reason: string, description?: string): Promise<void> {
    try {
      const response = await frontierApiClient.post(`/api/posts/${postId}/report`, {
        reason,
        description,
      });

      if (!response.success) {
        throw new Error(response.message || ERROR_MESSAGES.SERVER_ERROR);
      }
    } catch (error) {
      console.error('Failed to report post:', error);
      throw error;
    }
  }

  /**
   * Get post engagement statistics
   */
  async getPostEngagement(postId: string): Promise<{
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    viewsCount: number;
    engagementRate: number;
  }> {
    try {
      const response = await frontierApiClient.get(`/api/posts/${postId}/engagement`);

      if (!response.success || !response.data) {
        throw new Error(response.message || ERROR_MESSAGES.NOT_FOUND);
      }

      return response.data as {
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        viewsCount: number;
        engagementRate: number;
      };
    } catch (error) {
      console.error('Failed to get post engagement:', error);
      throw error;
    }
  }

  /**
   * Validate post content before submission
   */
  static validatePostContent(content: string): {isValid: boolean; errors: string[]} {
    const errors: string[] = [];
    
    if (!content.trim()) {
      errors.push('Post content cannot be empty');
    }
    
    if (content.length < 10) {
      errors.push('Post content must be at least 10 characters long');
    }
    
    if (content.length > 1000) {
      errors.push('Post content cannot exceed 1000 characters');
    }
    
    // Check for inappropriate content (basic filtering)
    const inappropriateWords = ['spam', 'scam', 'fake']; // This would be more comprehensive
    const hasInappropriateContent = inappropriateWords.some(word => 
      content.toLowerCase().includes(word)
    );
    
    if (hasInappropriateContent) {
      errors.push('Post content contains inappropriate language');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Extract hashtags from post content
   */
  static extractHashtags(content: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  /**
   * Format post content for display
   */
  static formatPostContent(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  /**
   * Calculate reading time for post content
   */
  static calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }
}

// Create singleton instance
export const postService = new PostService();

export default postService;






