import { BaseApiService } from './base-api.service';
import { apiConfig } from './api.config';

export interface TrendingPost {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  media?: any[];
  hashtags?: string;
  category?: string;
  hotScore: number;
}

export interface TrendingHashtag {
  hashtag: string;
  score: number;
  postCount: number;
}

export interface TrendingUser {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  postCount: number;
  followersCount: number;
}

export interface TrendingCategory {
  category: string;
  posts: TrendingPost[];
}

export interface AlgorithmStats {
  logBase: number;
  timeDecay: number;
  scoreWeight: number;
  commentWeight: number;
  shareWeight: number;
  viewWeight: number;
  lastUpdated: string;
}

export interface TrendingFilters {
  limit?: number;
  category?: string;
  fromDate?: string;
  timeRange?: '1h' | '6h' | '24h' | '7d' | '30d';
}

class TrendingService extends BaseApiService {
  constructor() {
    super(apiConfig.officerApi);
  }

  // Get trending posts
  async getTrendingPosts(filters: TrendingFilters = {}): Promise<TrendingPost[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.category) params.append('category', filters.category);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.timeRange) params.append('timeRange', filters.timeRange);

      const response = await this.get<{ data: TrendingPost[] }>(`/trending/posts?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get trending posts:', error);
      throw error;
    }
  }

  // Get trending hashtags
  async getTrendingHashtags(filters: TrendingFilters = {}): Promise<TrendingHashtag[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.timeRange) params.append('timeRange', filters.timeRange);

      const response = await this.get<{ data: TrendingHashtag[] }>(`/trending/hashtags?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get trending hashtags:', error);
      throw error;
    }
  }

  // Get trending users
  async getTrendingUsers(filters: TrendingFilters = {}): Promise<TrendingUser[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.timeRange) params.append('timeRange', filters.timeRange);

      const response = await this.get<{ data: TrendingUser[] }>(`/trending/users?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get trending users:', error);
      throw error;
    }
  }

  // Get trending content by category
  async getTrendingByCategory(filters: TrendingFilters = {}): Promise<TrendingCategory[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.limit) params.append('limitPerCategory', filters.limit.toString());
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.timeRange) params.append('timeRange', filters.timeRange);

      const response = await this.get<{ data: Record<string, TrendingPost[]> }>(`/trending/categories?${params.toString()}`);
      
      // Convert to array format
      return Object.entries(response.data).map(([category, posts]) => ({
        category,
        posts
      }));
    } catch (error) {
      console.error('Failed to get trending content by category:', error);
      throw error;
    }
  }

  // Get trending feed for a specific user
  async getTrendingFeed(userId: string, filters: TrendingFilters = {}): Promise<TrendingPost[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.category) params.append('category', filters.category);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.timeRange) params.append('timeRange', filters.timeRange);

      const response = await this.get<{ data: TrendingPost[] }>(`/trending/feed/${userId}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get trending feed:', error);
      throw error;
    }
  }

  // Get algorithm statistics
  async getAlgorithmStats(): Promise<AlgorithmStats> {
    try {
      const response = await this.get<{ data: AlgorithmStats }>('/trending/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get algorithm statistics:', error);
      throw error;
    }
  }

  // Utility methods
  formatTimeRange(timeRange: string): string {
    const timeRanges: Record<string, string> = {
      '1h': 'Last Hour',
      '6h': 'Last 6 Hours',
      '24h': 'Last 24 Hours',
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days'
    };
    return timeRanges[timeRange] || 'Last 24 Hours';
  }

  getTimeRangeOptions(): { value: string; label: string }[] {
    return [
      { value: '1h', label: 'Last Hour' },
      { value: '6h', label: 'Last 6 Hours' },
      { value: '24h', label: 'Last 24 Hours' },
      { value: '7d', label: 'Last 7 Days' },
      { value: '30d', label: 'Last 30 Days' }
    ];
  }

  formatScore(score: number): string {
    if (score >= 1000000) {
      return `${(score / 1000000).toFixed(1)}M`;
    } else if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}K`;
    }
    return score.toFixed(0);
  }

  getTrendingBadge(score: number): { text: string; color: string } {
    if (score >= 1000) {
      return { text: '🔥 Hot', color: 'text-red-600 bg-red-100' };
    } else if (score >= 500) {
      return { text: '📈 Rising', color: 'text-orange-600 bg-orange-100' };
    } else if (score >= 100) {
      return { text: '⭐ Trending', color: 'text-blue-600 bg-blue-100' };
    }
    return { text: '📊 Active', color: 'text-gray-600 bg-gray-100' };
  }

  // Calculate relative time for posts
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Get trending score color
  getScoreColor(score: number): string {
    if (score >= 1000) return 'text-red-600';
    if (score >= 500) return 'text-orange-600';
    if (score >= 100) return 'text-blue-600';
    return 'text-gray-600';
  }

  // Sort posts by trending score
  sortByTrendingScore(posts: TrendingPost[]): TrendingPost[] {
    return [...posts].sort((a, b) => b.hotScore - a.hotScore);
  }

  // Filter posts by category
  filterByCategory(posts: TrendingPost[], category: string): TrendingPost[] {
    if (!category) return posts;
    return posts.filter(post => post.category === category);
  }

  // Get top categories from posts
  getTopCategories(posts: TrendingPost[], limit: number = 10): { category: string; count: number }[] {
    const categoryCounts: Record<string, number> = {};
    
    posts.forEach(post => {
      const category = post.category || 'General';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    return Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Get trending hashtags from posts
  extractHashtags(posts: TrendingPost[]): { hashtag: string; count: number }[] {
    const hashtagCounts: Record<string, number> = {};
    
    posts.forEach(post => {
      if (post.hashtags) {
        const hashtags = post.hashtags.split(',').map(h => h.trim().toLowerCase());
        hashtags.forEach(hashtag => {
          if (hashtag) {
            hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(hashtagCounts)
      .map(([hashtag, count]) => ({ hashtag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }
}

export const trendingService = new TrendingService();
