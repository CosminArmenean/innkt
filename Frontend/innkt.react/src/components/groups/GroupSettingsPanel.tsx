import React, { useState } from 'react';
import { Group } from '../../services/social.service';
import SubgroupManagementPanel from './SubgroupManagementPanel';
import TopicManagementPanel from './TopicManagementPanel';
import RoleManagementPanel from './RoleManagementPanel';
import { 
  Cog6ToothIcon,
  UsersIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface GroupSettingsPanelProps {
  groupId: string;
  currentUserId?: string;
}

const GroupSettingsPanel: React.FC<GroupSettingsPanelProps> = ({ groupId, currentUserId }) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'roles' | 'subgroups' | 'topics' | 'permissions'>('general');

  const settingsTabs = [
    { id: 'general', label: 'General Settings', icon: Cog6ToothIcon },
    { id: 'roles', label: 'Role Management', icon: UsersIcon },
    { id: 'subgroups', label: 'Subgroup Settings', icon: UserGroupIcon },
    { id: 'topics', label: 'Topic Management', icon: ChatBubbleLeftRightIcon },
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
              placeholder="Enter group name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              placeholder="Enter group description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group Type</label>
            <select
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
    <RoleManagementPanel
      groupId={groupId}
      currentUserId={currentUserId || ''}
    />
  );

  const renderSubgroupSettings = () => (
    <SubgroupManagementPanel
      groupId={groupId}
      currentUserId={currentUserId || ''}
    />
  );

  const renderTopicManagement = () => (
    <TopicManagementPanel
      groupId={groupId}
      currentUserId={currentUserId || ''}
    />
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
        {activeSettingsTab === 'topics' && renderTopicManagement()}
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
