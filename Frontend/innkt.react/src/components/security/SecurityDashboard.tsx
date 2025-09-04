import React, { useState } from 'react';
import MFAManagement from './MFAManagement';
import APIKeyManagement from './APIKeyManagement';
import EncryptionTools from './EncryptionTools';

const SecurityDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'mfa' | 'api-keys' | 'encryption'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'mfa', label: 'MFA', icon: '🔐' },
    { id: 'api-keys', label: 'API Keys', icon: '🔑' },
    { id: 'encryption', label: 'Encryption', icon: '🔒' }
  ];

  const securityMetrics = {
    mfaEnabled: true,
    activeApiKeys: 3,
    lastSecurityScan: '2 hours ago',
    threatLevel: 'LOW',
    recentIncidents: 0
  };

  const recentActivity = [
    {
      id: '1',
      action: 'MFA enabled',
      timestamp: '2 hours ago',
      device: 'iPhone 13',
      location: 'New York, NY'
    },
    {
      id: '2',
      action: 'API key created',
      timestamp: '1 day ago',
      device: 'Web Dashboard',
      location: 'New York, NY'
    },
    {
      id: '3',
      action: 'Login from new device',
      timestamp: '3 days ago',
      device: 'MacBook Pro',
      location: 'San Francisco, CA'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Security Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🔐</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">MFA Status</h3>
                <p className={`text-sm font-medium ${
                  securityMetrics.mfaEnabled ? 'text-green-600' : 'text-red-600'
                }`}>
                  {securityMetrics.mfaEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>

              <div className="card text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🔑</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Active API Keys</h3>
                <p className="text-2xl font-bold text-blue-600">{securityMetrics.activeApiKeys}</p>
              </div>

              <div className="card text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🛡️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Threat Level</h3>
                <p className="text-sm font-medium text-yellow-600">{securityMetrics.threatLevel}</p>
              </div>

              <div className="card text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Incidents</h3>
                <p className="text-2xl font-bold text-purple-600">{securityMetrics.recentIncidents}</p>
              </div>
            </div>

            {/* Security Recommendations */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Recommendations</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-500 text-lg">💡</span>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Enable Two-Factor Authentication</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Add an extra layer of security to your account with MFA
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <span className="text-green-500 text-lg">✅</span>
                  <div>
                    <p className="text-sm font-medium text-green-900">Regular Security Scans</p>
                    <p className="text-xs text-green-700 mt-1">
                      Your account was last scanned {securityMetrics.lastSecurityScan}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <span className="text-yellow-500 text-lg">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Review API Key Permissions</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Ensure your API keys have minimal required permissions
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Security Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-innkt-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">🔒</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">
                          {activity.device} • {activity.location}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{activity.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'mfa':
        return <MFAManagement />;

      case 'api-keys':
        return <APIKeyManagement />;

      case 'encryption':
        return <EncryptionTools />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-gray-600">Manage your account security and privacy settings</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-innkt-primary text-innkt-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SecurityDashboard;
