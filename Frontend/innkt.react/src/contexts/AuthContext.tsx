import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { officerApi } from '../services/api.service';
import { pwaService } from '../services/pwa.service';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  profilePictureUrl?: string;
  birthDate?: string;
  isMfaEnabled: boolean;
  role: 'basic' | 'premium' | 'admin';
  linkedAccounts?: LinkedAccount[];
  kidsAccounts?: KidsAccount[];
}

interface LinkedAccount {
  id: string;
  platform: string;
  username: string;
  avatar: string;
  isActive: boolean;
}

interface KidsAccount {
  id: string;
  name: string;
  avatar: string;
  age: number;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  reloadUser: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  birthDate: string;
  avatar?: string;
  acceptTerms: boolean;
  acceptPrivacyPolicy: boolean;
  useAiBackgroundRemoval?: boolean;
  createKidsAccount?: boolean;
  kidsAccounts?: Array<{
    firstName: string;
    lastName: string;
    username: string;
    birthDate: string;
    avatar?: string;
  }>;
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
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Auth check - token exists:', !!token);
      if (!token) {
        console.log('No token found, user not authenticated');
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Verify token with backend
      console.log('Verifying token with backend...');
      const response = await officerApi.get('/api/auth/me');
      console.log('Auth verification successful:', response.data);
      setUser(response.data);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Auth check failed:', error);
      // Only remove token if it's a 401 error (token expired/invalid)
      if (error?.status === 401) {
        console.log('Token invalid, removing from localStorage');
        localStorage.removeItem('accessToken');
      }
      setUser(null);
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await officerApi.post('/api/auth/login', { Email: email, Password: password });
      const { accessToken, user: userData } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      setUser(userData);
      
      // Request notification permission after successful login
      try {
        await pwaService.requestNotificationPermission();
      } catch (permissionError) {
        console.warn('Failed to request notification permission:', permissionError);
        // Don't fail login if permission request fails
      }
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      // Convert frontend format to backend format
      const registrationData = {
        Email: userData.email,
        Username: userData.username,
        Password: userData.password,
        FirstName: userData.firstName,
        LastName: userData.lastName,
        BirthDate: userData.birthDate ? new Date(userData.birthDate).toISOString() : null,
        ProfilePictureBase64: userData.avatar || null,
        Subaccounts: userData.createKidsAccount && userData.kidsAccounts ? userData.kidsAccounts.map(kid => ({
          Username: kid.username,
          FirstName: kid.firstName,
          LastName: kid.lastName,
          BirthDate: kid.birthDate ? new Date(kid.birthDate).toISOString() : null,
          ProfilePictureBase64: kid.avatar || null
        })) : null,
        AcceptTerms: userData.acceptTerms,
        AcceptPrivacyPolicy: userData.acceptPrivacyPolicy,
        Language: "en",
        Theme: "light"
      };

      const response = await officerApi.post('/api/auth/register', registrationData);
      const { accessToken, user: newUser } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      setUser(newUser);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('Logging out user...');
    localStorage.removeItem('accessToken');
    setUser(null);
    console.log('User logged out, user state:', null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const reloadUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await officerApi.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to reload user data:', error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    reloadUser,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
