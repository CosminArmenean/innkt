import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { socialService, UserProfile } from '../../services/social.service';
import PageLayout from '../layout/PageLayout';
import ScrollableContent from '../layout/ScrollableContent';

const Dashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      setIsLoading(true);
      const user = await socialService.getCurrentUserProfile();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load current user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { name: 'Create Post', icon: '✏️', href: '/create-post', color: 'bg-blue-500' },
    { name: 'Upload Image', icon: '📷', href: '/upload', color: 'bg-green-500' },
    { name: 'Security Check', icon: '🛡️', href: '/security', color: 'bg-red-500' },
    { name: 'QR Code', icon: '📱', href: '/qr', color: 'bg-purple-500' },
    { name: 'Groups', icon: '👥', href: '/groups', color: 'bg-yellow-500' },
    { name: 'Settings', icon: '⚙️', href: '/settings', color: 'bg-gray-500' }
  ];

  // Recent activity will be loaded from real data in the future
  const recentActivity: any[] = [];

  const leftSidebar = (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-innkt-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-white">
              {currentUser?.displayName?.charAt(0) || '👤'}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {currentUser?.displayName || 'User'}
          </h3>
          <p className="text-gray-600 mb-4">@{currentUser?.username || 'username'}</p>
          <Link
            to="/profile/me"
            className="btn-primary w-full"
          >
            View Profile
          </Link>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Stats</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Posts</span>
            <span className="font-semibold">24</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Followers</span>
            <span className="font-semibold">156</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Following</span>
            <span className="font-semibold">89</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Groups</span>
            <span className="font-semibold">12</span>
          </div>
        </div>
      </div>
    </div>
  );

  const centerContent = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your account.</p>
      </div>

      {/* Current User Info */}
      {currentUser && (
        <div className="mb-6 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Welcome back!</h3>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-innkt-primary rounded-full flex items-center justify-center">
                <span className="text-white text-xl">
                  {currentUser.displayName?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{currentUser.displayName}</h4>
                <p className="text-sm text-gray-600">@{currentUser.username}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <ScrollableContent>
        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-shadow duration-200"
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-2xl text-white">{action.icon}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{action.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">{activity.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.content}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                to="/activity"
                className="text-innkt-primary hover:text-innkt-dark text-sm font-medium"
              >
                View all activity →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/security"
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-innkt-primary hover:bg-innkt-primary hover:text-white transition-all duration-200"
              >
                <span className="text-xl">🛡️</span>
                <span className="font-medium">Security Center</span>
              </Link>
              <Link
                to="/groups"
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-innkt-primary hover:bg-innkt-primary hover:text-white transition-all duration-200"
              >
                <span className="text-xl">👥</span>
                <span className="font-medium">Groups</span>
              </Link>
              <Link
                to="/qr"
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-innkt-primary hover:bg-innkt-primary hover:text-white transition-all duration-200"
              >
                <span className="text-xl">📱</span>
                <span className="font-medium">QR Codes</span>
              </Link>
              <Link
                to="/settings"
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-innkt-primary hover:bg-innkt-primary hover:text-white transition-all duration-200"
              >
                <span className="text-xl">⚙️</span>
                <span className="font-medium">Settings</span>
              </Link>
            </div>
          </div>
        </div>
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

export default Dashboard;



