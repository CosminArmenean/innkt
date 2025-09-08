import { BaseApiService } from './base-api.service';
import { apiConfig } from './api.config';

export interface GroupChat {
  _id: string;
  type: 'group';
  name: string;
  description?: string;
  avatar?: string;
  participants: Array<{
    userId: string;
    role: 'admin' | 'moderator' | 'member';
    joinedAt: string;
    lastSeen: string;
  }>;
  lastMessage?: {
    _id: string;
    content: string;
    senderId: string;
    timestamp: string;
  };
  unreadCount: number;
  isActive: boolean;
  settings: {
    allowFileSharing: boolean;
    allowReactions: boolean;
    allowReplies: boolean;
    messageRetention: number;
    encryptionEnabled: boolean;
    notificationsEnabled: boolean;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupChatRequest {
  name: string;
  description?: string;
  participants: string[];
  avatar?: string;
}

export interface UpdateGroupSettingsRequest {
  name?: string;
  description?: string;
  avatar?: string;
  settings?: Partial<GroupChat['settings']>;
}

export interface AddParticipantsRequest {
  participants: string[];
}

export interface UpdateParticipantRoleRequest {
  role: 'admin' | 'moderator' | 'member';
}

class GroupChatService extends BaseApiService {
  constructor() {
    super(apiConfig.messagingApi);
  }

  // Create a new group chat
  async createGroupChat(data: CreateGroupChatRequest): Promise<GroupChat> {
    try {
      const response = await this.post<{ conversation: GroupChat }>('/group-chat/create', data);
      return response.conversation;
    } catch (error) {
      console.error('Failed to create group chat:', error);
      throw error;
    }
  }

  // Get group chat details
  async getGroupChat(conversationId: string): Promise<GroupChat> {
    try {
      const response = await this.get<{ conversation: GroupChat }>(`/group-chat/${conversationId}`);
      return response.conversation;
    } catch (error) {
      console.error('Failed to get group chat:', error);
      throw error;
    }
  }

  // Update group chat settings
  async updateGroupSettings(
    conversationId: string, 
    data: UpdateGroupSettingsRequest
  ): Promise<GroupChat> {
    try {
      const response = await this.put<{ conversation: GroupChat }>(
        `/group-chat/${conversationId}/settings`, 
        data
      );
      return response.conversation;
    } catch (error) {
      console.error('Failed to update group settings:', error);
      throw error;
    }
  }

  // Add participants to group
  async addParticipants(
    conversationId: string, 
    data: AddParticipantsRequest
  ): Promise<{ message: string; addedParticipants: string[] }> {
    try {
      const response = await this.post<{ message: string; addedParticipants: string[] }>(
        `/group-chat/${conversationId}/participants`, 
        data
      );
      return response;
    } catch (error) {
      console.error('Failed to add participants:', error);
      throw error;
    }
  }

  // Remove participant from group
  async removeParticipant(
    conversationId: string, 
    participantId: string
  ): Promise<{ message: string }> {
    try {
      const response = await this.delete<{ message: string }>(
        `/group-chat/${conversationId}/participants/${participantId}`
      );
      return response;
    } catch (error) {
      console.error('Failed to remove participant:', error);
      throw error;
    }
  }

  // Update participant role
  async updateParticipantRole(
    conversationId: string, 
    participantId: string, 
    data: UpdateParticipantRoleRequest
  ): Promise<{ message: string }> {
    try {
      const response = await this.put<{ message: string }>(
        `/group-chat/${conversationId}/participants/${participantId}/role`, 
        data
      );
      return response;
    } catch (error) {
      console.error('Failed to update participant role:', error);
      throw error;
    }
  }

  // Get group participants
  async getParticipants(conversationId: string): Promise<{ participants: GroupChat['participants'] }> {
    try {
      const response = await this.get<{ participants: GroupChat['participants'] }>(
        `/group-chat/${conversationId}/participants`
      );
      return response;
    } catch (error) {
      console.error('Failed to get participants:', error);
      throw error;
    }
  }

  // Leave group
  async leaveGroup(conversationId: string): Promise<{ message: string }> {
    try {
      const response = await this.post<{ message: string }>(
        `/group-chat/${conversationId}/leave`
      );
      return response;
    } catch (error) {
      console.error('Failed to leave group:', error);
      throw error;
    }
  }

  // Delete group (admin only)
  async deleteGroup(conversationId: string): Promise<{ message: string }> {
    try {
      const response = await this.delete<{ message: string }>(
        `/group-chat/${conversationId}`
      );
      return response;
    } catch (error) {
      console.error('Failed to delete group:', error);
      throw error;
    }
  }

  // Utility methods
  getUserRole(groupChat: GroupChat, userId: string): 'admin' | 'moderator' | 'member' | null {
    const participant = groupChat.participants.find(p => p.userId === userId);
    return participant ? participant.role : null;
  }

  canManageParticipants(groupChat: GroupChat, userId: string): boolean {
    const role = this.getUserRole(groupChat, userId);
    return role === 'admin' || role === 'moderator';
  }

  canUpdateSettings(groupChat: GroupChat, userId: string): boolean {
    const role = this.getUserRole(groupChat, userId);
    return role === 'admin';
  }

  canDeleteGroup(groupChat: GroupChat, userId: string): boolean {
    const role = this.getUserRole(groupChat, userId);
    return role === 'admin';
  }

  getParticipantCount(groupChat: GroupChat): number {
    return groupChat.participants.length;
  }

  getAdminCount(groupChat: GroupChat): number {
    return groupChat.participants.filter(p => p.role === 'admin').length;
  }

  isOnlyAdmin(groupChat: GroupChat, userId: string): boolean {
    const userRole = this.getUserRole(groupChat, userId);
    if (userRole !== 'admin') return false;
    
    const adminCount = this.getAdminCount(groupChat);
    return adminCount === 1;
  }

  formatLastSeen(lastSeen: string): string {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'admin':
        return 'text-red-600 bg-red-100';
      case 'moderator':
        return 'text-blue-600 bg-blue-100';
      case 'member':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'admin':
        return '👑';
      case 'moderator':
        return '🛡️';
      case 'member':
        return '👤';
      default:
        return '👤';
    }
  }
}

export const groupChatService = new GroupChatService();
