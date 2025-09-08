import React, { useState, useEffect } from 'react';
import { trendingService, TrendingPost, TrendingHashtag, TrendingUser } from '../../services/trending.service';
import TrendingPosts from './TrendingPosts';
import TrendingHashtags from './TrendingHashtags';
import TrendingUsers from './TrendingUsers';
import { 
  FireIcon, 
  HashtagIcon, 
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface TrendingDashboardProps {
  className?: string;
  onPostClick?: (post: TrendingPost) => void;
  onHashtagClick?: (hashtag: string) => void;
  onUserClick?: (user: TrendingUser) => void;
  onFollowClick?: (user: TrendingUser) => void;
}

const TrendingDashboard: React.FC<TrendingDashboardProps> = ({
  className = '',
  onPostClick,
  onHashtagClick,
  onUserClick,
  onFollowClick
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'hashtags' | 'users'>('posts');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadAlgorithmStats();
  }, []);

  const loadAlgorithmStats = async () => {
    try {
      const algorithmStats = await trendingService.getAlgorithmStats();
      setStats(algorithmStats);
    } catch (error) {
      console.error('Failed to load algorithm stats:', error);
    }
  };

  const tabs = [
    {
      id: 'posts' as const,
      name: 'Trending Posts',
      icon: FireIcon,
      color: 'text-orange-600'
    },
    {
      id: 'hashtags' as const,
      name: 'Trending Hashtags',
      icon: HashtagIcon,
      color: 'text-blue-600'
    },
    {
      id: 'users' as const,
      name: 'Trending Users',
      icon: UserGroupIcon,
      color: 'text-green-600'
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trending Dashboard</h1>
              <p className="text-gray-600">Discover what's hot right now</p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-5 h-5 text-gray-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {trendingService.getTimeRangeOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Algorithm Stats */}
        {stats && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AdjustmentsHorizontalIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Algorithm Parameters</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Log Base:</span>
                <span className="ml-1 font-medium">{stats.logBase}</span>
              </div>
              <div>
                <span className="text-gray-500">Time Decay:</span>
                <span className="ml-1 font-medium">{stats.timeDecay}s</span>
              </div>
              <div>
                <span className="text-gray-500">Score Weight:</span>
                <span className="ml-1 font-medium">{stats.scoreWeight}</span>
              </div>
              <div>
                <span className="text-gray-500">Comment Weight:</span>
                <span className="ml-1 font-medium">{stats.commentWeight}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
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
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className={`w-5 h-5 ${activeTab === tab.id ? tab.color : ''}`} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'posts' && (
            <TrendingPosts
              limit={20}
              showFilters={false}
              onPostClick={onPostClick}
            />
          )}

          {activeTab === 'hashtags' && (
            <TrendingHashtags
              limit={20}
              showFilters={false}
              onHashtagClick={onHashtagClick}
            />
          )}

          {activeTab === 'users' && (
            <TrendingUsers
              limit={20}
              showFilters={false}
              onUserClick={onUserClick}
              onFollowClick={onFollowClick}
            />
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FireIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Hot Posts</h3>
              <p className="text-sm text-gray-600">Posts with high engagement</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HashtagIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Trending Tags</h3>
              <p className="text-sm text-gray-600">Most popular hashtags</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Rising Users</h3>
              <p className="text-sm text-gray-600">Users gaining momentum</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingDashboard;
