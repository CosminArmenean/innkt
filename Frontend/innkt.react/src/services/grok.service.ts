import { BaseApiService } from './api.service';

// Types for Grok AI API
export interface GrokResponse {
  id: string;
  question: string;
  response: string;
  responseType: string; // informational, educational, creative, factual
  confidenceScore: number; // 0.0 to 1.0
  safetyScore: number; // 0.0 to 1.0
  sources: string[];
  relatedTopics: string[];
  followUpQuestions: string[];
  metadata: Record<string, any>;
  generatedAt: string;
  model: string;
  tokensUsed: number;
  isKidSafe: boolean;
  isEducational: boolean; // Added missing property
  requiresHumanReview: boolean;
}

export interface GrokRequest {
  question: string;
  context?: string;
  userId: string;
  kidAccountId?: string;
  isKidAccount?: boolean;
  responseType?: string;
}

export interface GrokEducationalRequest {
  question: string;
  kidAge: number;
  subject?: string;
  gradeLevel?: string;
}

export interface GrokPersonality {
  userId: string;
  tone: string; // friendly, professional, casual, enthusiastic
  explanationStyle: string; // brief, detailed, step-by-step, visual
  preferredTopics: string[];
  avoidedTopics: string[];
  complexityPreference: number; // 1-5 scale
  includeExamples: boolean;
  includeFollowUps: boolean;
  includeSources: boolean;
}

export interface GrokInteraction {
  id: string;
  userId: string;
  question: string;
  response: GrokResponse;
  userSatisfied: boolean;
  userRating: number; // 1-5 stars
  userFeedback?: string;
  interactionTime: string;
  context: string; // post, comment, direct
}

export interface GrokUsageStats {
  totalQuestions: number;
  totalResponses: number;
  averageResponseTime: number;
  averageSatisfactionRating: number;
  topCategories: Record<string, number>;
  topTopics: Record<string, number>;
  uniqueUsers: number;
  periodStart: string;
  periodEnd: string;
}

/**
 * Grok AI Service - Revolutionary AI integration for social media
 * Industry-first AI-powered social interaction enhancement
 */
class GrokService extends BaseApiService {
  constructor() {
    super('/api/neurospark'); // NeuroSpark service endpoint
  }

  /**
   * Process @grok mention in social media comment
   */
  async processGrokMention(
    comment: string, 
    postId: string, 
    authorId: string, 
    context: string = ''
  ): Promise<GrokResponse> {
    try {
      const response = await this.post<GrokResponse>('/grok/process-mention', {
        comment,
        postId,
        authorId,
        context
      });

      console.log('✅ @grok mention processed successfully');
      return response;
    } catch (error) {
      console.error('❌ Error processing @grok mention:', error);
      throw new Error('Failed to process @grok mention');
    }
  }

  /**
   * Generate AI response for direct question
   */
  async generateResponse(request: GrokRequest): Promise<GrokResponse> {
    try {
      const response = await this.post<GrokResponse>('/grok/generate', request);
      
      console.log('🤖 Grok response generated:', {
        responseType: response.responseType,
        confidenceScore: response.confidenceScore,
        safetyScore: response.safetyScore,
        isKidSafe: response.isKidSafe
      });

      return response;
    } catch (error) {
      console.error('❌ Error generating Grok response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Generate educational response for kids
   */
  async generateEducationalResponse(request: GrokEducationalRequest): Promise<GrokResponse> {
    try {
      const response = await this.post<GrokResponse>('/grok/educational', request);
      
      console.log('🎓 Educational Grok response generated for age:', request.kidAge);
      return response;
    } catch (error) {
      console.error('❌ Error generating educational response:', error);
      throw new Error('Failed to generate educational response');
    }
  }

  /**
   * Check if content contains @grok mention
   */
  async isGrokMention(content: string): Promise<boolean> {
    try {
      const response = await this.post<{ isGrokMention: boolean }>('/grok/check-mention', {
        content
      });
      
      return response.isGrokMention;
    } catch (error) {
      console.error('❌ Error checking Grok mention:', error);
      return false;
    }
  }

  /**
   * Extract questions from @grok mention
   */
  async extractGrokQuestions(content: string): Promise<string[]> {
    try {
      const response = await this.post<{ questions: string[] }>('/grok/extract-questions', {
        content
      });
      
      return response.questions;
    } catch (error) {
      console.error('❌ Error extracting Grok questions:', error);
      return [];
    }
  }

  /**
   * Get personalized Grok settings for user
   */
  async getGrokPersonality(userId: string): Promise<GrokPersonality> {
    try {
      return await this.get<GrokPersonality>(`/grok/personality/${userId}`);
    } catch (error) {
      console.error('❌ Error getting Grok personality:', error);
      throw new Error('Failed to get Grok personality settings');
    }
  }

  /**
   * Update Grok personality settings
   */
  async updateGrokPersonality(userId: string, personality: Partial<GrokPersonality>): Promise<boolean> {
    try {
      await this.put(`/grok/personality/${userId}`, personality);
      console.log('✅ Grok personality updated for user:', userId);
      return true;
    } catch (error) {
      console.error('❌ Error updating Grok personality:', error);
      return false;
    }
  }

  /**
   * Get user's Grok interaction history
   */
  async getGrokHistory(userId: string, days: number = 30): Promise<GrokInteraction[]> {
    try {
      return await this.get<GrokInteraction[]>(`/grok/history/${userId}?days=${days}`);
    } catch (error) {
      console.error('❌ Error getting Grok history:', error);
      return [];
    }
  }

  /**
   * Log Grok interaction for analytics
   */
  async logGrokInteraction(interaction: Omit<GrokInteraction, 'id' | 'interactionTime'>): Promise<boolean> {
    try {
      await this.post('/grok/log-interaction', interaction);
      return true;
    } catch (error) {
      console.error('❌ Error logging Grok interaction:', error);
      return false;
    }
  }

  /**
   * Get Grok usage statistics
   */
  async getGrokUsageStats(startDate: string, endDate: string): Promise<GrokUsageStats> {
    try {
      return await this.get<GrokUsageStats>(`/grok/stats?start=${startDate}&end=${endDate}`);
    } catch (error) {
      console.error('❌ Error getting Grok usage stats:', error);
      throw new Error('Failed to get usage statistics');
    }
  }

  /**
   * Validate if question is appropriate for kids
   */
  async isQuestionAppropriate(question: string, kidAge?: number): Promise<boolean> {
    try {
      const response = await this.post<{ isAppropriate: boolean }>('/grok/validate-question', {
        question,
        kidAge
      });
      
      return response.isAppropriate;
    } catch (error) {
      console.error('❌ Error validating question appropriateness:', error);
      return false; // Fail safe for kids
    }
  }

  /**
   * Get safe topics for specific age
   */
  async getSafeTopicsForAge(age: number): Promise<string[]> {
    try {
      const response = await this.get<{ topics: string[] }>(`/grok/safe-topics/${age}`);
      return response.topics;
    } catch (error) {
      console.error('❌ Error getting safe topics:', error);
      return ['Science', 'Math', 'History', 'Art']; // Default safe topics
    }
  }

  /**
   * Filter Grok response for kid safety
   */
  async filterResponseForKid(response: GrokResponse, kidAge: number): Promise<GrokResponse> {
    try {
      return await this.post<GrokResponse>('/grok/filter-for-kid', {
        response,
        kidAge
      });
    } catch (error) {
      console.error('❌ Error filtering response for kid:', error);
      return response; // Return original if filtering fails
    }
  }
}

export const grokService = new GrokService();
