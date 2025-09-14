import { BaseApiService, socialApi, neurosparkApi } from './api.service';

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
    super(socialApi);
    this.loadSearchHistory();
  }

  // Perform comprehensive search
  async search(request: SearchRequest): Promise<SearchResult> {
    try {
      const startTime = Date.now();
      
      // Perform searches in parallel for different types
      const searchPromises: Promise<any>[] = [];
      
      if (request.includeUsers !== false) {
        searchPromises.push(
          this.searchUsers(request.query, request.filters, request.sort)
            .catch(error => {
              console.error('User search failed:', error);
              return [];
            })
        );
      } else {
        searchPromises.push(Promise.resolve([]));
      }
      
      if (request.includePosts !== false) {
        searchPromises.push(
          this.searchPosts(request.query, request.filters, request.sort)
            .catch(error => {
              console.error('Post search failed:', error);
              return [];
            })
        );
      } else {
        searchPromises.push(Promise.resolve([]));
      }
      
      if (request.includeGroups !== false) {
        searchPromises.push(
          this.searchGroups(request.query, request.filters, request.sort)
            .catch(error => {
              console.error('Group search failed:', error);
              return [];
            })
        );
      } else {
        searchPromises.push(Promise.resolve([]));
      }
      
      if (request.includeHashtags !== false) {
        searchPromises.push(
          this.searchHashtags(request.query, request.sort)
            .catch(error => {
              console.error('Hashtag search failed:', error);
              return [];
            })
        );
      } else {
        searchPromises.push(Promise.resolve([]));
      }

      const [users, posts, groups, hashtags] = await Promise.all(searchPromises);
      
      const searchTime = Date.now() - startTime;
      
      return {
        query: request.query,
        totalResults: users.length + posts.length + groups.length + hashtags.length,
        posts: posts,
        users: users,
        groups: groups,
        hashtags: hashtags,
        suggestions: [], // Could be implemented later
        searchTime: `${searchTime}ms`
      };
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
      params.append('page', '1');
      params.append('limit', '20');
      
      if (filters) {
        if (filters.isVerified !== undefined) params.append('filters.isVerified', filters.isVerified.toString());
      }
      
      if (sort) {
        params.append('sort.field', sort.field);
        params.append('sort.direction', sort.direction);
      }

      // Use the social service follows endpoint for user search
      const response = await this.get<{ users: any[] }>(`/api/follows/search?${params.toString()}`);
      
      // Transform the response to match SearchUserResult interface
      return response.users.map((user: any) => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        bio: '', // Not provided by the API
        avatarUrl: user.avatarUrl || '',
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        postsCount: user.postsCount || 0,
        isVerified: user.isVerified || false,
        isFollowing: false, // Not provided by the API
        relevanceScore: 1.0 // Default relevance score
      }));
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
      params.append('count', limit.toString());

      // Use neurosparkApi for search suggestions
      const response = await neurosparkApi.get<{ data: string[] }>(`/api/search/suggestions?${params.toString()}`);
      return response.data || [];
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
