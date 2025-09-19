import React, { useState, useEffect } from 'react';
import { ParentDashboard } from './ParentDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { kidSafetyService } from '../../services/kidSafety.service';
import { Shield, Users, BookOpen, AlertTriangle } from 'lucide-react';

interface KidSafetyDashboardProps {
  className?: string;
}

export const KidSafetyDashboard: React.FC<KidSafetyDashboardProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<'parent' | 'kid' | 'unknown'>('unknown');
  const [loading, setLoading] = useState(true);
  const [kidAccountInfo, setKidAccountInfo] = useState<any>(null);

  useEffect(() => {
    if (user) {
      determineUserRole();
    }
  }, [user]);

  const determineUserRole = async () => {
    try {
      setLoading(true);
      
      // Check if current user is a kid account
      const isKidResponse = await kidSafetyService.isKidAccount(user!.id);
      
      if (isKidResponse.isKidAccount) {
        setUserRole('kid');
        setKidAccountInfo(isKidResponse);
      } else {
        // Check if user has any kid accounts (is a parent)
        // For now, assume they are a parent if not a kid
        // TODO: Implement proper parent check by looking for kid accounts
        setUserRole('parent');
      }
    } catch (error) {
      console.error('Error determining user role:', error);
      setUserRole('unknown');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading safety dashboard...</p>
        </div>
      </div>
    );
  }

  if (userRole === 'unknown') {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center max-w-md mx-auto">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Safety Dashboard Unavailable</h2>
          <p className="text-gray-600 mb-6">
            Unable to determine your safety dashboard access. Please contact support if this issue persists.
          </p>
          <button 
            onClick={determineUserRole}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (userRole === 'parent') {
    return <ParentDashboard />;
  }

  if (userRole === 'kid') {
    return <KidDashboard kidAccountInfo={kidAccountInfo} />;
  }

  return null;
};

// Kid Dashboard Component (simplified version for now)
const KidDashboard: React.FC<{ kidAccountInfo: any }> = ({ kidAccountInfo }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Safety Center</h1>
                <p className="text-sm text-gray-500">Stay safe and have fun learning!</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                kidAccountInfo.canAccessPlatform 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {kidAccountInfo.canAccessPlatform ? 'Online' : 'Restricted'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Safety Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Safety Level</h3>
                <p className="text-sm text-gray-500">Your protection is active</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Safety Level:</span>
                <span className="font-medium capitalize">{kidAccountInfo.safetyLevel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Age:</span>
                <span className="font-medium">{kidAccountInfo.age} years old</span>
              </div>
            </div>
          </div>

          {/* Learning Progress */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Learning</h3>
                <p className="text-sm text-gray-500">Keep up the great work!</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Educational Content:</span>
                <span className="font-medium text-green-600">Prioritized</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Safe Learning:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>

          {/* Friends & Connections */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Friends</h3>
                <p className="text-sm text-gray-500">Safe connections</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Parent Approval:</span>
                <span className="font-medium text-blue-600">Required</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Safe Network:</span>
                <span className="font-medium text-green-600">Protected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Tips */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-medium text-blue-900">Stay Safe Online</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Never share personal information like your address, phone number, or school name with strangers.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
              <BookOpen className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-medium text-green-900">Learn and Explore</h4>
                <p className="text-sm text-green-700 mt-1">
                  Focus on educational content and ask questions. Learning is the best adventure!
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
              <Users className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-medium text-purple-900">Talk to Parents</h4>
                <p className="text-sm text-purple-700 mt-1">
                  If something makes you uncomfortable, talk to your parents or a trusted adult immediately.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-medium text-yellow-900">Emergency Help</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Use the panic button if you ever feel scared or need help immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
