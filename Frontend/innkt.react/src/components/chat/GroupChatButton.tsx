import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  UserGroupIcon, 
  PlusIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface LinkedAccount {
  id: string;
  name: string;
  username: string;
  avatar: string;
  platform: string;
  isActive: boolean;
}

interface GroupChatButtonProps {
  linkedAccounts: LinkedAccount[];
  onStartGroupChat: (accountIds: string[]) => void;
  className?: string;
}

const GroupChatButton: React.FC<GroupChatButtonProps> = ({ 
  linkedAccounts, 
  onStartGroupChat,
  className = '' 
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleStartGroupChat = () => {
    if (selectedAccounts.length >= 2) {
      onStartGroupChat(selectedAccounts);
      setSelectedAccounts([]);
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedAccounts([]);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
      >
        <UserGroupIcon className="h-5 w-5" />
        <span className="font-medium">{t('messaging.groupChat')}</span>
        <PlusIcon className="h-4 w-4" />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t('messaging.startGroupChat')}</h3>
              <button
                onClick={handleClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {t('messaging.selectAccountsForGroupChat')}
            </p>
          </div>

          {/* Account Selection */}
          <div className="p-4 max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {linkedAccounts.map((account) => (
                <label
                  key={account.id}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedAccounts.includes(account.id)}
                    onChange={() => handleAccountToggle(account.id)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <img
                    src={account.avatar}
                    alt={account.name}
                    className="w-10 h-10 rounded-full border-2 border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{account.name}</p>
                    <p className="text-sm text-gray-500 truncate">{account.username}</p>
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full mt-1">
                      {account.platform}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            {linkedAccounts.length === 0 && (
              <div className="text-center py-8">
                <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('messaging.noLinkedAccountsAvailable')}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {t('messaging.linkAccountsToStartGroupChats')}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {t('messaging.accountsSelected', { count: selectedAccounts.length })}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleStartGroupChat}
                  disabled={selectedAccounts.length < 2}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('messaging.startChat', { count: selectedAccounts.length })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleClose}
        />
      )}
    </div>
  );
};

export default GroupChatButton;
