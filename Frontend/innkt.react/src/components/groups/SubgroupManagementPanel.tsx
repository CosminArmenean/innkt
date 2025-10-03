import React, { useState, useEffect } from 'react';
import { groupsService, SubgroupResponse, GroupRoleResponse } from '../../services/groups.service';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  UsersIcon,
  CogIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SubgroupManagementPanelProps {
  groupId: string;
  currentUserId: string;
  onSubgroupCreated?: (subgroup: SubgroupResponse) => void;
  onSubgroupUpdated?: (subgroup: SubgroupResponse) => void;
  onSubgroupDeleted?: (subgroupId: string) => void;
}

interface CreateSubgroupFormData {
  name: string;
  description: string;
  settings: {
    allowMemberPosts: boolean;
    allowKidPosts: boolean;
    allowParentPosts: boolean;
    requireApproval: boolean;
  };
}

const SubgroupManagementPanel: React.FC<SubgroupManagementPanelProps> = ({
  groupId,
  currentUserId,
  onSubgroupCreated,
  onSubgroupUpdated,
  onSubgroupDeleted
}) => {
  const [subgroups, setSubgroups] = useState<SubgroupResponse[]>([]);
  const [roles, setRoles] = useState<GroupRoleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSubgroup, setEditingSubgroup] = useState<SubgroupResponse | null>(null);
  const [formData, setFormData] = useState<CreateSubgroupFormData>({
    name: '',
    description: '',
    settings: {
      allowMemberPosts: true,
      allowKidPosts: false,
      allowParentPosts: true,
      requireApproval: false
    }
  });

  useEffect(() => {
    loadSubgroups();
    loadRoles();
  }, [groupId]);

  const loadSubgroups = async () => {
    try {
      setIsLoading(true);
      const response = await groupsService.getGroupSubgroups(groupId);
      setSubgroups(response);
    } catch (error) {
      console.error('Failed to load subgroups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await groupsService.getGroupRoles(groupId);
      setRoles(response);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const handleCreateSubgroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newSubgroup = await groupsService.createSubgroup({
        groupId,
        name: formData.name,
        description: formData.description,
        settings: {
          allowMemberPosts: formData.settings.allowMemberPosts,
          allowKidPosts: formData.settings.allowKidPosts,
          allowParentPosts: formData.settings.allowParentPosts,
          requireApproval: formData.settings.requireApproval
        }
      });
      
      setSubgroups(prev => [...prev, newSubgroup]);
      onSubgroupCreated?.(newSubgroup);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        settings: {
          allowMemberPosts: true,
          allowKidPosts: false,
          allowParentPosts: true,
          requireApproval: false
        }
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create subgroup:', error);
    }
  };

  const handleUpdateSubgroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubgroup) return;

    try {
      const updatedSubgroup = await groupsService.updateSubgroup(editingSubgroup.id, {
        name: formData.name,
        description: formData.description,
        settings: {
          allowMemberPosts: formData.settings.allowMemberPosts,
          allowKidPosts: formData.settings.allowKidPosts,
          allowParentPosts: formData.settings.allowParentPosts,
          requireApproval: formData.settings.requireApproval
        }
      });
      
      setSubgroups(prev => prev.map(sg => sg.id === editingSubgroup.id ? updatedSubgroup : sg));
      onSubgroupUpdated?.(updatedSubgroup);
      
      setEditingSubgroup(null);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to update subgroup:', error);
    }
  };

  const handleDeleteSubgroup = async (subgroupId: string) => {
    if (!window.confirm('Are you sure you want to delete this subgroup? This action cannot be undone.')) {
      return;
    }

    try {
      await groupsService.deleteSubgroup(subgroupId);
      setSubgroups(prev => prev.filter(sg => sg.id !== subgroupId));
      onSubgroupDeleted?.(subgroupId);
    } catch (error) {
      console.error('Failed to delete subgroup:', error);
    }
  };

  const handleEditSubgroup = (subgroup: SubgroupResponse) => {
    setEditingSubgroup(subgroup);
    setFormData({
      name: subgroup.name,
      description: subgroup.description || '',
      settings: subgroup.settings || {
        allowMemberPosts: true,
        allowKidPosts: false,
        allowParentPosts: true,
        requireApproval: false
      }
    });
    setShowCreateForm(true);
  };

  const cancelEdit = () => {
    setEditingSubgroup(null);
    setShowCreateForm(false);
    setFormData({
      name: '',
      description: '',
      settings: {
        allowMemberPosts: true,
        allowKidPosts: false,
        allowParentPosts: true,
        requireApproval: false
      }
    });
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
          <h2 className="text-2xl font-bold text-gray-900">Subgroups Management</h2>
          <p className="text-gray-600">Create and manage subgroups within this group</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Create Subgroup
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingSubgroup ? 'Edit Subgroup' : 'Create New Subgroup'}
          </h3>
          
          <form onSubmit={editingSubgroup ? handleUpdateSubgroup : handleCreateSubgroup} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Subgroup Name
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Enter subgroup name"
              />
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
                placeholder="Enter subgroup description"
              />
            </div>

            {/* Settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Permissions</h4>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.settings.allowMemberPosts}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, allowMemberPosts: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow members to post</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.settings.allowKidPosts}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, allowKidPosts: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow kid accounts to post</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.settings.allowParentPosts}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, allowParentPosts: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow parent accounts to post</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.settings.requireApproval}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, requireApproval: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Require approval for new posts</span>
                </label>
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
                {editingSubgroup ? 'Update Subgroup' : 'Create Subgroup'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subgroups List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Existing Subgroups</h3>
        </div>
        
        {subgroups.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No subgroups</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new subgroup.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Create Subgroup
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {subgroups.map((subgroup) => (
              <div key={subgroup.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <UserGroupIcon className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {subgroup.name}
                        </h4>
                        {subgroup.description && (
                          <p className="text-sm text-gray-500 truncate">
                            {subgroup.description}
                          </p>
                        )}
                        <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <UsersIcon className="h-3 w-3" />
                            <span>{subgroup.membersCount} members</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {subgroup.isActive ? (
                              <>
                                <CheckIcon className="h-3 w-3 text-green-500" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <XMarkIcon className="h-3 w-3 text-red-500" />
                                <span>Inactive</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditSubgroup(subgroup)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Edit subgroup"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubgroup(subgroup.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Delete subgroup"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Roles */}
      {roles.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Available Roles</h3>
            <p className="text-sm text-gray-500">Roles that can be assigned to subgroup members</p>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => (
                <div key={role.id} className="border rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
                    <h4 className="text-sm font-medium text-gray-900">{role.name}</h4>
                  </div>
                  {role.description && (
                    <p className="mt-1 text-xs text-gray-500">{role.description}</p>
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubgroupManagementPanel;


