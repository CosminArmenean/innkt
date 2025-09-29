import React, { useState } from 'react';
import { Group } from '../../services/social.service';
import { 
  Cog6ToothIcon,
  UsersIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface GroupSettingsPanelProps {
  group: Group;
  currentUserId?: string;
}

const GroupSettingsPanel: React.FC<GroupSettingsPanelProps> = ({ group, currentUserId }) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'roles' | 'subgroups' | 'permissions'>('general');

  const settingsTabs = [
    { id: 'general', label: 'General Settings', icon: Cog6ToothIcon },
    { id: 'roles', label: 'Role Management', icon: UsersIcon },
    { id: 'subgroups', label: 'Subgroup Settings', icon: UserGroupIcon },
    { id: 'permissions', label: 'Permissions', icon: ShieldCheckIcon }
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Group Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
            <input
              type="text"
              defaultValue={group.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              defaultValue={group.description}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group Type</label>
            <select
              defaultValue={group.type}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="educational">Educational</option>
              <option value="general">General</option>
              <option value="family">Family</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Public Group</label>
              <p className="text-sm text-gray-500">Allow anyone to find and join this group</p>
            </div>
            <input
              type="checkbox"
              defaultChecked={group.type === 'public'}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Require Approval</label>
              <p className="text-sm text-gray-500">New members need admin approval to join</p>
            </div>
            <input
              type="checkbox"
              defaultChecked={true}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderRoleManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Role Management</h3>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
          Create New Role
        </button>
      </div>

      <div className="space-y-4">
        {/* Admin Role */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <ShieldCheckIcon className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Admin</h4>
                <p className="text-sm text-gray-500">Full control over group</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              {group.admins?.length || 0} members
            </span>
          </div>
          <div className="text-sm text-gray-600">
            <p>• Create and manage topics</p>
            <p>• Manage all members and roles</p>
            <p>• Upload files and manage settings</p>
            <p>• View analytics and reports</p>
          </div>
        </div>

        {/* Moderator Role */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <UsersIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Moderator</h4>
                <p className="text-sm text-gray-500">Content moderation and member management</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {group.moderators?.length || 0} members
            </span>
          </div>
          <div className="text-sm text-gray-600">
            <p>• Create and manage topics</p>
            <p>• Moderate content and comments</p>
            <p>• Upload files</p>
            <p>• Cannot manage roles or settings</p>
          </div>
        </div>

        {/* Member Role */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <UserGroupIcon className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Member</h4>
                <p className="text-sm text-gray-500">Standard group participation</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              {group.memberCount - (group.admins?.length || 0) - (group.moderators?.length || 0)} members
            </span>
          </div>
          <div className="text-sm text-gray-600">
            <p>• Post and comment in topics</p>
            <p>• Vote on polls</p>
            <p>• View group content</p>
            <p>• Cannot create topics or manage members</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSubgroupSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Subgroup Management</h3>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
          Create Subgroup
        </button>
      </div>

      <div className="space-y-4">
        <div className="text-center py-8 text-gray-500">
          <UserGroupIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No subgroups created yet</p>
          <p className="text-sm mt-2">Create subgroups to organize your group into smaller, focused communities</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Educational Group Structure</h4>
        <p className="text-sm text-blue-700">
          For educational groups, you can create subgroups for different grade levels, classes, or subjects.
          Each subgroup can have its own settings, topics, and member permissions.
        </p>
      </div>
    </div>
  );

  const renderPermissions = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Permission Settings</h3>
      
      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Content Permissions</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Allow Member Posts</label>
                <p className="text-sm text-gray-500">Members can create posts in group topics</p>
              </div>
              <input
                type="checkbox"
                defaultChecked={true}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Allow Comments</label>
                <p className="text-sm text-gray-500">Members can comment on posts</p>
              </div>
              <input
                type="checkbox"
                defaultChecked={true}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Allow File Uploads</label>
                <p className="text-sm text-gray-500">Members can upload files and documents</p>
              </div>
              <input
                type="checkbox"
                defaultChecked={true}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-4">Educational Features</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Enable @grok AI</label>
                <p className="text-sm text-gray-500">AI-powered content analysis and assistance</p>
              </div>
              <input
                type="checkbox"
                defaultChecked={true}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Perpetual Photo System</label>
                <p className="text-sm text-gray-500">Teachers can create individualized posts for students</p>
              </div>
              <input
                type="checkbox"
                defaultChecked={false}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Paper Scanning</label>
                <p className="text-sm text-gray-500">OCR integration for homework and documents</p>
              </div>
              <input
                type="checkbox"
                defaultChecked={false}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Settings Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeSettingsTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings Content */}
      <div>
        {activeSettingsTab === 'general' && renderGeneralSettings()}
        {activeSettingsTab === 'roles' && renderRoleManagement()}
        {activeSettingsTab === 'subgroups' && renderSubgroupSettings()}
        {activeSettingsTab === 'permissions' && renderPermissions()}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default GroupSettingsPanel;
