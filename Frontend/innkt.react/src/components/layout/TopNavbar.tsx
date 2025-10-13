import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMessaging } from '../../contexts/MessagingContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../providers/LanguageProvider';
import PostCreation from '../social/PostCreation';
import QuickSearch from '../search/QuickSearch';
import NotificationBell from '../notifications/NotificationBell';
import LanguageSelector from '../language/LanguageSelector';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  ChatBubbleLeftRightIcon, 
  Cog6ToothIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const TopNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { conversations, unreadCount, isLoading: messagesLoading } = useMessaging();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);

  const handleCreatePost = () => {
    setShowCreatePost(true);
  };

  const handlePostCreated = (post: any) => {
    setShowCreatePost(false);
    console.log('Post created:', post);
  };

  const handleMessages = () => {
    setShowMessages(!showMessages);
    setShowSettings(false);
    setShowAccount(false);
  };

  const handleSettings = () => {
    setShowSettings(!showSettings);
    setShowMessages(false);
    setShowAccount(false);
  };

  const handleAccount = () => {
    setShowAccount(!showAccount);
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
    <div ref={navbarRef} className={`bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-40 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex items-center justify-between">
        {isRTL ? (
          // RTL Layout: Profile/Settings -> Search -> Create Post
          <>
            {/* Left: Profile/Settings */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
              <NotificationBell />
              
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
              </div>

              <div className="relative">
                <button 
                  onClick={handleSettings}
                  className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Cog6ToothIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              <div className="relative">
                <button 
                  onClick={handleAccount}
                  className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Center: Search */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-4">
              <QuickSearch
                placeholder="Search for friends, groups, pages..."
                className="w-full"
                onUserSelect={(user) => {
                  console.log('Selected user:', user);
                }}
              />
            </div>

            {/* Right: Create Post */}
            <div>
              <button
                onClick={handleCreatePost}
                className="bg-purple-600 text-white px-2 sm:px-4 py-2 rounded-full flex items-center space-x-1 sm:space-x-2 hover:bg-purple-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">{t('social.createPost')}</span>
              </button>
            </div>
          </>
        ) : (
          // LTR Layout: Search -> Create Post -> Profile/Settings
          <>
            {/* Left: Search */}
            <div className="hidden md:flex flex-1 max-w-2xl">
              <QuickSearch
                placeholder="Search for friends, groups, pages..."
                className="w-full"
                onUserSelect={(user) => {
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

            {/* Right: Create Post + Profile/Settings */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 ml-2 sm:ml-4 md:ml-6">
              <button
                onClick={handleCreatePost}
                className="bg-purple-600 text-white px-2 sm:px-4 py-2 rounded-full flex items-center space-x-1 sm:space-x-2 hover:bg-purple-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">{t('social.createPost')}</span>
              </button>

              <NotificationBell />

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
              </div>

              <div className="relative">
                <button 
                  onClick={handleSettings}
                  className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Cog6ToothIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              <div className="relative">
                <button 
                  onClick={handleAccount}
                  className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">{t('social.createNewPost')}</h3>
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
