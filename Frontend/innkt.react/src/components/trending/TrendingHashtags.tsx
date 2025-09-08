import React, { useState, useEffect } from 'react';
import { trendingService, TrendingHashtag, TrendingFilters } from '../../services/trending.service';
import { 
  HashtagIcon, 
  FireIcon, 
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

interface TrendingHashtagsProps {
  className?: string;
  limit?: number;
  showFilters?: boolean;
  onHashtagClick?: (hashtag: string) => void;
}

const TrendingHashtags: React.FC<TrendingHashtagsProps> = ({
  className = '',
  limit = 15,
  showFilters = true,
  onHashtagClick
}) => {
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TrendingFilters>({
    limit,
    timeRange: '24h'
  });
  const [showAllHashtags, setShowAllHashtags] = useState(false);

  useEffect(() => {
    loadTrendingHashtags();
  }, [filters]);

  const loadTrendingHashtags = async () => {
    try {
      setLoading(true);
      setError(null);
      const trendingHashtags = await trendingService.getTrendingHashtags(filters);
      setHashtags(trendingHashtags);
    } catch (err: any) {
      setError(err.message || 'Failed to load trending hashtags');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (timeRange: string) => {
    setFilters(prev => ({ ...prev, timeRange: timeRange as any }));
  };

  const displayedHashtags = showAllHashtags ? hashtags : hashtags.slice(0, 10);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
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
            onClick={loadTrendingHashtags}
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
            <HashtagIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Trending Hashtags</h2>
          </div>
          <div className="text-sm text-gray-500">
            {trendingService.formatTimeRange(filters.timeRange || '24h')}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4">
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
          </div>
        )}
      </div>

      {/* Hashtags List */}
      <div className="divide-y divide-gray-200">
        {displayedHashtags.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <HashtagIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No trending hashtags found</p>
          </div>
        ) : (
          displayedHashtags.map((hashtag, index) => (
            <div
              key={hashtag.hashtag}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onHashtagClick?.(hashtag.hashtag)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Trending Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index < 3 
                      ? 'bg-gradient-to-r from-blue-400 to-purple-500 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Hashtag Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg font-semibold text-blue-600">
                        #{hashtag.hashtag}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        trendingService.getTrendingBadge(hashtag.score).color
                      }`}>
                        {trendingService.getTrendingBadge(hashtag.score).text}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{hashtag.postCount} posts</span>
                      <span>•</span>
                      <span>{trendingService.formatScore(hashtag.score)} score</span>
                    </div>
                  </div>
                </div>

                {/* Trending Indicator */}
                <div className="flex-shrink-0">
                  <div className="flex items-center space-x-1">
                    <FireIcon className="w-4 h-4 text-orange-500" />
                    <span className={`text-sm font-bold ${trendingService.getScoreColor(hashtag.score)}`}>
                      {trendingService.formatScore(hashtag.score)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Show More/Less Button */}
      {hashtags.length > 10 && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button
            onClick={() => setShowAllHashtags(!showAllHashtags)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium mx-auto"
          >
            <span>{showAllHashtags ? 'Show Less' : `Show All ${hashtags.length} Hashtags`}</span>
            {showAllHashtags ? (
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

export default TrendingHashtags;
