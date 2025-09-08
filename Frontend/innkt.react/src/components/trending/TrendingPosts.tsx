import React, { useState, useEffect } from 'react';
import { trendingService, TrendingPost, TrendingFilters } from '../../services/trending.service';
import { 
  FireIcon, 
  ClockIcon, 
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface TrendingPostsProps {
  className?: string;
  limit?: number;
  showFilters?: boolean;
  onPostClick?: (post: TrendingPost) => void;
}

const TrendingPosts: React.FC<TrendingPostsProps> = ({
  className = '',
  limit = 20,
  showFilters = true,
  onPostClick
}) => {
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TrendingFilters>({
    limit,
    timeRange: '24h'
  });
  const [showAllPosts, setShowAllPosts] = useState(false);

  useEffect(() => {
    loadTrendingPosts();
  }, [filters]);

  const loadTrendingPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const trendingPosts = await trendingService.getTrendingPosts(filters);
      setPosts(trendingPosts);
    } catch (err: any) {
      setError(err.message || 'Failed to load trending posts');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (timeRange: string) => {
    setFilters(prev => ({ ...prev, timeRange: timeRange as any }));
  };

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({ ...prev, category: category || undefined }));
  };

  const displayedPosts = showAllPosts ? posts : posts.slice(0, 10);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="p-6 text-center">
          <div className="text-red-600 mb-2">⚠️</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadTrendingPosts}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FireIcon className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">Trending Posts</h2>
          </div>
          <div className="text-sm text-gray-500">
            {trendingService.formatTimeRange(filters.timeRange || '24h')}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            <select
              value={filters.timeRange || '24h'}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {trendingService.getTimeRangeOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filters.category || ''}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              <option value="Technology">Technology</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Sports">Sports</option>
              <option value="News">News</option>
              <option value="Lifestyle">Lifestyle</option>
            </select>
          </div>
        )}
      </div>

      {/* Posts List */}
      <div className="divide-y divide-gray-200">
        {displayedPosts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <FireIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No trending posts found</p>
          </div>
        ) : (
          displayedPosts.map((post, index) => (
            <div
              key={post.id}
              className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onPostClick?.(post)}
            >
              <div className="flex items-start space-x-3">
                {/* Trending Rank */}
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index < 3 
                      ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                </div>

                {/* Post Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <img
                      src={post.authorAvatar || '/default-avatar.png'}
                      alt={post.authorName}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm font-medium text-gray-900">{post.authorName}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">
                      {trendingService.getRelativeTime(post.createdAt)}
                    </span>
                  </div>

                  <p className="text-gray-800 mb-3 line-clamp-2">{post.content}</p>

                  {/* Engagement Stats */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <HeartSolidIcon className="w-4 h-4 text-red-500" />
                      <span>{trendingService.formatScore(post.likesCount)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                      <span>{trendingService.formatScore(post.commentsCount)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ShareIcon className="w-4 h-4" />
                      <span>{trendingService.formatScore(post.sharesCount)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <EyeIcon className="w-4 h-4" />
                      <span>{trendingService.formatScore(post.viewsCount)}</span>
                    </div>
                  </div>

                  {/* Trending Badge */}
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      trendingService.getTrendingBadge(post.hotScore).color
                    }`}>
                      {trendingService.getTrendingBadge(post.hotScore).text}
                    </span>
                  </div>
                </div>

                {/* Hot Score */}
                <div className="flex-shrink-0 text-right">
                  <div className={`text-sm font-bold ${trendingService.getScoreColor(post.hotScore)}`}>
                    {trendingService.formatScore(post.hotScore)}
                  </div>
                  <div className="text-xs text-gray-500">score</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Show More/Less Button */}
      {posts.length > 10 && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button
            onClick={() => setShowAllPosts(!showAllPosts)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium"
          >
            <span>{showAllPosts ? 'Show Less' : `Show All ${posts.length} Posts`}</span>
            {showAllPosts ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default TrendingPosts;
