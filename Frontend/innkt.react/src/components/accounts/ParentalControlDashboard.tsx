import React, { useState, useEffect } from 'react';
import { kinderService, MaturityScore } from '../../services/kinder.service';
import PasswordManagementPanel from './PasswordManagementPanel';
import MaturityAssessmentPanel from './MaturityAssessmentPanel';

interface Kid {
  id: string;
  username: string;
  displayName: string;
  age: number;
  maturityScore?: MaturityScore;
}

interface ParentalControlDashboardProps {
  kid: Kid;
  parentId: string;
  onClose: () => void;
}

const ParentalControlDashboard: React.FC<ParentalControlDashboardProps> = ({
  kid,
  parentId,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'password' | 'maturity' | 'time' | 'content'>('overview');
  const [maturityScore, setMaturityScore] = useState<MaturityScore | null>(null);
  const [timeRestrictions, setTimeRestrictions] = useState<any[]>([]);
  const [contentFilters, setContentFilters] = useState<any>(null);
  const [usageToday, setUsageToday] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [kid.id]);

  const loadData = async () => {
    try {
      // Load maturity score
      const score = await kinderService.getMaturityScore(kid.id);
      setMaturityScore(score);

      // Load other data
      // TODO: Add API calls for time restrictions, content filters, usage
    } catch (err) {
      console.error('Error loading parental control data:', err);
    }
  };

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'password', label: '🔐 Password', icon: '🔐' },
    { id: 'maturity', label: '📈 Maturity', icon: '📈' },
    { id: 'time', label: '⏰ Time', icon: '⏰' },
    { id: 'content', label: '🛡️ Content', icon: '🛡️' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Parental Controls</h2>
              <p className="text-gray-600 mt-1">
                Managing controls for {kid.displayName} (Age {kid.age})
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {maturityScore?.totalScore || 0}
                    </div>
                    <div className="text-sm text-gray-600">Maturity Score</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {maturityScore?.level.toUpperCase() || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Maturity Level</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {kid.age}
                    </div>
                    <div className="text-sm text-gray-600">Years Old</div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h4>
                  <p className="text-sm text-gray-600">Activity tracking coming soon...</p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveTab('password')}
                    className="bg-white border-2 border-purple-200 text-purple-600 py-3 px-4 rounded-lg hover:bg-purple-50 transition-colors font-medium"
                  >
                    🔐 Manage Password
                  </button>
                  <button
                    onClick={() => setActiveTab('maturity')}
                    className="bg-white border-2 border-blue-200 text-blue-600 py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                  >
                    📈 Update Assessment
                  </button>
                  <button
                    onClick={() => setActiveTab('time')}
                    className="bg-white border-2 border-yellow-200 text-yellow-600 py-3 px-4 rounded-lg hover:bg-yellow-50 transition-colors font-medium"
                  >
                    ⏰ Set Time Limits
                  </button>
                  <button
                    onClick={() => setActiveTab('content')}
                    className="bg-white border-2 border-green-200 text-green-600 py-3 px-4 rounded-lg hover:bg-green-50 transition-colors font-medium"
                  >
                    🛡️ Content Filters
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <PasswordManagementPanel
                kidAccountId={kid.id}
                parentId={parentId}
                kidName={kid.displayName}
                maturityLevel={maturityScore?.level || 'low'}
                onClose={() => setActiveTab('overview')}
              />
            )}

            {activeTab === 'maturity' && (
              <MaturityAssessmentPanel
                kidAccountId={kid.id}
                parentId={parentId}
                kidName={kid.displayName}
                kidAge={kid.age}
              />
            )}

            {activeTab === 'time' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Time Restrictions</h3>
                <p className="text-sm text-gray-600">Set daily time limits and allowed hours for {kid.displayName}</p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-700 text-sm">
                    ⚠️ Time restriction UI coming soon! API endpoints are ready.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Max Daily Time:</span>
                      <span className="text-sm font-medium text-gray-900">2 hours</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Allowed Hours:</span>
                      <span className="text-sm font-medium text-gray-900">6 AM - 8 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Content Filtering</h3>
                <p className="text-sm text-gray-600">Control what content {kid.displayName} can access</p>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700 text-sm">
                    ⚠️ Content filtering UI coming soon! API endpoints are ready.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Filter Level:</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        MODERATE
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Blocked Keywords:</span>
                      <span className="text-sm font-medium text-gray-900">0</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentalControlDashboard;

