import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { socialService, Group } from '../../services/social.service';
import { groupsService } from '../../services/groups.service';

interface GroupManagementProps {
  userId: string;
}

const GroupManagement: React.FC<GroupManagementProps> = ({ userId }) => {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'owned' | 'member' | 'admin'>('all');

  // Form state for creating new group
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    type: 'public' as 'public' | 'private' | 'secret',
    category: '',
    tags: [] as string[],
    allowMemberPosts: true,
    requireApproval: false,
    maxMembers: 1000,
  });

  // Load groups
  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const response = await socialService.getGroups({ limit: 100 });
      setGroups(response.groups);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // Create new group
  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) return;

    setIsLoading(true);
    try {
      const groupData = {
        name: newGroup.name.trim(),
        description: newGroup.description.trim(),
        type: newGroup.type,
        category: newGroup.category,
        tags: newGroup.tags,
        settings: {
          allowMemberPosts: newGroup.allowMemberPosts,
          requireApproval: newGroup.requireApproval,
          maxMembers: newGroup.maxMembers,
        },
      };

      const createdGroup = await groupsService.createGroup(groupData);
      setGroups(prev => [createdGroup, ...prev]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setNewGroup({
      name: '',
      description: '',
      type: 'public',
      category: '',
      tags: [],
      allowMemberPosts: true,
      requireApproval: false,
      maxMembers: 1000,
    });
  };

  // Generate QR code for group
  const generateGroupQR = async (group: Group) => {
    try {
      const qrData = {
        type: 'group_join',
        groupId: group.id,
        groupName: group.name,
      };

      const qrCodeUrl = await socialService.generateQRCode(JSON.stringify(qrData));
      return qrCodeUrl;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      return null;
    }
  };

  // Filter groups
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'owned') return matchesSearch && group.memberRole === 'admin'; // Assume admin is owner for now
    if (filterType === 'admin') return matchesSearch && group.memberRole === 'admin';
    if (filterType === 'member') return matchesSearch && group.isMember;
    
    return matchesSearch;
  });

  // Get group role
  const getGroupRole = (group: Group) => {
    if (group.memberRole === 'admin') return t('groups.admin');
    if (group.memberRole === 'moderator') return t('groups.moderator');
    if (group.memberRole === 'member') return t('groups.member');
    if (group.memberRole === 'guest') return t('groups.guest');
    return t('groups.notAMember');
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-800';
      case 'Moderator': return 'bg-blue-100 text-blue-800';
      case 'Member': return 'bg-green-100 text-green-800';
      case 'Guest': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('groups.groupManagement')}</h2>
          <p className="text-gray-600">{t('groups.manageYourGroups')}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          {t('groups.createGroup')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder={t('groups.searchGroups')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-innkt-primary"
        >
          <option value="all">{t('groups.allGroups')}</option>
          <option value="owned">{t('groups.ownedByMe')}</option>
          <option value="admin">{t('groups.admin')}</option>
          <option value="member">{t('groups.member')}</option>
        </select>
      </div>

      {/* Groups Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-innkt-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div key={group.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                    {group.avatar ? (
                      <img
                        src={group.avatar}
                        alt={group.name}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-semibold">
                        {group.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(getGroupRole(group))}`}>
                      {getGroupRole(group)}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowQRModal(true);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title={t('groups.generateQRCode')}
                  >
                    📱
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {group.description}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{group.memberCount?.toLocaleString() || '0'} {t('groups.members')}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  group.type === 'public' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {group.type}
                </span>
              </div>

              {group.tags && group.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {group.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-innkt-light text-innkt-dark text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                  {group.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{group.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('groups.createNewGroup')}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('groups.groupName')} *
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder={t('groups.enterGroupName')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('groups.description')}
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder={t('groups.describeYourGroup')}
                />
              </div>

                             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   {t('groups.type')}
                 </label>
                 <select
                   value={newGroup.type}
                   onChange={(e) => setNewGroup(prev => ({ ...prev, type: e.target.value as any }))}
                   className="input-field"
                 >
                   <option value="public">{t('groups.public')}</option>
                   <option value="private">{t('groups.private')}</option>
                   <option value="secret">{t('groups.secret')}</option>
                 </select>
               </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('groups.category')}
                </label>
                <input
                  type="text"
                  value={newGroup.category}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, category: e.target.value }))}
                  className="input-field"
                  placeholder={t('groups.selectCategory')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('groups.maxMembersLabel')}
                </label>
                <input
                  type="number"
                  value={newGroup.maxMembers}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 1000 }))}
                  className="input-field"
                  min="1"
                  max="10000"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newGroup.allowMemberPosts}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, allowMemberPosts: e.target.checked }))}
                    className="rounded border-gray-300 text-innkt-primary focus:ring-innkt-primary"
                  />
                  <span className="ml-2 text-sm text-gray-700">{t('groups.allowMembersToPost')}</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newGroup.requireApproval}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, requireApproval: e.target.checked }))}
                    className="rounded border-gray-300 text-innkt-primary focus:ring-innkt-primary"
                  />
                  <span className="ml-2 text-sm text-gray-700">{t('groups.requireApprovalNewMembers')}</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="btn-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroup.name.trim() || isLoading}
                className="btn-primary disabled:opacity-50"
              >
                {isLoading ? t('groups.creating') : t('groups.createGroup')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('groups.groupQRCode')}
            </h3>
            
            <div className="text-center">
              <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-gray-500">{t('groups.qrCodeWillAppear')}</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {t('groups.shareQRCode')} <strong>{selectedGroup.name}</strong>
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowQRModal(false)}
                className="btn-secondary"
              >
                {t('groups.close')}
              </button>
              <button
                onClick={() => {
                  // TODO: Implement QR code generation
                  alert(t('groups.qrCodeGeneration'));
                }}
                className="btn-primary"
              >
                {t('groups.generateQRCodeButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManagement;

