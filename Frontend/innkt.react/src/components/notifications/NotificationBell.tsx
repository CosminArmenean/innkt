import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import { BellIcon } from '@heroicons/react/24/outline';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const { counts, isConnected } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
        title={t('nav.notifications')}
      >
        <BellIcon className="w-5 h-5" />
        
        {/* Unread Count Badge */}
        {counts.unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {counts.unread > 99 ? '99+' : counts.unread}
          </span>
        )}
        
        {/* Connection Status Indicator */}
        <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} title={isConnected ? t('common.connected') : t('common.disconnected')} />
      </button>

      {/* Notification Dropdown */}
      <NotificationDropdown
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
      />
    </div>
  );
};

export default NotificationBell;