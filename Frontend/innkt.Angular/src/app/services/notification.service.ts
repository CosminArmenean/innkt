import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'post' | 'follow' | 'like' | 'comment';
  title: string;
  message: string;
  userId: string;
  relatedId?: string; // Post ID, User ID, etc.
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  postNotifications: boolean;
  followNotifications: boolean;
  likeNotifications: boolean;
  commentNotifications: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly API_BASE_URL = 'https://localhost:5002/api';
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private preferencesSubject = new BehaviorSubject<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    postNotifications: true,
    followNotifications: true,
    likeNotifications: true,
    commentNotifications: true
  });

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();
  public preferences$ = this.preferencesSubject.asObservable();

  private pollingInterval = 30000; // 30 seconds
  private isPolling = false;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  // Get user notifications
  getNotifications(userId: string, page: number = 0, pageSize: number = 20): Observable<{ notifications: Notification[], totalCount: number }> {
    return this.http.get<{ notifications: Notification[], totalCount: number }>(
      `${this.API_BASE_URL}/users/${userId}/notifications`,
      { params: { page: page.toString(), pageSize: pageSize.toString() } }
    );
  }

  // Mark notification as read
  markAsRead(notificationId: string): Observable<void> {
    return this.http.put<void>(`${this.API_BASE_URL}/notifications/${notificationId}/read`, {});
  }

  // Mark all notifications as read
  markAllAsRead(userId: string): Observable<void> {
    return this.http.put<void>(`${this.API_BASE_URL}/users/${userId}/notifications/read-all`, {});
  }

  // Delete notification
  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/notifications/${notificationId}`);
  }

  // Get notification preferences
  getPreferences(userId: string): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.API_BASE_URL}/users/${userId}/notification-preferences`);
  }

  // Update notification preferences
  updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>(`${this.API_BASE_URL}/users/${userId}/notification-preferences`, preferences);
  }

  // Start polling for new notifications
  startPolling(userId: string): void {
    if (this.isPolling) return;

    this.isPolling = true;
    interval(this.pollingInterval)
      .pipe(
        switchMap(() => this.getNotifications(userId, 0, 10))
      )
      .subscribe({
        next: (response) => {
          const currentNotifications = this.notificationsSubject.value;
          const newNotifications = response.notifications.filter(
            newNotif => !currentNotifications.some(existing => existing.id === newNotif.id)
          );

          if (newNotifications.length > 0) {
            this.notificationsSubject.next([...newNotifications, ...currentNotifications]);
            this.updateUnreadCount();
            this.showNewNotificationToast(newNotifications[0]);
          }
        },
        error: (error) => {
          console.error('Error polling notifications:', error);
        }
      });
  }

  // Stop polling
  stopPolling(): void {
    this.isPolling = false;
  }

  // Show notification toast
  private showNewNotificationToast(notification: Notification): void {
    const action = this.getNotificationAction(notification);
    
    this.snackBar.open(notification.message, action, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [`notification-${notification.type}`]
    });
  }

  // Get appropriate action for notification type
  private getNotificationAction(notification: Notification): string {
    switch (notification.type) {
      case 'post':
        return 'View Post';
      case 'follow':
        return 'View Profile';
      case 'like':
        return 'View Post';
      case 'comment':
        return 'View Comment';
      default:
        return 'View';
    }
  }

  // Update unread count
  private updateUnreadCount(): void {
    const unreadCount = this.notificationsSubject.value.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unreadCount);
  }

  // Get cached notifications
  getCachedNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  // Get cached unread count
  getCachedUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  // Get cached preferences
  getCachedPreferences(): NotificationPreferences {
    return this.preferencesSubject.value;
  }

  // Create local notification (for immediate feedback)
  createLocalNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      createdAt: new Date(),
      isRead: false
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([newNotification, ...currentNotifications]);
    this.updateUnreadCount();
  }

  // Generate temporary ID for local notifications
  private generateId(): string {
    return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Clear all notifications
  clearAllNotifications(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }
}





