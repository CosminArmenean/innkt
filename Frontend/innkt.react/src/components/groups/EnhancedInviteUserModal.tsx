import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserPlusIcon, AcademicCapIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { groupsService } from '../../services/groups.service';
import { SubgroupResponse } from '../../services/groups.service';

interface EnhancedInviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  groupCategory: string;
  subgroups: SubgroupResponse[];
  onInviteSent: (invitation?: any) => void;
  currentSubgroup?: SubgroupResponse | null; // Current context - null means main group
}

interface UserSearchResult {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

const EnhancedInviteUserModal: React.FC<EnhancedInviteUserModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  groupCategory,
  subgroups,
  onInviteSent,
  currentSubgroup
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteTarget, setInviteTarget] = useState<'main' | 'subgroup'>('main');
  const [selectedSubgroup, setSelectedSubgroup] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Reset form when modal opens/closes and auto-determine invitation target
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setInviteMessage('');
      
      // Auto-determine invitation target based on current context
      if (currentSubgroup) {
        setInviteTarget('subgroup');
        setSelectedSubgroup(currentSubgroup.id);
      } else {
        setInviteTarget('main');
        setSelectedSubgroup('');
      }
    }
  }, [isOpen, currentSubgroup]);

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await groupsService.searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser(user);
    setSearchQuery(user.displayName || user.username);
    setSearchResults([]);
  };

  const handleInvite = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    const inviteData = {
      groupId: groupId,
      userId: selectedUser.id,
      message: inviteMessage,
      targetType: inviteTarget,
      subgroupId: inviteTarget === 'subgroup' ? selectedSubgroup : undefined
    };
    
    try {
      console.log('Sending invite with data:', inviteData);
      console.log('Selected user:', selectedUser);
      
      await groupsService.inviteUser(inviteData);
      onInviteSent();
      onClose();
    } catch (error: any) {
      console.error('Failed to send invite:', error);
      console.error('Invite data that failed:', inviteData);
      
      // Extract error message from the response
      let errorMessage = 'Failed to send invitation. Please try again.';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isEducationalGroup = groupCategory?.toLowerCase() === 'education';

  console.log('🔍 EnhancedInviteUserModal render:', { isOpen, groupId, groupName, groupCategory });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <UserPlusIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Invite to {groupName}
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
          {/* Educational Group Features */}
          {isEducationalGroup && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <AcademicCapIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Educational Group Invitation</h3>
              </div>
              <p className="text-sm text-blue-800 mb-4">
                This is an educational group. The invitation will be sent to the location you're currently viewing.
              </p>
              
              {/* Invitation Target Display */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Inviting to:
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {currentSubgroup ? (
                        <UserGroupIcon className="w-6 h-6 text-blue-600" />
                      ) : (
                        <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-blue-900">
                        {currentSubgroup ? currentSubgroup.name : groupName}
                      </div>
                      <div className="text-xs text-blue-700">
                        {currentSubgroup ? 'Subgroup' : 'Main Group'}
                        {currentSubgroup && currentSubgroup.description && (
                          <span> • {currentSubgroup.description}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search for user:
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                placeholder="Type username or display name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 font-medium text-sm">
                          {(user.displayName || user.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {user.displayName || user.username}
                      </div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected User */}
          {selectedUser && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                {selectedUser.avatarUrl ? (
                  <img
                    src={selectedUser.avatarUrl}
                    alt={selectedUser.displayName}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-600 font-medium">
                      {(selectedUser.displayName || selectedUser.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedUser.displayName || selectedUser.username}
                  </div>
                  <div className="text-sm text-gray-500">@{selectedUser.username}</div>
                </div>
              </div>
            </div>
          )}

          {/* Invite Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invitation message (optional):
            </label>
            <textarea
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              placeholder="Add a personal message to the invitation..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Educational Group Info */}
          {isEducationalGroup && inviteTarget === 'subgroup' && selectedSubgroup && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <UserGroupIcon className="w-5 h-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-900">Subgroup Invitation</h4>
              </div>
              <p className="text-sm text-yellow-800">
                When this user accepts the invitation, they will be added to the selected subgroup. 
                If they are a parent, they will need to select which of their kid accounts should be added to the subgroup.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={!selectedUser || (inviteTarget === 'subgroup' && !selectedSubgroup) || isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedInviteUserModal;
