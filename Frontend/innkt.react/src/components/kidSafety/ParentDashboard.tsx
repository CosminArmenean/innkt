import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  BookOpen,
  Calendar,
  TrendingUp,
  Bell,
  Settings,
  Award,
  Heart,
  MessageCircle,
  UserPlus
} from 'lucide-react';

interface KidAccount {
  id: string;
  userId: string;
  age: number;
  safetyLevel: string;
  maxDailyTimeMinutes: number;
  currentMaturityScore: number;
  recentSafetyEvents: number;
  pendingApprovals: number;
  canAccessPlatform: boolean;
  dailyUsageMinutes: number;
  isWithinAllowedHours: boolean;
  displayName: string;
  avatarUrl?: string;
}

interface PendingApproval {
  id: string;
  requestType: string;
  targetUserId: string;
  targetUserName: string;
  targetUserAvatar?: string;
  safetyScore: number;
  createdAt: string;
  requestData: Record<string, any>;
}

interface SafetyInsight {
  insightType: string;
  title: string;
  description: string;
  severity: string;
  actionRequired: string;
  createdAt: string;
}

export const ParentDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [kidAccounts, setKidAccounts] = useState<KidAccount[]>([]);
  const [selectedKid, setSelectedKid] = useState<KidAccount | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [safetyInsights, setSafetyInsights] = useState<SafetyInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'insights' | 'settings'>('overview');

  useEffect(() => {
    loadParentDashboardData();
  }, []);

  const loadParentDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API calls
      
      // Mock data for development
      const mockKidAccounts: KidAccount[] = [
        {
          id: '1',
          userId: 'kid1',
          age: 12,
          safetyLevel: 'moderate',
          maxDailyTimeMinutes: 90,
          currentMaturityScore: 0.75,
          recentSafetyEvents: 0,
          pendingApprovals: 2,
          canAccessPlatform: true,
          dailyUsageMinutes: 45,
          isWithinAllowedHours: true,
          displayName: 'Emma Johnson',
          avatarUrl: '/api/placeholder/32/32'
        },
        {
          id: '2',
          userId: 'kid2',
          age: 8,
          safetyLevel: 'strict',
          maxDailyTimeMinutes: 60,
          currentMaturityScore: 0.65,
          recentSafetyEvents: 1,
          pendingApprovals: 0,
          canAccessPlatform: true,
          dailyUsageMinutes: 30,
          isWithinAllowedHours: true,
          displayName: 'Alex Johnson',
          avatarUrl: '/api/placeholder/32/32'
        }
      ];

      const mockPendingApprovals: PendingApproval[] = [
        {
          id: '1',
          requestType: 'follow',
          targetUserId: 'user123',
          targetUserName: 'Sarah Wilson',
          targetUserAvatar: '/api/placeholder/32/32',
          safetyScore: 0.85,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          requestData: { reason: 'Friend from school' }
        },
        {
          id: '2',
          requestType: 'message',
          targetUserId: 'user456',
          targetUserName: 'Teacher Johnson',
          targetUserAvatar: '/api/placeholder/32/32',
          safetyScore: 0.95,
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          requestData: { reason: 'Homework question' }
        }
      ];

      const mockSafetyInsights: SafetyInsight[] = [
        {
          insightType: 'behavior_trend',
          title: 'Improved Digital Citizenship',
          description: 'Emma has shown consistent improvement in online behavior over the past week.',
          severity: 'info',
          actionRequired: 'none',
          createdAt: new Date().toISOString()
        },
        {
          insightType: 'safety_improvement',
          title: 'Educational Engagement Up 25%',
          description: 'Both kids are spending more time on educational content this week.',
          severity: 'info',
          actionRequired: 'none',
          createdAt: new Date().toISOString()
        }
      ];

      setKidAccounts(mockKidAccounts);
      setSelectedKid(mockKidAccounts[0]);
      setPendingApprovals(mockPendingApprovals);
      setSafetyInsights(mockSafetyInsights);
    } catch (error) {
      console.error('Error loading parent dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (approvalId: string, approved: boolean, notes?: string) => {
    try {
      // TODO: API call to process approval
      console.log('Processing approval:', { approvalId, approved, notes });
      
      // Remove from pending approvals
      setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));
      
      // Update kid account pending count
      if (selectedKid) {
        setKidAccounts(prev => prev.map(kid => 
          kid.id === selectedKid.id 
            ? { ...kid, pendingApprovals: Math.max(0, kid.pendingApprovals - 1) }
            : kid
        ));
      }
    } catch (error) {
      console.error('Error processing approval:', error);
    }
  };

  const getSafetyLevelColor = (level: string) => {
    switch (level) {
      case 'strict': return 'text-red-600 bg-red-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'relaxed': return 'text-green-600 bg-green-100';
      case 'adaptive': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMaturityScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimeRemaining = (usedMinutes: number, maxMinutes: number) => {
    const remaining = Math.max(0, maxMinutes - usedMinutes);
    const hours = Math.floor(remaining / 60);
    const minutes = remaining % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading parent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Parent Dashboard</h1>
                <p className="text-sm text-gray-500">Comprehensive child safety monitoring</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
                <Bell className="h-6 w-6" />
                {pendingApprovals.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingApprovals.length}
                  </span>
                )}
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Kid Accounts */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Kids</h2>
              <div className="space-y-3">
                {kidAccounts.map((kid) => (
                  <button
                    key={kid.id}
                    onClick={() => setSelectedKid(kid)}
                    className={`w-full p-3 rounded-lg border transition-colors ${
                      selectedKid?.id === kid.id
                        ? 'border-purple-200 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={kid.avatarUrl || '/api/placeholder/40/40'}
                        alt={kid.displayName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">{kid.displayName}</p>
                        <p className="text-sm text-gray-500">Age {kid.age}</p>
                      </div>
                      {kid.pendingApprovals > 0 && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                          {kid.pendingApprovals}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedKid && (
              <>
                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                      {[
                        { key: 'overview', label: 'Overview', icon: Eye },
                        { key: 'approvals', label: 'Approvals', icon: CheckCircle, badge: pendingApprovals.length },
                        { key: 'insights', label: 'Insights', icon: TrendingUp },
                        { key: 'settings', label: 'Settings', icon: Settings }
                      ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                              activeTab === tab.key
                                ? 'border-purple-500 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span>{tab.label}</span>
                            {tab.badge && tab.badge > 0 && (
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                {tab.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Safety Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Safety Level</p>
                            <p className={`text-lg font-semibold capitalize px-3 py-1 rounded-full text-sm inline-block mt-1 ${getSafetyLevelColor(selectedKid.safetyLevel)}`}>
                              {selectedKid.safetyLevel}
                            </p>
                          </div>
                          <Shield className="h-8 w-8 text-purple-600" />
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Maturity Score</p>
                            <p className={`text-2xl font-bold ${getMaturityScoreColor(selectedKid.currentMaturityScore)}`}>
                              {Math.round(selectedKid.currentMaturityScore * 100)}%
                            </p>
                          </div>
                          <Award className="h-8 w-8 text-purple-600" />
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Time Remaining</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatTimeRemaining(selectedKid.dailyUsageMinutes, selectedKid.maxDailyTimeMinutes)}
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-purple-600" />
                        </div>
                      </div>
                    </div>

                    {/* Platform Status */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Access Status</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center space-x-3">
                          {selectedKid.canAccessPlatform ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : (
                            <XCircle className="h-6 w-6 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">Platform Access</p>
                            <p className="text-sm text-gray-500">
                              {selectedKid.canAccessPlatform ? 'Currently allowed' : 'Currently restricted'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          {selectedKid.isWithinAllowedHours ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : (
                            <Clock className="h-6 w-6 text-yellow-600" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">Time Restrictions</p>
                            <p className="text-sm text-gray-500">
                              {selectedKid.isWithinAllowedHours ? 'Within allowed hours' : 'Outside allowed hours'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                          <BookOpen className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">Educational Content Viewed</p>
                            <p className="text-sm text-green-700">Completed math lesson on fractions - 2 hours ago</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                          <Users className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-900">Safe Social Interaction</p>
                            <p className="text-sm text-blue-700">Participated in study group discussion - 4 hours ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'approvals' && (
                  <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Review and approve your child's connection requests
                      </p>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {pendingApprovals.length === 0 ? (
                        <div className="p-6 text-center">
                          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-900">All caught up!</p>
                          <p className="text-gray-500">No pending approval requests at this time.</p>
                        </div>
                      ) : (
                        pendingApprovals.map((approval) => (
                          <div key={approval.id} className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4">
                                <img
                                  src={approval.targetUserAvatar || '/api/placeholder/48/48'}
                                  alt={approval.targetUserName}
                                  className="w-12 h-12 rounded-full"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-medium text-gray-900">{approval.targetUserName}</h4>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      approval.safetyScore >= 0.8 
                                        ? 'bg-green-100 text-green-800'
                                        : approval.safetyScore >= 0.6
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      Safety: {Math.round(approval.safetyScore * 100)}%
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Wants to {approval.requestType} {selectedKid.displayName}
                                  </p>
                                  {approval.requestData.reason && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      Reason: {approval.requestData.reason}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-2">
                                    {new Date(approval.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleApprovalAction(approval.id, false)}
                                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                  Deny
                                </button>
                                <button
                                  onClick={() => handleApprovalAction(approval.id, true)}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  Approve
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'insights' && (
                  <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Safety Insights</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        AI-powered insights about your child's online behavior
                      </p>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {safetyInsights.map((insight, index) => (
                          <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div className={`p-2 rounded-full ${
                              insight.severity === 'info' ? 'bg-blue-100' : 
                              insight.severity === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                            }`}>
                              <TrendingUp className={`h-5 w-5 ${
                                insight.severity === 'info' ? 'text-blue-600' : 
                                insight.severity === 'warning' ? 'text-yellow-600' : 'text-red-600'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{insight.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(insight.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Safety Settings</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Configure safety and time restrictions for {selectedKid.displayName}
                      </p>
                    </div>
                    <div className="p-6">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Safety Level
                          </label>
                          <select 
                            value={selectedKid.safetyLevel}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="strict">Strict - Maximum protection</option>
                            <option value="moderate">Moderate - Balanced approach</option>
                            <option value="relaxed">Relaxed - More freedom</option>
                            <option value="adaptive">Adaptive - AI-adjusted</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Daily Time Limit
                          </label>
                          <div className="flex items-center space-x-4">
                            <input
                              type="range"
                              min="30"
                              max="300"
                              value={selectedKid.maxDailyTimeMinutes}
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-600 w-16">
                              {Math.floor(selectedKid.maxDailyTimeMinutes / 60)}h {selectedKid.maxDailyTimeMinutes % 60}m
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                            Cancel
                          </button>
                          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
