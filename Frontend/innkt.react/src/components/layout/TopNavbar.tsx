import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMessaging } from '../../contexts/MessagingContext';
import { useNavigate } from 'react-router-dom';
import PostCreation from '../social/PostCreation';
import QuickSearch from '../search/QuickSearch';
import NotificationBell from '../notifications/NotificationBell';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  BellIcon, 
  ChatBubbleLeftRightIcon, 
  Cog6ToothIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const TopNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { conversations, unreadCount, isLoading: messagesLoading } = useMessaging();
  const navigate = useNavigate();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);

  const handleCreatePost = () => {
    // Navigate to social feed and trigger post creation expansion
    // For now, keep the existing modal behavior
    // TODO: Integrate with SocialFeed toggle when on social page
    setShowCreatePost(true);
  };

  const handlePostCreated = (post: any) => {
    setShowCreatePost(false);
    // Optionally refresh the feed or show success message
    console.log('Post created:', post);
  };

  const handleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowMessages(false);
    setShowSettings(false);
  };

  const handleMessages = () => {
    setShowMessages(!showMessages);
    setShowNotifications(false);
    setShowSettings(false);
  };

  const handleSettings = () => {
    setShowSettings(!showSettings);
    setShowNotifications(false);
    setShowMessages(false);
    setShowAccount(false);
  };

  const handleAccount = () => {
    setShowAccount(!showAccount);
    setShowNotifications(false);
    setShowMessages(false);
    setShowSettings(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowSettings(false);
    setShowAccount(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
        setShowMessages(false);
        setShowSettings(false);
        setShowAccount(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={navbarRef} className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Search Bar - Hidden on mobile */}
        <div className="hidden md:flex flex-1 max-w-2xl">
          <QuickSearch
            placeholder="Search for friends, groups, pages..."
            className="w-full"
            onUserSelect={(user) => {
              // TODO: Navigate to user profile
              console.log('Selected user:', user);
            }}
          />
        </div>

        {/* Mobile Search Button */}
        <div className="md:hidden">
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 ml-2 sm:ml-4 md:ml-6">
          {/* Create Post Button */}
          <button
            onClick={handleCreatePost}
            className="bg-purple-600 text-white px-2 sm:px-4 py-2 rounded-full flex items-center space-x-1 sm:space-x-2 hover:bg-purple-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Add New Post</span>
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* Messages */}
          <div className="relative">
            <button 
              onClick={handleMessages}
              className="relative p-1.5 sm:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            
            {/* Messages Dropdown */}
            {showMessages && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {messagesLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="mt-2 text-sm">Loading messages...</p>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">No conversations yet</p>
                      <p className="text-xs mt-1">Start a conversation with someone!</p>
                    </div>
                  ) : (
                    conversations.slice(0, 5).map((conversation, index) => (
                      <div 
                        key={conversation.id || `conversation-${index}`}
                        className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          navigate('/messaging', { state: { selectedConversationId: conversation.id } });
                          setShowMessages(false);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            {conversation.avatar ? (
                              <img 
                                src={conversation.avatar} 
                                alt={conversation.name || 'Conversation'}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-600 text-sm">
                                {conversation.name ? conversation.name.charAt(0).toUpperCase() : '👤'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {conversation.name || conversation.participants[0]?.displayName || 'Unknown User'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {conversation.lastMessage ? new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage?.content || 'No messages yet'}
                            </p>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 border-t border-gray-200">
                  <button 
                    className="w-full text-center text-sm text-purple-600 hover:text-purple-800"
                    onClick={() => {
                      navigate('/messaging');
                      setShowMessages(false);
                    }}
                  >
                    View all messages
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="relative">
            <button 
              onClick={handleSettings}
              className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Cog6ToothIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            
            {/* Settings Dropdown */}
            {showSettings && (
              <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                </div>
                <div className="py-2">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Account Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Privacy & Security
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/notifications');
                      setShowSettings(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Notifications
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Appearance
                  </button>
                  <hr className="my-2" />
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Account */}
          <div className="relative">
            <button 
              onClick={handleAccount}
              className="p-1 group relative"
              title="Account"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Profile"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-purple-200 group-hover:border-purple-400 transition-colors"
                  onError={(e) => {
                    console.log('Navbar avatar image failed to load:', user.avatar);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-600 rounded-full flex items-center justify-center group-hover:bg-purple-700 transition-colors">
                  <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              )}
              {/* Account tooltip */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Account
              </div>
            </button>
            
            {/* Account Settings Dropdown */}
            {showAccount && (
              <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{user?.firstName} {user?.lastName}</h3>
                      <p className="text-sm text-gray-500">@{user?.username || user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Account Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Privacy & Security
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/notifications');
                      setShowSettings(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Notifications
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Appearance
                  </button>
                  <hr className="my-2" />
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Create New Post</h3>
              <button
                onClick={() => setShowCreatePost(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <PostCreation 
                onPostCreated={handlePostCreated}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopNavbar;
