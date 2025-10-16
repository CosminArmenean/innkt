import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useLanguage } from '../providers/LanguageProvider';
import Logo from '../common/Logo';
import { convertToFullAvatarUrl } from '../../utils/avatarUtils';
import { 
  HomeIcon, 
  UsersIcon, 
  UserGroupIcon, 
  CogIcon, 
  ChatBubbleLeftRightIcon,
  UserIcon,
  ChevronDownIcon,
  PlusIcon,
  StarIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface LeftSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ collapsed, onToggle }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { counts } = useNotifications();
  const { isRTL } = useLanguage();
  const location = useLocation();
  const [showAdvancedMenu, setShowAdvancedMenu] = useState(false);

  const basicMenuItems = [
    { name: t('nav.social'), href: '/social', icon: HomeIcon, badge: counts.byType.like + counts.byType.comment + counts.byType.post_mention },
    { name: t('nav.search'), href: '/search', icon: MagnifyingGlassIcon },
    { name: t('nav.followers'), href: '/followers', icon: UsersIcon, badge: counts.byType.follow },
    { name: t('nav.groups'), href: '/groups', icon: UserGroupIcon, badge: counts.byType.group_invite },
    { name: t('nav.settings'), href: '/settings', icon: CogIcon },
    { name: t('nav.messaging'), href: '/messaging', icon: ChatBubbleLeftRightIcon, badge: counts.byType.message },
    { name: t('nav.profile'), href: `/profile/${user?.id}`, icon: UserIcon },
  ];

  const advancedMenuItems = [
    { name: t('nav.apis'), href: '/apis', icon: CogIcon },
    { name: t('nav.subscription'), href: '/subscription', icon: StarIcon },
    { name: t('nav.helpSupport'), href: '/support', icon: UserIcon },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className={`${collapsed ? 'w-16' : 'w-56'} text-white flex flex-col h-screen transition-all duration-300 ease-in-out left-sidebar bg-purple-600 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Logo and Toggle */}
      <div className="p-4 border-b border-purple-500 flex items-center justify-between">
        {!collapsed && (
          <Link to="/">
            <Logo variant="full" size="lg" color="white" />
          </Link>
        )}
        {collapsed && (
          <Link to="/">
            <Logo variant="icon" size="md" color="white" />
          </Link>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-purple-500 rounded-lg transition-colors"
        >
          {collapsed ? (
            <Bars3Icon className="h-5 w-5" />
          ) : (
            <XMarkIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Search Bar - Hidden when collapsed */}
      {!collapsed && (
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className={`w-full bg-purple-500 text-white placeholder-purple-200 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-purple-300 search-input ${isRTL ? 'rtl' : 'ltr'}`}
            />
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none search-icon ${isRTL ? 'rtl' : 'ltr'}`}>
              <svg className="h-5 w-5 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Basic Menu Items */}
      <nav className="flex-1 px-2 space-y-1">
        {basicMenuItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center nav-item ${collapsed ? 'justify-center px-2 py-3' : 'justify-between px-4 py-3'} rounded-lg transition-colors ${
              isActive(item.href)
                ? 'accent-purple text-white'
                : 'text-purple-100 hover:bg-purple-500 hover:text-white'
            } ${isRTL ? 'rtl' : 'ltr'}`}
            title={collapsed ? item.name : undefined}
          >
            <div className={`flex items-center ${collapsed ? '' : 'space-x-3'} ${isRTL ? 'rtl' : 'ltr'}`}>
              <item.icon className="h-5 w-5" />
              {!collapsed && <span>{item.name}</span>}
            </div>
            {!collapsed && item.badge && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {item.badge}
              </span>
            )}
          </Link>
        ))}

        {/* Advanced Menu Toggle - Hidden when collapsed */}
        {!collapsed && (
          <>
            <button
              onClick={() => setShowAdvancedMenu(!showAdvancedMenu)}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-purple-100 hover:bg-purple-500 hover:text-white transition-colors"
            >
              <div className="flex items-center space-x-3">
                <CogIcon className="h-5 w-5" />
                <span>{t('nav.advanced')}</span>
              </div>
              <ChevronDownIcon className={`h-4 w-4 transition-transform ${showAdvancedMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Advanced Menu Items */}
            {showAdvancedMenu && (
              <div className="ml-4 space-y-1">
                {advancedMenuItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-purple-500 text-white'
                        : 'text-purple-200 hover:bg-purple-500 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </nav>

      {/* Go Pro Banner - Hidden when collapsed */}
      {!collapsed && (
        <div className="p-4">
          <div className="accent-purple rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <StarIcon className="h-5 w-5 text-yellow-400" />
              <span className="font-semibold">{t('nav.goPro')}</span>
            </div>
            <p className="text-sm text-purple-100 mb-3">
              {t('nav.unlimitedAccess')}
            </p>
            <button className="w-full bg-yellow-400 text-purple-800 font-semibold py-2 px-4 rounded-lg hover:bg-yellow-300 transition-colors">
              {t('nav.upgradeNow')}
            </button>
          </div>
        </div>
      )}

      {/* User Profile */}
      <div className="p-2 border-t border-purple-500">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-400 rounded-full flex items-center justify-center">
            {user?.profilePictureUrl && user.profilePictureUrl.trim() !== '' ? (
              <img 
                        src={convertToFullAvatarUrl(user.profilePictureUrl)!}
                alt="Profile" 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" 
                onLoad={() => console.log('LeftSidebar avatar loaded successfully:', user.profilePictureUrl)}
                onError={(e) => {
                  console.log('LeftSidebar avatar image failed to load:', user.profilePictureUrl);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              (() => {
                console.log('LeftSidebar: No avatar or empty avatar. User object:', user);
                return (
                  <span className="text-purple-800 font-semibold text-sm">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                );
              })()
            )}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-purple-200 truncate">
                  {user?.role === 'basic' ? t('nav.basicMember') : user?.role === 'premium' ? t('nav.premiumMember') : t('nav.admin')}
                </p>
              </div>
              <ChevronDownIcon className="h-4 w-4 text-purple-200" />
            </>
          )}
        </div>

        {/* Linked Accounts - Hidden when collapsed */}
        {!collapsed && user?.linkedAccounts && user.linkedAccounts.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-purple-200 font-medium">{t('nav.linkedAccounts')}</p>
            {user.linkedAccounts.map((account) => (
              <div key={account.id} className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center">
                  <img src={account.avatar} alt={account.platform} className="w-6 h-6 rounded-full" />
                </div>
                <span className="text-xs text-purple-200 truncate">{account.platform}</span>
              </div>
            ))}
          </div>
        )}

        {/* Kids Accounts - Hidden when collapsed */}
        {!collapsed && user?.kidsAccounts && user.kidsAccounts.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-purple-200 font-medium">{t('nav.kidsAccounts')}</p>
            {user.kidsAccounts.map((kid) => (
              <div key={kid.id} className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center">
                  <img src={kid.avatar} alt={kid.name} className="w-6 h-6 rounded-full" />
                </div>
                <span className="text-xs text-purple-200 truncate">{kid.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;
