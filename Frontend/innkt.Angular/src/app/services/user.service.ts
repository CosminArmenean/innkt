import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User, UpdateProfileRequest, ChangePasswordRequest, UserStats } from '../models/user';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_BASE_URL = 'https://localhost:5002/api'; // Frontier service
  private userProfileSubject = new BehaviorSubject<User | null>(null);
  private userStatsSubject = new BehaviorSubject<UserStats | null>(null);

  public userProfile$ = this.userProfileSubject.asObservable();
  public userStats$ = this.userStatsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Get user profile by ID
  getUserProfile(userId: string): Observable<User> {
    return this.http.get<User>(`${this.API_BASE_URL}/users/${userId}`)
      .pipe(
        tap(user => {
          if (user.id === this.authService.getCurrentUser()?.id) {
            this.userProfileSubject.next(user);
          }
        })
      );
  }

  // Get current user's profile
  getCurrentUserProfile(): Observable<User> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user');
    }
    return this.getUserProfile(currentUser.id);
  }

  // Update user profile
  updateProfile(userId: string, updates: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.API_BASE_URL}/users/${userId}`, updates)
      .pipe(
        tap(updatedUser => {
          if (updatedUser.id === this.authService.getCurrentUser()?.id) {
            this.userProfileSubject.next(updatedUser);
            // Update auth service with new user data
            this.authService.updateUserProfile(updatedUser);
          }
        })
      );
  }

  // Change password
  changePassword(userId: string, passwordData: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.API_BASE_URL}/users/${userId}/password`, passwordData);
  }

  // Upload profile picture
  uploadProfilePicture(userId: string, file: File): Observable<{ profilePictureUrl: string }> {
    const formData = new FormData();
    formData.append('profilePicture', file);

    return this.http.post<{ profilePictureUrl: string }>(
      `${this.API_BASE_URL}/users/${userId}/profile-picture`, 
      formData
    ).pipe(
      tap(response => {
        // Update local user profile with new picture URL
        const currentProfile = this.userProfileSubject.value;
        if (currentProfile && currentProfile.id === userId) {
          const updatedProfile = { ...currentProfile, profilePicture: response.profilePictureUrl };
          this.userProfileSubject.next(updatedProfile);
          this.authService.updateUserProfile(updatedProfile);
        }
      })
    );
  }

  // Get user statistics
  getUserStats(userId: string): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.API_BASE_URL}/users/${userId}/stats`)
      .pipe(
        tap(stats => {
          if (userId === this.authService.getCurrentUser()?.id) {
            this.userStatsSubject.next(stats);
          }
        })
      );
  }

  // Follow a user
  followUser(userId: string, targetUserId: string): Observable<void> {
    return this.http.post<void>(`${this.API_BASE_URL}/users/${userId}/follow/${targetUserId}`, {});
  }

  // Unfollow a user
  unfollowUser(userId: string, targetUserId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/users/${userId}/follow/${targetUserId}`);
  }

  // Get user's followers
  getUserFollowers(userId: string, page: number = 0, pageSize: number = 20): Observable<{ users: User[], totalCount: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    });

    return this.http.get<{ users: User[], totalCount: number }>(
      `${this.API_BASE_URL}/users/${userId}/followers?${params}`
    );
  }

  // Get users that the user is following
  getUserFollowing(userId: string, page: number = 0, pageSize: number = 20): Observable<{ users: User[], totalCount: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    });

    return this.http.get<{ users: User[], totalCount: number }>(
      `${this.API_BASE_URL}/users/${userId}/following?${params}`
    );
  }

  // Search users
  searchUsers(query: string, page: number = 0, pageSize: number = 20): Observable<{ users: User[], totalCount: number }> {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      pageSize: pageSize.toString()
    });

    return this.http.get<{ users: User[], totalCount: number }>(
      `${this.API_BASE_URL}/users/search?${params}`
    );
  }

  // Get suggested users to follow
  getSuggestedUsers(userId: string, limit: number = 10): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_BASE_URL}/users/${userId}/suggestions`, {
      params: { limit: limit.toString() }
    });
  }

  // Check if user is following another user
  isFollowing(userId: string, targetUserId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.API_BASE_URL}/users/${userId}/following/${targetUserId}/check`);
  }

  // Get cached user profile
  getCachedUserProfile(): User | null {
    return this.userProfileSubject.value;
  }

  // Get cached user stats
  getCachedUserStats(): UserStats | null {
    return this.userStatsSubject.value;
  }

  // Clear user data
  clearUserData(): void {
    this.userProfileSubject.next(null);
    this.userStatsSubject.next(null);
  }
}





