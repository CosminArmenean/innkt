import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socialService, Group } from '../../services/social.service';
import { groupsService } from '../../services/groups.service';
import { convertToFullAvatarUrl, convertToFullGroupImageUrl, getUserInitial } from '../../utils/avatarUtils';
import GroupSettingsPanel from './GroupSettingsPanel';
import SubgroupManagementPanel from './SubgroupManagementPanel';
import GroupManagementPanel from './GroupManagementPanel';
import InvitesManagementPanel from './InvitesManagementPanel';
import TopicsList from './TopicsList';
import EnhancedInviteUserModal from './EnhancedInviteUserModal';
import { useAuth } from '../../contexts/AuthContext';
import { 
  UserGroupIcon, 
  UsersIcon, 
  ChatBubbleLeftRightIcon, 
  CogIcon,
  ShareIcon,
  BellIcon,
  PhotoIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const GroupDetailPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  console.log('GroupDetailPage rendered for group ID:', id);
  const [group, setGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<'topics' | 'members' | 'rules' | 'subgroups' | 'settings' | 'invites'>('topics');
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [topicsCount, setTopicsCount] = useState(0);
  const [subgroupsCount, setSubgroupsCount] = useState(0);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [subgroups, setSubgroups] = useState<any[]>([]);
  const [currentSubgroup, setCurrentSubgroup] = useState<any>(null);
  const [subgroupTopicsCount, setSubgroupTopicsCount] = useState(0);
  const [subgroupMembersCount, setSubgroupMembersCount] = useState(0);
  const [subgroupMemberListTab, setSubgroupMemberListTab] = useState<'users' | 'roles'>('users');
  const [subgroupRoles, setSubgroupRoles] = useState<any[]>([]);
  const [subgroupMembers, setSubgroupMembers] = useState<any[]>([]);
  const [subgroupInvitations, setSubgroupInvitations] = useState<any[]>([]);
  const [userRestrictions, setUserRestrictions] = useState<{ 
    isKidAccount: boolean; 
    isParentShadowAccount: boolean;
    restrictedToSubgroupId?: string; 
    subgroupName?: string;
    subgroupSettings?: any;
    parentPermissions?: {
      canPost: boolean;
      canVote: boolean;
      canComment: boolean;
      canViewAnnouncements: boolean;
      canViewTopics: boolean;
      canViewMembers: boolean;
      canManageKid: boolean;
      accessLevel: 'read_only' | 'participant';
    };
  } | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const subgroupChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingSubgroupDataRef = useRef(false);

  useEffect(() => {
    if (id) {
      loadGroup();
    }
  }, [id]);

  // Debug logging for group data
  useEffect(() => {
    if (group) {
      console.log('🔍 Group data loaded:', {
        id: group.id,
        name: group.name,
        memberRole: group.memberRole,
        canManageMembers: group.canManageMembers,
        isMember: group.isMember
      });
    }
  }, [group]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (subgroupChangeTimeoutRef.current) {
        clearTimeout(subgroupChangeTimeoutRef.current);
      }
    };
  }, []);

  const loadGroup = async () => {
    if (!id || !currentUserId) return;
    
    try {
      setIsLoading(true);
      const groupData = await socialService.getGroup(id);
      setGroup(groupData);
      
      // Load user restrictions (for kid accounts)
      const restrictions = await groupsService.getUserSubgroupRestrictions(id, currentUserId);
      setUserRestrictions(restrictions);
      
      console.log('🔍 User restrictions loaded:', restrictions);
      
      // If user is restricted to a specific subgroup, automatically select it
      if ((restrictions.isKidAccount || restrictions.isParentShadowAccount) && restrictions.restrictedToSubgroupId) {
        console.log('🎯 Restricted account detected, auto-selecting subgroup:', restrictions.restrictedToSubgroupId);
        console.log('🔍 Account type:', restrictions.isKidAccount ? 'Kid Account' : 'Parent Shadow Account');
        if (restrictions.isParentShadowAccount) {
          console.log('👨‍👩‍👧‍👦 Parent permissions:', restrictions.parentPermissions);
        }
        setCurrentSubgroup({ id: restrictions.restrictedToSubgroupId, name: restrictions.subgroupName });
        setActiveTab('topics'); // Switch to topics tab to show subgroup content
      }
      
      // Load topics and subgroups counts
      await loadCounts(id);
    } catch (error) {
      console.error('Failed to load group:', error);
      navigate('/groups');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCounts = async (groupId: string) => {
    try {
      // Load topics count
      const topics = await groupsService.getGroupTopics(groupId);
      setTopicsCount(topics?.length || 0);
      
      // Load subgroups count and data
      const subgroupsData = await groupsService.getGroupSubgroups(groupId);
      setSubgroupsCount(subgroupsData?.length || 0);
      setSubgroups(subgroupsData || []);
    } catch (error) {
      console.error('Failed to load counts:', error);
      // Set default counts on error
      setTopicsCount(0);
      setSubgroupsCount(0);
      setSubgroups([]);
    }
  };

  const handleTopicCreated = () => {
    if (id) {
      loadCounts(id);
    }
  };

  const handleSubgroupCreated = () => {
    if (id) {
      loadCounts(id);
    }
  };

  const handleSubgroupViewChange = useCallback(async (subgroup: any) => {
    // Clear any existing timeout
    if (subgroupChangeTimeoutRef.current) {
      clearTimeout(subgroupChangeTimeoutRef.current);
    }
    
    // Debounce the API calls by 300ms
    subgroupChangeTimeoutRef.current = setTimeout(async () => {
      // Prevent unnecessary calls if subgroup hasn't changed or if already loading
      if (currentSubgroup?.id === subgroup?.id || isLoadingSubgroupDataRef.current) {
        return;
      }
      
      isLoadingSubgroupDataRef.current = true;
      setCurrentSubgroup(subgroup);
      
      if (subgroup) {
        // Load subgroup-specific data
        try {
          const [subgroupTopics, subgroupMembers, subgroupInvitations] = await Promise.all([
            groupsService.getGroupTopics(id!, { subgroupId: subgroup.id }),
            groupsService.getSubgroupMembers(id!, subgroup.id),
            groupsService.getGroupInvitations(id!, 1, 20, subgroup.id)
          ]);
          
          setSubgroupTopicsCount(subgroupTopics?.length || 0);
          setSubgroupMembersCount(subgroupMembers?.length || 0);
          setSubgroupMembers(subgroupMembers || []);
          setSubgroupInvitations(subgroupInvitations.invitations || []);
          
          // Only try to load roles if user has permission (avoid the 500 error)
          try {
            const subgroupRolesData = await groupsService.getRolesWithSubgroups(id!);
            const rolesWithSubgroupAccess = subgroupRolesData.filter(role => 
              role.assignedToSubgroups.includes(subgroup.id)
            );
            setSubgroupRoles(rolesWithSubgroupAccess);
          } catch (roleError) {
            console.warn('Failed to load roles (permission issue):', roleError);
            setSubgroupRoles([]);
          }
        } catch (error) {
          console.error('Failed to load subgroup data:', error);
          setSubgroupTopicsCount(0);
          setSubgroupMembersCount(0);
          setSubgroupRoles([]);
        }
      } else {
        // Reset to main group data
        setSubgroupTopicsCount(0);
        setSubgroupMembersCount(0);
        setSubgroupRoles([]);
      }
      
      isLoadingSubgroupDataRef.current = false;
    }, 300);
  }, [currentSubgroup?.id, id]);


  const handleJoin = async () => {
    if (!group) return;
    
    setIsJoining(true);
    try {
      await socialService.joinGroup(group.id);
      setGroup(prev => prev ? { ...prev, isMember: true, memberCount: prev.memberCount + 1 } : null);
    } catch (error) {
      console.error('Failed to join group:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleNotify = async () => {
    if (!group) return;
    
    try {
      // Send notification to all group members
      const members = await groupsService.getGroupMembers(group.id);
      const notificationData = {
        type: 'group_notification',
        groupId: group.id,
        groupName: group.name,
        message: `New notification from ${group.name}`,
        priority: 'medium'
      };
      
      // Send notification to each member
      for (const member of members) {
        await groupsService.sendGroupNotification(member.userId, notificationData);
      }
      
      alert(`Notification sent to ${members.length} group members!`);
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification. Please try again.');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: group?.name || 'Group',
        text: group?.description || 'Check out this group!',
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Group link copied to clipboard!');
    }
  };

  const refreshSubgroupData = async () => {
    if (!currentSubgroup || !id) return;
    
    try {
      const [subgroupMembers, subgroupInvitations] = await Promise.all([
        groupsService.getSubgroupMembers(id, currentSubgroup.id),
        groupsService.getGroupInvitations(id, 1, 20, currentSubgroup.id)
      ]);
      
      setSubgroupMembers(subgroupMembers || []);
      setSubgroupMembersCount(subgroupMembers?.length || 0);
      setSubgroupInvitations(subgroupInvitations.invitations || []);
    } catch (error) {
      console.error('Failed to refresh subgroup data:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size too large. Maximum size is 5MB.');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const avatarUrl = await groupsService.uploadGroupAvatar(id, file);
      
      // Reload group data to get the updated avatar URL from the API
      await loadGroup();
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Maximum size is 10MB.');
      return;
    }

    try {
      setIsUploadingCover(true);
      const coverUrl = await groupsService.uploadGroupCover(id, file);
      
      // Reload group data to get the updated cover URL from the API
      await loadGroup();
    } catch (error) {
      console.error('Failed to upload cover:', error);
      alert('Failed to upload cover photo. Please try again.');
    } finally {
      setIsUploadingCover(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!id) return;
    
    try {
      await groupsService.cancelInvitation(id, invitationId);
      // Refresh the subgroup data to remove the canceled invitation
      await refreshSubgroupData();
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      alert('Failed to cancel invitation. Please try again.');
    }
  };

  const handleLeave = async () => {
    if (!group) return;
    
    // Check if user is the only admin
    if (group.memberRole === 'owner' || group.memberRole === 'admin') {
      const members = await groupsService.getGroupMembers(group.id);
      const adminCount = members.filter(member => member.role === 'owner' || member.role === 'admin').length;
      
      if (adminCount <= 1) {
        const confirmTransfer = window.confirm(
          'You are the only admin of this group. Leaving will delete the group permanently. ' +
          'Do you want to transfer admin rights to another member first?'
        );
        
        if (confirmTransfer) {
          // Show member selection for admin transfer
          const memberList = members
            .filter(member => member.role !== 'admin')
            .map(member => `${member.user?.displayName || 'Unknown User'} (${member.role})`)
            .join('\n');
          
          if (memberList) {
            alert(`Please transfer admin rights to one of these members first:\n\n${memberList}\n\nUse the Manage button to transfer admin rights.`);
          } else {
            alert('No other members available to transfer admin rights to. The group will be deleted if you leave.');
          }
          return;
        }
      }
    }
    
    const confirmLeave = window.confirm('Are you sure you want to leave this group?');
    if (!confirmLeave) return;
    
    setIsLeaving(true);
    try {
      await socialService.leaveGroup(group.id);
      setGroup(prev => prev ? { ...prev, isMember: false, memberCount: prev.memberCount - 1 } : null);
      navigate('/groups');
    } catch (error) {
      console.error('Failed to leave group:', error);
      alert('Failed to leave group. Please try again.');
    } finally {
      setIsLeaving(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Group not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Group Header */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-purple-500 to-blue-500 relative">
          {group.coverImage && (
            <img 
              src={convertToFullGroupImageUrl(group.coverImage)} 
              alt={group.name}
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Group Type Badge */}
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(group.type)}`}>
              {group.type}
            </span>
          </div>
          
          {/* Cover Photo Button - Admin Only */}
          {(group.memberRole === 'owner' || group.memberRole === 'admin' || group.memberRole === 'moderator') && (
            <div className="absolute bottom-4 right-4">
              <label className="flex items-center space-x-2 px-3 py-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors cursor-pointer">
                <PhotoIcon className="w-4 h-4" />
                <span className="text-sm">
                  {isUploadingCover ? 'Uploading...' : 'Add Cover'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={isUploadingCover}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Group Info - Compact */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="relative w-16 h-16 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 -mt-8 border-4 border-white">
                {group.avatar ? (
                  <img 
                    src={convertToFullGroupImageUrl(group.avatar)} 
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <UserGroupIcon className="w-8 h-8 text-gray-600" />
                  </div>
                )}
                
                {/* Add Profile Picture Button - Admin Only */}
                {(group.memberRole === 'owner' || group.memberRole === 'admin' || group.memberRole === 'moderator') && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                    <label className="cursor-pointer flex flex-col items-center justify-center text-white text-xs">
                      <PhotoIcon className="w-4 h-4 mb-1" />
                      <span className="text-center leading-tight">Add Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={isUploadingAvatar}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
                
                {/* Loading indicator */}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              {/* Group Details */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">{group.category}</span>
                  {userRestrictions?.isParentShadowAccount && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      👨‍👩‍👧‍👦 Parent Shadow
                    </span>
                  )}
                  {userRestrictions?.isKidAccount && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      👶 Kid Account
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-2 line-clamp-1">{group.description}</p>
                
                {/* Tags */}
                {group.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {group.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                    {group.tags.length > 2 && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        +{group.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Stats */}
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <UsersIcon className="w-3 h-3" />
                    <span>{group.memberCount?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ChatBubbleLeftRightIcon className="w-3 h-3" />
                    <span>{group.postCount || '0'}</span>
                  </div>
                  <span>{new Date(group.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons - Compact */}
            <div className="flex space-x-2">
              {group.isMember ? (
                <>
                  <button 
                    onClick={handleNotify}
                    className="flex items-center space-x-1 px-2 py-1.5 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300 transition-colors"
                  >
                    <BellIcon className="w-3 h-3" />
                    <span>Notify</span>
                  </button>
                  {(group.memberRole === 'owner' || group.memberRole === 'admin' || group.memberRole === 'moderator') && (
                    <button 
                      onClick={() => {
                        console.log('🔍 Patrick Jane invite button clicked - memberRole:', group.memberRole);
                        setShowInviteModal(true);
                      }}
                      className="flex items-center space-x-1 px-2 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      <UserPlusIcon className="w-3 h-3" />
                      <span>Invite</span>
                    </button>
                  )}
                  <button 
                    onClick={handleShare}
                    className="flex items-center space-x-1 px-2 py-1.5 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
                  >
                    <ShareIcon className="w-3 h-3" />
                    <span>Share</span>
                  </button>
                  {(group.memberRole === 'owner' || group.memberRole === 'admin' || group.memberRole === 'moderator') && (
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="flex items-center space-x-1 px-2 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                    >
                      <CogIcon className="w-3 h-3" />
                      <span>Manage</span>
                    </button>
                  )}
                  <button
                    onClick={handleLeave}
                    disabled={isLeaving}
                    className="px-2 py-1.5 border border-red-300 text-red-700 rounded text-sm hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {isLeaving ? 'Leaving...' : 'Leave'}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {isJoining ? 'Joining...' : 'Join Group'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {currentSubgroup ? (
              // Subgroup navbar - show Main Group button first, then subgroup-specific tabs
              <>
                <button
                  onClick={() => {
                    setCurrentSubgroup(null);
                    setSubgroupMembers([]);
                    setSubgroupInvitations([]);
                    setSubgroupMembersCount(0);
                    setActiveTab('topics'); // Reset to topics tab when returning to main group
                  }}
                  className="py-2 px-1 border-b-2 font-medium text-sm border-transparent text-purple-600 hover:text-purple-700 hover:border-purple-300"
                >
                  ← Main Group
                </button>
                {[
                  { id: 'topics', label: 'Topics', count: subgroupTopicsCount },
                  { id: 'members', label: 'Members', count: subgroupMembersCount },
                  { id: 'rules', label: 'Rules', count: 0 } // Subgroups don't have rules
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
                {/* Invites tab - only visible to users with manage members access */}
                {(group.canManageMembers || group.memberRole === 'owner' || group.memberRole === 'admin' || group.memberRole === 'moderator') && (
                  <button
                    onClick={() => setActiveTab('invites')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'invites'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Invites
                  </button>
                )}
                {(group.memberRole === 'owner' || group.memberRole === 'admin' || group.memberRole === 'moderator') && (
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'settings'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Settings
                  </button>
                )}
              </>
            ) : (
              // Main group navbar - normal tabs
              <>
                {[
                  { 
                    id: 'topics', 
                    label: userRestrictions?.isKidAccount 
                      ? 'My Topics' 
                      : userRestrictions?.isParentShadowAccount 
                        ? 'Subgroup Topics' 
                        : 'Topics', 
                    count: topicsCount 
                  },
                  ...(userRestrictions?.isKidAccount ? [] : [
                    { 
                      id: 'members', 
                      label: 'Members', 
                      count: group.memberCount || 0,
                      disabled: userRestrictions?.isParentShadowAccount && userRestrictions?.parentPermissions?.accessLevel === 'read_only'
                    },
                    { 
                      id: 'rules', 
                      label: 'Rules', 
                      count: group.rules?.length || 0,
                      disabled: userRestrictions?.isParentShadowAccount && userRestrictions?.parentPermissions?.accessLevel === 'read_only'
                    },
                    ...(userRestrictions?.isParentShadowAccount ? [] : [
                      { id: 'subgroups', label: 'Subgroups', count: subgroupsCount }
                    ])
                  ])
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
                {/* Invites tab - only visible to users with manage members access */}
                {(group.canManageMembers || group.memberRole === 'owner' || group.memberRole === 'admin' || group.memberRole === 'moderator') && (
                  <button
                    onClick={() => setActiveTab('invites')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'invites'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Invites
                  </button>
                )}
                {(group.memberRole === 'owner' || group.memberRole === 'admin' || group.memberRole === 'moderator') && (
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'settings'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Settings
                  </button>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'topics' && (
            <TopicsList
              group={group}
              currentUserId={currentUserId}
              onTopicCreated={handleTopicCreated}
              onSubgroupViewChange={handleSubgroupViewChange}
              currentSubgroup={currentSubgroup}
            />
          )}

          {activeTab === 'members' && (
            currentSubgroup ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {currentSubgroup.name} - Members
                    </h3>
                    <p className="text-sm text-gray-500">
                      {subgroupMemberListTab === 'users' 
                        ? `${subgroupMembersCount} member${subgroupMembersCount !== 1 ? 's' : ''} in this subgroup`
                        : `${subgroupRoles.length} role${subgroupRoles.length !== 1 ? 's' : ''} with access to this subgroup`
                      }
                    </p>
                  </div>
                  {(group.canManageMembers || group.memberRole === 'owner' || group.memberRole === 'admin' || group.memberRole === 'moderator') && (
                    <button
                      onClick={() => {
                        console.log('🔍 Members section invite button clicked - memberRole:', group.memberRole, 'canManageMembers:', group.canManageMembers);
                        setShowInviteModal(true);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
                      Invite Members
                    </button>
                  )}
                </div>

                {/* Subgroup Member List Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setSubgroupMemberListTab('users')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        subgroupMemberListTab === 'users'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Members ({subgroupMembersCount})
                    </button>
                    <button
                      onClick={() => setSubgroupMemberListTab('roles')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        subgroupMemberListTab === 'roles'
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Roles Members ({subgroupRoles.length})
                    </button>
                  </nav>
                </div>

                {/* Subgroup Member Content */}
                {subgroupMemberListTab === 'users' ? (
                  <div className="space-y-6">
                    {/* Members List */}
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900">Members ({subgroupMembers.length})</h4>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {subgroupMembers.length === 0 ? (
                          <div className="p-6 text-center text-gray-500">
                            <UserGroupIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <p>No members in this subgroup yet.</p>
                          </div>
                        ) : (
                          subgroupMembers.map((member) => (
                            <div key={member.id} className="p-4 flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  {member.user?.avatarUrl ? (
                                    <img
                                      src={convertToFullAvatarUrl(member.user.avatarUrl)}
                                      alt={member.user.username}
                                      className="h-10 w-10 rounded-full"
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                      <span className="text-purple-600 font-medium">
                                        {getUserInitial(member.user?.username || member.user?.displayName)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <p className="text-sm font-medium text-gray-900">
                                    {member.user?.username || member.user?.displayName || 'Unknown User'}
                                  </p>
                                  <p className="text-sm text-gray-500 capitalize">
                                    {member.role || 'Member'}
                                    {member.isParentAccount && ' (Parent)'}
                                    {member.kidAccountId && ' (Managing Kid Account)'}
                                  </p>
                                </div>
                              </div>
                              {member.assignedRoleId && member.roleName && (
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                  {member.roleName}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Pending Invitations */}
                    {subgroupInvitations.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h4 className="text-sm font-medium text-gray-900">Pending Invitations ({subgroupInvitations.length})</h4>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {subgroupInvitations.map((invitation) => (
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
                                      {invitation?.invitedUser?.displayName || 'Unknown User'}
                                    </p>
                                  </div>
                                  <p className="text-sm text-gray-500">
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
                                {(group.canManageMembers || group.memberRole === 'owner' || group.memberRole === 'admin' || group.memberRole === 'moderator') && (
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
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900">Roles Members with Access to {currentSubgroup.name} ({subgroupRoles.length})</h4>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {subgroupRoles.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          <UserGroupIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                          <p>No roles have access to this subgroup yet.</p>
                        </div>
                      ) : (
                        subgroupRoles.map((role) => (
                          <div key={role.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">
                                    {role.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="flex items-center">
                                  <p className="text-sm font-medium text-gray-900">{role.name}</p>
                                  {role.alias && (
                                    <span className="ml-2 text-sm text-gray-500">({role.alias})</span>
                                  )}
                                </div>
                                {role.description && (
                                  <p className="text-sm text-gray-500">{role.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Role
                              </span>
                              <div className="flex space-x-1">
                                {role.canCreateTopics && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800">
                                    Create Topics
                                  </span>
                                )}
                                {role.canManageMembers && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                                    Manage Members
                                  </span>
                                )}
                                {role.canManageRoles && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">
                                    Manage Roles
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <GroupManagementPanel
                group={group}
                currentUserId={currentUserId}
                onSubgroupCreated={handleSubgroupCreated}
                showOnlyTab="members"
              />
            )
          )}

          {activeTab === 'rules' && (
            <div className="space-y-4">
              {(!group.rules || group.rules.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No rules set for this group.</p>
                </div>
              ) : (
                group.rules?.map((rule) => (
                  <div key={rule.id} className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">{rule.title}</h4>
                    <p className="text-gray-700">{rule.description}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'subgroups' && (
            <SubgroupManagementPanel
              groupId={id || ''}
              currentUserId={currentUserId || ''}
              onSubgroupCreated={handleSubgroupCreated}
            />
          )}

          {activeTab === 'invites' && (
            <InvitesManagementPanel
              groupId={id || ''}
              currentUserId={currentUserId || ''}
              currentSubgroup={currentSubgroup}
            />
          )}

          {activeTab === 'settings' && (
            <GroupSettingsPanel
              groupId={id || ''}
              currentUserId={currentUserId}
              group={group}
            />
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && group && (
        <EnhancedInviteUserModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          groupId={group.id}
          groupName={group.name}
          groupCategory={group.category || ''}
          subgroups={subgroups}
          currentSubgroup={currentSubgroup} // Pass current subgroup context
          onInviteSent={() => {
            setShowInviteModal(false);
            // Refresh subgroup data to show the new invitation
            refreshSubgroupData();
          }}
        />
      )}
    </div>
  );
};

export default GroupDetailPage;
