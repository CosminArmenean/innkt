import React from 'react';
import { Group } from '../../services/social.service';
import { UserGroupIcon, UsersIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface GroupCardProps {
  group: Group;
  currentUserId?: string;
  onJoin?: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
  className?: string;
}

const GroupCard: React.FC<GroupCardProps> = ({
  group,
  currentUserId,
  onJoin,
  onLeave,
  className = ''
}) => {
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'public':
        return 'bg-green-100 text-green-800';
      case 'private':
        return 'bg-yellow-100 text-yellow-800';
      case 'secret':
        return 'bg-red-100 text-red-800';
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

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${className}`}>
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-r from-purple-500 to-blue-500 relative">
        {group.coverImage && (
          <img 
            src={group.coverImage} 
            alt={group.name}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Group Type Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(group.type)}`}>
            {group.type}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Group Avatar and Name */}
        <div className="flex items-start space-x-3 mb-4">
          <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 -mt-8 border-4 border-white">
            {group.avatar ? (
              <img 
                src={group.avatar} 
                alt={group.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <UserGroupIcon className="w-8 h-8 text-gray-600" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{group.name}</h3>
            <p className="text-sm text-gray-600 capitalize">{group.category}</p>
            
            {/* Member Role Badge */}
            {group.isMember && (
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getRoleColor(group.memberRole)}`}>
                {group.memberRole}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
          {group.description}
        </p>

        {/* Tags */}
        {group.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {group.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
            {group.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{group.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <UsersIcon className="w-4 h-4" />
              <span>{group.memberCount.toLocaleString()} members</span>
            </div>
            <div className="flex items-center space-x-1">
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              <span>{group.postCount} posts</span>
            </div>
          </div>
          
          <span className="text-xs">
            Created {new Date(group.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Action Button */}
        <div className="flex space-x-2">
          {group.isMember ? (
            <>
              <button className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">
                View Group
              </button>
              <button
                onClick={handleLeave}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Leave
              </button>
            </>
          ) : (
            <button
              onClick={handleJoin}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              Join Group
            </button>
          )}
        </div>

        {/* Rules Preview */}
        {group.rules.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Group Rules</h4>
            <div className="space-y-1">
              {group.rules.slice(0, 2).map((rule) => (
                <div key={rule.id} className="text-xs text-gray-600">
                  • {rule.title}
                </div>
              ))}
              {group.rules.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{group.rules.length - 2} more rules
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupCard;
