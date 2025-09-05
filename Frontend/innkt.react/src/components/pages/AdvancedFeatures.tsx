import React, { useState } from 'react';
import GroupManagement from '../groups/GroupManagement';
import KidAccountManagement from '../accounts/KidAccountManagement';
import BlockchainIntegration from '../blockchain/BlockchainIntegration';
import NotificationCenter from '../notifications/NotificationCenter';

const AdvancedFeatures: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'groups' | 'kid-accounts' | 'blockchain' | 'notifications'>('groups');
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // Mock user data - in real app this would come from auth context
  const currentUser = {
    id: 'user123',
    isVerified: true,
    isParent: true,
  };

  const tabs = [
    { id: 'groups', label: 'Group Management', icon: '👥', description: 'Manage communities and groups' },
    { id: 'kid-accounts', label: 'Kid Accounts', icon: '👶', description: 'Parental controls and kid account management' },
    { id: 'blockchain', label: 'Blockchain', icon: '⛓️', description: 'Verified posts and blockchain integration' },
    { id: 'notifications', label: 'Notifications', icon: '🔔', description: 'Real-time notifications and settings' },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'groups':
        return <GroupManagement userId={currentUser.id} />;
      case 'kid-accounts':
        return <KidAccountManagement parentId={currentUser.id} />;
      case 'blockchain':
        return <BlockchainIntegration userId={currentUser.id} isVerified={currentUser.isVerified} />;
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Notification Management</h2>
                <p className="text-gray-600">Manage your notification preferences and view recent notifications</p>
              </div>
              <button
                onClick={() => setShowNotificationCenter(true)}
                className="btn-primary"
              >
                View All Notifications
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-2xl">📱</span>
                  <h3 className="text-lg font-semibold text-gray-900">Push Notifications</h3>
                </div>
                <p className="text-gray-600 mb-4">Get instant notifications on your device</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Enabled</span>
                  <button className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    ON
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-2xl">📧</span>
                  <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
                </div>
                <p className="text-gray-600 mb-4">Receive notifications via email</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Enabled</span>
                  <button className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    ON
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-2xl">🔕</span>
                  <h3 className="text-lg font-semibold text-gray-900">Quiet Hours</h3>
                </div>
                <p className="text-gray-600 mb-4">Set quiet hours for notifications</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">10:00 PM - 8:00 AM</span>
                  <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    SET
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Advanced Features</h1>
          <p className="text-gray-600 mt-2">
            Access powerful features for managing your social network experience
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-innkt-primary text-innkt-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{tab.icon}</span>
                    <div className="text-left">
                      <div>{tab.label}</div>
                      <div className="text-xs text-gray-400">{tab.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {renderActiveTab()}
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Enhanced Security</h3>
            <p className="text-gray-600 text-sm">
              Advanced security features including MFA, API key management, and encryption tools.
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Integration</h3>
            <p className="text-gray-600 text-sm">
              AI-powered content processing, image enhancement, and smart recommendations.
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
            <p className="text-gray-600 text-sm">
              Comprehensive analytics and monitoring for system health and performance.
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl mb-4">🌐</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Global Features</h3>
            <p className="text-gray-600 text-sm">
              Multi-language support, RTL languages, and international accessibility.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:border-innkt-primary hover:bg-innkt-primary hover:bg-opacity-5 transition-colors">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm font-medium">Create Group</div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:border-innkt-primary hover:bg-innkt-primary hover:bg-opacity-5 transition-colors">
              <div className="text-2xl mb-2">👶</div>
              <div className="text-sm font-medium">Add Kid Account</div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:border-innkt-primary hover:bg-innkt-primary hover:bg-opacity-5 transition-colors">
              <div className="text-2xl mb-2">⛓️</div>
              <div className="text-sm font-medium">Blockchain Post</div>
            </button>
            <button 
              onClick={() => setShowNotificationCenter(true)}
              className="p-4 border border-gray-200 rounded-lg hover:border-innkt-primary hover:bg-innkt-primary hover:bg-opacity-5 transition-colors"
            >
              <div className="text-2xl mb-2">🔔</div>
              <div className="text-sm font-medium">View Notifications</div>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Center Modal */}
      <NotificationCenter 
        isOpen={showNotificationCenter} 
        onClose={() => setShowNotificationCenter(false)} 
      />
    </div>
  );
};

export default AdvancedFeatures;


