import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { socialService, Post } from '../../services/social.service';
import PWAStatus from '../pwa/PWAStatus';

const RightPanel: React.FC = () => {
  const { t } = useTranslation();
  const [activePost, setActivePost] = useState<string | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [postsResponse, trendingTopics] = await Promise.all([
        socialService.getPosts({ limit: 6 }),
        socialService.getTrendingTopics()
      ]);
      
      setRecentPosts(postsResponse.posts);
      setTrendingSearches(trendingTopics);
    } catch (error) {
      console.error('Failed to load right panel data:', error);
      // Set empty arrays as fallback
      setRecentPosts([]);
      setTrendingSearches([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-80 bg-gray-100 p-6 h-full flex flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto">
        {/* Recent Posts Carousel */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{t('social.recentPosts')}</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
            <span className="text-sm text-gray-600 font-medium">{t('social.recentPost')}</span>
          </div>
        </div>
        
        {/* Circular Profile Pictures */}
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {isLoading ? (
            <div className="flex space-x-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
              ))}
            </div>
          ) : recentPosts.length > 0 ? (
            recentPosts.map((post) => (
              <div key={post.id} className="flex-shrink-0">
                <button
                  onClick={() => setActivePost(activePost === post.id ? null : post.id)}
                  className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                    activePost === post.id 
                      ? 'border-purple-500 ring-2 ring-purple-200' 
                      : 'border-gray-300 hover:border-purple-400'
                  }`}
                >
                  <img
                    src={post.authorProfile?.avatar || '/api/placeholder/40/40'}
                    alt={post.authorProfile?.username || t('common.user')}
                    className="w-full h-full object-cover"
                  />
                </button>
                <p className="text-xs text-gray-600 text-center mt-1 truncate w-12">
                  {post.authorProfile?.username || t('common.user')}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">{t('social.noRecentPosts')}</p>
          )}
        </div>

        {/* Active Post Preview */}
        {activePost && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            {(() => {
              const post = recentPosts.find(p => p.id === activePost);
              return post ? (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <img
                      src={post.authorProfile?.avatar || '/api/placeholder/24/24'}
                      alt={post.authorProfile?.username || t('common.user')}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm font-medium text-gray-800">{post.authorProfile?.username || t('common.user')}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{post.content}</p>
                  {post.media && post.media.length > 0 && (
                    <img
                      src={post.media[0].url}
                      alt={post.media[0].altText || t('common.post')}
                      className="w-full h-32 object-cover rounded"
                    />
                  )}
                </div>
              ) : null;
            })()}
          </div>
        )}
        </div>
      </div>

      {/* Trending Searches */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('social.trendingSearches')}</h3>
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : trendingSearches.length > 0 ? (
            trendingSearches.map((trend, index) => (
              <div key={index} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg cursor-pointer transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <span className="text-sm font-medium text-gray-800">#{trend}</span>
                </div>
                <span className="text-xs text-gray-500">{t('common.trending')}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">{t('social.noTrendingTopics')}</p>
          )}
        </div>
        <button className="w-full mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium">
          {t('common.seeAllTrends')}
        </button>
      </div>

      {/* Friend Suggestions */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{t('social.friendSuggestions')}</h3>
          <Link to="/suggestions" className="text-sm text-purple-600 hover:text-purple-700">
            {t('common.seeAll')}
          </Link>
        </div>
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t('social.noSuggestionsAvailable')}</p>
          )}
        </div>
      </div>

      {/* Profile Activity - Removed mock data */}

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{t('social.upcomingEvents')}</h3>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-800">{t('social.friendsBirthday')}</p>
              <p className="text-xs text-gray-500">Jun 25, 2028</p>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0115 0v5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* System Status with Real-time Indicator */}
      <div className="bg-white rounded-lg p-4 shadow-sm mt-4 flex-shrink-0">
        <div className="text-center">
          <h3 className="text-sm font-medium text-gray-900 mb-3">{t('social.systemStatus')}</h3>
          
          {/* Real-time Connection Status */}
          <div className="flex items-center justify-center space-x-2 mb-3 p-2 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-gray-600 font-medium">{t('social.realtimeActive')}</span>
          </div>
          
          <PWAStatus showDetails={false} />
        </div>
      </div>

      {/* Version Information - Fixed at bottom */}
      <div className="bg-white rounded-lg p-4 shadow-sm mt-4 flex-shrink-0">
        <div className="text-center text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-2">
            <span>{t('common.version')}</span>
                <span className="font-mono font-semibold">1.0.9</span>
          </div>
          <div className="mt-1 text-xs">
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
