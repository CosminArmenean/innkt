import { BaseApiService, createApiInstance } from './api.service';

export interface UsernameValidationResult {
  isValid: boolean;
  isAvailable: boolean;
  username: string;
  errors: string[];
  suggestions: string[];
}

export interface UsernameFormatResult {
  isValid: boolean;
  username: string;
  errors: string[];
}

class UsernameValidationService extends BaseApiService {
  private readonly OFFICER_API_URL = 'http://localhost:5001';

  constructor() {
    super(createApiInstance('http://localhost:5001'));
  }

  /**
   * Check if username is available and valid
   */
  async checkUsername(username: string, signal?: AbortSignal): Promise<UsernameValidationResult> {
    try {
      const response = await this.api.get(`${this.OFFICER_API_URL}/api/auth/username/check`, {
        params: { username },
        signal
      });
      return response.data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw error; // Re-throw abort errors
      }
      console.error('Error checking username:', error);
      return {
        isValid: false,
        isAvailable: false,
        username,
        errors: ['Error checking username availability'],
        suggestions: []
      };
    }
  }

  /**
   * Validate username format only (no database check)
   */
  async validateFormat(username: string): Promise<UsernameFormatResult> {
    try {
      const response = await this.api.get(`${this.OFFICER_API_URL}/api/auth/username/validate-format`, {
        params: { username }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error validating username format:', error);
      return {
        isValid: false,
        username,
        errors: ['Error validating username format']
      };
    }
  }

  /**
   * Client-side username format validation
   */
  validateUsernameFormat(username: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!username || username.trim().length === 0) {
      errors.push('Username is required');
      return { isValid: false, errors };
    }

    const trimmed = username.trim();

    // Length validation
    if (trimmed.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (trimmed.length > 30) {
      errors.push('Username must be no more than 30 characters long');
    }

    // Format validation (alphanumeric and dots only)
    const usernameRegex = /^[a-zA-Z0-9.]+$/;
    if (!usernameRegex.test(trimmed)) {
      errors.push('Username can only contain letters, numbers, and dots (.)');
    }

    // Check for consecutive dots
    if (trimmed.includes('..')) {
      errors.push('Username cannot contain consecutive dots');
    }

    // Check if starts or ends with dot
    if (trimmed.startsWith('.') || trimmed.endsWith('.')) {
      errors.push('Username cannot start or end with a dot');
    }

    // Check for reserved usernames
    const reservedUsernames = [
      'admin', 'administrator', 'root', 'system', 'support', 'help',
      'api', 'www', 'mail', 'email', 'noreply', 'no-reply',
      'innkt', 'innktapp', 'app', 'platform', 'social', 'messaging',
      'groups', 'notifications', 'null', 'undefined', 'true', 'false',
      'test', 'demo', 'guest', 'anonymous', 'user', 'account',
      'profile', 'kid', 'kids', 'child', 'children', 'parent',
      'parents', 'family', 'guardian', 'teacher', 'school',
      'mod', 'moderator', 'staff', 'team', 'abuse', 'report',
      'spam', 'bot', 'follow', 'following', 'followers', 'like',
      'likes', 'post', 'posts', 'comment', 'comments', 'share',
      'shares', 'notification', 'notifications', 'settings',
      'privacy', 'terms', 'policy', 'legal', 'tos', 'css', 'js',
      'html', 'htm', 'xml', 'json', 'pdf', 'doc', 'jpg', 'jpeg',
      'png', 'gif', 'svg', 'ico', 'favicon', 'blog', 'news',
      'forum', 'forums', 'chat', 'shop', 'store', 'login',
      'logout', 'register', 'signup', 'signin', 'auth',
      'dashboard', 'home', 'index', 'main', 'default'
    ];

    if (reservedUsernames.includes(trimmed.toLowerCase())) {
      errors.push('This username is reserved and cannot be used');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate username suggestions
   */
  generateSuggestions(baseUsername: string): string[] {
    const suggestions: string[] = [];
    const clean = baseUsername.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    if (clean.length >= 3) {
      // Add numbers
      for (let i = 1; i <= 5; i++) {
        suggestions.push(`${clean}${i}`);
      }

      // Add year
      const currentYear = new Date().getFullYear();
      suggestions.push(`${clean}${currentYear}`);

      // Add random numbers
      for (let i = 0; i < 3; i++) {
        const randomNum = Math.floor(Math.random() * 1000);
        suggestions.push(`${clean}${randomNum}`);
      }
    }

    return suggestions.slice(0, 5); // Return max 5 suggestions
  }
}

export const usernameValidationService = new UsernameValidationService();
