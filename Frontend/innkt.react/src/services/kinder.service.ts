import axios from 'axios';

const KINDER_API_URL = 'http://localhost:5004/api/kinder';

// Interfaces for Kinder service
export interface KidLoginCodeResponse {
  codeId: string;
  code: string;
  qrCodeDataUrl: string;
  expiresAt: string;
  expirationDays: number;
  maturityLevel: string;
}

export interface GenerateLoginCodeRequest {
  kidAccountId: string;
  parentId: string;
  expirationDays?: number;
}

export interface ValidateLoginCodeRequest {
  code: string;
}

export interface LoginCodeValidationResponse {
  isValid: boolean;
  kidAccountId?: string;
  userId?: string;
  message: string;
}

export interface MaturityScore {
  id: string;
  kidAccountId: string;
  ageScore: number;
  parentAssessment: number;
  parentRating: number;
  behavioralScore: number;
  totalScore: number;
  level: string;
  timeManagement: number;
  contentAppropriateness: number;
  socialInteraction: number;
  responsibilityScore: number;
  securityAwareness: number;
  assessmentNotes?: string;
  lastUpdated: string;
}

export interface KidPasswordSettings {
  id: string;
  kidAccountId: string;
  hasPassword: boolean;
  passwordSetByParent: boolean;
  firstPasswordSetAt?: string;
  lastPasswordChangeAt?: string;
  passwordChangedByKid: boolean;
  independenceDay?: string;
  canChangePassword: boolean;
  passwordRevoked: boolean;
  notifyParentOnPasswordChange: boolean;
  independenceDayReached: boolean;
}

export interface ParentAssessmentRequest {
  parentId: string;
  rating: number;
  notes?: string;
}

export interface BehavioralMetrics {
  timeManagement: number;
  contentAppropriateness: number;
  socialInteraction: number;
  responsibilityScore: number;
  securityAwareness: number;
}

/**
 * Kinder Service API Client
 * Handles QR code generation, validation, maturity scoring, and password management
 */
class KinderService {
  // QR Code & Login Code Management
  async generateLoginCode(request: GenerateLoginCodeRequest): Promise<KidLoginCodeResponse> {
    const response = await axios.post(`${KINDER_API_URL}/generate-login-code`, request);
    return response.data;
  }

  async validateLoginCode(request: ValidateLoginCodeRequest): Promise<LoginCodeValidationResponse> {
    const response = await axios.post(`${KINDER_API_URL}/validate-login-code`, request);
    return response.data;
  }

  async getActiveLoginCodes(kidAccountId: string): Promise<any[]> {
    const response = await axios.get(`${KINDER_API_URL}/${kidAccountId}/login-codes`);
    return response.data;
  }

  async revokeLoginCode(codeId: string, parentId: string): Promise<void> {
    await axios.delete(`${KINDER_API_URL}/login-codes/${codeId}?parentId=${parentId}`);
  }

  // Maturity Score Management
  async getMaturityScore(kidAccountId: string): Promise<MaturityScore> {
    const response = await axios.get(`${KINDER_API_URL}/${kidAccountId}/maturity-score`);
    return response.data;
  }

  async updateParentAssessment(kidAccountId: string, request: ParentAssessmentRequest): Promise<MaturityScore> {
    const response = await axios.post(`${KINDER_API_URL}/${kidAccountId}/parent-assessment`, request);
    return response.data;
  }

  async updateBehavioralMetrics(kidAccountId: string, metrics: BehavioralMetrics): Promise<MaturityScore> {
    const response = await axios.post(`${KINDER_API_URL}/${kidAccountId}/behavioral-metrics`, metrics);
    return response.data;
  }

  // Password Management
  async setPassword(kidAccountId: string, parentId: string, password: string): Promise<void> {
    await axios.post(`${KINDER_API_URL}/${kidAccountId}/set-password`, { parentId, password });
  }

  async changePassword(kidAccountId: string, oldPassword: string, newPassword: string): Promise<void> {
    await axios.post(`${KINDER_API_URL}/${kidAccountId}/change-password`, { oldPassword, newPassword });
  }

  async revokePassword(kidAccountId: string, parentId: string, reason: string): Promise<void> {
    await axios.post(`${KINDER_API_URL}/${kidAccountId}/revoke-password`, { parentId, reason });
  }

  async getPasswordSettings(kidAccountId: string): Promise<KidPasswordSettings> {
    const response = await axios.get(`${KINDER_API_URL}/${kidAccountId}/password-settings`);
    return response.data;
  }

  // Behavioral Tracking
  async trackActivity(kidAccountId: string, activityType: string, contentType?: string, metadata?: any): Promise<void> {
    await axios.post(`${KINDER_API_URL}/behavior/track-activity`, {
      kidAccountId,
      activityType,
      contentType,
      metadata
    });
  }

  async getBehavioralMetrics(kidAccountId: string): Promise<any> {
    const response = await axios.get(`${KINDER_API_URL}/behavior/${kidAccountId}/metrics`);
    return response.data;
  }

  async getActivityHistory(kidAccountId: string, days: number = 7): Promise<any[]> {
    const response = await axios.get(`${KINDER_API_URL}/behavior/${kidAccountId}/history?days=${days}`);
    return response.data;
  }

  // Time Restrictions
  async getTimeRestrictions(kidAccountId: string): Promise<any[]> {
    const response = await axios.get(`${KINDER_API_URL}/time-restrictions/${kidAccountId}`);
    return response.data;
  }

  async createTimeRestriction(kidAccountId: string, dayOfWeek: number, startTime: string, endTime: string): Promise<any> {
    const response = await axios.post(`${KINDER_API_URL}/time-restrictions/${kidAccountId}`, {
      dayOfWeek,
      startTime,
      endTime
    });
    return response.data;
  }

  async checkAccess(kidAccountId: string): Promise<any> {
    const response = await axios.get(`${KINDER_API_URL}/time-restrictions/${kidAccountId}/check-access`);
    return response.data;
  }

  async getUsageToday(kidAccountId: string): Promise<any> {
    const response = await axios.get(`${KINDER_API_URL}/time-restrictions/${kidAccountId}/usage-today`);
    return response.data;
  }

  // Content Filtering
  async getContentFilters(kidAccountId: string): Promise<any> {
    const response = await axios.get(`${KINDER_API_URL}/content/filters/${kidAccountId}`);
    return response.data;
  }

  async updateContentFilters(kidAccountId: string, filterLevel: string, blockedKeywords: string[], allowedCategories: string[]): Promise<any> {
    const response = await axios.post(`${KINDER_API_URL}/content/filters/${kidAccountId}`, {
      filterLevel,
      blockedKeywords,
      allowedCategories
    });
    return response.data;
  }

  async checkContentSafety(kidAccountId: string, content: string, contentCategory: string = 'general'): Promise<any> {
    const response = await axios.post(`${KINDER_API_URL}/content/check-safety`, {
      kidAccountId,
      content,
      contentCategory
    });
    return response.data;
  }
}

export const kinderService = new KinderService();

