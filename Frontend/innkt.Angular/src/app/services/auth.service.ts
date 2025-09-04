import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  language: string;
  profilePicture?: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  isJointAccount?: boolean;
  linkedUserId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  language: string;
  isJointAccount?: boolean;
  jointAccount?: JointAccountRequest;
  acceptTerms: boolean;
  acceptPrivacyPolicy: boolean;
  acceptMarketing: boolean;
  acceptCookies: boolean;
}

export interface JointAccountRequest {
  secondUserFirstName: string;
  secondUserLastName: string;
  secondUserPassword: string;
  secondUserPasswordConfirmation: string;
  secondUserCountryCode?: string;
  secondUserMobilePhone?: string;
  secondUserBirthDate?: Date;
  secondUserGender?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  // Backend service URLs
  private readonly OFFICER_BASE_URL = 'https://localhost:5000';
  private readonly FRONTIER_BASE_URL = 'https://localhost:5002';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth() {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('current_user');

    if (token && user) {
      try {
        const userObj = JSON.parse(user);
        this.tokenSubject.next(token);
        this.currentUserSubject.next(userObj);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        this.clearAuth();
      }
    }
  }

  async login(credentials: LoginRequest): Promise<boolean> {
    try {
      // Use OAuth 2.0 authorization code flow with Officer service
      const authUrl = `${this.OFFICER_BASE_URL}/connect/authorize?` +
        `client_id=innkt.web&` +
        `redirect_uri=${encodeURIComponent('https://localhost:4200/signin-callback')}&` +
        `response_type=code&` +
        `scope=openid profile email innkt.api&` +
        `state=${this.generateRandomState()}`;

      // For now, simulate the OAuth flow
      // In production, this would redirect to the Officer service
      console.log('Redirecting to OAuth authorization:', authUrl);
      
      // Simulate successful login for development
      const mockResponse: AuthResponse = {
        user: {
          id: '1',
          email: credentials.email,
          firstName: 'John',
          lastName: 'Doe',
          language: 'en',
          isActive: true,
          createdAt: new Date(),
          isJointAccount: false
        },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token'
      };

      this.setAuth(mockResponse);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  async register(userData: RegisterRequest): Promise<boolean> {
    try {
      // Register with Officer service
      const response = await this.http.post<AuthResponse>(
        `${this.FRONTIER_BASE_URL}/api/auth/register`, 
        userData
      ).toPromise();

      if (response) {
        this.setAuth(response);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        return false;
      }

      const response = await this.http.post<{ access_token: string }>(
        `${this.OFFICER_BASE_URL}/connect/token`,
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: 'innkt.web'
        }
      ).toPromise();

      if (response) {
        localStorage.setItem('auth_token', response.access_token);
        this.tokenSubject.next(response.access_token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuth();
      return false;
    }
  }

  private setAuth(authResponse: AuthResponse) {
    localStorage.setItem('auth_token', authResponse.token);
    localStorage.setItem('refresh_token', authResponse.refreshToken);
    localStorage.setItem('current_user', JSON.stringify(authResponse.user));

    this.tokenSubject.next(authResponse.token);
    this.currentUserSubject.next(authResponse.user);
    this.isAuthenticatedSubject.next(true);
  }

  logout() {
    // Logout from Officer service
    const logoutUrl = `${this.OFFICER_BASE_URL}/connect/endsession?` +
      `id_token_hint=${this.tokenSubject.value}&` +
      `post_logout_redirect_uri=${encodeURIComponent('https://localhost:4200')}`;
    
    this.clearAuth();
    
    // Redirect to Officer logout endpoint
    window.location.href = logoutUrl;
  }

  private clearAuth() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');

    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  updateUserProfile(updates: Partial<User>) {
    const currentUser = this.currentUserSubject.value;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      this.currentUserSubject.next(updatedUser);
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
    }
  }

  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // OAuth callback handler
  handleOAuthCallback(code: string, state: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        // Exchange authorization code for tokens
        const tokenResponse = await this.http.post<{
          access_token: string;
          refresh_token: string;
          id_token: string;
        }>(`${this.OFFICER_BASE_URL}/connect/token`, {
          grant_type: 'authorization_code',
          client_id: 'innkt.web',
          code: code,
          redirect_uri: 'https://localhost:4200/signin-callback'
        }).toPromise();

        if (tokenResponse) {
          // Get user info using the access token
          const userInfo = await this.http.get<User>(`${this.OFFICER_BASE_URL}/connect/userinfo`, {
            headers: new HttpHeaders({
              'Authorization': `Bearer ${tokenResponse.access_token}`
            })
          }).toPromise();

          if (userInfo) {
            const authResponse: AuthResponse = {
              user: userInfo,
              token: tokenResponse.access_token,
              refreshToken: tokenResponse.refresh_token
            };
            this.setAuth(authResponse);
            resolve(true);
          } else {
            resolve(false);
          }
        } else {
          resolve(false);
        }
      } catch (error) {
        console.error('OAuth callback failed:', error);
        resolve(false);
      }
    });
  }
}
