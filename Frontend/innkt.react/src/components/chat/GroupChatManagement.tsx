import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { groupChatService, GroupChat } from '../../services/groupChat.service';
import { useAuth } from '../../contexts/AuthContext';
import { 
  UsersIcon, 
  Cog6ToothIcon, 
  UserPlusIcon, 
  UserMinusIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface GroupChatManagementProps {
  groupChat: GroupChat;
  onUpdate: (updatedGroup: GroupChat) => void;
  onClose: () => void;
  className?: string;
}

const GroupChatManagement: React.FC<GroupChatManagementProps> = ({
  groupChat,
  onUpdate,
  onClose,
  className = ''
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'settings' | 'participants'>('settings');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Settings state
  const [settings, setSettings] = useState({
    name: groupChat.name,
    description: groupChat.description || '',
    avatar: groupChat.avatar || '',
    allowFileSharing: groupChat.settings.allowFileSharing,
    allowReactions: groupChat.settings.allowReactions,
    allowReplies: groupChat.settings.allowReplies,
    notificationsEnabled: groupChat.settings.notificationsEnabled
  });

  // Participants state
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [newParticipants, setNewParticipants] = useState<string[]>([]);
  const [participantInput, setParticipantInput] = useState('');

  const currentUserRole = groupChatService.getUserRole(groupChat, user?.id || '');
  const canManageParticipants = groupChatService.canManageParticipants(groupChat, user?.id || '');
  const canUpdateSettings = groupChatService.canUpdateSettings(groupChat, user?.id || '');
  const canDeleteGroup = groupChatService.canDeleteGroup(groupChat, user?.id || '');
  const isOnlyAdmin = groupChatService.isOnlyAdmin(groupChat, user?.id || '');

  const handleSaveSettings = async () => {
    if (!canUpdateSettings) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const updatedGroup = await groupChatService.updateGroupSettings(groupChat._id, {
        name: settings.name,
        description: settings.description,
        avatar: settings.avatar,
        settings: {
          allowFileSharing: settings.allowFileSharing,
          allowReactions: settings.allowReactions,
          allowReplies: settings.allowReplies,
          notificationsEnabled: settings.notificationsEnabled
        }
      });

      onUpdate(updatedGroup);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Group settings updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update group settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddParticipants = async () => {
    if (!canManageParticipants || newParticipants.length === 0) return;

    setIsLoading(true);
    setMessage(null);

    try {
      await groupChatService.addParticipants(groupChat._id, {
        participants: newParticipants
      });

      setNewParticipants([]);
      setParticipantInput('');
      setShowAddParticipants(false);
      setMessage({ type: 'success', text: 'Participants added successfully!' });
      
      // Refresh group data
      const updatedGroup = await groupChatService.getGroupChat(groupChat._id);
      onUpdate(updatedGroup);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to add participants' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!canManageParticipants) return;

    setIsLoading(true);
    setMessage(null);

    try {
      await groupChatService.removeParticipant(groupChat._id, participantId);
      setMessage({ type: 'success', text: 'Participant removed successfully!' });
      
      // Refresh group data
      const updatedGroup = await groupChatService.getGroupChat(groupChat._id);
      onUpdate(updatedGroup);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to remove participant' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (participantId: string, newRole: 'admin' | 'moderator' | 'member') => {
    if (!canUpdateSettings) return;

    setIsLoading(true);
    setMessage(null);

    try {
      await groupChatService.updateParticipantRole(groupChat._id, participantId, { role: newRole });
      setMessage({ type: 'success', text: 'Participant role updated successfully!' });
      
      // Refresh group data
      const updatedGroup = await groupChatService.getGroupChat(groupChat._id);
      onUpdate(updatedGroup);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update participant role' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!canDeleteGroup) return;

    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await groupChatService.deleteGroup(groupChat._id);
      setMessage({ type: 'success', text: 'Group deleted successfully!' });
      setTimeout(() => onClose(), 1000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete group' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (isOnlyAdmin) {
      setMessage({ type: 'error', text: 'Cannot leave as the only admin. Transfer admin role first or delete the group.' });
      return;
    }

    if (!window.confirm('Are you sure you want to leave this group?')) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await groupChatService.leaveGroup(groupChat._id);
      setMessage({ type: 'success', text: 'Successfully left the group!' });
      setTimeout(() => onClose(), 1000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to leave group' });
    } finally {
      setIsLoading(false);
    }
  };

  const addParticipant = () => {
    if (participantInput.trim() && !newParticipants.includes(participantInput.trim())) {
      setNewParticipants([...newParticipants, participantInput.trim()]);
      setParticipantInput('');
    }
  };

  const removeNewParticipant = (participantId: string) => {
    setNewParticipants(newParticipants.filter(id => id !== participantId));
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <UsersIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{groupChat.name}</h2>
            <p className="text-sm text-gray-500">{groupChatService.getParticipantCount(groupChat)} members</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckIcon className="w-5 h-5" />
          ) : (
            <XMarkIcon className="w-5 h-5" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 px-6 text-sm font-medium ${
            activeTab === 'settings'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Cog6ToothIcon className="w-4 h-4 inline mr-2" />
          Settings
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 py-3 px-6 text-sm font-medium ${
            activeTab === 'participants'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <UsersIcon className="w-4 h-4 inline mr-2" />
          Participants
        </button>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto max-h-96">
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {canUpdateSettings ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={settings.description}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={!isEditing}
                    placeholder="Describe your group..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    value={settings.avatar}
                    onChange={(e) => setSettings({ ...settings, avatar: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={!isEditing}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">Group Settings</h3>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.allowFileSharing}
                      onChange={(e) => setSettings({ ...settings, allowFileSharing: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow file sharing</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.allowReactions}
                      onChange={(e) => setSettings({ ...settings, allowReactions: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow reactions</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.allowReplies}
                      onChange={(e) => setSettings({ ...settings, allowReplies: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow replies</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notificationsEnabled}
                      onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable notifications</span>
                  </label>
                </div>

                <div className="flex space-x-3">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span>Edit Settings</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSaveSettings}
                        disabled={isLoading}
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckIcon className="w-4 h-4" />
                        <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setSettings({
                            name: groupChat.name,
                            description: groupChat.description || '',
                            avatar: groupChat.avatar || '',
                            allowFileSharing: groupChat.settings.allowFileSharing,
                            allowReactions: groupChat.settings.allowReactions,
                            allowReplies: groupChat.settings.allowReplies,
                            notificationsEnabled: groupChat.settings.notificationsEnabled
                          });
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Cog6ToothIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Only admins can manage group settings</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="space-y-4">
            {/* Add Participants */}
            {canManageParticipants && (
              <div className="border-b border-gray-200 pb-4">
                <button
                  onClick={() => setShowAddParticipants(!showAddParticipants)}
                  className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  <span>Add Participants</span>
                </button>

                {showAddParticipants && (
                  <div className="mt-3 space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={participantInput}
                        onChange={(e) => setParticipantInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                        placeholder="Enter user ID..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={addParticipant}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Add
                      </button>
                    </div>

                    {newParticipants.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">New participants:</p>
                        {newParticipants.map((participantId) => (
                          <div key={participantId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm">{participantId}</span>
                            <button
                              onClick={() => removeNewParticipant(participantId)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={handleAddParticipants}
                          disabled={isLoading}
                          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {isLoading ? 'Adding...' : 'Add Participants'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Participants List */}
            <div className="space-y-3">
              {groupChat.participants.map((participant) => (
                <div key={participant.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-600">
                        {participant.userId.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{participant.userId}</p>
                      <p className="text-xs text-gray-500">
                        Last seen: {groupChatService.formatLastSeen(participant.lastSeen)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${groupChatService.getRoleColor(participant.role)}`}>
                      {groupChatService.getRoleIcon(participant.role)} {participant.role}
                    </span>

                    {canManageParticipants && participant.userId !== user?.id && (
                      <div className="flex space-x-1">
                        {canUpdateSettings && (
                          <select
                            value={participant.role}
                            onChange={(e) => handleUpdateRole(participant.userId, e.target.value as any)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                            disabled={isLoading}
                          >
                            <option value="member">Member</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                        
                        <button
                          onClick={() => handleRemoveParticipant(participant.userId)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          <UserMinusIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex space-x-3">
          <button
            onClick={handleLeaveGroup}
            disabled={isLoading}
            className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-50"
          >
            Leave Group
          </button>
          
          {canDeleteGroup && (
            <button
              onClick={handleDeleteGroup}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Delete Group</span>
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default GroupChatManagement;
