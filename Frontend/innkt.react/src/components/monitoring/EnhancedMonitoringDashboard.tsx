import React, { useState } from 'react';
import SystemHealthDashboard from './SystemHealthDashboard';
import PerformanceAnalytics from './PerformanceAnalytics';
import SystemAdministration from './SystemAdministration';

const EnhancedMonitoringDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'health' | 'performance' | 'administration'>('health');

  const tabs = [
    { id: 'health', label: 'System Health', icon: '🏥', component: SystemHealthDashboard },
    { id: 'performance', label: 'Performance Analytics', icon: '📊', component: PerformanceAnalytics },
    { id: 'administration', label: 'System Administration', icon: '⚙️', component: SystemAdministration }
  ];

  const renderTabContent = () => {
    const TabComponent = tabs.find(tab => tab.id === activeTab)?.component;
    return TabComponent ? <TabComponent /> : null;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Monitoring & Analytics</h1>
          <p className="text-gray-600">Comprehensive system monitoring, performance analysis, and administrative controls</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-innkt-primary text-innkt-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default EnhancedMonitoringDashboard;



