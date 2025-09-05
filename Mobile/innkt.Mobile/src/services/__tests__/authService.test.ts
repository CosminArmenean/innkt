import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../auth/authService';
import { officerApiClient, frontierApiClient } from '../api/apiClient';
import { UserLoginRequest, UserRegistrationRequest, AppUser } from '../../models/user';

// Mock the API clients
jest.mock('../api/apiClient', () => ({
  officerApiClient: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  frontierApiClient: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any stored tokens
    authService.clearTokens();
  });

  describe('login', () => {
    it('should successfully login user and store tokens', async () => {
      const mockResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        } as AppUser,
      };

      (officerApiClient.post as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const loginRequest: UserLoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.login(loginRequest);

      expect(result).toEqual(mockResponse);
      expect(officerApiClient.post).toHaveBeenCalledWith(
        '/connect/token',
        expect.objectContaining({
          grant_type: 'password',
          username: loginRequest.email,
          password: loginRequest.password,
        })
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'accessToken',
        mockResponse.accessToken
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'refreshToken',
        mockResponse.refreshToken
      );
    });

    it('should throw error on login failure', async () => {
      const error = new Error('Invalid credentials');
      (officerApiClient.post as jest.Mock).mockRejectedValue(error);

      const loginRequest: UserLoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(authService.login(loginRequest)).rejects.toThrow('Invalid credentials');
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should successfully register user', async () => {
      const mockResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: '1',
          email: 'new@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
        } as AppUser,
      };

      (frontierApiClient.post as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const registerRequest: UserRegistrationRequest = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        isJointAccount: false,
        gdprConsent: {
          marketing: true,
          analytics: true,
          thirdParty: false,
        },
      };

      const result = await authService.register(registerRequest);

      expect(result).toEqual(mockResponse);
      expect(frontierApiClient.post).toHaveBeenCalledWith(
        '/api/auth/register',
        registerRequest
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'accessToken',
        mockResponse.accessToken
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'refreshToken',
        mockResponse.refreshToken
      );
    });

    it('should handle registration errors', async () => {
      const error = new Error('Email already exists');
      (frontierApiClient.post as jest.Mock).mockRejectedValue(error);

      const registerRequest: UserRegistrationRequest = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        isJointAccount: false,
        gdprConsent: {
          marketing: true,
          analytics: true,
          thirdParty: false,
        },
      };

      await expect(authService.register(registerRequest)).rejects.toThrow('Email already exists');
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh access token', async () => {
      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('old-refresh-token');
      (officerApiClient.post as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const result = await authService.refreshToken();

      expect(result).toEqual(mockResponse);
      expect(officerApiClient.post).toHaveBeenCalledWith(
        '/connect/token',
        expect.objectContaining({
          grant_type: 'refresh_token',
          refresh_token: 'old-refresh-token',
        })
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'accessToken',
        mockResponse.accessToken
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'refreshToken',
        mockResponse.refreshToken
      );
    });

    it('should throw error when no refresh token exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await expect(authService.refreshToken()).rejects.toThrow('No refresh token available');
      expect(officerApiClient.post).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should successfully logout user and clear tokens', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-access-token');
      (officerApiClient.post as jest.Mock).mockResolvedValue({});

      await authService.logout();

      expect(officerApiClient.post).toHaveBeenCalledWith('/connect/logout');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user');
    });

    it('should clear tokens even if logout API call fails', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-access-token');
      (officerApiClient.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      await authService.logout();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user from storage', async () => {
      const mockUser: AppUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockUser));

      const result = await authService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('user');
    });

    it('should return null when no user in storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });

    it('should return null when invalid user data in storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid-json');

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when access token exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-access-token');

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when no access token', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('should successfully update user profile', async () => {
      const mockResponse = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Updated',
        lastName: 'Name',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-access-token');
      (officerApiClient.put as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const updateRequest = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const result = await authService.updateProfile(updateRequest);

      expect(result).toEqual(mockResponse);
      expect(officerApiClient.put).toHaveBeenCalledWith(
        '/api/users/profile',
        updateRequest
      );
    });

    it('should throw error when not authenticated', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const updateRequest = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      await expect(authService.updateProfile(updateRequest)).rejects.toThrow('Not authenticated');
      expect(officerApiClient.put).not.toHaveBeenCalled();
    });
  });

  describe('updateConsent', () => {
    it('should successfully update user consent', async () => {
      const mockResponse = {
        id: '1',
        gdprConsent: {
          marketing: true,
          analytics: false,
          thirdParty: true,
        },
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-access-token');
      (officerApiClient.put as jest.Mock).mockResolvedValue({
        data: mockResponse,
      });

      const consentRequest = {
        marketing: true,
        analytics: false,
        thirdParty: true,
      };

      const result = await authService.updateConsent(consentRequest);

      expect(result).toEqual(mockResponse);
      expect(officerApiClient.put).toHaveBeenCalledWith(
        '/api/users/consent',
        consentRequest
      );
    });
  });

  describe('token management', () => {
    it('should get access token from storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-access-token');

      const result = await authService.getAccessToken();

      expect(result).toBe('mock-access-token');
    });

    it('should clear all tokens', async () => {
      await authService.clearTokens();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });
});






