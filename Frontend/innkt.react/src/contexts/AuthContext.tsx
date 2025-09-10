import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { officerApi } from '../services/api.service';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
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
  checkAuth: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  birthDate: string;
  acceptTerms: boolean;
  acceptPrivacyPolicy: boolean;
  useAiBackgroundRemoval?: boolean;
  createKidsAccount?: boolean;
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
      if (!token) {
        setIsLoading(false);
        return;
      }

      // For now, skip auth verification since /api/auth/me doesn't exist
      // TODO: Implement proper user profile endpoint
      setIsLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('accessToken');
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
        Password: userData.password,
        FirstName: userData.firstName,
        LastName: userData.lastName,
        BirthDate: userData.birthDate ? new Date(userData.birthDate).toISOString() : null,
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
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
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
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
