import React, {createContext, useContext, useEffect, useState} from 'react';
import {authService} from '../services/auth/authService';
import {AppUser, UserRegistrationRequest, UserLoginRequest, UserProfileUpdateRequest} from '../models/user';
import {Alert} from 'react-native';

// Re-export types from models for backward compatibility
export type LoginRequest = UserLoginRequest;
export type RegisterRequest = UserRegistrationRequest;
export type User = AppUser;

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: UserLoginRequest) => Promise<boolean>;
  register: (userData: UserRegistrationRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUserProfile: (updates: UserProfileUpdateRequest) => Promise<void>;
  updateConsent: (consentData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated using the auth service
      const authenticated = await authService.isAuthenticated();
      if (authenticated) {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: UserLoginRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const loggedInUser = await authService.login(credentials);
      setUser(loggedInUser);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      Alert.alert('Login Failed', 'Please check your credentials and try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: UserRegistrationRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const registeredUser = await authService.register(userData);
      setUser(registeredUser);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Force clear local state even if backend call fails
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      await authService.refreshToken();
      // Token refreshed, user should still be authenticated
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  };

  const updateUserProfile = async (updates: UserProfileUpdateRequest) => {
    try {
      if (user) {
        const updatedUser = await authService.updateProfile(updates);
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  const updateConsent = async (consentData: any) => {
    try {
      await authService.updateConsent(consentData);
      // Refresh user data to get updated consent status
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Consent update failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    updateUserProfile,
    updateConsent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
