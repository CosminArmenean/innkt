import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MFAManagement from './MFAManagement';
import APIKeyManagement from './APIKeyManagement';
import EncryptionTools from './EncryptionTools';
import PageLayout from '../layout/PageLayout';
import ScrollableContent from '../layout/ScrollableContent';

const SecurityDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'mfa' | 'api-keys' | 'encryption'>('overview');

  const tabs = [
    { id: 'overview', label: t('security.overview'), icon: '📊' },
    { id: 'mfa', label: t('security.mfa'), icon: '🔐' },
    { id: 'api-keys', label: t('security.apiKeys'), icon: '🔑' },
    { id: 'encryption', label: t('security.encryption'), icon: '🔒' }
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

  const leftSidebar = (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => setActiveTab('mfa')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeTab === 'mfa'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🔐 Manage MFA
          </button>
          <button
            onClick={() => setActiveTab('api-keys')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeTab === 'api-keys'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🔑 API Keys
          </button>
          <button
            onClick={() => setActiveTab('encryption')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeTab === 'encryption'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🔒 Encryption Tools
          </button>
        </div>
      </div>

      {/* Security Status */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Security Status</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <span className="text-green-500">🔐</span>
            <div>
              <p className="text-sm font-medium text-green-900">MFA Enabled</p>
              <p className="text-xs text-green-700">Two-factor authentication active</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-blue-500">🔑</span>
            <div>
              <p className="text-sm font-medium text-blue-900">{securityMetrics.activeApiKeys} API Keys</p>
              <p className="text-xs text-blue-700">Active API keys</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
            <span className="text-yellow-500">🛡️</span>
            <div>
              <p className="text-sm font-medium text-yellow-900">Threat Level: {securityMetrics.threatLevel}</p>
              <p className="text-xs text-yellow-700">Last scan: {securityMetrics.lastSecurityScan}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const centerContent = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">{t('security.dashboard')}</h1>
        <p className="text-gray-600">{t('settings.privacySecurity')}</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex-shrink-0">
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
      <ScrollableContent>
        {renderTabContent()}
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

export default SecurityDashboard;
