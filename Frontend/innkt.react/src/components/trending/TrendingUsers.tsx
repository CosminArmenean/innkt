import React, { useState, useEffect } from 'react';
import { trendingService, TrendingUser, TrendingFilters } from '../../services/trending.service';
import { 
  UserGroupIcon, 
  FireIcon, 
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';

interface TrendingUsersProps {
  className?: string;
  limit?: number;
  showFilters?: boolean;
  onUserClick?: (user: TrendingUser) => void;
  onFollowClick?: (user: TrendingUser) => void;
}

const TrendingUsers: React.FC<TrendingUsersProps> = ({
  className = '',
  limit = 15,
  showFilters = true,
  onUserClick,
  onFollowClick
}) => {
  const [users, setUsers] = useState<TrendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TrendingFilters>({
    limit,
    timeRange: '24h'
  });
  const [showAllUsers, setShowAllUsers] = useState(false);

  useEffect(() => {
    loadTrendingUsers();
  }, [filters]);

  const loadTrendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const trendingUsers = await trendingService.getTrendingUsers(filters);
      setUsers(trendingUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to load trending users');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (timeRange: string) => {
    setFilters(prev => ({ ...prev, timeRange: timeRange as any }));
  };

  const displayedUsers = showAllUsers ? users : users.slice(0, 10);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
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
            onClick={loadTrendingUsers}
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
            <UserGroupIcon className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Trending Users</h2>
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

      {/* Users List */}
      <div className="divide-y divide-gray-200">
        {displayedUsers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No trending users found</p>
          </div>
        ) : (
          displayedUsers.map((user, index) => (
            <div
              key={user.userId}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Trending Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index < 3 
                      ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.avatarUrl || '/default-avatar.png'}
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 
                            className="text-sm font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600"
                            onClick={() => onUserClick?.(user)}
                          >
                            {user.displayName}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            trendingService.getTrendingBadge(user.score).color
                          }`}>
                            {trendingService.getTrendingBadge(user.score).text}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>@{user.username}</span>
                          <span>•</span>
                          <span>{trendingService.formatScore(user.followersCount)} followers</span>
                          <span>•</span>
                          <span>{user.postCount} posts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {/* Trending Score */}
                  <div className="text-right mr-3">
                    <div className={`text-sm font-bold ${trendingService.getScoreColor(user.score)}`}>
                      {trendingService.formatScore(user.score)}
                    </div>
                    <div className="text-xs text-gray-500">score</div>
                  </div>

                  {/* Follow Button */}
                  <button
                    onClick={() => onFollowClick?.(user)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    <span>Follow</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Show More/Less Button */}
      {users.length > 10 && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button
            onClick={() => setShowAllUsers(!showAllUsers)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium mx-auto"
          >
            <span>{showAllUsers ? 'Show Less' : `Show All ${users.length} Users`}</span>
            {showAllUsers ? (
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

export default TrendingUsers;
