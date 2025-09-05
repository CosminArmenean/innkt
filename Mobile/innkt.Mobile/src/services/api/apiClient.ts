import AsyncStorage from '@react-native-async-storage/async-storage';
import {ENV, API_ENDPOINTS, ERROR_MESSAGES} from '../../config/environment';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  statusCode: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: string[];
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Request configuration
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

// API Client Configuration
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * API Client for making HTTP requests to backend services
 * Handles authentication, retries, error handling, and response formatting
 */
class ApiClient {
  private config: ApiClientConfig;
  private authToken: string | null = null;

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.initializeAuthToken();
  }

  /**
   * Initialize authentication token from storage
   */
  private async initializeAuthToken(): Promise<void> {
    try {
      this.authToken = await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Failed to initialize auth token:', error);
    }
  }

  /**
   * Set authentication token
   */
  public setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  public clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Get default headers including authentication
   */
  private getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Innkt-Mobile/1.0.0',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    config: RequestConfig,
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.executeRequest<T>(config);
      return response;
    } catch (error) {
      if (attempt < this.config.retryAttempts && this.shouldRetry(error)) {
        await this.delay(this.config.retryDelay * attempt);
        return this.makeRequest<T>(config, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Execute HTTP request
   */
  private async executeRequest<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const {method, url, data, headers, timeout} = config;
    
    const requestConfig: RequestInit = {
      method,
      headers: {
        ...this.getDefaultHeaders(),
        ...headers,
      },
      signal: AbortSignal.timeout(timeout || this.config.timeout),
    };

    if (data && method !== 'GET') {
      requestConfig.body = JSON.stringify(data);
    }

    const fullUrl = `${this.config.baseURL}${url}`;
    
    try {
      const response = await fetch(fullUrl, requestConfig);
      const responseData = await this.parseResponse<T>(response);
      
      if (!response.ok) {
        throw this.createApiError(response.status, responseData);
      }
      
      return responseData;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(ERROR_MESSAGES.TIMEOUT_ERROR);
      }
      throw error;
    }
  }

  /**
   * Parse response and handle different content types
   */
  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const data = await response.json();
        return data as ApiResponse<T>;
      } catch (error) {
        throw new Error('Invalid JSON response');
      }
    }
    
    // Handle non-JSON responses
    const text = await response.text();
    return {
      success: response.ok,
      message: text || 'Response received',
      statusCode: response.status,
    } as ApiResponse<T>;
  }

  /**
   * Create API error from response
   */
  private createApiError(statusCode: number, response?: any): ApiError {
    const message = response?.message || this.getErrorMessage(statusCode);
    const errors = response?.errors || [];
    
    return {
      message,
      statusCode,
      errors,
    };
  }

  /**
   * Get error message based on status code
   */
  private getErrorMessage(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return ERROR_MESSAGES.VALIDATION_ERROR;
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 500:
        return ERROR_MESSAGES.SERVER_ERROR;
      default:
        return ERROR_MESSAGES.UNKNOWN_ERROR;
    }
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: any): boolean {
    // Retry on network errors, 5xx server errors, and timeouts
    if (error.message === ERROR_MESSAGES.TIMEOUT_ERROR) {
      return true;
    }
    
    if (error.statusCode && error.statusCode >= 500) {
      return true;
    }
    
    return false;
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make GET request
   */
  public async get<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'GET',
      url,
      headers,
    });
  }

  /**
   * Make POST request
   */
  public async post<T>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'POST',
      url,
      data,
      headers,
    });
  }

  /**
   * Make PUT request
   */
  public async put<T>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'PUT',
      url,
      data,
      headers,
    });
  }

  /**
   * Make DELETE request
   */
  public async delete<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'DELETE',
      url,
      headers,
    });
  }

  /**
   * Make PATCH request
   */
  public async patch<T>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({
      method: 'PATCH',
      url,
      data,
      headers,
    });
  }

  /**
   * Upload file with progress tracking
   */
  public async uploadFile<T>(
    url: string,
    file: File | Blob,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return this.makeRequest<T>({
      method: 'POST',
      url,
      data: formData,
      headers,
    });
  }

  /**
   * Check if client is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.authToken;
  }

  /**
   * Get current authentication token
   */
  public getAuthToken(): string | null {
    return this.authToken;
  }
}

// Create instances for different services
export const officerApiClient = new ApiClient({
  baseURL: ENV.OFFICER_BASE_URL,
  timeout: ENV.API_TIMEOUT,
  retryAttempts: ENV.API_RETRY_ATTEMPTS,
  retryDelay: 1000,
});

export const frontierApiClient = new ApiClient({
  baseURL: ENV.FRONTIER_BASE_URL,
  timeout: ENV.API_TIMEOUT,
  retryAttempts: ENV.API_RETRY_ATTEMPTS,
  retryDelay: 1000,
});

export default ApiClient;






