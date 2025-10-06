import React, { useState, useEffect } from 'react';
import { XMarkIcon, AcademicCapIcon, UserGroupIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { groupsService } from '../../services/groups.service';

interface EducationalInviteAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: {
    id: string;
    groupId: string;
    groupName: string;
    groupCategory: string;
    subgroupId?: string;
    subgroupName?: string;
    invitedBy: string;
    message?: string;
  };
  onInviteAccepted: () => void;
}

interface KidAccount {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  age?: number;
  grade?: string;
}

const EducationalInviteAcceptanceModal: React.FC<EducationalInviteAcceptanceModalProps> = ({
  isOpen,
  onClose,
  invitation,
  onInviteAccepted
}) => {
  const [kidAccounts, setKidAccounts] = useState<KidAccount[]>([]);
  const [selectedKidId, setSelectedKidId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingKids, setIsLoadingKids] = useState(false);
  const [error, setError] = useState<string>('');

  // Load kid accounts when modal opens
  useEffect(() => {
    if (isOpen) {
      loadKidAccounts();
    }
  }, [isOpen]);

  const loadKidAccounts = async () => {
    setIsLoadingKids(true);
    setError('');
    try {
      // This would call a service to get the parent's kid accounts
      const kids = await groupsService.getParentKidAccounts();
      setKidAccounts(kids);
      
      if (kids.length === 0) {
        setError('You need to create a kid account before joining this educational group.');
      }
    } catch (error) {
      console.error('Failed to load kid accounts:', error);
      setError('Failed to load kid accounts. Please try again.');
    } finally {
      setIsLoadingKids(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!selectedKidId) {
      setError('Please select a kid account to join this group.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await groupsService.acceptEducationalInvitation(invitation.id, {
        kidId: selectedKidId,
        groupId: invitation.groupId,
        subgroupId: invitation.subgroupId
      });
      
      onInviteAccepted();
      onClose();
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      setError('Failed to accept invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKidAccount = () => {
    // Redirect to kid account creation page
    window.open('/kid-account-creation', '_blank');
  };

  if (!isOpen) return null;

  const isSubgroupInvite = !!invitation.subgroupId;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <AcademicCapIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Educational Group Invitation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Invitation Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              You've been invited to join:
            </h3>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-blue-900">
                {invitation.groupName}
              </div>
              {isSubgroupInvite && (
                <div className="flex items-center space-x-2 text-blue-800">
                  <UserGroupIcon className="w-4 h-4" />
                  <span className="text-sm">Subgroup: {invitation.subgroupName}</span>
                </div>
              )}
              <div className="text-sm text-blue-700">
                Invited by: {invitation.invitedBy}
              </div>
              {invitation.message && (
                <div className="text-sm text-blue-700 mt-2 p-2 bg-blue-100 rounded">
                  "{invitation.message}"
                </div>
              )}
            </div>
          </div>

          {/* Educational Group Requirements */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-2">
                  Educational Group Requirements
                </h4>
                <div className="text-sm text-yellow-800 space-y-1">
                  <p>• You must select a kid account to join this group</p>
                  <p>• Your parent account will automatically join as a shadow member</p>
                  <p>• You'll have voting power but the kid account will be the primary member</p>
                  <p>• This invitation cannot be used without selecting a kid account</p>
                </div>
              </div>
            </div>
          </div>

          {/* Kid Account Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select which kid account should join this group:
            </label>
            
            {isLoadingKids ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading kid accounts...</p>
              </div>
            ) : kidAccounts.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Kid Accounts Found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  You need to create a kid account before joining this educational group.
                </p>
                <button
                  onClick={handleCreateKidAccount}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Kid Account
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {kidAccounts.map((kid) => (
                  <label
                    key={kid.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedKidId === kid.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="kidAccount"
                      value={kid.id}
                      checked={selectedKidId === kid.id}
                      onChange={(e) => setSelectedKidId(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex items-center space-x-3">
                      {kid.avatarUrl ? (
                        <img
                          src={kid.avatarUrl}
                          alt={kid.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {kid.displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {kid.displayName}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{kid.username}
                          {kid.age && ` • Age ${kid.age}`}
                          {kid.grade && ` • Grade ${kid.grade}`}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Parent Shadow Account Info */}
          {selectedKidId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">
                Parent Shadow Account
              </h4>
              <div className="text-sm text-green-800 space-y-1">
                <p>• Your parent account will automatically join as a shadow member</p>
                <p>• You'll have full voting and participation rights</p>
                <p>• You can monitor and guide your child's participation</p>
                <p>• You can switch between parent and kid views</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAcceptInvitation}
            disabled={!selectedKidId || isLoading || kidAccounts.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Joining...' : 'Join Group'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EducationalInviteAcceptanceModal;
