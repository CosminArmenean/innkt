import React, { useState, useEffect } from 'react';
import { Group, GroupMember } from '../../services/social.service';
import { groupsService, SubgroupResponse, GroupMemberResponse, GroupInvitationResponse } from '../../services/groups.service';
import CreateSubgroupModal from './CreateSubgroupModal';
import GroupRulesManagement from './GroupRulesManagement';
import InviteUserModal from './InviteUserModal';
import EnhancedInviteUserModal from './EnhancedInviteUserModal';
import NestedMemberDisplay from './NestedMemberDisplay';
import { PlusIcon, UserGroupIcon, AcademicCapIcon, Cog6ToothIcon, UserPlusIcon } from '@heroicons/react/24/outline';

interface GroupManagementPanelProps {
  group: Group;
  currentUserId?: string;
  onSubgroupCreated?: (subgroup: SubgroupResponse) => void;
  showOnlyTab?: 'overview' | 'subgroups' | 'members' | 'rules' | 'settings';
}

const GroupManagementPanel: React.FC<GroupManagementPanelProps> = ({ 
  group, 
  currentUserId, 
  onSubgroupCreated,
  showOnlyTab
}) => {
  const [subgroups, setSubgroups] = useState<SubgroupResponse[]>([]);
  const [members, setMembers] = useState<GroupMemberResponse[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateSubgroup, setShowCreateSubgroup] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [showEnhancedInvite, setShowEnhancedInvite] = useState(false);
  const [useNestedView, setUseNestedView] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'subgroups' | 'members' | 'rules' | 'settings'>('overview');

  useEffect(() => {
    loadSubgroups();
    loadMembers();
    loadInvitations();
  }, [group.id]);

  const loadSubgroups = async () => {
    try {
      const subgroupsData = await groupsService.getGroupSubgroups(group.id);
      setSubgroups(subgroupsData);
    } catch (error) {
      console.error('Failed to load subgroups:', error);
    }
  };

  const loadMembers = async () => {
    try {
      console.log('Loading members for group:', group.id);
      const membersData = await groupsService.getGroupMembers(group.id);
      console.log('Members data received:', membersData);
      setMembers(membersData);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      const invitationsData = await groupsService.getGroupInvitations(group.id);
      setInvitations(invitationsData.invitations);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    }
  };

  const handleInvitationSent = (invitation: GroupInvitationResponse) => {
    setInvitations(prev => [invitation, ...prev]);
    setShowInviteUser(false);
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await groupsService.cancelInvitation(group.id, invitationId);
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
    }
  };

  const handleSubgroupCreated = (subgroup: SubgroupResponse) => {
    setSubgroups(prev => [subgroup, ...prev]);
    setShowCreateSubgroup(false);
    if (onSubgroupCreated) {
      onSubgroupCreated(subgroup);
    }
  };

  const isAdmin = members.find(member => 
    member.userId === currentUserId && 
    member.role === 'admin'
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Group Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <UserGroupIcon className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Members</p>
              <p className="text-2xl font-semibold text-gray-900">{members.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <AcademicCapIcon className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Subgroups</p>
              <p className="text-2xl font-semibold text-gray-900">{subgroups.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Cog6ToothIcon className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Group Type</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{group.type}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Group Description */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Group</h3>
        <p className="text-gray-600">{group.description}</p>
        {group.tags && group.tags.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {group.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSubgroups = () => (
    <div className="space-y-4">
      {/* Subgroups Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Subgroups</h3>
        {isAdmin && (
          <button
            onClick={() => setShowCreateSubgroup(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Subgroup
          </button>
        )}
      </div>

      {/* Subgroups List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading subgroups...</div>
      ) : subgroups.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AcademicCapIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p>No subgroups created yet.</p>
          {isAdmin && (
            <p className="text-sm mt-2">Create your first subgroup to organize by grade level or subject.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subgroups.map((subgroup) => (
            <div key={subgroup.id} className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">{subgroup.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">Level {subgroup.level}</p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{subgroup.description}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <UserGroupIcon className="w-4 h-4 mr-1" />
                  {subgroup.membersCount} members
                </div>
                <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMembers = () => (
    <div className="space-y-6">
      {/* Header with Invite Button and View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">Members</h3>
          {group.category?.toLowerCase() === 'education' && (
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">View:</label>
              <button
                onClick={() => setUseNestedView(!useNestedView)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  useNestedView 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {useNestedView ? 'Nested (Parent-Kid)' : 'Standard'}
              </button>
            </div>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              if (group.category?.toLowerCase() === 'education') {
                setShowEnhancedInvite(true);
              } else {
                setShowInviteUser(true);
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Invite Members
          </button>
        )}
      </div>

      {/* Current Members */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading members...</div>
      ) : useNestedView && group.category?.toLowerCase() === 'education' ? (
          <NestedMemberDisplay
            members={members}
            currentUserId={currentUserId}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-900">Current Members ({members.length})</h4>
            </div>
            <div className="divide-y divide-gray-200">
              {members.map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {member.user?.avatarUrl ? (
                        <img className="h-10 w-10 rounded-full" src={member.user.avatarUrl} alt={member.user.displayName} />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-600 font-medium text-sm">
                            {member.user?.displayName?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {member.user?.displayName || 'Unknown User'}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">@{member.user?.username || 'unknown'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.role === 'admin' ? 'bg-yellow-100 text-yellow-800' :
                      member.role === 'moderator' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {member.role || 'member'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">Pending Invitations ({invitations.length})</h4>
          </div>
          <div className="divide-y divide-gray-200">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <UserPlusIcon className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {invitation.invitedBy?.displayName || 'Unknown User'}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      Invited by @{invitation.invitedBy?.username || 'unknown'}
                    </p>
                    {invitation.message && (
                      <p className="text-xs text-gray-400 mt-1">"{invitation.message}"</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Pending
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderRules = () => (
    <GroupRulesManagement
      groupId={group.id}
      currentUserId={currentUserId}
      isAdmin={!!isAdmin}
    />
  );

  const renderSettings = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Group Settings</h3>
      {isAdmin ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-gray-600">Group settings and rules management will be available here.</p>
          <p className="text-sm text-gray-500 mt-2">This feature is coming soon!</p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Only group administrators can access settings.</p>
        </div>
      )}
    </div>
  );

  // If showOnlyTab is specified, render only that tab content
  if (showOnlyTab) {
    switch (showOnlyTab) {
      case 'members':
        return (
          <div className="space-y-6">
            {renderMembers()}
            {/* Modals */}
            {showInviteUser && (
              <InviteUserModal
                groupId={group.id}
                groupName={group.name}
                onClose={() => setShowInviteUser(false)}
                onInvitationSent={handleInvitationSent}
              />
            )}
          </div>
        );
      case 'subgroups':
        return (
          <div className="space-y-6">
            {renderSubgroups()}
            {/* Modals */}
            {showCreateSubgroup && (
              <CreateSubgroupModal
                groupId={group.id}
                groupName={group.name}
                onClose={() => setShowCreateSubgroup(false)}
                onSubgroupCreated={handleSubgroupCreated}
              />
            )}
          </div>
        );
      case 'rules':
        return <div className="space-y-6">{renderRules()}</div>;
      case 'settings':
        return <div className="space-y-6">{renderSettings()}</div>;
      default:
        return <div className="space-y-6">{renderOverview()}</div>;
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('subgroups')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'subgroups'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Subgroups
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'members'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'rules'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Rules
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'settings'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Settings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'subgroups' && renderSubgroups()}
      {activeTab === 'members' && renderMembers()}
      {activeTab === 'rules' && renderRules()}
      {activeTab === 'settings' && renderSettings()}

      {/* Create Subgroup Modal */}
      {showCreateSubgroup && (
        <CreateSubgroupModal
          groupId={group.id}
          groupName={group.name}
          onClose={() => setShowCreateSubgroup(false)}
          onSubgroupCreated={handleSubgroupCreated}
        />
      )}

      {/* Invite User Modal */}
      {showInviteUser && (
        <InviteUserModal
          groupId={group.id}
          groupName={group.name}
          onClose={() => setShowInviteUser(false)}
          onInvitationSent={handleInvitationSent}
        />
      )}

      {/* Enhanced Invite User Modal for Educational Groups */}
      {showEnhancedInvite && (
        <EnhancedInviteUserModal
          isOpen={showEnhancedInvite}
          onClose={() => setShowEnhancedInvite(false)}
          groupId={group.id}
          groupName={group.name}
          groupCategory={group.category || ''}
          subgroups={subgroups}
          onInviteSent={() => handleInvitationSent({} as GroupInvitationResponse)}
        />
      )}
    </div>
  );
};

export default GroupManagementPanel;
