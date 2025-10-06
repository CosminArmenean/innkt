import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon, UserIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { groupsService, GroupMemberResponse } from '../../services/groups.service';

interface NestedMemberDisplayProps {
  members: GroupMemberResponse[];
  subgroupId?: string;
  currentUserId?: string;
  onRoleUpdate?: (memberId: string, newRole: string) => void;
}

interface KidAccount {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  age?: number;
  grade?: string;
}

interface ParentMember extends GroupMemberResponse {
  kidAccounts?: KidAccount[];
  isExpanded?: boolean;
  customRole?: string; // For tags like "President", "Parent Representative"
}

const NestedMemberDisplay: React.FC<NestedMemberDisplayProps> = ({
  members,
  subgroupId,
  currentUserId,
  onRoleUpdate
}) => {
  const [parentMembers, setParentMembers] = useState<ParentMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadNestedMembers();
  }, [members, subgroupId]);

  const loadNestedMembers = async () => {
    setIsLoading(true);
    try {
      // For now, treat all members as parents and try to load their kid accounts
      // In a real implementation, you would have parent/kid account indicators
      const nestedParents: ParentMember[] = [];

      for (const member of members) {
        // Load kid accounts for this member (assuming they might be a parent)
        let kidAccounts: KidAccount[] = [];
        try {
          // This would need to be implemented in the backend to get kid accounts for a specific parent
          // For now, we'll show empty kid accounts
          kidAccounts = [];
        } catch (error) {
          console.error('Failed to load kid accounts for parent:', error);
        }

        nestedParents.push({
          ...member,
          kidAccounts,
          isExpanded: false,
          customRole: getCustomRole(member.role)
        });
      }

      setParentMembers(nestedParents);
    } catch (error) {
      console.error('Failed to load nested members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCustomRole = (role: string): string => {
    
    // Map standard roles to more descriptive labels
    switch (role) {
      case 'admin':
        return 'Group Administrator';
      case 'moderator':
        return 'Moderator';
      case 'president':
        return 'President';
      case 'parent_rep':
        return 'Parent Representative';
      case 'treasurer':
        return 'Treasurer';
      case 'secretary':
        return 'Secretary';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const toggleExpanded = (parentId: string) => {
    setParentMembers(prev => 
      prev.map(parent => 
        parent.id === parentId 
          ? { ...parent, isExpanded: !parent.isExpanded }
          : parent
      )
    );
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'group administrator':
        return 'bg-red-100 text-red-800';
      case 'president':
        return 'bg-purple-100 text-purple-800';
      case 'parent representative':
      case 'parent_rep':
        return 'bg-green-100 text-green-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      case 'treasurer':
        return 'bg-yellow-100 text-yellow-800';
      case 'secretary':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {parentMembers.map((parent) => (
        <div key={parent.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Parent Member */}
          <div className="p-4 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => toggleExpanded(parent.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                {parent.isExpanded ? (
                  <ChevronDownIcon className="w-5 h-5" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5" />
                )}
              </button>

              <div className="flex-shrink-0">
                {parent.user?.avatarUrl ? (
                  <img
                    className="h-10 w-10 rounded-full"
                    src={parent.user.avatarUrl}
                    alt={parent.user.displayName}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {parent.user?.displayName?.charAt(0).toUpperCase() || 'P'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900">
                    {parent.user?.displayName || 'Unknown Parent'}
                  </p>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Parent
                  </span>
                </div>
                <p className="text-sm text-gray-500">@{parent.user?.username || 'unknown'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(parent.customRole || parent.role)}`}>
                {parent.customRole || parent.role}
              </span>
            </div>
          </div>

          {/* Kid Accounts (Nested) */}
          {parent.isExpanded && parent.kidAccounts && parent.kidAccounts.length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50">
              <div className="px-4 py-2">
                <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                  <AcademicCapIcon className="w-4 h-4 mr-1" />
                  Kid Accounts ({parent.kidAccounts.length})
                </h4>
                <div className="space-y-2">
                  {parent.kidAccounts.map((kid) => (
                    <div key={kid.id} className="flex items-center space-x-3 pl-4">
                      <div className="flex-shrink-0">
                        {kid.avatarUrl ? (
                          <img
                            className="h-8 w-8 rounded-full"
                            src={kid.avatarUrl}
                            alt={kid.displayName}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 font-medium text-xs">
                              {kid.displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {kid.displayName}
                        </p>
                        <p className="text-xs text-gray-500">@{kid.username}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Kid
                        </span>
                        {kid.age && (
                          <span className="text-xs text-gray-500">
                            Age {kid.age}
                          </span>
                        )}
                        {kid.grade && (
                          <span className="text-xs text-gray-500">
                            Grade {kid.grade}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* No Kids Message */}
          {parent.isExpanded && (!parent.kidAccounts || parent.kidAccounts.length === 0) && (
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-sm text-gray-500 text-center">
                No kid accounts in this subgroup
              </p>
            </div>
          )}
        </div>
      ))}

      {/* No Parents Message */}
      {parentMembers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <UserIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No parent members found</p>
        </div>
      )}
    </div>
  );
};

export default NestedMemberDisplay;
