import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchService, SearchRequest, SearchResult, SearchFilters, SearchSort } from '../../services/search.service';
import { useAuth } from '../../contexts/AuthContext';
import FollowButton from '../social/FollowButton';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  FireIcon,
  HashtagIcon,
  UserGroupIcon,
  DocumentTextIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import PageLayout from '../layout/PageLayout';
import ScrollableContent from '../layout/ScrollableContent';

interface SearchPageProps {
  className?: string;
  onResultClick?: (result: any) => void;
}

const SearchPage: React.FC<SearchPageProps> = ({
  className = '',
  onResultClick
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'users' | 'groups' | 'hashtags'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sort, setSort] = useState<SearchSort>({ field: 'relevance', direction: 'desc' });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (query.length >= 2) {
      loadSuggestions();
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const loadRecentSearches = () => {
    const recent = searchService.getRecentSearches();
    setRecentSearches(recent);
  };

  const loadSuggestions = useCallback(async () => {
    try {
      const suggestions = await searchService.getSearchSuggestions(query, 8);
      setSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  }, [query]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const request: SearchRequest = {
        query: searchQuery,
        page: 1,
        pageSize: 20,
        includePosts: activeTab === 'all' || activeTab === 'posts',
        includeUsers: activeTab === 'all' || activeTab === 'users',
        includeGroups: activeTab === 'all' || activeTab === 'groups',
        includeHashtags: activeTab === 'all' || activeTab === 'hashtags',
        filters,
        sort
      };

      const result = await searchService.search(request);
      setSearchResult(result);
      searchService.addToRecentSearches(searchQuery);
      loadRecentSearches();
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters, sort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    performSearch(suggestion);
  };

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
    performSearch(recentQuery);
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResult(null);
    setError(null);
    setShowSuggestions(false);
  };

  const clearFilters = () => {
    setFilters({});
    if (query) {
      performSearch(query);
    }
  };

  const handleUserClick = (user: any) => {
    if (onResultClick) {
      onResultClick(user);
    } else {
      // Default behavior: navigate to user profile
      navigate(`/profile/${user.id}`);
    }
  };

  const getTabCount = (type: 'posts' | 'users' | 'groups' | 'hashtags') => {
    if (!searchResult) return 0;
    switch (type) {
      case 'posts': return searchResult.posts.length;
      case 'users': return searchResult.users.length;
      case 'groups': return searchResult.groups.length;
      case 'hashtags': return searchResult.hashtags.length;
      default: return 0;
    }
  };

  const renderSearchResults = () => {
    if (!searchResult) return null;

    const tabs = [
      { id: 'all' as const, name: 'All', count: searchResult.totalResults, icon: MagnifyingGlassIcon },
      { id: 'posts' as const, name: 'Posts', count: getTabCount('posts'), icon: DocumentTextIcon },
      { id: 'users' as const, name: 'Users', count: getTabCount('users'), icon: UserIcon },
      { id: 'groups' as const, name: 'Groups', count: getTabCount('groups'), icon: UserGroupIcon },
      { id: 'hashtags' as const, name: 'Hashtags', count: getTabCount('hashtags'), icon: HashtagIcon }
    ];

    return (
      <div className="space-y-6">
        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {searchService.formatSearchResultCount(searchResult.totalResults)}
            </h2>
            <p className="text-gray-600">for "{query}"</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              <FunnelIcon className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Search Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.fromDate || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="date"
                    value={filters.toDate || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                <select
                  value={filters.types?.[0] || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    types: e.target.value ? [e.target.value] : undefined 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="text">Text Posts</option>
                  <option value="image">Image Posts</option>
                  <option value="video">Video Posts</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sort.field}
                  onChange={(e) => setSort(prev => ({ ...prev, field: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="popularity">Popularity</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasMedia || false}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasMedia: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Has Media</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.isVerified || false}
                  onChange={(e) => setFilters(prev => ({ ...prev, isVerified: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Verified Only</span>
              </label>
            </div>
          </div>
        )}

        {/* Results Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                  {tab.count > 0 && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Results Content */}
        <div className="space-y-4">
          {activeTab === 'all' && (
            <div className="space-y-6">
              {searchResult.posts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <DocumentTextIcon className="w-5 h-5 mr-2" />
                    Posts ({searchResult.posts.length})
                  </h3>
                  <div className="space-y-3">
                    {searchResult.posts.slice(0, 3).map((post) => (
                      <div
                        key={post.id}
                        className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md cursor-pointer"
                        onClick={() => onResultClick?.(post)}
                      >
                        <div className="flex items-start space-x-3">
                          <img
                            src={post.authorAvatar}
                            alt={post.authorName}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900">{post.authorName}</span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">
                                {new Date(post.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-800 line-clamp-2">
                              {post.highlightedContent || post.content}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span>❤️ {post.likesCount}</span>
                              <span>💬 {post.commentsCount}</span>
                              <span>🔄 {post.sharesCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResult.users.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <UserIcon className="w-5 h-5 mr-2" />
                    Users ({searchResult.users.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {searchResult.users.map((user) => (
                      <div
                        key={user.id}
                        className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-purple-200 transition-all duration-200 cursor-pointer group"
                        onClick={() => handleUserClick(user)}
                      >
                        <div className="flex items-start space-x-4">
                          {/* Profile Picture */}
                          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.displayName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.log('Search user avatar failed to load:', user.avatarUrl);
                                  e.currentTarget.style.display = 'none';
                                  // Show fallback
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <span 
                              className="text-white font-bold text-lg"
                              style={{ display: user.avatarUrl ? 'none' : 'flex' }}
                            >
                              {user.displayName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          
                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                                {user.displayName}
                              </h3>
                              {user.isVerified && (
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">✓</span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">@{user.username}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <span className="font-medium text-gray-700">{user.followersCount}</span>
                                <span>followers</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <span className="font-medium text-gray-700">{user.postsCount}</span>
                                <span>posts</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Follow Button */}
                          <div className="flex-shrink-0">
                            <FollowButton
                              userId={user.id}
                              currentUserId={currentUser?.id}
                              size="sm"
                              variant="primary"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResult.groups.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <UserGroupIcon className="w-5 h-5 mr-2" />
                    Groups ({searchResult.groups.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {searchResult.groups.map((group) => (
                      <div
                        key={group.id}
                        className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-purple-200 transition-all duration-200 cursor-pointer group"
                        onClick={() => onResultClick?.(group)}
                      >
                        <div className="flex flex-col items-center text-center space-y-3">
                          {/* Group Avatar */}
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                            {group.avatarUrl ? (
                              <img
                                src={group.avatarUrl}
                                alt={group.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.log('Group avatar failed to load:', group.avatarUrl);
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <span 
                              className="text-white font-bold text-xl"
                              style={{ display: group.avatarUrl ? 'none' : 'flex' }}
                            >
                              {group.name?.charAt(0)?.toUpperCase() || 'G'}
                            </span>
                          </div>
                          
                          {/* Group Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors mb-1">
                              {group.name}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">{group.category}</p>
                            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <span className="font-medium text-gray-700">{group.membersCount}</span>
                                <span>members</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <span className="font-medium text-gray-700">{group.postsCount}</span>
                                <span>posts</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResult.hashtags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <HashtagIcon className="w-5 h-5 mr-2" />
                    Hashtags ({searchResult.hashtags.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {searchResult.hashtags.slice(0, 8).map((hashtag) => (
                      <button
                        key={hashtag.hashtag}
                        onClick={() => onResultClick?.(hashtag)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                      >
                        #{hashtag.hashtag} ({hashtag.usageCount})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Individual tab results would be rendered here */}
          {activeTab !== 'all' && (
            <div className="text-center py-8 text-gray-500">
              <p>Individual tab results will be implemented here</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const leftSidebar = (
    <div className="space-y-6">
      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <ClockIcon className="w-4 h-4 text-gray-500" />
            <h3 className="font-medium text-gray-900">Recent Searches</h3>
          </div>
          <div className="space-y-2">
            {recentSearches.slice(0, 8).map((recentQuery, index) => (
              <button
                key={index}
                onClick={() => handleRecentSearchClick(recentQuery)}
                className="w-full text-left px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                {recentQuery}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending Topics */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">🔥 Trending Topics</h3>
        <div className="space-y-2">
          {['#technology', '#design', '#startup', '#ai', '#webdev'].map((topic, index) => (
            <button
              key={index}
              className="w-full text-left px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const centerContent = (
    <div className="h-full flex flex-col">
      {/* Search Header */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Search</h1>
        <p className="text-gray-600">Find posts, users, groups, and more</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative mb-6 flex-shrink-0">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && showSuggestions) {
                e.preventDefault();
                setShowSuggestions(false);
                performSearch(query);
              }
            }}
            placeholder="Search for posts, users, groups, hashtags..."
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 mb-2">Suggestions</div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Content Area */}
      <ScrollableContent>
        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Searching...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">⚠️</div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => performSearch(query)}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Search Results */}
        {searchResult && !loading && renderSearchResults()}

        {/* Empty State */}
        {!searchResult && !loading && !error && query && (
          <div className="text-center py-8">
            <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No results found for "{query}"</p>
            <p className="text-sm text-gray-500 mt-1">Try different keywords or check your spelling</p>
          </div>
        )}
      </ScrollableContent>
    </div>
  );

  return (
    <PageLayout
      leftSidebar={leftSidebar}
      centerContent={centerContent}
      layoutType="wide-right"
    />
  );
};

export default SearchPage;