import React, { useState, useEffect } from 'react';
import { groupsService, GroupRoleResponse, GroupMemberResponse } from '../../services/groups.service';
import { GroupMember } from '../../services/social.service';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UsersIcon,
  UserGroupIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  CogIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

interface RoleManagementPanelProps {
  groupId: string;
  currentUserId: string;
  onRoleCreated?: (role: GroupRoleResponse) => void;
  onRoleUpdated?: (role: GroupRoleResponse) => void;
  onRoleDeleted?: (roleId: string) => void;
  onMemberRoleAssigned?: (memberId: string, roleId: string) => void;
}

interface CreateRoleFormData {
  name: string;
  alias: string;
  description: string;
  permissions: {
    canCreateTopics: boolean;
    canManageMembers: boolean;
    canManageRoles: boolean;
    canManageSubgroups: boolean;
    canPostAnnouncements: boolean;
    canModerateContent: boolean;
    canAccessAllSubgroups: boolean;
    canUseGrokAI: boolean;
    canUsePerpetualPhotos: boolean;
    canUsePaperScanning: boolean;
    canManageFunds: boolean;
    canSeeRealUsername: boolean;
  };
}

const RoleManagementPanel: React.FC<RoleManagementPanelProps> = ({
  groupId,
  currentUserId,
  onRoleCreated,
  onRoleUpdated,
  onRoleDeleted,
  onMemberRoleAssigned
}) => {
  const [roles, setRoles] = useState<GroupRoleResponse[]>([]);
  const [members, setMembers] = useState<(GroupMemberResponse | GroupMember)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState<GroupRoleResponse | null>(null);
  
  // New state for improved member management
  const [showMemberAssignment, setShowMemberAssignment] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  
  // State for role-specific member assignment
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const [roleMemberAssignments, setRoleMemberAssignments] = useState<{[roleId: string]: string[]}>({});
  const [formData, setFormData] = useState<CreateRoleFormData>({
    name: '',
    alias: '',
    description: '',
    permissions: {
      canCreateTopics: false,
      canManageMembers: false,
      canManageRoles: false,
      canManageSubgroups: false,
      canPostAnnouncements: false,
      canModerateContent: false,
      canAccessAllSubgroups: false,
      canUseGrokAI: true,
      canUsePerpetualPhotos: false,
      canUsePaperScanning: false,
      canManageFunds: false,
      canSeeRealUsername: false
    }
  });

  useEffect(() => {
    loadRoles();
    loadMembers();
  }, [groupId]);

  const loadRoles = async () => {
    try {
      setIsLoading(true);
      const response = await groupsService.getGroupRoles(groupId);
      setRoles(response);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      setIsLoadingMembers(true);
      const response = await groupsService.getGroupMembers(groupId);
      // Handle both GroupMember[] and GroupMemberResponse[] types
      const allMembers = Array.isArray(response) ? response : (response as any).members || [];
      
      // Filter out kid accounts - only show main group members (adults)
      const mainGroupMembers = allMembers.filter((member: any) => {
        // Only filter out actual kid accounts, but keep parent accounts
        // Parent accounts can have roles assigned to them
        return !member.kidAccountId && !member.kidId;
      });
      
      console.log('🔍 Loaded main group members:', mainGroupMembers.length, 'out of', allMembers.length);
      setMembers(mainGroupMembers);
      
      // Load existing role assignments from member data
      const assignments: {[roleId: string]: string[]} = {};
      mainGroupMembers.forEach((member: any) => {
        if (member.assignedRoleId) {
          if (!assignments[member.assignedRoleId]) {
            assignments[member.assignedRoleId] = [];
          }
          assignments[member.assignedRoleId].push(member.id);
        }
      });
      setRoleMemberAssignments(assignments);
      console.log('🔍 Loaded role assignments:', assignments);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newRole = await groupsService.createGroupRole({
        groupId,
        name: formData.name,
        alias: formData.alias,
        description: formData.description,
        canCreateTopics: formData.permissions.canCreateTopics,
        canManageMembers: formData.permissions.canManageMembers,
        canManageRoles: formData.permissions.canManageRoles,
        canManageSubgroups: formData.permissions.canManageSubgroups,
        canPostAnnouncements: formData.permissions.canPostAnnouncements,
        canModerateContent: formData.permissions.canModerateContent,
        canAccessAllSubgroups: formData.permissions.canAccessAllSubgroups,
        canUseGrokAI: formData.permissions.canUseGrokAI,
        canUsePerpetualPhotos: formData.permissions.canUsePerpetualPhotos,
        canUsePaperScanning: formData.permissions.canUsePaperScanning,
        canManageFunds: formData.permissions.canManageFunds,
        canSeeRealUsername: formData.permissions.canSeeRealUsername
      });
      
      setRoles(prev => [...prev, newRole]);
      onRoleCreated?.(newRole);
      
      // Reset form
      setFormData({
        name: '',
        alias: '',
        description: '',
        permissions: {
          canCreateTopics: false,
          canManageMembers: false,
          canManageRoles: false,
          canManageSubgroups: false,
          canPostAnnouncements: false,
          canModerateContent: false,
          canAccessAllSubgroups: false,
          canUseGrokAI: true,
          canUsePerpetualPhotos: false,
          canUsePaperScanning: false,
          canManageFunds: false,
          canSeeRealUsername: false
        }
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create role:', error);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    try {
      const updatedRole = await groupsService.updateGroupRole(editingRole.id, {
        name: formData.name,
        alias: formData.alias,
        description: formData.description,
        canCreateTopics: formData.permissions.canCreateTopics,
        canManageMembers: formData.permissions.canManageMembers,
        canManageRoles: formData.permissions.canManageRoles,
        canManageSubgroups: formData.permissions.canManageSubgroups,
        canPostAnnouncements: formData.permissions.canPostAnnouncements,
        canModerateContent: formData.permissions.canModerateContent,
        canAccessAllSubgroups: formData.permissions.canAccessAllSubgroups,
        canUseGrokAI: formData.permissions.canUseGrokAI,
        canUsePerpetualPhotos: formData.permissions.canUsePerpetualPhotos,
        canUsePaperScanning: formData.permissions.canUsePaperScanning,
        canManageFunds: formData.permissions.canManageFunds,
        canSeeRealUsername: formData.permissions.canSeeRealUsername
      });
      
      setRoles(prev => prev.map(role => role.id === editingRole.id ? updatedRole : role));
      onRoleUpdated?.(updatedRole);
      
      setEditingRole(null);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      await groupsService.deleteGroupRole(roleId);
      setRoles(prev => prev.filter(role => role.id !== roleId));
      onRoleDeleted?.(roleId);
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  const handleEditRole = (role: GroupRoleResponse) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      alias: role.alias || '',
      description: role.description || '',
      permissions: {
        canCreateTopics: role.canCreateTopics,
        canManageMembers: role.canManageMembers,
        canManageRoles: role.canManageRoles,
        canManageSubgroups: role.canManageSubgroups,
        canPostAnnouncements: role.canPostAnnouncements,
        canModerateContent: role.canModerateContent,
        canAccessAllSubgroups: role.canAccessAllSubgroups,
        canUseGrokAI: role.canUseGrokAI,
        canUsePerpetualPhotos: role.canUsePerpetualPhotos,
        canUsePaperScanning: role.canUsePaperScanning,
        canManageFunds: role.canManageFunds,
        canSeeRealUsername: role.canSeeRealUsername
      }
    });
    setShowCreateForm(true);
  };

  const handleAssignRole = async (memberId: string, roleId: string) => {
    try {
      await groupsService.assignRoleToMember({
        groupId,
        memberId,
        roleId
      });
      
      // Update member in local state
      setMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, roleId, roleName: roles.find(r => r.id === roleId)?.name || (member as any).roleName }
          : member
      ));
      
      onMemberRoleAssigned?.(memberId, roleId);
    } catch (error) {
      console.error('Failed to assign role:', error);
    }
  };

  const cancelEdit = () => {
    setEditingRole(null);
    setShowCreateForm(false);
    setFormData({
      name: '',
      alias: '',
      description: '',
      permissions: {
        canCreateTopics: false,
        canManageMembers: false,
        canManageRoles: false,
        canManageSubgroups: false,
        canPostAnnouncements: false,
        canModerateContent: false,
        canAccessAllSubgroups: false,
        canUseGrokAI: true,
        canUsePerpetualPhotos: false,
        canUsePaperScanning: false,
        canManageFunds: false,
        canSeeRealUsername: false
      }
    });
  };

  // Helper function to get proper user display name
  const getUserDisplayName = (member: any): string => {
    // Try different possible fields for user name
    if (member.user?.displayName) return member.user.displayName;
    if (member.user?.username) return member.user.username;
    if (member.userName) return member.userName;
    if (member.username) return member.username;
    if (member.displayName) return member.displayName;
    if (member.user?.firstName && member.user?.lastName) {
      return `${member.user.firstName} ${member.user.lastName}`;
    }
    if (member.firstName && member.lastName) {
      return `${member.firstName} ${member.lastName}`;
    }
    return 'Unknown User';
  };

  // Helper function to get user role
  const getUserRole = (member: any): string => {
    return member.roleName || member.role || 'Member';
  };

  // Filter members based on search term
  const filteredMembers = members.filter((member) => {
    const displayName = getUserDisplayName(member).toLowerCase();
    const searchTerm = memberSearchTerm.toLowerCase();
    return displayName.includes(searchTerm);
  });

  // Get members assigned to a specific role
  const getRoleMembers = (roleId: string): (GroupMemberResponse | GroupMember)[] => {
    const assignedMemberIds = roleMemberAssignments[roleId] || [];
    return members.filter(member => assignedMemberIds.includes(member.id));
  };

  // Get available members for a role (not already assigned to this role)
  const getAvailableMembersForRole = (roleId: string): (GroupMemberResponse | GroupMember)[] => {
    const assignedMemberIds = roleMemberAssignments[roleId] || [];
    return members.filter(member => !assignedMemberIds.includes(member.id));
  };

  // Add member to role
  const addMemberToRole = async (roleId: string, memberId: string) => {
    console.log('🎯 addMemberToRole called:', { roleId, memberId });
    
    const currentAssignments = roleMemberAssignments[roleId] || [];
    if (currentAssignments.length >= 3) {
      alert('Maximum 3 members per role allowed');
      return;
    }
    
    try {
      // Find the member to get their userId
      const member = members.find(m => m.id === memberId);
      if (!member) {
        alert('❌ Member not found');
        return;
      }
      
      // Get userId from member (handle both GroupMemberResponse and GroupMember types)
      const memberUserId = 'userId' in member ? member.userId : member.profile?.id || memberId;
      console.log('🎯 Member details:', { member, memberUserId });
      
      // Call the API to assign the role
      console.log('🎯 Calling assignRoleToMember API:', { groupId, memberId: memberUserId, roleId });
      await groupsService.assignRoleToMember({
        groupId,
        memberId: memberUserId,
        roleId
      });
      
      console.log('✅ API call successful');
      
      // Update local state
      setRoleMemberAssignments(prev => ({
        ...prev,
        [roleId]: [...currentAssignments, memberId]
      }));
      
      // Show success notification
      alert('✅ Role assigned successfully!');
      
      // Reload members to get updated data
      await loadMembers();
    } catch (error) {
      console.error('❌ Failed to assign role to member:', error);
      alert('❌ Failed to assign role. Please try again.');
    }
  };

  // Remove member from role
  const removeMemberFromRole = async (roleId: string, memberId: string) => {
    console.log('🎯 removeMemberFromRole called:', { roleId, memberId });
    
    try {
      // To remove a role, we need to find the member's userId
      const member = members.find(m => m.id === memberId);
      if (!member) {
        alert('❌ Member not found');
        return;
      }
      
      // Get userId from member (handle both GroupMemberResponse and GroupMember types)
      const memberUserId = 'userId' in member ? member.userId : member.profile?.id || memberId;
      console.log('🎯 Member details for removal:', { member, memberUserId });
      
      // Assign null roleId to remove custom role
      console.log('🎯 Calling assignRoleToMember API to remove role:', { groupId, memberId: memberUserId, roleId: '' });
      await groupsService.assignRoleToMember({
        groupId,
        memberId: memberUserId,
        roleId: '' // Empty string will be converted to null on backend
      });
      
      console.log('✅ Role removal API call successful');
      
      // Update local state
      setRoleMemberAssignments(prev => ({
        ...prev,
        [roleId]: (prev[roleId] || []).filter(id => id !== memberId)
      }));
      
      // Show success notification
      alert('✅ Role removed successfully!');
      
      // Reload members to get updated data
      await loadMembers();
    } catch (error) {
      console.error('❌ Failed to remove role from member:', error);
      alert('❌ Failed to remove role. Please try again.');
    }
  };

  // Toggle role expansion
  const toggleRoleExpansion = (roleId: string) => {
    setExpandedRoleId(expandedRoleId === roleId ? null : roleId);
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
          <p className="text-gray-600">Create and manage roles with specific permissions</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Create Role
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingRole ? 'Edit Role' : 'Create New Role'}
          </h3>
          
          <form onSubmit={editingRole ? handleUpdateRole : handleCreateRole} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Role Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="e.g., Math Teacher"
                />
              </div>

              <div>
                <label htmlFor="alias" className="block text-sm font-medium text-gray-700">
                  Display Alias
                </label>
                <input
                  type="text"
                  id="alias"
                  value={formData.alias}
                  onChange={(e) => setFormData(prev => ({ ...prev, alias: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="e.g., Math Teacher"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Describe the role's responsibilities"
              />
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Permissions</h4>
              
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(formData.permissions).map(([key, value]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, [key]: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                {editingRole ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Roles List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Existing Roles</h3>
        </div>
        
        {roles.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No roles</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new role with specific permissions.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Create Role
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {roles.map((role) => {
              const roleMembers = getRoleMembers(role.id);
              const availableMembers = getAvailableMembersForRole(role.id);
              const isExpanded = expandedRoleId === role.id;
              
              return (
                <div key={role.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {role.name}
                            </h4>
                            {role.alias && role.alias !== role.name && (
                              <span className="text-xs text-gray-500">({role.alias})</span>
                            )}
                            <span className="text-xs text-gray-500">
                              ({roleMembers.length}/3 members)
                            </span>
                          </div>
                          {role.description && (
                            <p className="text-sm text-gray-500 truncate">
                              {role.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {role.canCreateTopics && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Create Topics
                              </span>
                            )}
                            {role.canManageMembers && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Manage Members
                              </span>
                            )}
                            {role.canModerateContent && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                Moderate
                              </span>
                            )}
                            {role.canUseGrokAI && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                AI Access
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Edit role"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Delete role"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Expandable Member Assignment */}
                  <div className="mt-4">
                    <button
                      onClick={() => toggleRoleExpansion(role.id)}
                      className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-800 font-medium"
                    >
                      {isExpanded ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                      <span>
                        {isExpanded ? 'Hide' : 'Manage'} Members ({roleMembers.length}/3)
                      </span>
                    </button>
                    
                    {isExpanded && (
                      <div className="mt-4 pl-6 border-l-2 border-gray-200">
                        {/* Assigned Members */}
                        {roleMembers.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Assigned Members</h5>
                            <div className="space-y-2">
                              {roleMembers.map((member) => (
                                <div key={member.id} className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg">
                                  <div className="flex items-center space-x-2">
                                    <UserGroupIcon className="h-5 w-5 text-green-600" />
                                    <span className="text-sm font-medium text-gray-900">
                                      {getUserDisplayName(member)}
                                    </span>
                                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                      Assigned
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => removeMemberFromRole(role.id, member.id)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Available Members */}
                        {availableMembers.length > 0 && roleMembers.length < 3 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Available Members</h5>
                            <div className="space-y-2">
                              {availableMembers.slice(0, 10).map((member) => (
                                <div key={member.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center space-x-2">
                                    <UserGroupIcon className="h-5 w-5 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-900">
                                      {getUserDisplayName(member)}
                                    </span>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                      Available
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => addMemberToRole(role.id, member.id)}
                                    className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                  >
                                    Add to Role
                                  </button>
                                </div>
                              ))}
                              {availableMembers.length > 10 && (
                                <p className="text-xs text-gray-500 text-center">
                                  ... and {availableMembers.length - 10} more members
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {roleMembers.length >= 3 && (
                          <p className="text-sm text-gray-500">Maximum 3 members reached for this role</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


    </div>
  );
};

export default RoleManagementPanel;


