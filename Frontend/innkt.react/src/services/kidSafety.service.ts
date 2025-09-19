import { BaseApiService } from './api.service';

// Types for Kid Safety API
export interface KidAccount {
  id: string;
  userId: string;
  parentId: string;
  age: number;
  safetyLevel: string;
  maxDailyTimeMinutes: number;
  maxConnections: number;
  ageGapLimitYears: number;
  parentNetworkOnly: boolean;
  requireParentApproval: boolean;
  educationalContentOnly: boolean;
  blockMatureContent: boolean;
  minContentSafetyScore: number;
  allowedTopics: string[];
  blockedTopics: string[];
  independenceDate?: string;
  independenceDateSet: boolean;
  currentMaturityScore: number;
  requiredMaturityScore: number;
  adaptiveSafetyEnabled: boolean;
  behaviorScore: number;
  trustScore: number;
  educationalEngagement: number;
  lastBehaviorAssessment: string;
  emergencyContacts: string[];
  panicButtonEnabled: boolean;
  locationSharingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isActive: boolean;
}

export interface KidAccountDetails extends KidAccount {
  currentMaturityScore: number;
  recentSafetyEvents: number;
  pendingApprovals: number;
  canAccessPlatform: boolean;
  dailyUsageMinutes: number;
  isWithinAllowedHours: boolean;
}

export interface ParentApproval {
  id: string;
  kidAccountId: string;
  parentId: string;
  requestType: string;
  targetUserId: string;
  status: string;
  requestData: Record<string, any>;
  parentNotes?: string;
  expiresAt?: string;
  processedAt?: string;
  safetyScore: number;
  safetyFlags: string[];
  autoApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SafetyEvent {
  id: string;
  kidAccountId: string;
  eventType: string;
  severity: string;
  description: string;
  eventData: Record<string, any>;
  parentNotified: boolean;
  resolved: boolean;
  resolvedAt?: string;
  resolutionNotes?: string;
  riskScore: number;
  aiFlags: string[];
  requiresHumanReview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BehaviorAssessment {
  id: string;
  kidAccountId: string;
  assessmentDate: string;
  digitalCitizenship: number;
  responsibleBehavior: number;
  parentTrust: number;
  educationalEngagement: number;
  socialInteraction: number;
  contentQuality: number;
  overallMaturityScore: number;
  safetyRisk: number;
  independenceReadiness: number;
  assessmentMethod: string;
  assessmentData: Record<string, any>;
  assessorNotes?: string;
  recommendedActions: string[];
  safetyRecommendations: string[];
  nextAssessmentDate: string;
  createdAt: string;
  createdBy?: string;
}

export interface KidSafetyReport {
  kidAccountId: string;
  parentId: string;
  weekStartDate: string;
  weekEndDate: string;
  totalActiveMinutes: number;
  postsCreated: number;
  commentsReceived: number;
  messagesExchanged: number;
  newConnections: number;
  overallSafetyScore: number;
  safetyEvents: number;
  parentInterventions: number;
  maturityProgress: number;
  educationalEngagement: number;
  learningAchievements: number;
  teacherFeedback: number;
  parentRecommendations: string[];
  safetyImprovements: string[];
  educationalOpportunities: string[];
  trendDirection: string;
  trendExplanation?: string;
}

export interface SafetyInsight {
  insightType: string;
  title: string;
  description: string;
  severity: string;
  actionRequired: string;
  createdAt: string;
  metadata: Record<string, any>;
}

export interface ActivitySummary {
  kidAccountId: string;
  startDate: string;
  endDate: string;
  totalMinutesActive: number;
  sessionsCount: number;
  averageSessionLength: number;
  postsViewed: number;
  postsCreated: number;
  commentsPosted: number;
  commentsReceived: number;
  messagesExchanged: number;
  newConnectionRequests: number;
  approvedConnections: number;
  safetyEventsTriggered: number;
  contentSafetyScore: number;
  behaviorScore: number;
  educationalContentViewed: number;
  learningAchievements: number;
  educationalEngagementScore: number;
}

// Request/Response types
export interface CreateKidAccountRequest {
  userId: string;
  age: number;
  safetyLevel?: string;
}

export interface CreateKidAccountResponse {
  kidAccount: KidAccount;
  message: string;
  nextSteps: string[];
}

export interface IsKidAccountResponse {
  isKidAccount: boolean;
  age?: number;
  safetyLevel?: string;
  parentId?: string;
  canAccessPlatform: boolean;
}

export interface CreateApprovalRequest {
  kidAccountId: string;
  requestType: string;
  targetUserId: string;
  requestData?: Record<string, any>;
}

export interface CreateApprovalResponse {
  approval: ParentApproval;
  message: string;
  estimatedResponseTime: string;
}

export interface ProcessApprovalRequest {
  approved: boolean;
  notes?: string;
}

export interface ProcessApprovalResponse {
  success: boolean;
  message: string;
  action: string;
  notificationSent: boolean;
}

export interface ContentSafetyRequest {
  content: string;
  kidAccountId: string;
  kidAge: number;
  mediaUrls?: string[];
}

export interface ContentSafetyResponse {
  isSafe: boolean;
  safetyScore: number;
  reasons: string[];
  recommendations: string[];
}

export interface PanicButtonRequest {
  message?: string;
}

export interface EmergencyResponse {
  success: boolean;
  message: string;
  emergencyId: string;
  responseTime: string;
  contactsNotified: string[];
}

/**
 * Kid Safety Service - Comprehensive child protection API client
 * Provides industry-leading safety features and parental controls
 */
class KidSafetyService extends BaseApiService {
  constructor() {
    super('/api/v1/kid-safety');
  }

  /**
   * Create a new kid account with comprehensive safety settings
   */
  async createKidAccount(request: CreateKidAccountRequest): Promise<CreateKidAccountResponse> {
    return await this.post<CreateKidAccountResponse>('/kid-accounts', request);
  }

  /**
   * Get kid account details with safety metrics
   */
  async getKidAccount(kidAccountId: string): Promise<KidAccountDetails> {
    return await this.get<KidAccountDetails>(`/kid-accounts/${kidAccountId}`);
  }

  /**
   * Check if a user is a kid account
   */
  async isKidAccount(userId: string): Promise<IsKidAccountResponse> {
    return await this.get<IsKidAccountResponse>(`/users/${userId}/is-kid`);
  }

  /**
   * Create approval request for kid account activity
   */
  async createApprovalRequest(request: CreateApprovalRequest): Promise<CreateApprovalResponse> {
    return await this.post<CreateApprovalResponse>('/approval-requests', request);
  }

  /**
   * Process parent approval request (approve/deny)
   */
  async processApprovalRequest(
    approvalId: string, 
    request: ProcessApprovalRequest
  ): Promise<ProcessApprovalResponse> {
    return await this.put<ProcessApprovalResponse>(`/approval-requests/${approvalId}`, request);
  }

  /**
   * Get pending approval requests for parent
   */
  async getPendingApprovals(parentId: string): Promise<ParentApproval[]> {
    return await this.get<ParentApproval[]>(`/parents/${parentId}/pending-approvals`);
  }

  /**
   * Check if content is safe for kid account
   */
  async checkContentSafety(request: ContentSafetyRequest): Promise<ContentSafetyResponse> {
    return await this.post<ContentSafetyResponse>('/content-safety-check', request);
  }

  /**
   * Get weekly safety report for kid account
   */
  async getWeeklySafetyReport(kidAccountId: string): Promise<KidSafetyReport> {
    return await this.get<KidSafetyReport>(`/kid-accounts/${kidAccountId}/safety-report`);
  }

  /**
   * Get safety insights for parent dashboard
   */
  async getSafetyInsights(parentId: string): Promise<SafetyInsight[]> {
    return await this.get<SafetyInsight[]>(`/parents/${parentId}/safety-insights`);
  }

  /**
   * Trigger emergency panic button
   */
  async triggerPanicButton(kidAccountId: string, request: PanicButtonRequest): Promise<EmergencyResponse> {
    return await this.post<EmergencyResponse>(`/kid-accounts/${kidAccountId}/panic-button`, request);
  }

  /**
   * Get kid account by user ID
   */
  async getKidAccountByUserId(userId: string): Promise<KidAccount | null> {
    try {
      return await this.get<KidAccount>(`/users/${userId}/kid-account`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get behavior assessments for kid account
   */
  async getBehaviorAssessments(kidAccountId: string, days: number = 30): Promise<BehaviorAssessment[]> {
    return await this.get<BehaviorAssessment[]>(`/kid-accounts/${kidAccountId}/behavior-assessments?days=${days}`);
  }

  /**
   * Get safety events for kid account
   */
  async getSafetyEvents(kidAccountId: string, days: number = 7): Promise<SafetyEvent[]> {
    return await this.get<SafetyEvent[]>(`/kid-accounts/${kidAccountId}/safety-events?days=${days}`);
  }

  /**
   * Get activity summary for kid account
   */
  async getActivitySummary(kidAccountId: string, days: number = 7): Promise<ActivitySummary> {
    return await this.get<ActivitySummary>(`/kid-accounts/${kidAccountId}/activity-summary?days=${days}`);
  }

  /**
   * Update kid account settings
   */
  async updateKidAccountSettings(kidAccountId: string, settings: Partial<KidAccount>): Promise<boolean> {
    const response = await this.put<{success: boolean}>(`/kid-accounts/${kidAccountId}`, settings);
    return response.success;
  }

  /**
   * Get approval history for kid account
   */
  async getApprovalHistory(kidAccountId: string, page: number = 1, pageSize: number = 20): Promise<ParentApproval[]> {
    return await this.get<ParentApproval[]>(`/kid-accounts/${kidAccountId}/approval-history?page=${page}&pageSize=${pageSize}`);
  }

  /**
   * Get safe user suggestions for kid account
   */
  async getSafeUserSuggestions(kidAccountId: string, limit: number = 10): Promise<string[]> {
    return await this.get<string[]>(`/kid-accounts/${kidAccountId}/safe-suggestions?limit=${limit}`);
  }

  /**
   * Check if user is safe for kid to interact with
   */
  async isUserSafeForKid(targetUserId: string, kidAccountId: string): Promise<boolean> {
    const response = await this.get<{isSafe: boolean}>(`/kid-accounts/${kidAccountId}/check-user/${targetUserId}`);
    return response.isSafe;
  }

  /**
   * Get educational connections for kid account
   */
  async getEducationalConnections(kidAccountId: string): Promise<string[]> {
    return await this.get<string[]>(`/kid-accounts/${kidAccountId}/educational-connections`);
  }

  /**
   * Create independence transition plan
   */
  async createIndependenceTransition(kidAccountId: string, independenceDate: string): Promise<any> {
    return await this.post<any>(`/kid-accounts/${kidAccountId}/independence-transition`, {
      independenceDate
    });
  }

  /**
   * Get upcoming independence days
   */
  async getUpcomingIndependenceDays(daysAhead: number = 30): Promise<any[]> {
    return await this.get<any[]>(`/independence-transitions/upcoming?daysAhead=${daysAhead}`);
  }
}

export const kidSafetyService = new KidSafetyService();
