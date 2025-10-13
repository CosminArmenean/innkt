import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, MagnifyingGlassIcon, UserPlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { groupsService, InviteUserRequest, GroupInvitationResponse } from '../../services/groups.service';

interface InviteUserModalProps {
  groupId: string;
  groupName: string;
  onClose: () => void;
  onInvitationSent: (invitation: GroupInvitationResponse) => void;
}

interface UserSearchResult {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({
  groupId,
  groupName,
  onClose,
  onInvitationSent
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await groupsService.searchUsers(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Failed to search users:', error);
        setError('Failed to search users. Please try again.');
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser(user);
    setSearchQuery(user.username);
    setSearchResults([]);
  };

  const handleInvite = async () => {
    if (!selectedUser) {
      setError('Please select a user to invite.');
      return;
    }

    setIsInviting(true);
    setError(null);

    try {
      const request: InviteUserRequest = {
        groupId,
        userId: selectedUser.id,
        message: inviteMessage.trim() || undefined
      };

      const invitation = await groupsService.inviteUser(request);
      onInvitationSent(invitation);
      onClose();
    } catch (error) {
      console.error('Failed to send invitation:', error);
      setError('Failed to send invitation. Please try again.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <UserPlusIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Invite User</h2>
              <p className="text-sm text-gray-600">Invite someone to join {groupName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Search */}
          <div>
            <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 mb-2">
              Search for a user
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="user-search"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Type username or name (e.g., @teresa.lisbon)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isInviting}
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && !selectedUser && (
              <div className="mt-2 border border-gray-200 rounded-md bg-white shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.displayName} className="w-8 h-8 rounded-full" />
                        ) : (
                          <span className="text-sm font-medium text-purple-600">
                            {user.displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected User */}
            {selectedUser && (
              <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      {selectedUser.avatarUrl ? (
                        <img src={selectedUser.avatarUrl} alt={selectedUser.displayName} className="w-8 h-8 rounded-full" />
                      ) : (
                        <span className="text-sm font-medium text-purple-600">
                          {selectedUser.displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedUser.displayName}</p>
                      <p className="text-xs text-gray-500">@{selectedUser.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckIcon className="w-4 h-4 text-green-600" />
                    <button
                      onClick={handleClearSelection}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Invite Message */}
          <div>
            <label htmlFor="invite-message" className="block text-sm font-medium text-gray-700 mb-2">
              Personal message (optional)
            </label>
            <textarea
              id="invite-message"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Add a personal message to your invitation..."
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              disabled={isInviting}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isInviting}
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={!selectedUser || isInviting}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isInviting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <UserPlusIcon className="w-4 h-4" />
                <span>Send Invitation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteUserModal;
