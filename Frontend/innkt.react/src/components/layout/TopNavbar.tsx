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
import ThemeToggle from '../theme/ThemeToggle';
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
  
  // Debug: Force LTR layout for now to fix navbar issues
  const forceLTR = true;
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

  const handleNotificationClick = () => {
    // Close all other dropdowns when notification bell is clicked
    setShowMessages(false);
    setShowSettings(false);
    setShowAccount(false);
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
    <div ref={navbarRef} className={`border-b border-theme px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-40 h-16 top-navbar bg-purple-600 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex items-center justify-between h-full w-full">
        {isRTL && !forceLTR ? (
          // RTL Layout: Profile/Settings -> Search -> Create Post
          <>
            {/* Left: Profile/Settings */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
              <NotificationBell onNotificationClick={handleNotificationClick} />
              
              <div className="relative">
                <button 
                  onClick={handleMessages}
                  className="relative p-1.5 sm:p-2 text-white hover:text-purple-200 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
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
                  <div className="absolute right-0 mt-2 w-80 bg-gradient-to-br from-purple-800 to-indigo-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-white border-opacity-20">
                        <h3 className="text-sm font-medium text-white">{t('messaging.recentConversations')}</h3>
                      </div>
                      {conversations && conversations.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto">
                          {conversations.slice(0, 5).map((conversation) => (
                            <button
                              key={conversation.id}
                              onClick={() => {
                                navigate('/messaging');
                                setShowMessages(false);
                              }}
                              className="block w-full text-left px-4 py-3 hover:bg-white hover:bg-opacity-10 border-b border-white border-opacity-20"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                  <span className="text-purple-600 text-sm font-medium">
                                    {conversation.participants?.[0]?.displayName?.charAt(0) || 'U'}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">
                                    {conversation.participants?.[0]?.displayName} {conversation.participants?.[0]?.username}
                                  </p>
                                  <p className="text-xs text-purple-200 truncate">
                                    {conversation.lastMessage?.content || t('messaging.noMessages')}
                                  </p>
                                </div>
                                {conversation.unreadCount > 0 && (
                                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-3 text-center text-purple-200 text-sm">
                          {t('messaging.noConversations')}
                        </div>
                      )}
                      <div className="border-t border-white border-opacity-20 px-4 py-2">
                        <button
                          onClick={() => {
                            navigate('/messaging');
                            setShowMessages(false);
                          }}
                          className="w-full text-center text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                          {t('messaging.viewAll')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button 
                  onClick={handleSettings}
                  className="p-1.5 sm:p-2 text-white hover:text-purple-200 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <Cog6ToothIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                
                {/* Settings Dropdown */}
                {showSettings && (
                  <div className="absolute right-0 mt-2 w-48 bg-gradient-to-br from-purple-800 to-indigo-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => navigate('/settings')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white hover:bg-opacity-10"
                      >
                        {t('nav.settings')}
                      </button>
                      <button
                        onClick={() => navigate('/settings/language')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white hover:bg-opacity-10"
                      >
                        {t('settings.language')}
                      </button>
                      <div className="px-4 py-2">
                        <ThemeToggle showLabel={true} className="w-full justify-start" />
                      </div>
                      <button
                        onClick={() => navigate('/security')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white hover:bg-opacity-10"
                      >
                        {t('nav.security')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button 
                  onClick={handleAccount}
                  className="p-1.5 sm:p-2 text-white hover:text-purple-200 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                    {user?.profilePictureUrl && user.profilePictureUrl.trim() !== '' ? (
                      <img
                        src={user.profilePictureUrl}
                        alt={user.firstName || user.username || 'User'}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-8 h-8 rounded-full bg-purple-400 flex items-center justify-center ${user?.profilePictureUrl && user.profilePictureUrl.trim() !== '' ? 'hidden' : ''}`}>
                      <span className="text-white text-sm font-medium">
                        {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </div>
                </button>
                
                {/* Account Dropdown */}
                {showAccount && (
                  <div className="absolute right-0 mt-2 w-48 bg-gradient-to-br from-purple-800 to-indigo-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => navigate(`/profile/${user?.id}`)}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white hover:bg-opacity-10"
                      >
                        {t('nav.profile')}
                      </button>
                      <button
                        onClick={() => navigate('/settings')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white hover:bg-opacity-10"
                      >
                        {t('nav.settings')}
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        {t('auth.logout')}
                      </button>
                    </div>
                  </div>
                )}
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
                className="text-white px-2 sm:px-4 py-2 rounded-full flex items-center space-x-1 sm:space-x-2 hover:bg-purple-700 transition-colors bg-purple-500 border border-purple-400 shadow-lg"
              >
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="inline">{t('social.createPost')}</span>
              </button>
            </div>
          </>
        ) : (
          // LTR Layout: Search -> Create Post -> Profile/Settings
          <>
            {/* Left: Search */}
            <div className="flex flex-1 max-w-2xl">
              <QuickSearch
                placeholder="Search for friends, groups, pages..."
                className="w-full"
                onUserSelect={(user) => {
                  console.log('Selected user:', user);
                }}
              />
            </div>

            {/* Mobile Search Button - Hidden since we show search bar always */}
            <div className="hidden">
              <button className="p-2 text-white hover:text-purple-200 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors">
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Right: Create Post + Profile/Settings */}
            <div className="flex items-center space-x-2 md:space-x-4 ml-4">
              <button
                onClick={handleCreatePost}
                className="text-white px-2 sm:px-4 py-2 rounded-full flex items-center space-x-1 sm:space-x-2 hover:bg-purple-700 transition-colors bg-purple-500 border border-purple-400 shadow-lg"
              >
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="inline">{t('social.createPost')}</span>
              </button>

              <NotificationBell onNotificationClick={handleNotificationClick} />

              <div className="relative">
                <button 
                  onClick={handleMessages}
                  className="relative p-1.5 sm:p-2 text-white hover:text-purple-200 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
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
                  <div className="absolute right-0 mt-2 w-80 bg-gradient-to-br from-purple-800 to-indigo-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-white border-opacity-20">
                        <h3 className="text-sm font-medium text-white">{t('messaging.recentConversations')}</h3>
                      </div>
                      {conversations && conversations.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto">
                          {conversations.slice(0, 5).map((conversation) => (
                            <button
                              key={conversation.id}
                              onClick={() => {
                                navigate('/messaging');
                                setShowMessages(false);
                              }}
                              className="block w-full text-left px-4 py-3 hover:bg-white hover:bg-opacity-10 border-b border-white border-opacity-20"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                  <span className="text-purple-600 text-sm font-medium">
                                    {conversation.participants?.[0]?.displayName?.charAt(0) || 'U'}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">
                                    {conversation.participants?.[0]?.displayName} {conversation.participants?.[0]?.username}
                                  </p>
                                  <p className="text-xs text-purple-200 truncate">
                                    {conversation.lastMessage?.content || t('messaging.noMessages')}
                                  </p>
                                </div>
                                {conversation.unreadCount > 0 && (
                                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-3 text-center text-purple-200 text-sm">
                          {t('messaging.noConversations')}
                        </div>
                      )}
                      <div className="border-t border-white border-opacity-20 px-4 py-2">
                        <button
                          onClick={() => {
                            navigate('/messaging');
                            setShowMessages(false);
                          }}
                          className="w-full text-center text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                          {t('messaging.viewAll')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button 
                  onClick={handleSettings}
                  className="p-1.5 sm:p-2 text-white hover:text-purple-200 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <Cog6ToothIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                
                {/* Settings Dropdown */}
                {showSettings && (
                  <div className="absolute right-0 mt-2 w-48 bg-gradient-to-br from-purple-800 to-indigo-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => navigate('/settings')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white hover:bg-opacity-10"
                      >
                        {t('nav.settings')}
                      </button>
                      <button
                        onClick={() => navigate('/settings/language')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white hover:bg-opacity-10"
                      >
                        {t('settings.language')}
                      </button>
                      <div className="px-4 py-2">
                        <ThemeToggle showLabel={true} className="w-full justify-start" />
                      </div>
                      <button
                        onClick={() => navigate('/security')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white hover:bg-opacity-10"
                      >
                        {t('nav.security')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button 
                  onClick={handleAccount}
                  className="p-1.5 sm:p-2 text-white hover:text-purple-200 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                    {user?.profilePictureUrl && user.profilePictureUrl.trim() !== '' ? (
                      <img
                        src={user.profilePictureUrl}
                        alt={user.firstName || user.username || 'User'}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-8 h-8 rounded-full bg-purple-400 flex items-center justify-center ${user?.profilePictureUrl && user.profilePictureUrl.trim() !== '' ? 'hidden' : ''}`}>
                      <span className="text-white text-sm font-medium">
                        {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </div>
                </button>
                
                {/* Account Dropdown */}
                {showAccount && (
                  <div className="absolute right-0 mt-2 w-48 bg-gradient-to-br from-purple-800 to-indigo-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => navigate(`/profile/${user?.id}`)}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white hover:bg-opacity-10"
                      >
                        {t('nav.profile')}
                      </button>
                      <button
                        onClick={() => navigate('/settings')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white hover:bg-opacity-10"
                      >
                        {t('nav.settings')}
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        {t('auth.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('social.createNewPost')}</h3>
              <button
                onClick={() => setShowCreatePost(false)}
                className="p-2 text-gray-500 dark:text-purple-200 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white dark:hover:bg-opacity-10 rounded-full transition-colors"
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
