import axios from 'axios';
import { environment } from '../config/environment';

// Create axios instances for different services
const createApiInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      // Add auth token if available
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// API instances
export const officerApi = createApiInstance(environment.api.officer);
export const neurosparkApi = createApiInstance(environment.api.neurospark);
export const messagingApi = createApiInstance(environment.api.messaging);
export const frontierApi = createApiInstance(environment.api.frontier);

// Generic API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// Generic API error interface
export interface ApiError {
  message: string;
  status: number;
  errors?: string[];
}

// Helper function to handle API responses
export const handleApiResponse = <T>(response: any): T => {
  if (response.data.success) {
    return response.data.data!;
  }
  throw new Error(response.data.message || 'API request failed');
};

// Helper function to handle API errors
export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    const data = error.response.data as any;
    return {
      message: data.message || 'Request failed',
      status: error.response.status,
      errors: data.errors,
    };
  }
  return {
    message: error.message || 'Network error',
    status: 0,
  };
};

// Base service class
export abstract class BaseApiService {
  protected api: any;

  constructor(api: any) {
    this.api = api;
  }

  protected async get<T>(url: string, params?: any): Promise<T> {
    try {
      const response = await this.api.get(url, { params });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  protected async post<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.api.post(url, data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  protected async put<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.api.put(url, data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  protected async delete<T>(url: string): Promise<T> {
    try {
      const response = await this.api.delete(url);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  protected async upload<T>(url: string, formData: FormData): Promise<T> {
    try {
      const response = await this.api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}
