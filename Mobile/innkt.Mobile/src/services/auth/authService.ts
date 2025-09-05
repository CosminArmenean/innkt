import AsyncStorage from '@react-native-async-storage/async-storage';
import {officerApiClient, frontierApiClient} from '../api/apiClient';
import {API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES} from '../../config/environment';
import {
  AppUser,
  UserRegistrationRequest,
  UserLoginRequest,
  UserAuthResponse,
  UserProfileUpdateRequest,
  PasswordChangeRequest,
  ConsentStatus,
  createEmptyUser,
  createEmptyConsentStatus,
} from '../../models/user';

// Authentication service interface
export interface IAuthService {
  // Authentication methods
  login(credentials: UserLoginRequest): Promise<AppUser>;
  register(userData: UserRegistrationRequest): Promise<AppUser>;
  logout(): Promise<void>;
  refreshToken(): Promise<string>;
  
  // User management
  getCurrentUser(): Promise<AppUser | null>;
  updateProfile(profileData: UserProfileUpdateRequest): Promise<AppUser>;
  changePassword(passwordData: PasswordChangeRequest): Promise<void>;
  updateConsent(consentData: Partial<ConsentStatus>): Promise<void>;
  
  // Token management
  getAccessToken(): Promise<string | null>;
  isTokenValid(): Promise<boolean>;
  clearTokens(): Promise<void>;
  
  // Utility methods
  isAuthenticated(): Promise<boolean>;
  getStoredUser(): AppUser | null;
}

/**
 * Real authentication service that integrates with backend services
 * Handles user authentication, registration, and profile management
 */
export class AuthService implements IAuthService {
  private currentUser: AppUser | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.initializeFromStorage();
  }

  /**
   * Initialize service from stored data
   */
  private async initializeFromStorage(): Promise<void> {
    try {
      const [userData, token, refreshToken, expiry] = await Promise.all([
        AsyncStorage.getItem('user_data'),
        AsyncStorage.getItem('access_token'),
        AsyncStorage.getItem('refresh_token'),
        AsyncStorage.getItem('token_expiry'),
      ]);

      if (userData && token) {
        this.currentUser = JSON.parse(userData);
        this.accessToken = token;
        this.refreshToken = refreshToken;
        this.tokenExpiry = expiry ? new Date(expiry) : null;

        // Set token in API clients
        officerApiClient.setAuthToken(token);
        frontierApiClient.setAuthToken(token);
      }
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
      await this.clearTokens();
    }
  }

  /**
   * Store authentication data
   */
  private async storeAuthData(
    user: AppUser,
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ): Promise<void> {
    try {
      const expiry = new Date(Date.now() + expiresIn * 1000);
      
      await Promise.all([
        AsyncStorage.setItem('user_data', JSON.stringify(user)),
        AsyncStorage.setItem('access_token', accessToken),
        AsyncStorage.setItem('refresh_token', refreshToken),
        AsyncStorage.setItem('token_expiry', expiry.toISOString()),
      ]);

      this.currentUser = user;
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.tokenExpiry = expiry;

      // Set token in API clients
      officerApiClient.setAuthToken(accessToken);
      frontierApiClient.setAuthToken(accessToken);
    } catch (error) {
      console.error('Failed to store auth data:', error);
      throw new Error(ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  }

  /**
   * Clear stored authentication data
   */
  private async clearStoredData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem('user_data'),
        AsyncStorage.removeItem('access_token'),
        AsyncStorage.removeItem('refresh_token'),
        AsyncStorage.removeItem('token_expiry'),
      ]);
    } catch (error) {
      console.error('Failed to clear stored data:', error);
    }
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(): boolean {
    if (!this.tokenExpiry) return true;
    return new Date() >= this.tokenExpiry;
  }

  /**
   * Login user with Officer service
   */
  async login(credentials: UserLoginRequest): Promise<AppUser> {
    try {
      // First, get OAuth 2.0 authorization URL from Officer
      const authUrlResponse = await officerApiClient.get('/connect/authorize', {
        'Content-Type': 'application/x-www-form-urlencoded',
      });

      if (!authUrlResponse.success) {
        throw new Error(authUrlResponse.message || ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      // For mobile app, we'll use resource owner password flow
      const tokenResponse = await officerApiClient.post('/connect/token', {
        grant_type: 'password',
        username: credentials.email,
        password: credentials.password,
        scope: 'innkt.api',
        client_id: 'innkt.mobile',
      });

      if (!tokenResponse.success || !tokenResponse.data) {
        throw new Error(tokenResponse.message || ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      const authData = tokenResponse.data as UserAuthResponse;
      
      // Store authentication data
      await this.storeAuthData(
        authData.user,
        authData.accessToken,
        authData.refreshToken,
        authData.expiresIn
      );

      return authData.user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Register user through Frontier service
   */
  async register(userData: UserRegistrationRequest): Promise<AppUser> {
    try {
      // Register through Frontier API Gateway
      const response = await frontierApiClient.post(API_ENDPOINTS.REGISTER, userData);

      if (!response.success || !response.data) {
        throw new Error(response.message || ERROR_MESSAGES.VALIDATION_ERROR);
      }

      const authData = response.data as UserAuthResponse;
      
      // Store authentication data
      await this.storeAuthData(
        authData.user,
        authData.accessToken,
        authData.refreshToken,
        authData.expiresIn
      );

      return authData.user;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Logout user and clear all data
   */
  async logout(): Promise<void> {
    try {
      // Notify backend about logout
      if (this.accessToken) {
        try {
          await officerApiClient.post('/connect/logout', {
            token: this.accessToken,
          });
        } catch (error) {
          console.warn('Failed to notify backend about logout:', error);
        }
      }

      // Clear local data
      await this.clearStoredData();
      this.currentUser = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiry = null;

      // Clear tokens in API clients
      officerApiClient.clearAuthToken();
      frontierApiClient.clearAuthToken();
    } catch (error) {
      console.error('Logout failed:', error);
      // Force clear local data even if backend call fails
      await this.clearStoredData();
      this.currentUser = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiry = null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<string> {
    try {
      if (!this.refreshToken) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }

      const response = await officerApiClient.post('/connect/token', {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: 'innkt.mobile',
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || ERROR_MESSAGES.UNAUTHORIZED);
      }

      const authData = response.data as UserAuthResponse;
      
      // Update stored tokens
      await this.storeAuthData(
        authData.user,
        authData.accessToken,
        authData.refreshToken,
        authData.expiresIn
      );

      return authData.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear invalid tokens
      await this.clearStoredData();
      this.currentUser = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiry = null;
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AppUser | null> {
    try {
      // Check if we have a valid user in memory
      if (this.currentUser && !this.isTokenExpired()) {
        return this.currentUser;
      }

      // If token is expired, try to refresh
      if (this.isTokenExpired() && this.refreshToken) {
        try {
          await this.refreshToken();
          return this.currentUser;
        } catch (error) {
          console.error('Failed to refresh token:', error);
          await this.logout();
          return null;
        }
      }

      // If no valid user, try to get from storage
      if (!this.currentUser) {
        const userData = await AsyncStorage.getItem('user_data');
        if (userData) {
          this.currentUser = JSON.parse(userData);
          return this.currentUser;
        }
      }

      return this.currentUser;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: UserProfileUpdateRequest): Promise<AppUser> {
    try {
      if (!this.currentUser) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }

      const response = await frontierApiClient.put(
        API_ENDPOINTS.UPDATE_PROFILE,
        profileData
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || ERROR_MESSAGES.VALIDATION_ERROR);
      }

      const updatedUser = response.data as AppUser;
      
      // Update local user data
      this.currentUser = {...this.currentUser, ...updatedUser};
      await AsyncStorage.setItem('user_data', JSON.stringify(this.currentUser));

      return this.currentUser;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(passwordData: PasswordChangeRequest): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }

      const response = await frontierApiClient.post(
        API_ENDPOINTS.CHANGE_PASSWORD,
        passwordData
      );

      if (!response.success) {
        throw new Error(response.message || ERROR_MESSAGES.VALIDATION_ERROR);
      }
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  }

  /**
   * Update user consent preferences
   */
  async updateConsent(consentData: Partial<ConsentStatus>): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }

      const response = await frontierApiClient.patch(
        '/api/users/consent',
        consentData
      );

      if (!response.success) {
        throw new Error(response.message || ERROR_MESSAGES.VALIDATION_ERROR);
      }

      // Update local consent status
      if (this.currentUser.consentStatus) {
        this.currentUser.consentStatus = {
          ...this.currentUser.consentStatus,
          ...consentData,
        };
        await AsyncStorage.setItem('user_data', JSON.stringify(this.currentUser));
      }
    } catch (error) {
      console.error('Consent update failed:', error);
      throw error;
    }
  }

  /**
   * Get current access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      // Check if token is expired and refresh if needed
      if (this.isTokenExpired() && this.refreshToken) {
        try {
          await this.refreshToken();
        } catch (error) {
          console.error('Failed to refresh token:', error);
          await this.logout();
          return null;
        }
      }

      return this.accessToken;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Check if current token is valid
   */
  async isTokenValid(): Promise<boolean> {
    try {
      if (!this.accessToken) return false;
      
      if (this.isTokenExpired()) {
        if (this.refreshToken) {
          try {
            await this.refreshToken();
            return true;
          } catch (error) {
            return false;
          }
        }
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all authentication tokens
   */
  async clearTokens(): Promise<void> {
    await this.clearStoredData();
    this.currentUser = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    
    officerApiClient.clearAuthToken();
    frontierApiClient.clearAuthToken();
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null && await this.isTokenValid();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get stored user data (synchronous)
   */
  getStoredUser(): AppUser | null {
    return this.currentUser;
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): {isValid: boolean; errors: string[]} {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate registration data
   */
  static validateRegistration(data: UserRegistrationRequest): {isValid: boolean; errors: string[]} {
    const errors: string[] = [];
    
    if (!data.firstName.trim()) {
      errors.push('First name is required');
    }
    
    if (!data.lastName.trim()) {
      errors.push('Last name is required');
    }
    
    if (!this.validateEmail(data.email)) {
      errors.push('Invalid email format');
    }
    
    const passwordValidation = this.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
    
    if (data.password !== data.passwordConfirmation) {
      errors.push('Passwords do not match');
    }
    
    if (!data.acceptTerms) {
      errors.push('You must accept the terms of service');
    }
    
    if (!data.acceptPrivacyPolicy) {
      errors.push('You must accept the privacy policy');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Create singleton instance
export const authService = new AuthService();

export default authService;






