import { BaseApiService } from './base-api.service';
import { apiConfig } from './api.config';

export interface SearchRequest {
  query: string;
  page?: number;
  pageSize?: number;
  includePosts?: boolean;
  includeUsers?: boolean;
  includeGroups?: boolean;
  includeHashtags?: boolean;
  filters?: SearchFilters;
  sort?: SearchSort;
}

export interface SearchResult {
  query: string;
  totalResults: number;
  posts: SearchPostResult[];
  users: SearchUserResult[];
  groups: SearchGroupResult[];
  hashtags: SearchHashtagResult[];
  suggestions: string[];
  searchTime: string;
  error?: string;
}

export interface SearchPostResult {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  hashtags: string[];
  mediaUrls: string[];
  relevanceScore: number;
  highlightedContent?: string;
}

export interface SearchUserResult {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified: boolean;
  isFollowing: boolean;
  relevanceScore: number;
}

export interface SearchGroupResult {
  id: string;
  name: string;
  description: string;
  category: string;
  avatarUrl: string;
  coverUrl: string;
  membersCount: number;
  postsCount: number;
  isPrivate: boolean;
  isJoined: boolean;
  relevanceScore: number;
}

export interface SearchHashtagResult {
  hashtag: string;
  usageCount: number;
  lastUsed: string;
  recentPosts: string[];
  relevanceScore: number;
}

export interface SearchFilters {
  fromDate?: string;
  toDate?: string;
  categories?: string[];
  types?: string[];
  hasMedia?: boolean;
  minLikes?: number;
  minComments?: number;
  isVerified?: boolean;
  isPrivate?: boolean;
}

export interface SearchSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TrendingSearch {
  query: string;
  searchCount: number;
  trendScore: number;
  lastSearched: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  resultCount: number;
  searchedAt: string;
}

export interface SearchAnalytics {
  totalSearches: number;
  uniqueQueries: number;
  mostSearchedTerms: SearchTermStats[];
  searchTrends: SearchTrend[];
  period: DateRange;
}

export interface SearchTermStats {
  term: string;
  count: number;
  trend: number;
}

export interface SearchTrend {
  date: string;
  searchCount: number;
  uniqueQueries: number;
}

export interface DateRange {
  from: string;
  to: string;
}

class SearchService extends BaseApiService {
  private searchHistory: SearchHistoryItem[] = [];
  private recentSearches: string[] = [];

  constructor() {
    super(apiConfig.officerApi);
    this.loadSearchHistory();
  }

  // Perform comprehensive search
  async search(request: SearchRequest): Promise<SearchResult> {
    try {
      const params = new URLSearchParams();
      params.append('query', request.query);
      
      if (request.page) params.append('page', request.page.toString());
      if (request.pageSize) params.append('pageSize', request.pageSize.toString());
      if (request.includePosts !== undefined) params.append('includePosts', request.includePosts.toString());
      if (request.includeUsers !== undefined) params.append('includeUsers', request.includeUsers.toString());
      if (request.includeGroups !== undefined) params.append('includeGroups', request.includeGroups.toString());
      if (request.includeHashtags !== undefined) params.append('includeHashtags', request.includeHashtags.toString());
      
      if (request.filters) {
        if (request.filters.fromDate) params.append('filters.fromDate', request.filters.fromDate);
        if (request.filters.toDate) params.append('filters.toDate', request.filters.toDate);
        if (request.filters.categories) params.append('filters.categories', request.filters.categories.join(','));
        if (request.filters.types) params.append('filters.types', request.filters.types.join(','));
        if (request.filters.hasMedia !== undefined) params.append('filters.hasMedia', request.filters.hasMedia.toString());
        if (request.filters.minLikes) params.append('filters.minLikes', request.filters.minLikes.toString());
        if (request.filters.minComments) params.append('filters.minComments', request.filters.minComments.toString());
        if (request.filters.isVerified !== undefined) params.append('filters.isVerified', request.filters.isVerified.toString());
        if (request.filters.isPrivate !== undefined) params.append('filters.isPrivate', request.filters.isPrivate.toString());
      }
      
      if (request.sort) {
        params.append('sort.field', request.sort.field);
        params.append('sort.direction', request.sort.direction);
      }

      const response = await this.get<{ data: SearchResult }>(`/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  // Search posts only
  async searchPosts(query: string, filters?: SearchFilters, sort?: SearchSort): Promise<SearchPostResult[]> {
    try {
      const params = new URLSearchParams();
      params.append('query', query);
      
      if (filters) {
        if (filters.fromDate) params.append('filters.fromDate', filters.fromDate);
        if (filters.toDate) params.append('filters.toDate', filters.toDate);
        if (filters.categories) params.append('filters.categories', filters.categories.join(','));
        if (filters.hasMedia !== undefined) params.append('filters.hasMedia', filters.hasMedia.toString());
        if (filters.minLikes) params.append('filters.minLikes', filters.minLikes.toString());
        if (filters.minComments) params.append('filters.minComments', filters.minComments.toString());
      }
      
      if (sort) {
        params.append('sort.field', sort.field);
        params.append('sort.direction', sort.direction);
      }

      const response = await this.get<{ data: SearchPostResult[] }>(`/search/posts?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Post search failed:', error);
      throw error;
    }
  }

  // Search users only
  async searchUsers(query: string, filters?: SearchFilters, sort?: SearchSort): Promise<SearchUserResult[]> {
    try {
      const params = new URLSearchParams();
      params.append('query', query);
      
      if (filters) {
        if (filters.isVerified !== undefined) params.append('filters.isVerified', filters.isVerified.toString());
      }
      
      if (sort) {
        params.append('sort.field', sort.field);
        params.append('sort.direction', sort.direction);
      }

      const response = await this.get<{ data: SearchUserResult[] }>(`/search/users?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('User search failed:', error);
      throw error;
    }
  }

  // Search groups only
  async searchGroups(query: string, filters?: SearchFilters, sort?: SearchSort): Promise<SearchGroupResult[]> {
    try {
      const params = new URLSearchParams();
      params.append('query', query);
      
      if (filters) {
        if (filters.categories) params.append('filters.categories', filters.categories.join(','));
        if (filters.isPrivate !== undefined) params.append('filters.isPrivate', filters.isPrivate.toString());
      }
      
      if (sort) {
        params.append('sort.field', sort.field);
        params.append('sort.direction', sort.direction);
      }

      const response = await this.get<{ data: SearchGroupResult[] }>(`/search/groups?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Group search failed:', error);
      throw error;
    }
  }

  // Search hashtags only
  async searchHashtags(query: string, sort?: SearchSort): Promise<SearchHashtagResult[]> {
    try {
      const params = new URLSearchParams();
      params.append('query', query);
      
      if (sort) {
        params.append('sort.field', sort.field);
        params.append('sort.direction', sort.direction);
      }

      const response = await this.get<{ data: SearchHashtagResult[] }>(`/search/hashtags?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Hashtag search failed:', error);
      throw error;
    }
  }

  // Get search suggestions
  async getSearchSuggestions(query: string, limit: number = 10): Promise<string[]> {
    try {
      if (query.length < 2) {
        return [];
      }

      const params = new URLSearchParams();
      params.append('query', query);
      params.append('limit', limit.toString());

      const response = await this.get<{ data: string[] }>(`/search/suggestions?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }

  // Get trending searches
  async getTrendingSearches(limit: number = 10): Promise<TrendingSearch[]> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());

      const response = await this.get<{ data: TrendingSearch[] }>(`/search/trending?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get trending searches:', error);
      return [];
    }
  }

  // Get search history
  async getSearchHistory(limit: number = 20): Promise<SearchHistoryItem[]> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());

      const response = await this.get<{ data: SearchHistoryItem[] }>(`/search/history?${params.toString()}`);
      this.searchHistory = response.data;
      return response.data;
    } catch (error) {
      console.error('Failed to get search history:', error);
      return this.searchHistory;
    }
  }

  // Clear search history
  async clearSearchHistory(): Promise<void> {
    try {
      await this.delete('/search/history');
      this.searchHistory = [];
      this.recentSearches = [];
      this.saveSearchHistory();
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  }

  // Get search analytics (Admin only)
  async getSearchAnalytics(fromDate?: string, toDate?: string): Promise<SearchAnalytics> {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const response = await this.get<{ data: SearchAnalytics }>(`/search/analytics?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get search analytics:', error);
      throw error;
    }
  }

  // Advanced search
  async advancedSearch(request: SearchRequest): Promise<SearchResult> {
    try {
      const response = await this.post<{ data: SearchResult }>('/search/advanced', request);
      return response.data;
    } catch (error) {
      console.error('Advanced search failed:', error);
      throw error;
    }
  }

  // Utility methods
  parseSearchQuery(query: string): {
    terms: string[];
    hashtags: string[];
    mentions: string[];
    filters: Record<string, string>;
  } {
    const result = {
      terms: [] as string[],
      hashtags: [] as string[],
      mentions: [] as string[],
      filters: {} as Record<string, string>
    };

    if (!query) return result;

    // Extract hashtags
    const hashtagMatches = query.match(/#(\w+)/g);
    if (hashtagMatches) {
      result.hashtags = hashtagMatches.map(match => match.substring(1));
    }

    // Extract mentions
    const mentionMatches = query.match(/@(\w+)/g);
    if (mentionMatches) {
      result.mentions = mentionMatches.map(match => match.substring(1));
    }

    // Extract filters (e.g., "type:post", "user:john")
    const filterMatches = query.match(/(\w+):(\w+)/g);
    if (filterMatches) {
      filterMatches.forEach(match => {
        const [key, value] = match.split(':');
        result.filters[key] = value;
      });
    }

    // Extract remaining terms
    let cleanQuery = query;
    [...(hashtagMatches || []), ...(mentionMatches || []), ...(filterMatches || [])].forEach(match => {
      cleanQuery = cleanQuery.replace(match, '');
    });
    
    result.terms = cleanQuery.split(' ').filter(term => term.trim().length > 0);

    return result;
  }

  formatSearchQuery(parsed: ReturnType<typeof this.parseSearchQuery>): string {
    const parts: string[] = [];
    
    if (parsed.terms.length > 0) {
      parts.push(parsed.terms.join(' '));
    }
    
    if (parsed.hashtags.length > 0) {
      parts.push(parsed.hashtags.map(tag => `#${tag}`).join(' '));
    }
    
    if (parsed.mentions.length > 0) {
      parts.push(parsed.mentions.map(mention => `@${mention}`).join(' '));
    }
    
    if (Object.keys(parsed.filters).length > 0) {
      parts.push(Object.entries(parsed.filters).map(([key, value]) => `${key}:${value}`).join(' '));
    }

    return parts.join(' ');
  }

  addToRecentSearches(query: string): void {
    if (!query || query.trim().length === 0) return;
    
    // Remove if already exists
    this.recentSearches = this.recentSearches.filter(item => item !== query);
    
    // Add to beginning
    this.recentSearches.unshift(query);
    
    // Keep only last 10
    this.recentSearches = this.recentSearches.slice(0, 10);
    
    this.saveSearchHistory();
  }

  getRecentSearches(): string[] {
    return [...this.recentSearches];
  }

  clearRecentSearches(): void {
    this.recentSearches = [];
    this.saveSearchHistory();
  }

  private loadSearchHistory(): void {
    try {
      const saved = localStorage.getItem('searchHistory');
      if (saved) {
        const data = JSON.parse(saved);
        this.recentSearches = data.recentSearches || [];
        this.searchHistory = data.searchHistory || [];
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }

  private saveSearchHistory(): void {
    try {
      const data = {
        recentSearches: this.recentSearches,
        searchHistory: this.searchHistory
      };
      localStorage.setItem('searchHistory', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  // Search result formatting utilities
  formatSearchResultCount(count: number): string {
    if (count === 0) return 'No results';
    if (count === 1) return '1 result';
    if (count < 1000) return `${count} results`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K results`;
    return `${(count / 1000000).toFixed(1)}M results`;
  }

  getSearchResultIcon(type: 'posts' | 'users' | 'groups' | 'hashtags'): string {
    const icons = {
      posts: '📝',
      users: '👤',
      groups: '👥',
      hashtags: '#️⃣'
    };
    return icons[type];
  }

  getSearchResultColor(type: 'posts' | 'users' | 'groups' | 'hashtags'): string {
    const colors = {
      posts: 'text-blue-600',
      users: 'text-green-600',
      groups: 'text-purple-600',
      hashtags: 'text-orange-600'
    };
    return colors[type];
  }

  highlightSearchTerms(text: string, query: string): string {
    if (!query || !text) return text;
    
    const terms = query.split(' ').filter(term => term.length > 0);
    let highlightedText = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
    });
    
    return highlightedText;
  }
}

export const searchService = new SearchService();
