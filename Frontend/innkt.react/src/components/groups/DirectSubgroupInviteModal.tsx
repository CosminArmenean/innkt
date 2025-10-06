import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserPlusIcon, AcademicCapIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { groupsService } from '../../services/groups.service';

interface DirectSubgroupInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  subgroupId: string;
  subgroupName: string;
  onInviteSent: () => void;
}

interface UserSearchResult {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isParent?: boolean;
}

const DirectSubgroupInviteModal: React.FC<DirectSubgroupInviteModalProps> = ({
  isOpen,
  onClose,
  groupId,
  subgroupId,
  subgroupName,
  onInviteSent
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setInviteMessage('');
    }
  }, [isOpen]);

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Search specifically for adult/parent users
      const results = await groupsService.searchUsers(query);
      // Filter for adult users (you might need to adjust this based on your user data structure)
      const adultUsers = results.filter(user => user.isParent !== false); // Assuming isParent is true for adults
      setSearchResults(adultUsers);
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
    try {
      const inviteData = {
        groupId: groupId,
        userId: selectedUser.id,
        message: inviteMessage,
        targetType: 'subgroup' as const,
        subgroupId: subgroupId
      };

      await groupsService.inviteUser(inviteData);
      onInviteSent();
      onClose();
    } catch (error) {
      console.error('Failed to send invite:', error);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <UserPlusIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Invite to {subgroupName}
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
          {/* Subgroup Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AcademicCapIcon className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">Direct Subgroup Invitation</h3>
            </div>
            <p className="text-sm text-blue-800">
              Invite a parent directly to this subgroup. They will need to select a kid account when accepting.
            </p>
          </div>

          {/* User Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search for parent/adult user:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                placeholder="Type username or display name..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
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
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {(user.displayName || user.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {user.displayName || user.username}
                      </div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </div>
                    {user.isParent && (
                      <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Parent
                      </div>
                    )}
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
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {(selectedUser.displayName || selectedUser.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {selectedUser.displayName || selectedUser.username}
                  </div>
                  <div className="text-sm text-gray-500">@{selectedUser.username}</div>
                </div>
                {selectedUser.isParent && (
                  <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Parent
                  </div>
                )}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Educational Group Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">
              Subgroup Invitation Process
            </h4>
            <div className="text-sm text-yellow-800 space-y-1">
              <p>• Parent will receive invitation to join this specific subgroup</p>
              <p>• They must select which kid account should join</p>
              <p>• Parent account will automatically join as shadow member</p>
              <p>• Kid account becomes the primary subgroup member</p>
            </div>
          </div>
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
            disabled={!selectedUser || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectSubgroupInviteModal;
