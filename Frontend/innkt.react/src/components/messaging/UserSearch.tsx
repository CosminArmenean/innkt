import React, { useState } from 'react';
import { socialService } from '../../services/social.service';
import { useMessaging } from '../../contexts/MessagingContext';
import { useAuth } from '../../contexts/AuthContext';

interface UserSearchProps {
  onUserSelect: (userId: string, displayName: string) => void;
  onClose: () => void;
}

interface SearchUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isVerified: boolean;
  isFollowing: boolean;
  isFollower: boolean;
}

const UserSearch: React.FC<UserSearchProps> = ({ onUserSelect, onClose }) => {
  const { createDirectConversation } = useMessaging();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search for users
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get current user ID from auth context
      const currentUserId = user?.id;
      
      if (!currentUserId) {
        setError('Please log in to search for users');
        return;
      }
      
      console.log('Searching users for query:', query, 'with userId:', currentUserId);
      
      // Get current user's followers and following
      const [followersResponse, followingResponse] = await Promise.all([
        socialService.getFollowers(currentUserId),
        socialService.getFollowing(currentUserId)
      ]);

      console.log('Followers response:', followersResponse);
      console.log('Following response:', followingResponse);

      const followers = followersResponse.followers || [];
      const following = followingResponse.following || [];

      console.log('Followers count:', followers.length);
      console.log('Following count:', following.length);

      // Combine followers and following, remove duplicates
      const allUsers = [...followers, ...following].reduce((acc, follow) => {
        // Extract user profile from follow object
        const userProfile = follow.follower || follow.following;
        if (!userProfile) return acc;
        
        if (!acc.find(u => u.id === userProfile.id)) {
          acc.push({
            id: userProfile.id,
            username: userProfile.username || 'Unknown',
            displayName: userProfile.displayName || 'Unknown User',
            avatarUrl: userProfile.avatarUrl,
            isVerified: userProfile.isVerified || false,
            isFollowing: following.some(f => f.following?.id === userProfile.id),
            isFollower: followers.some(f => f.follower?.id === userProfile.id)
          });
        }
        return acc;
      }, [] as SearchUser[]);

      console.log('All users before filtering:', allUsers);

      // Filter by search term
      const filteredUsers = allUsers.filter(user =>
        user.displayName.toLowerCase().includes(query.toLowerCase()) ||
        user.username.toLowerCase().includes(query.toLowerCase())
      );

      console.log('Filtered users:', filteredUsers);
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchUsers(value);
  };

  // Handle user selection
  const handleUserClick = async (user: SearchUser) => {
    try {
      // Create or find existing conversation
      const conversation = await createDirectConversation(user.id);
      onUserSelect(conversation.id, user.displayName);
      onClose();
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError('Failed to start conversation');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Start New Chat</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Search people you follow or who follow you..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoFocus
            />
            <div className="absolute right-3 top-2.5">
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {error && (
            <div className="p-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          {users.length === 0 && searchTerm && !isLoading && (
            <div className="p-4 text-gray-500 text-center">
              No users found matching "{searchTerm}". Make sure you have followers or are following someone.
            </div>
          )}

          {users.length === 0 && !searchTerm && !isLoading && (
            <div className="p-4 text-gray-500 text-center">
              <div className="text-sm mb-2">Start typing to search for people you follow or who follow you.</div>
              <div className="text-xs text-gray-400">You can only message people in your network.</div>
            </div>
          )}

          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user)}
              className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3 flex-shrink-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 text-sm font-medium">
                    {user.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {user.displayName}
                  </h3>
                  {user.isVerified && (
                    <span className="ml-1 text-blue-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">
                  @{user.username}
                </p>
                <div className="flex items-center mt-1">
                  {user.isFollowing && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                      Following
                    </span>
                  )}
                  {user.isFollower && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Follows you
                    </span>
                  )}
                </div>
              </div>

              {/* Chat Icon */}
              <div className="ml-2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Only people you follow or who follow you can be messaged
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserSearch;
