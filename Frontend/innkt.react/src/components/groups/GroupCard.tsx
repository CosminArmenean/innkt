import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Group } from '../../services/social.service';
import { 
  UserGroupIcon, 
  UsersIcon, 
  ChatBubbleLeftRightIcon, 
  Cog6ToothIcon,
  CalendarIcon,
  TagIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface GroupCardProps {
  group: Group;
  currentUserId?: string;
  onJoin?: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
  onManage?: (groupId: string) => void;
  className?: string;
}

const GroupCard: React.FC<GroupCardProps> = ({
  group,
  currentUserId,
  onJoin,
  onLeave,
  onManage,
  className = ''
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleJoin = () => {
    if (onJoin) {
      onJoin(group.id);
    }
  };

  const handleLeave = () => {
    if (onLeave) {
      onLeave(group.id);
    }
  };

  const handleViewGroup = () => {
    console.log('View Group clicked for group:', group.id, group.name);
    navigate(`/groups/${group.id}`);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'public':
        return 'bg-green-100 text-green-800';
      case 'private':
        return 'bg-yellow-100 text-yellow-800';
      case 'secret':
        return 'bg-red-100 text-red-800';
      case 'educational':
        return 'bg-blue-100 text-blue-800';
      case 'family':
        return 'bg-purple-100 text-purple-800';
      case 'general':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVisibilityIcon = (type: string) => {
    switch (type) {
      case 'public':
        return <EyeIcon className="w-4 h-4 text-green-600" />;
      case 'private':
        return <EyeSlashIcon className="w-4 h-4 text-yellow-600" />;
      case 'secret':
        return <ShieldCheckIcon className="w-4 h-4 text-red-600" />;
      case 'educational':
        return <UserGroupIcon className="w-4 h-4 text-blue-600" />;
      case 'family':
        return <UserGroupIcon className="w-4 h-4 text-purple-600" />;
      case 'general':
        return <EyeIcon className="w-4 h-4 text-gray-600" />;
      default:
        return <EyeIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${className}`}>
      <div className="flex h-28">
        {/* Left Section - Avatar and Basic Info */}
        <div className="flex-shrink-0 w-16 p-3 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 overflow-hidden flex items-center justify-center shadow-lg">
            {group.avatar ? (
              <img 
                src={group.avatar} 
                alt={group.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserGroupIcon className="w-6 h-6 text-white" />
            )}
          </div>
        </div>

        {/* Center Section - Main Content */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                {group.name}
              </h3>
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex items-center space-x-1">
                  {getVisibilityIcon(group.type)}
                  <span className="text-xs text-gray-500 capitalize">{group.type}</span>
                </div>
                {group.isMember && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(group.memberRole)}`}>
                      {group.memberRole}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          {group.tags && group.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {group.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-medium"
                >
                  <TagIcon className="w-2 h-2 mr-1" />
                  {tag}
                </span>
              ))}
              {group.tags && group.tags.length > 2 && (
                <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-medium">
                  +{group.tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <UsersIcon className="w-3 h-3" />
                <span className="font-medium">{group.memberCount?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <ChatBubbleLeftRightIcon className="w-3 h-3" />
                <span className="font-medium">{group.postCount || '0'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <CalendarIcon className="w-3 h-3" />
              <span>{new Date(group.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex-shrink-0 w-24 p-3 flex flex-col justify-center space-y-2">
          {group.isMember ? (
            <>
              <button 
                onClick={handleViewGroup}
                className="w-full px-2 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
              >
                {t('groups.view')}
              </button>
              <div className="flex space-x-1">
                {onManage && (
                  <button
                    onClick={() => onManage(group.id)}
                    className="flex-1 px-1 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    title={t('groups.manageGroup')}
                  >
                    <Cog6ToothIcon className="w-3 h-3 mx-auto" />
                  </button>
                )}
                <button
                  onClick={handleLeave}
                  className="flex-1 px-1 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-xs"
                >
                  {t('groups.leave')}
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={handleJoin}
              className="w-full px-2 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
            >
              {t('groups.join')}
            </button>
          )}
        </div>
      </div>

      {/* Rules Preview - Only show if there are rules */}
      {group.rules && group.rules.length > 0 && (
        <div className="px-3 pb-3 border-t border-gray-100">
          <div className="pt-2">
            <div className="flex items-center space-x-1 mb-1">
              <ShieldCheckIcon className="w-3 h-3 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">{t('groups.rules')}</span>
            </div>
            <div className="space-y-0.5">
              {group.rules.slice(0, 1).map((rule) => (
                <div key={rule.id} className="text-xs text-gray-600 flex items-start">
                  <span className="text-gray-400 mr-1">•</span>
                  <span className="line-clamp-1">{rule.title}</span>
                </div>
              ))}
              {group.rules.length > 1 && (
                <div className="text-xs text-gray-500">
                  +{group.rules.length - 1} {t('groups.moreRules')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupCard;
