import { BaseApiService, createApiInstance } from './api.service';

export interface GrokRequest {
  postContent: string;
  userQuestion: string;
  postId: string;
  commentId: string;
  userId?: string; // Optional, will be set by the service
}

export interface GrokResponse {
  id: string;
  response: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}


class GrokService extends BaseApiService {
  constructor() {
    const api = createApiInstance(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081'}/api/grok`);
    super(api);
  }

  /**
   * Send a request to Grok AI via NeuroSpark service
   */
  async sendGrokRequest(request: Omit<GrokRequest, 'userId'>): Promise<GrokResponse> {
    try {
      console.log('🤖 Sending Grok AI request:', request);
      const response = await this.post<GrokResponse>('/ask', request);
      console.log('🤖 Grok AI response received:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to send Grok AI request:', error);
      throw error;
    }
  }

  /**
   * Check the status of a Grok AI request
   */
  async getGrokStatus(requestId: string): Promise<GrokResponse> {
    try {
      const response = await this.get<GrokResponse>(`/status/${requestId}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get Grok AI status:', error);
      throw error;
    }
  }


  /**
   * Detect @grok mentions in text
   */
  detectGrokMentions(text: string): string[] {
    const grokRegex = /@grok\b/gi;
    const matches = text.match(grokRegex);
    return matches || [];
  }

  /**
   * Extract the question from a comment that mentions @grok
   */
  extractGrokQuestion(text: string): string {
    // Remove @grok and clean up the text
    return text.replace(/@grok\s*/gi, '').trim();
  }

  /**
   * Check if a comment contains a @grok mention
   */
  hasGrokMention(text: string): boolean {
    return this.detectGrokMentions(text).length > 0;
  }

  /**
   * Check if a question is appropriate for kids
   */
  async isQuestionAppropriate(question: string, age: number): Promise<boolean> {
    // Simple content filtering - in production, this would call a content filtering service
    const inappropriateWords = ['hate', 'violence', 'adult', 'inappropriate'];
    const lowerQuestion = question.toLowerCase();
    
    for (const word of inappropriateWords) {
      if (lowerQuestion.includes(word)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Process a @grok mention (legacy method for compatibility)
   */
  async processGrokMention(content: string, postId: string, commentId: string): Promise<string> {
    const question = this.extractGrokQuestion(content);
    if (!question) {
      throw new Error('No question found in @grok mention');
    }

    const response = await this.sendGrokRequest({
      postContent: content,
      userQuestion: question,
      postId,
      commentId
    });

    return response.response;
  }

  /**
   * Filter response for kid accounts
   */
  async filterResponseForKid(response: string, age: number): Promise<string> {
    // Simple filtering - in production, this would call a content filtering service
    const filteredResponse = response
      .replace(/inappropriate/gi, 'not suitable')
      .replace(/adult/gi, 'grown-up')
      .replace(/violence/gi, 'conflict');
    
    return filteredResponse;
  }

  /**
   * Generate a response (legacy method for compatibility)
   */
  async generateResponse(request: { question: string; context: string; postId: string; commentId: string }): Promise<string> {
    const response = await this.sendGrokRequest({
      postContent: request.context,
      userQuestion: request.question,
      postId: request.postId,
      commentId: request.commentId
    });

    return response.response;
  }
}

export const grokService = new GrokService();