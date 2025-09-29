import { BaseApiService, groupsApi } from './api.service';
import { Group, GroupMember, GroupRule, Post } from './social.service';

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

export interface SubgroupResponse {
  id: string;
  name: string;
  description: string;
  parentGroupId: string;
  gradeLevel: string;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface TopicResponse {
  id: string;
  name: string;
  description: string;
  groupId: string;
  subgroupId?: string;
  status: 'active' | 'paused' | 'archived';
  isAnnouncementOnly: boolean;
  allowMemberPosts: boolean;
  allowKidPosts: boolean;
  allowParentPosts: boolean;
  postCount: number;
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

  async getGroupMembers(groupId: string, page?: number, limit?: number): Promise<{ members: GroupMember[]; totalCount: number; hasMore: boolean }> {
    try {
      const response = await this.get<{ members: GroupMember[]; totalCount: number; hasMore: boolean }>(`/api/groups/${groupId}/members`, {
        page: page || 1,
        pageSize: limit || 50
      });
      return response;
    } catch (error) {
      console.error('Failed to get group members:', error);
      throw error;
    }
  }

  // Subgroup Management
  async createSubgroup(groupId: string, subgroupData: {
    name: string;
    description: string;
    gradeLevel: string;
    settings: {
      isKidFriendly: boolean;
      allowParentParticipation: boolean;
      requireParentApproval: boolean;
      allowMemberPosts: boolean;
      allowKidPosts: boolean;
      allowParentPosts: boolean;
      requireApprovalForPosts: boolean;
      allowFileUploads: boolean;
      allowPolls: boolean;
      moderationLevel: 'none' | 'basic' | 'strict';
      contentFiltering: boolean;
      profanityFilter: boolean;
      imageModeration: boolean;
      autoApproveParents: boolean;
      autoApproveKids: boolean;
    };
  }): Promise<SubgroupResponse> {
    try {
      const response = await this.post<SubgroupResponse>(`/api/groups/${groupId}/subgroups`, subgroupData);
      return response;
    } catch (error) {
      console.error('Failed to create subgroup:', error);
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

  // Topic Management
  async createTopic(groupId: string, topicData: {
    name: string;
    description: string;
    subgroupId?: string;
    isAnnouncementOnly?: boolean;
    allowMemberPosts?: boolean;
    allowKidPosts?: boolean;
    allowParentPosts?: boolean;
  }): Promise<TopicResponse> {
    try {
      const response = await this.post<TopicResponse>(`/api/groups/${groupId}/topics`, topicData);
      return response;
    } catch (error) {
      console.error('Failed to create topic:', error);
      throw error;
    }
  }

  async getGroupTopics(groupId: string, subgroupId?: string): Promise<TopicResponse[]> {
    try {
      const response = await this.get<TopicResponse[]>(`/api/groups/${groupId}/topics`, {
        subgroupId
      });
      return response;
    } catch (error) {
      console.error('Failed to get group topics:', error);
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
}

export const groupsService = new GroupsService();
