import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  UsersIcon, 
  UserGroupIcon, 
  ChatBubbleLeftRightIcon,
  UserIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const BottomNavigation: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Feed', href: '/social', icon: HomeIcon },
    { name: 'Search', href: '/search', icon: MagnifyingGlassIcon },
    { name: 'Followers', href: '/followers', icon: UsersIcon },
    { name: 'Groups', href: '/groups', icon: UserGroupIcon },
    { name: 'Messages', href: '/messaging', icon: ChatBubbleLeftRightIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:left-80 lg:right-80 bg-white border-t border-gray-200 px-2 py-1 z-50">
      <div className="flex items-center justify-around">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors ${
              isActive(item.href)
                ? 'text-purple-600 bg-purple-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
