import { BaseApiService, groupsApi, officerApi } from './api.service';
import { Group, GroupMember, GroupRule, Post } from './social.service';

// Additional interfaces for new features
export interface SubgroupResponse {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  parentSubgroupId?: string;
  level: number;
  membersCount: number;
  isActive: boolean;
  settings?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubgroupRequest {
  groupId: string;
  name: string;
  description?: string;
  settings?: {
    allowMemberPosts: boolean;
    allowKidPosts: boolean;
    allowParentPosts: boolean;
    requireApproval: boolean;
  };
}

export interface TopicResponse {
  id: string;
  groupId: string;
  subgroupId?: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'archived';
  isAnnouncementOnly: boolean;
  allowMemberPosts: boolean;
  allowKidPosts: boolean;
  allowParentPosts: boolean;
  allowRolePosts: boolean;
  postsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopicRequest {
  groupId: string;
  subgroupId?: string;
  name: string;
  description?: string;
  status?: 'active' | 'paused' | 'archived';
  isAnnouncementOnly?: boolean;
  allowMemberPosts?: boolean;
  allowKidPosts?: boolean;
  allowParentPosts?: boolean;
  allowRolePosts?: boolean;
}

export interface GroupInvitationResponse {
  id: string;
  groupId: string;
  invitedUserId: string;
  invitedByUserId: string;
  message?: string;
  status: string;
  createdAt: string;
  respondedAt?: string;
  expiresAt: string;
  group?: {
    id: string;
    name: string;
    description?: string;
  };
  invitedBy?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export interface InviteUserRequest {
  groupId: string;
  userId: string;
  message?: string;
  targetType?: 'main' | 'subgroup';
  subgroupId?: string;
}

export interface GroupInvitationListResponse {
  invitations: GroupInvitationResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GroupRoleResponse {
  id: string;
  groupId: string;
  name: string;
  alias?: string;
  description?: string;
  showRealUsername: boolean;
  canCreateTopics: boolean;
  canManageMembers: boolean;
  canManageRoles: boolean;
  canManageSubgroups: boolean;
  canModerateContent: boolean;
  canAccessAllSubgroups: boolean;
  canUseGrokAI: boolean;
  canUsePerpetualPhotos: boolean;
  canUsePaperScanning: boolean;
  canManageFunds: boolean;
  // Role-based posting permissions
  canPostText: boolean;
  canPostImages: boolean;
  canPostPolls: boolean;
  canPostVideos: boolean;
  canPostAnnouncements: boolean;
  canSeeRealUsername: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  groupId: string;
  name: string;
  alias?: string;
  description?: string;
  canCreateTopics?: boolean;
  canManageMembers?: boolean;
  canManageRoles?: boolean;
  canManageSubgroups?: boolean;
  canPostAnnouncements?: boolean;
  canModerateContent?: boolean;
  canAccessAllSubgroups?: boolean;
  canUseGrokAI?: boolean;
  canUsePerpetualPhotos?: boolean;
  canUsePaperScanning?: boolean;
  canManageFunds?: boolean;
  canSeeRealUsername?: boolean;
}

export interface GroupMemberResponse {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  assignedRoleId?: string; // Custom role assignment
  joinedAt: string;
  lastSeenAt?: string;
  isActive: boolean;
  user?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  
  // Parent-Kid relationship fields
  isParentAccount?: boolean;
  parentId?: string;
  kidId?: string;
  kidAccountId?: string;
}

export interface AssignRoleRequest {
  groupId: string;
  memberId: string;
  roleId: string;
}

// Enhanced Group Interfaces matching our new Groups API
export interface CreateEducationalGroupRequest {
  name: string;
  description: string;
  institutionName: string;
  gradeLevel: string;
  isKidFriendly: boolean;
  allowParentParticipation: boolean;
  requireParentApproval: boolean;
  category: string;
  tags: string[];
  rules: GroupRule[];
  settings: EducationalGroupSettings;
}

export interface CreateFamilyGroupRequest {
  name: string;
  description: string;
  isKidFriendly: boolean;
  allowParentParticipation: boolean;
  requireParentApproval: boolean;
  category: string;
  tags: string[];
  rules: GroupRule[];
}

export interface EducationalGroupSettings {
  allowMemberPosts: boolean;
  allowKidPosts: boolean;
  allowParentPosts: boolean;
  requireApprovalForPosts: boolean;
  allowFileUploads: boolean;
  allowPolls: boolean;
  allowEvents: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  moderationLevel: 'none' | 'basic' | 'strict';
  contentFiltering: boolean;
  profanityFilter: boolean;
  imageModeration: boolean;
  autoApproveParents: boolean;
  autoApproveKids: boolean;
  notificationSettings: {
    newPosts: boolean;
    newMembers: boolean;
    newComments: boolean;
    newPolls: boolean;
    newEvents: boolean;
  };
}

export interface EnhancedGroupResponse extends Group {
  // Enhanced fields
  institutionName?: string;
  gradeLevel?: string;
  isKidFriendly: boolean;
  allowParentParticipation: boolean;
  requireParentApproval: boolean;
  settings?: EducationalGroupSettings;
  subgroups: SubgroupResponse[];
  topics: TopicResponse[];
  polls: PollResponse[];
  documentation: DocumentationResponse[];
}


export interface GroupRuleResponse {
  id: string;
  groupId: string;
  title: string;
  description: string;
  details?: string;
  isActive: boolean;
  order: number;
  category?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}


export interface PollResponse {
  id: string;
  groupId: string;
  topicId?: string;
  question: string;
  options: string[];
  allowMultipleVotes: boolean;
  allowKidVoting: boolean;
  allowParentVotingForKid: boolean;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  totalVotes: number;
  optionResults: PollOptionResult[];
  hasUserVoted: boolean;
  userVoteIndex?: number;
}

export interface PollOptionResult {
  optionIndex: number;
  optionText: string;
  voteCount: number;
  percentage: number;
}

export interface PollResultsResponse {
  pollId: string;
  question: string;
  options: string[];
  totalVotes: number;
  optionResults: PollOptionResult[];
  isActive: boolean;
  expiresAt: string;
}

export interface PollVoteResponse {
  id: string;
  pollId: string;
  userId: string;
  kidId?: string;
  isParentVotingForKid: boolean;
  selectedOptionIndex: number;
  votedAt: string;
}

export interface DocumentationResponse {
  id: string;
  title: string;
  content: string;
  groupId: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}


export class GroupsService extends BaseApiService {
  constructor() {
    super(groupsApi);
  }

  // Enhanced Group Creation Methods
  async createEducationalGroup(userId: string, groupData: CreateEducationalGroupRequest): Promise<Group> {
    try {
      const response = await this.post<Group>(`/api/groups/educational/${userId}`, groupData);
      return response;
    } catch (error) {
      console.error('Failed to create educational group:', error);
      throw error;
    }
  }

  async createFamilyGroup(userId: string, groupData: CreateFamilyGroupRequest): Promise<Group> {
    try {
      const response = await this.post<Group>(`/api/groups/family/${userId}`, groupData);
      return response;
    } catch (error) {
      console.error('Failed to create family group:', error);
      throw error;
    }
  }

  // Legacy method for backward compatibility
  async createGroup(groupData: Partial<Group>): Promise<Group> {
    try {
      // Default to family group for legacy calls
      const familyGroupData: CreateFamilyGroupRequest = {
        name: groupData.name || '',
        description: groupData.description || '',
        isKidFriendly: false, // Default value for legacy calls
        allowParentParticipation: true, // Default value for legacy calls
        requireParentApproval: false, // Default value for legacy calls
        category: groupData.category || 'General',
        tags: groupData.tags || [],
        rules: groupData.rules || []
      };

      // Use a default userId for now - this should be passed from the calling component
      const userId = 'default-user-id'; // TODO: Get from auth context
      return await this.createFamilyGroup(userId, familyGroupData);
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  }

  // Group Management Methods
  async getGroups(filters?: {
    category?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
    currentUserId?: string;
  }): Promise<{ groups: Group[]; totalCount: number; hasMore: boolean }> {
    try {
      const response = await this.get<{ groups: Group[]; totalCount: number; hasMore: boolean }>('/api/groups/public', {
        page: filters?.page || 1,
        pageSize: filters?.limit || 50,
        category: filters?.category,
        type: filters?.type,
        search: filters?.search,
        currentUserId: filters?.currentUserId
      });
      return response;
    } catch (error) {
      console.error('Failed to get groups:', error);
      // Return empty groups as fallback
      return { groups: [], totalCount: 0, hasMore: false };
    }
  }

  async getGroup(groupId: string): Promise<Group> {
    try {
      const response = await this.get<Group>(`/api/groups/${groupId}`);
      return response;
    } catch (error) {
      console.error('Failed to get group:', error);
      throw error;
    }
  }

  async getUserGroups(userId: string, options?: {
    page?: number;
    limit?: number;
  }): Promise<{ groups: Group[]; totalCount: number; hasMore: boolean }> {
    try {
      const response = await this.get<{ groups: Group[]; totalCount: number; hasMore: boolean }>(`/api/groups/user/${userId}`, {
        page: options?.page || 1,
        pageSize: options?.limit || 20
      });
      return response;
    } catch (error) {
      console.error('Failed to get user groups:', error);
      // Return empty groups as fallback
      return { groups: [], totalCount: 0, hasMore: false };
    }
  }

  async getGroupPosts(groupId: string, options?: {
    page?: number;
    limit?: number;
    topicId?: string;
  }): Promise<{ posts: Post[]; totalCount: number; hasMore: boolean }> {
    try {
      const response = await this.get<{ posts: Post[]; totalCount: number; hasMore: boolean }>(`/api/groups/${groupId}/posts`, {
        page: options?.page || 1,
        pageSize: options?.limit || 20,
        topicId: options?.topicId
      });
      return response;
    } catch (error) {
      console.error('Failed to get group posts:', error);
      // Return empty posts as fallback
      return { posts: [], totalCount: 0, hasMore: false };
    }
  }

  async updateGroup(groupId: string, updates: Partial<Group>): Promise<Group> {
    try {
      const response = await this.put<Group>(`/api/groups/${groupId}`, updates);
      return response;
    } catch (error) {
      console.error('Failed to update group:', error);
      throw error;
    }
  }

  async deleteGroup(groupId: string): Promise<void> {
    try {
      await this.delete(`/api/groups/${groupId}`);
    } catch (error) {
      console.error('Failed to delete group:', error);
      throw error;
    }
  }

  // Member Management
  async joinGroup(groupId: string): Promise<void> {
    try {
      await this.post(`/api/groups/${groupId}/join`);
    } catch (error) {
      console.error('Failed to join group:', error);
      throw error;
    }
  }

  async leaveGroup(groupId: string): Promise<void> {
    try {
      await this.post(`/api/groups/${groupId}/leave`);
    } catch (error) {
      console.error('Failed to leave group:', error);
      throw error;
    }
  }



  async getGroupSubgroups(groupId: string): Promise<SubgroupResponse[]> {
    try {
      const response = await this.get<SubgroupResponse[]>(`/api/groups/${groupId}/subgroups`);
      return response;
    } catch (error) {
      console.error('Failed to get group subgroups:', error);
      throw error;
    }
  }



  // Poll Management
  async createPoll(pollData: {
    groupId: string;
    question: string;
    options: string[];
    topicId?: string;
    allowMultipleVotes?: boolean;
    allowKidVoting?: boolean;
    allowParentVotingForKid?: boolean;
    expiresAt: string;
  }): Promise<PollResponse> {
    try {
      const response = await this.post<PollResponse>('/api/polls', pollData);
      return response;
    } catch (error) {
      console.error('Failed to create poll:', error);
      throw error;
    }
  }

  async getPoll(pollId: string): Promise<PollResponse> {
    try {
      const response = await this.get<PollResponse>(`/api/polls/${pollId}`);
      return response;
    } catch (error) {
      console.error('Failed to get poll:', error);
      throw error;
    }
  }

  async getGroupPolls(groupId: string, topicId?: string, isActive?: boolean): Promise<PollResponse[]> {
    try {
      const response = await this.get<PollResponse[]>(`/api/polls/group/${groupId}`, {
        topicId,
        isActive
      });
      return response;
    } catch (error) {
      console.error('Failed to get group polls:', error);
      throw error;
    }
  }

  async votePoll(pollId: string, selectedOptionIndex: number): Promise<PollResponse> {
    try {
      const response = await this.post<PollResponse>(`/api/polls/${pollId}/vote`, {
        pollId,
        selectedOptionIndex
      });
      return response;
    } catch (error) {
      console.error('Failed to vote on poll:', error);
      throw error;
    }
  }

  async getPollResults(pollId: string): Promise<PollResultsResponse> {
    try {
      const response = await this.get<PollResultsResponse>(`/api/polls/${pollId}/results`);
      return response;
    } catch (error) {
      console.error('Failed to get poll results:', error);
      throw error;
    }
  }

  async updatePoll(pollId: string, pollData: {
    question?: string;
    options?: string[];
    allowMultipleVotes?: boolean;
    allowKidVoting?: boolean;
    allowParentVotingForKid?: boolean;
    expiresAt?: string;
    isActive?: boolean;
  }): Promise<PollResponse> {
    try {
      const response = await this.put<PollResponse>(`/api/polls/${pollId}`, pollData);
      return response;
    } catch (error) {
      console.error('Failed to update poll:', error);
      throw error;
    }
  }

  async deletePoll(pollId: string): Promise<void> {
    try {
      await this.delete(`/api/polls/${pollId}`);
    } catch (error) {
      console.error('Failed to delete poll:', error);
      throw error;
    }
  }

  async getMyVote(pollId: string): Promise<PollVoteResponse> {
    try {
      const response = await this.get<PollVoteResponse>(`/api/polls/${pollId}/my-vote`);
      return response;
    } catch (error) {
      console.error('Failed to get my vote:', error);
      throw error;
    }
  }

  // Documentation Management
  async createDocumentation(groupId: string, docData: {
    title: string;
    content: string;
    category: string;
    tags: string[];
    isPublic?: boolean;
  }): Promise<DocumentationResponse> {
    try {
      const response = await this.post<DocumentationResponse>(`/api/groups/${groupId}/documentation`, docData);
      return response;
    } catch (error) {
      console.error('Failed to create documentation:', error);
      throw error;
    }
  }

  async getGroupDocumentation(groupId: string): Promise<DocumentationResponse[]> {
    try {
      const response = await this.get<DocumentationResponse[]>(`/api/groups/${groupId}/documentation`);
      return response;
    } catch (error) {
      console.error('Failed to get group documentation:', error);
      throw error;
    }
  }

  // Analytics
  async getGroupAnalytics(groupId: string): Promise<any> {
    try {
      const response = await this.get(`/api/groups/${groupId}/analytics`);
      return response;
    } catch (error) {
      console.error('Failed to get group analytics:', error);
      throw error;
    }
  }

  // Group Rules Management
  async createGroupRule(groupId: string, ruleData: {
    title: string;
    description: string;
    details?: string;
    isActive?: boolean;
    order?: number;
    category?: string;
  }): Promise<GroupRuleResponse> {
    try {
      const response = await this.post<GroupRuleResponse>(`/api/groups/${groupId}/rules`, ruleData);
      return response;
    } catch (error) {
      console.error('Failed to create group rule:', error);
      throw error;
    }
  }

  async getGroupRules(groupId: string): Promise<GroupRuleResponse[]> {
    try {
      const response = await this.get<GroupRuleResponse[]>(`/api/groups/${groupId}/rules`);
      return response;
    } catch (error) {
      console.error('Failed to get group rules:', error);
      throw error;
    }
  }

  async getGroupRule(groupId: string, ruleId: string): Promise<GroupRuleResponse> {
    try {
      const response = await this.get<GroupRuleResponse>(`/api/groups/${groupId}/rules/${ruleId}`);
      return response;
    } catch (error) {
      console.error('Failed to get group rule:', error);
      throw error;
    }
  }

  async updateGroupRule(groupId: string, ruleId: string, updates: Partial<GroupRuleResponse>): Promise<GroupRuleResponse> {
    try {
      const response = await this.put<GroupRuleResponse>(`/api/groups/${groupId}/rules/${ruleId}`, updates);
      return response;
    } catch (error) {
      console.error('Failed to update group rule:', error);
      throw error;
    }
  }

  async deleteGroupRule(groupId: string, ruleId: string): Promise<void> {
    try {
      await this.delete(`/api/groups/${groupId}/rules/${ruleId}`);
    } catch (error) {
      console.error('Failed to delete group rule:', error);
      throw error;
    }
  }

  async toggleGroupRule(groupId: string, ruleId: string): Promise<GroupRuleResponse> {
    try {
      const response = await this.put<GroupRuleResponse>(`/api/groups/${groupId}/rules/${ruleId}/toggle`);
      return response;
    } catch (error) {
      console.error('Failed to toggle group rule:', error);
      throw error;
    }
  }


  async createSubgroup(request: CreateSubgroupRequest): Promise<SubgroupResponse> {
    try {
      const response = await this.post<SubgroupResponse>(`/api/groups/${request.groupId}/subgroups`, request);
      return response;
    } catch (error) {
      console.error('Failed to create subgroup:', error);
      throw error;
    }
  }

  async updateSubgroup(subgroupId: string, updates: Partial<SubgroupResponse>): Promise<SubgroupResponse> {
    try {
      const response = await this.put<SubgroupResponse>(`/api/subgroups/${subgroupId}`, updates);
      return response;
    } catch (error) {
      console.error('Failed to update subgroup:', error);
      throw error;
    }
  }

  async deleteSubgroup(subgroupId: string): Promise<void> {
    try {
      await this.delete(`/api/subgroups/${subgroupId}`);
    } catch (error) {
      console.error('Failed to delete subgroup:', error);
      throw error;
    }
  }

  // Topic Management
  async getGroupTopics(groupId: string, options?: { subgroupId?: string }): Promise<TopicResponse[]> {
    try {
      const params = options?.subgroupId ? { subgroupId: options.subgroupId } : {};
      const response = await this.get<TopicResponse[]>(`/api/groups/${groupId}/topics`, params);
      return response;
    } catch (error) {
      console.error('Failed to get group topics:', error);
      throw error;
    }
  }

  async createTopic(request: CreateTopicRequest): Promise<TopicResponse> {
    try {
      const response = await this.post<TopicResponse>(`/api/groups/${request.groupId}/topics`, request);
      return response;
    } catch (error) {
      console.error('Failed to create topic:', error);
      throw error;
    }
  }

  async updateTopic(topicId: string, updates: Partial<TopicResponse>): Promise<TopicResponse> {
    try {
      const response = await this.put<TopicResponse>(`/api/topics/${topicId}`, updates);
      return response;
    } catch (error) {
      console.error('Failed to update topic:', error);
      throw error;
    }
  }

  async deleteTopic(topicId: string): Promise<void> {
    try {
      await this.delete(`/api/topics/${topicId}`);
    } catch (error) {
      console.error('Failed to delete topic:', error);
      throw error;
    }
  }

  // Role Management
  async getGroupRoles(groupId: string): Promise<GroupRoleResponse[]> {
    try {
      const response = await this.get<GroupRoleResponse[]>(`/api/groups/${groupId}/roles`);
      return response;
    } catch (error) {
      console.error('Failed to get group roles:', error);
      throw error;
    }
  }

  async createGroupRole(request: CreateRoleRequest): Promise<GroupRoleResponse> {
    try {
      const response = await this.post<GroupRoleResponse>(`/api/groups/${request.groupId}/roles`, request);
      return response;
    } catch (error) {
      console.error('Failed to create group role:', error);
      throw error;
    }
  }

  async updateGroupRole(roleId: string, updates: Partial<GroupRoleResponse>): Promise<GroupRoleResponse> {
    try {
      const response = await this.put<GroupRoleResponse>(`/api/roles/${roleId}`, updates);
      return response;
    } catch (error) {
      console.error('Failed to update group role:', error);
      throw error;
    }
  }

  async deleteGroupRole(roleId: string): Promise<void> {
    try {
      await this.delete(`/api/roles/${roleId}`);
    } catch (error) {
      console.error('Failed to delete group role:', error);
      throw error;
    }
  }

  async getGroupMembers(groupId: string): Promise<GroupMemberResponse[]> {
    try {
      const response = await this.get<any>(`/api/groups/${groupId}/members`);
      // Handle both array response and object with members property (lowercase from backend)
      const result = Array.isArray(response) ? response : response.members || [];
      return result;
    } catch (error) {
      console.error('Failed to get group members:', error);
      throw error;
    }
  }

  async createTopicPost(groupId: string, topicId: string, postData: any): Promise<any> {
    try {
      console.log('Creating topic post:', { groupId, topicId, postData });
      const response = await this.post(`/api/groups/${groupId}/topics/${topicId}/posts`, postData);
      console.log('Topic post created successfully:', response);
      return response;
    } catch (error) {
      console.error('Failed to create topic post:', error);
      throw error;
    }
  }

  async updateTopicStatus(groupId: string, topicId: string, status: 'active' | 'paused'): Promise<TopicResponse> {
    try {
      const response = await this.put<TopicResponse>(`/api/groups/${groupId}/topics/${topicId}/status`, { status });
      return response;
    } catch (error) {
      console.error('Failed to update topic status:', error);
      throw error;
    }
  }

  async assignRoleToMember(request: AssignRoleRequest): Promise<void> {
    try {
      await this.put(`/api/groups/${request.groupId}/members/${request.memberId}/role`, { roleId: request.roleId });
    } catch (error) {
      console.error('Failed to assign role to member:', error);
      throw error;
    }
  }

  // Group invitation methods
  async inviteUser(request: InviteUserRequest): Promise<GroupInvitationResponse> {
    try {
      // Extract groupId from request and send only the required fields in the body
      // Backend expects PascalCase property names
      const { groupId, userId, message, subgroupId } = request;
      
      console.log('InviteUser - Raw request:', request);
      console.log('InviteUser - userId type:', typeof userId, 'value:', userId);
      console.log('InviteUser - groupId type:', typeof groupId, 'value:', groupId);
      
      const body = { 
        UserId: userId, 
        Message: message, 
        SubgroupId: subgroupId 
      };
      
      console.log('InviteUser - Sending body:', body);
      console.log('InviteUser - POST URL:', `/api/groups/${groupId}/invite`);
      
      const response = await this.post<GroupInvitationResponse>(`/api/groups/${groupId}/invite`, body);
      return response;
    } catch (error) {
      console.error('Failed to invite user:', error);
      throw error;
    }
  }

  async getGroupInvitations(groupId: string, page: number = 1, pageSize: number = 20): Promise<GroupInvitationListResponse> {
    try {
      const response = await this.get<GroupInvitationListResponse>(`/api/groups/${groupId}/invitations?page=${page}&pageSize=${pageSize}`);
      return response;
    } catch (error) {
      console.error('Failed to get group invitations:', error);
      throw error;
    }
  }

  async cancelInvitation(groupId: string, invitationId: string): Promise<void> {
    try {
      await this.delete(`/api/groups/${groupId}/invitations/${invitationId}`);
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      throw error;
    }
  }

  // User search for invitations
  async searchUsers(query: string): Promise<any[]> {
    try {
      // Call the Officer service to search for real users
      // Note: Route is api/User (capital U) not api/users
      const response = await officerApi.get(`/api/User/search?query=${encodeURIComponent(query)}&limit=10`);
      
      console.log('User search response:', response.data);
      
      // Map the response to the expected format
      if (response.data && Array.isArray(response.data.users)) {
        return response.data.users.map((user: any) => {
          const avatarPath = user.avatarUrl || user.profilePictureUrl;
          // If avatar path is relative, prepend the Officer service base URL
          const fullAvatarUrl = avatarPath && avatarPath.startsWith('/') 
            ? `http://localhost:5001${avatarPath}` 
            : avatarPath;
            
          return {
            id: user.id || user.userId,
            username: user.username || user.userName,
            displayName: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
            avatarUrl: fullAvatarUrl
          };
        });
      }
      
      return [];
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }


  async getParentKidAccounts(): Promise<any[]> {
    try {
      const response = await this.get<any[]>('/api/parent/kid-accounts');
      return response;
    } catch (error) {
      console.error('Failed to get parent kid accounts:', error);
      throw error;
    }
  }

  async acceptEducationalInvitation(invitationId: string, data: {
    kidId: string;
    groupId: string;
    subgroupId?: string;
  }): Promise<any> {
    try {
      const response = await this.post(`/api/groups/invitations/${invitationId}/accept-educational`, data);
      return response;
    } catch (error) {
      console.error('Failed to accept educational invitation:', error);
      throw error;
    }
  }

  async sendGroupNotification(userId: string, notificationData: any): Promise<any> {
    try {
      const response = await this.post(`/api/groups/notifications/send`, {
        userId,
        ...notificationData
      });
      return response;
    } catch (error) {
      console.error('Failed to send group notification:', error);
      throw error;
    }
  }

  // Group invitation methods
  async joinGroupWithKid(groupId: string, kidAccountId: string): Promise<void> {
    try {
      await this.post(`/api/groups/${groupId}/join-with-kid`, {
        kidAccountId
      });
    } catch (error) {
      console.error('Failed to join group with kid account:', error);
      throw error;
    }
  }

  async joinSubgroupWithKid(groupId: string, subgroupId: string, kidAccountId: string): Promise<void> {
    try {
      await this.post(`/api/groups/${groupId}/subgroups/${subgroupId}/join-with-kid`, {
        kidAccountId
      });
    } catch (error) {
      console.error('Failed to join subgroup with kid account:', error);
      throw error;
    }
  }

  async declineInvite(inviteId: string): Promise<void> {
    try {
      await this.post(`/api/groups/invites/${inviteId}/decline`);
    } catch (error) {
      console.error('Failed to decline invite:', error);
      throw error;
    }
  }

  // Get user's roles in a group for role-based posting
  async getUserRolesInGroup(groupId: string): Promise<GroupRoleResponse[]> {
    try {
      const response = await this.get<GroupRoleResponse[]>(`/api/groups/${groupId}/user-roles`);
      return response;
    } catch (error) {
      console.error('Failed to get user roles in group:', error);
      throw error;
    }
  }
}

export const groupsService = new GroupsService();
