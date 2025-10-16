import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { groupsService, GroupRoleResponse, SubgroupWithRolesResponse, RoleWithSubgroupsResponse } from '../../services/groups.service';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import EnhancedInviteUserModal from './EnhancedInviteUserModal';
import CreateSubgroupModal from './CreateSubgroupModal';
import { 
  PlusIcon, 
  EyeIcon, 
  UserGroupIcon, 
  Cog6ToothIcon, 
  ChartBarIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';

interface SubgroupManagementPanelProps {
  groupId: string;
  groupName?: string;
  currentUserId?: string;
  onSubgroupCreated?: () => void;
  onClose?: () => void;
}

const SubgroupManagementPanel: React.FC<SubgroupManagementPanelProps> = ({
  groupId,
  groupName,
  currentUserId,
  onSubgroupCreated,
  onClose
}) => {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<RoleWithSubgroupsResponse[]>([]);
  const [subgroups, setSubgroups] = useState<SubgroupWithRolesResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedSubgroupForMembers, setSelectedSubgroupForMembers] = useState<SubgroupWithRolesResponse | null>(null);
  const [subgroupMembers, setSubgroupMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [subgroupInvitations, setSubgroupInvitations] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [editingSubgroup, setEditingSubgroup] = useState<SubgroupWithRolesResponse | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [subgroupToDelete, setSubgroupToDelete] = useState<SubgroupWithRolesResponse | null>(null);
  const [viewingSubgroup, setViewingSubgroup] = useState<SubgroupWithRolesResponse | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showCreateSubgroupModal, setShowCreateSubgroupModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [groupId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [rolesData, subgroupsData, groupData] = await Promise.all([
        groupsService.getRolesWithSubgroups(groupId),
        groupsService.getSubgroupsWithRoles(groupId),
        groupsService.getGroup(groupId)
      ]);
      
      setRoles(rolesData);
      setSubgroups(subgroupsData);
      setUserPermissions(groupData);
    } catch (err) {
      console.error('Failed to load subgroup management data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    console.log('🎯 Drag ended:', result);
    
    if (!result.destination) {
      console.log('❌ No destination, dropping outside');
      return;
    }

    const { source, destination, draggableId } = result;
    console.log('📍 Source:', source.droppableId, 'Destination:', destination.droppableId, 'DraggableId:', draggableId);
    
    // Only handle drag from roles to subgroups
    if (source.droppableId !== 'roles' || !destination.droppableId.startsWith('subgroup-')) {
      console.log('❌ Invalid drag operation - not from roles to subgroup');
      return;
    }

    const roleId = draggableId;
    const subgroupId = destination.droppableId.replace('subgroup-', ''); // Extract subgroup ID from "subgroup-{id}"
    console.log('🎯 Assigning role', roleId, 'to subgroup', subgroupId);

    try {
      setIsAssigning(true);
      
      // Assign role to subgroup
      await groupsService.assignRoleToSubgroup(groupId, subgroupId, roleId, {
        subgroupId: subgroupId,
        roleId: roleId,
        expiresAt: null,
        notes: null
      });

      console.log('✅ Role assigned successfully');
      // Reload data to reflect changes
      await loadData();
    } catch (err) {
      console.error('❌ Failed to assign role to subgroup:', err);
      setError('Failed to assign role. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveRole = async (subgroupId: string, roleId: string) => {
    try {
      await groupsService.removeRoleFromSubgroup(groupId, subgroupId, roleId);
      await loadData();
    } catch (err) {
      console.error('Failed to remove role from subgroup:', err);
      setError('Failed to remove role. Please try again.');
    }
  };

  const handleViewMembers = async (subgroup: SubgroupWithRolesResponse) => {
    setSelectedSubgroupForMembers(subgroup);
    setIsLoadingMembers(true);
    try {
      const [members, invitations] = await Promise.all([
        groupsService.getSubgroupMembers(groupId, subgroup.id),
        groupsService.getGroupInvitations(groupId, 1, 20, subgroup.id)
      ]);
      setSubgroupMembers(members);
      setSubgroupInvitations(invitations.invitations);
    } catch (error) {
      console.error('Failed to load subgroup data:', error);
      setError('Failed to load members. Please try again.');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleCloseMembersModal = () => {
    setSelectedSubgroupForMembers(null);
    setSubgroupMembers([]);
    setSubgroupInvitations([]);
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await groupsService.cancelInvitation(groupId, invitationId);
      // Refresh the subgroup invitations
      if (selectedSubgroupForMembers) {
        const invitations = await groupsService.getGroupInvitations(groupId, 1, 20, selectedSubgroupForMembers.id);
        setSubgroupInvitations(invitations.invitations);
      }
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      setError('Failed to cancel invitation. Please try again.');
    }
  };

  // Edit subgroup handler
  const handleEditSubgroup = (subgroup: SubgroupWithRolesResponse) => {
    setEditingSubgroup(subgroup);
    setEditFormData({
      name: subgroup.name,
      description: subgroup.description || ''
    });
    setShowEditModal(true);
  };

  // Delete subgroup handler
  const handleDeleteSubgroup = (subgroup: SubgroupWithRolesResponse) => {
    setSubgroupToDelete(subgroup);
    setShowDeleteConfirm(true);
  };

  // Confirm delete subgroup
  const confirmDeleteSubgroup = async () => {
    if (!subgroupToDelete) return;
    
    try {
      await groupsService.deleteSubgroup(groupId, subgroupToDelete.id);
      setShowDeleteConfirm(false);
      setSubgroupToDelete(null);
      loadData(); // Refresh the list
      if (onSubgroupCreated) onSubgroupCreated();
    } catch (error) {
      console.error('Failed to delete subgroup:', error);
      setError('Failed to delete subgroup');
    }
  };

  // View subgroup handler
  const handleViewSubgroup = (subgroup: SubgroupWithRolesResponse) => {
    setViewingSubgroup(subgroup);
    setShowViewModal(true);
  };

  // Settings subgroup handler
  const handleSettingsSubgroup = (subgroup: SubgroupWithRolesResponse) => {
    setViewingSubgroup(subgroup);
    setShowSettingsModal(true);
  };

  // Analytics subgroup handler
  const handleAnalyticsSubgroup = (subgroup: SubgroupWithRolesResponse) => {
    setViewingSubgroup(subgroup);
    setShowAnalyticsModal(true);
  };

  // Handle subgroup creation
  const handleSubgroupCreated = (subgroup: any) => {
    setShowCreateSubgroupModal(false);
    loadData(); // Refresh the list
    if (onSubgroupCreated) onSubgroupCreated();
  };

  // Save subgroup changes
  const handleSaveSubgroup = async () => {
    if (!editingSubgroup) return;
    
    try {
      setIsSaving(true);
      await groupsService.updateSubgroup(groupId, editingSubgroup.id, {
        name: editFormData.name,
        description: editFormData.description
      });
      
      setShowEditModal(false);
      setEditingSubgroup(null);
      loadData(); // Refresh the list
      if (onSubgroupCreated) onSubgroupCreated();
    } catch (error) {
      console.error('Failed to update subgroup:', error);
      setError('Failed to update subgroup');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form input changes
  const handleFormChange = (field: 'name' | 'description', value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadData}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('groups.subgroupManagement')}</h2>
          <p className="text-gray-600">Manage roles and subgroups for {groupName}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex h-[600px] overflow-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          {/* Left Panel - Roles (1/3) */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">📋 Available Roles</h3>
                <button className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors">
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <Droppable droppableId="roles">
                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-4 space-y-3 ${snapshot.isDraggingOver ? 'bg-purple-50' : ''}`}
                  >
                    {roles.map((role, index) => (
                      <Draggable key={role.id} draggableId={role.id} index={index}>
                        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 bg-white border border-gray-200 rounded-lg cursor-move transition-all ${
                              snapshot.isDragging ? 'shadow-lg rotate-2' : 'hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-purple-600">
                                  {role.alias ? role.alias.charAt(0).toUpperCase() : role.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {role.alias || role.name}
                                </h4>
                                <p className="text-sm text-gray-500 truncate">{role.name}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs text-gray-400">
                                    {role.assignmentCount} assignment{role.assignmentCount !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Role Permissions Preview */}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {role.canPostText && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">{t('groups.text')}</span>
                              )}
                              {role.canPostImages && (
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Images</span>
                              )}
                              {role.canPostPolls && (
                                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">Polls</span>
                              )}
                              {role.canPostVideos && (
                                <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Videos</span>
                              )}
                              {role.canPostAnnouncements && (
                                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">Announcements</span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>

          {/* Right Panel - Subgroups (2/3) */}
          <div className="w-2/3 flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">🏫 Subgroups</h3>
                <button 
                  onClick={() => setShowCreateSubgroupModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <PlusIcon className="w-4 h-4 inline mr-2" />
                  Create Subgroup
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {subgroups.map((subgroup) => (
                  <div key={subgroup.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    {/* Subgroup Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">🏫</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{subgroup.name}</h4>
                          <p className="text-sm text-gray-500">{subgroup.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEditSubgroup(subgroup)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit subgroup"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSubgroup(subgroup)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete subgroup"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Subgroup Stats */}
                    <div className="flex items-center space-x-4 mb-3 text-sm text-gray-500">
                      <span>👥 {subgroup.membersCount} members</span>
                      <span>🎭 {subgroup.activeRolesCount} roles</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        subgroup.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {subgroup.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Drop Zone for Roles */}
                    <Droppable droppableId={`subgroup-${subgroup.id}`}>
                      {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[100px] border-2 border-dashed rounded-lg p-4 transition-colors ${
                            snapshot.isDraggingOver 
                              ? 'border-purple-400 bg-purple-50' 
                              : 'border-gray-300 bg-gray-50'
                          }`}
                        >
                          <div className="text-center text-gray-500 mb-3">
                            {snapshot.isDraggingOver ? 'Drop role here' : 'Drag roles here to assign'}
                          </div>
                          
                          {/* Assigned Roles */}
                          <div className="space-y-2">
                            {subgroup.assignedRoles.map((assignment: any) => (
                              <div key={assignment.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-2">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-purple-600">
                                      {assignment.roleAlias ? assignment.roleAlias.charAt(0).toUpperCase() : assignment.roleName.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-900">
                                      {assignment.roleAlias || assignment.roleName}
                                    </span>
                                    {assignment.notes && (
                                      <p className="text-xs text-gray-500">{assignment.notes}</p>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveRole(subgroup.id, assignment.roleId)}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>

                    {/* Quick Actions */}
                    <div className="mt-4 flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewSubgroup(subgroup)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                        title="View subgroup details"
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button 
                        onClick={() => handleViewMembers(subgroup)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                        title="View subgroup members"
                      >
                        <UserGroupIcon className="w-4 h-4" />
                        <span>Members ({subgroup.membersCount})</span>
                      </button>
                      <button 
                        onClick={() => handleSettingsSubgroup(subgroup)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                        title="Subgroup settings"
                      >
                        <Cog6ToothIcon className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      <button 
                        onClick={() => handleAnalyticsSubgroup(subgroup)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                        title="Subgroup analytics"
                      >
                        <ChartBarIcon className="w-4 h-4" />
                        <span>Analytics</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DragDropContext>
      </div>

      {/* Loading Overlay */}
      {isAssigning && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="text-gray-700">Assigning role...</span>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {selectedSubgroupForMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">Subgroup</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedSubgroupForMembers.name} - Members
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {subgroupMembers.length} member{subgroupMembers.length !== 1 ? 's' : ''} in this subgroup
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {/* Invite Button - Show if user has manage members permission */}
                {(userPermissions?.canManageMembers || userPermissions?.memberRole === 'owner' || userPermissions?.memberRole === 'admin' || userPermissions?.memberRole === 'moderator') && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    <span>Invite</span>
                  </button>
                )}
                <button
                  onClick={handleCloseMembersModal}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Members List */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {isLoadingMembers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : subgroupMembers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <UserGroupIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p>No members in this subgroup yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subgroupMembers.map((member: any) => (
                    <div
                      key={member.userId || member.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">
                            {(member.username || member.displayName || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        {/* Member Info */}
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.username || member.displayName || 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-500 capitalize">
                            {member.role || 'Member'}
                            {member.isParentAccount && ' (Parent)'}
                            {member.kidAccountId && ' (Managing Kid Account)'}
                          </p>
                        </div>
                      </div>
                      {/* Role Badge */}
                      {member.assignedRoleId && member.roleName && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                          {member.roleName}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pending Invitations */}
              {subgroupInvitations.length > 0 && (
                <div className="p-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Pending Invitations ({subgroupInvitations.length})</h4>
                  <div className="space-y-3">
                    {subgroupInvitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                              <UserPlusIcon className="h-4 w-4 text-orange-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900">
                                {invitation?.invitedUser?.displayName || 'Unknown User'}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500">
                              Invited by @{invitation?.invitedBy?.username || 'unknown'}
                            </p>
                            {invitation?.message && (
                              <p className="text-xs text-gray-400 mt-1">"{invitation.message}"</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Pending
                          </span>
                          {/* Show cancel button for users who can manage invitations */}
                          {(userPermissions?.canManageMembers || userPermissions?.memberRole === 'owner' || userPermissions?.memberRole === 'admin' || userPermissions?.memberRole === 'moderator') && (
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to cancel this invitation?')) {
                                  handleCancelInvitation(invitation.id);
                                }
                              }}
                              className="inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              title="Cancel invitation"
                            >
                              <XMarkIcon className="w-3 h-3 mr-1" />
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

            {/* Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleCloseMembersModal}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && userPermissions && (
        <EnhancedInviteUserModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          groupId={groupId}
          groupName={userPermissions.name || groupName || 'Group'}
          groupCategory={userPermissions.category || ''}
          subgroups={subgroups.map(subgroup => ({
            id: subgroup.id,
            groupId: groupId,
            name: subgroup.name,
            description: subgroup.description,
            level: 1, // Default level for subgroups
            membersCount: subgroup.membersCount,
            isActive: subgroup.isActive,
            createdAt: subgroup.createdAt,
            updatedAt: subgroup.createdAt // Use createdAt as fallback
          }))}
          currentSubgroup={selectedSubgroupForMembers ? {
            id: selectedSubgroupForMembers.id,
            groupId: groupId,
            name: selectedSubgroupForMembers.name,
            description: selectedSubgroupForMembers.description,
            level: 1,
            membersCount: selectedSubgroupForMembers.membersCount,
            isActive: selectedSubgroupForMembers.isActive,
            createdAt: selectedSubgroupForMembers.createdAt,
            updatedAt: selectedSubgroupForMembers.createdAt
          } : null}
          onInviteSent={() => {
            setShowInviteModal(false);
            // Optionally refresh the member list
            if (selectedSubgroupForMembers) {
              handleViewMembers(selectedSubgroupForMembers);
            }
          }}
        />
      )}

      {/* Edit Subgroup Modal */}
      {showEditModal && editingSubgroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Subgroup</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter subgroup name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter subgroup description"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isSaving}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubgroup}
                disabled={isSaving || !editFormData.name.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSaving && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && subgroupToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Delete Subgroup</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{subgroupToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSubgroup}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Subgroup Modal */}
      {showViewModal && viewingSubgroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Subgroup Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">{viewingSubgroup.name}</h4>
                <p className="text-gray-600">{viewingSubgroup.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Members</div>
                  <div className="text-2xl font-semibold">{viewingSubgroup.membersCount}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Active Roles</div>
                  <div className="text-2xl font-semibold">{viewingSubgroup.activeRolesCount}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  viewingSubgroup.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {viewingSubgroup.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-sm text-gray-500">
                  Created {new Date(viewingSubgroup.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && viewingSubgroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Subgroup Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <Cog6ToothIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Subgroup settings coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && viewingSubgroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Subgroup Analytics</h3>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <ChartBarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Analytics for "{viewingSubgroup.name}" coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Subgroup Modal */}
      {showCreateSubgroupModal && (
        <CreateSubgroupModal
          groupId={groupId}
          groupName={groupName || 'Group'}
          onClose={() => setShowCreateSubgroupModal(false)}
          onSubgroupCreated={handleSubgroupCreated}
        />
      )}
    </div>
  );
};

export default SubgroupManagementPanel;