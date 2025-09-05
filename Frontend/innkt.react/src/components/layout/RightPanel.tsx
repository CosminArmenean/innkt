import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const RightPanel: React.FC = () => {
  const [activePost, setActivePost] = useState<number | null>(null);

  // Mock data for recent posts carousel
  const recentPosts = [
    {
      id: 1,
      user: { name: 'x_ae-23b', avatar: '/api/placeholder/40/40' },
      post: { content: 'Just finished an amazing project!', image: '/api/placeholder/300/200' }
    },
    {
      id: 2,
      user: { name: 'maisenpai', avatar: '/api/placeholder/40/40' },
      post: { content: 'Beautiful sunset today 🌅', image: '/api/placeholder/300/200' }
    },
    {
      id: 3,
      user: { name: 'saylortwift', avatar: '/api/placeholder/40/40' },
      post: { content: 'New music coming soon!', image: '/api/placeholder/300/200' }
    },
    {
      id: 4,
      user: { name: 'johndoe', avatar: '/api/placeholder/40/40' },
      post: { content: 'Working on something exciting', image: '/api/placeholder/300/200' }
    },
    {
      id: 5,
      user: { name: 'maryjane2', avatar: '/api/placeholder/40/40' },
      post: { content: 'Coffee break time ☕', image: '/api/placeholder/300/200' }
    },
    {
      id: 6,
      user: { name: 'obama', avatar: '/api/placeholder/40/40' },
      post: { content: 'Hope everyone is doing well!', image: '/api/placeholder/300/200' }
    }
  ];

  // Mock trending searches
  const trendingSearches = [
    { term: '#AI', count: '12.5K posts' },
    { term: '#MachineLearning', count: '8.2K posts' },
    { term: '#WebDevelopment', count: '6.7K posts' },
    { term: '#Design', count: '5.1K posts' },
    { term: '#Innovation', count: '4.3K posts' },
    { term: '#Tech', count: '3.8K posts' }
  ];

  return (
    <div className="w-80 bg-gray-100 p-6 space-y-6">
      {/* Recent Posts Carousel */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Posts</h3>
        
        {/* Circular Profile Pictures */}
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {recentPosts.map((post) => (
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
                  src={post.user.avatar}
                  alt={post.user.name}
                  className="w-full h-full object-cover"
                />
              </button>
              <p className="text-xs text-gray-600 text-center mt-1 truncate w-12">
                {post.user.name}
              </p>
            </div>
          ))}
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
                      src={post.user.avatar}
                      alt={post.user.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm font-medium text-gray-800">{post.user.name}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{post.post.content}</p>
                  <img
                    src={post.post.image}
                    alt="Post"
                    className="w-full h-32 object-cover rounded"
                  />
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>

      {/* Trending Searches */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Trending Searches</h3>
        <div className="space-y-3">
          {trendingSearches.map((trend, index) => (
            <div key={index} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                <span className="text-sm font-medium text-gray-800">{trend.term}</span>
              </div>
              <span className="text-xs text-gray-500">{trend.count}</span>
            </div>
          ))}
        </div>
        <button className="w-full mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium">
          See all trends
        </button>
      </div>

      {/* Friend Suggestions */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Friend Suggestions</h3>
          <Link to="/suggestions" className="text-sm text-purple-600 hover:text-purple-700">
            See All
          </Link>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Julia Smith', handle: '@juliasmith', avatar: '/api/placeholder/40/40' },
            { name: 'Vermillion D. Gray', handle: '@vermilliongray', avatar: '/api/placeholder/40/40' },
            { name: 'Mai Senpai', handle: '@maisenpai', avatar: '/api/placeholder/40/40' },
            { name: 'Azunyan U. Wu', handle: '@azunyandesu', avatar: '/api/placeholder/40/40' },
            { name: 'Oarack Babama', handle: '@obama21', avatar: '/api/placeholder/40/40' }
          ].map((friend, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={friend.avatar}
                  alt={friend.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{friend.name}</p>
                  <p className="text-xs text-gray-500">{friend.handle}</p>
                </div>
              </div>
              <button className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Activity */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Profile Activity</h3>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg font-bold text-green-600">+1,158</span>
            <span className="text-sm text-gray-600">Followers</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-green-600 font-medium">23% vs last month</span>
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            You gained a substantial amount of followers this month!
          </p>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Upcoming Events</h3>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-800">Friend's Birthday</p>
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
    </div>
  );
};

export default RightPanel;
