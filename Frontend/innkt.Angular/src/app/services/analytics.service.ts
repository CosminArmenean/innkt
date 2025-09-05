import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  pageUrl: string;
  userAgent: string;
  customProperties?: Record<string, any>;
}

export interface UserBehavior {
  pageViews: number;
  sessionDuration: number;
  interactions: number;
  lastActivity: Date;
  favoritePages: string[];
  searchQueries: string[];
  postInteractions: number;
  chatMessages: number;
}

export interface AnalyticsMetrics {
  totalUsers: number;
  activeUsers: number;
  pageViews: number;
  averageSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  topPages: Array<{ page: string; views: number }>;
  userEngagement: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private eventsSubject = new BehaviorSubject<AnalyticsEvent[]>([]);
  private userBehaviorSubject = new BehaviorSubject<UserBehavior>({
    pageViews: 0,
    sessionDuration: 0,
    interactions: 0,
    lastActivity: new Date(),
    favoritePages: [],
    searchQueries: [],
    postInteractions: 0,
    chatMessages: 0
  });

  private sessionStartTime: number;
  private sessionId: string;
  private currentUserId?: string;

  public events$ = this.eventsSubject.asObservable();
  public userBehavior$ = this.userBehaviorSubject.asObservable();

  constructor(private router: Router) {
    this.initializeAnalytics();
  }

  // Initialize analytics
  private initializeAnalytics() {
    this.sessionStartTime = Date.now();
    this.sessionId = this.generateSessionId();
    
    // Track page views
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(event => event as NavigationEnd)
      )
      .subscribe(event => {
        this.trackPageView(event.urlAfterRedirects);
      });

    // Track session duration
    setInterval(() => {
      this.updateSessionDuration();
    }, 30000); // Update every 30 seconds

    // Track user activity
    this.trackUserActivity();
  }

  // Track page view
  trackPageView(url: string) {
    const event: AnalyticsEvent = {
      event: 'page_view',
      category: 'navigation',
      action: 'page_view',
      label: url,
      timestamp: new Date(),
      userId: this.currentUserId,
      sessionId: this.sessionId,
      pageUrl: url,
      userAgent: navigator.userAgent
    };

    this.addEvent(event);
    this.updatePageViews();
    this.updateFavoritePages(url);
  }

  // Track user interaction
  trackUserInteraction(category: string, action: string, label?: string, value?: number) {
    const event: AnalyticsEvent = {
      event: 'user_interaction',
      category,
      action,
      label,
      value,
      timestamp: new Date(),
      userId: this.currentUserId,
      sessionId: this.sessionId,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent
    };

    this.addEvent(event);
    this.updateInteractions();
  }

  // Track post interaction
  trackPostInteraction(action: string, postId: string, postType: 'view' | 'like' | 'comment' | 'share') {
    this.trackUserInteraction('post', action, `${postType}_${postId}`);
    this.updatePostInteractions();
  }

  // Track search query
  trackSearchQuery(query: string, resultsCount: number) {
    this.trackUserInteraction('search', 'search_query', query, resultsCount);
    this.updateSearchQueries(query);
  }

  // Track chat message
  trackChatMessage(roomId: string, messageType: 'text' | 'file' | 'image') {
    this.trackUserInteraction('chat', 'message_sent', `${messageType}_${roomId}`);
    this.updateChatMessages();
  }

  // Track user engagement
  trackUserEngagement(engagementType: 'login' | 'logout' | 'profile_update' | 'post_create') {
    this.trackUserInteraction('user', engagementType);
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, unit: string) {
    this.trackUserInteraction('performance', metric, unit, value);
  }

  // Track error events
  trackError(error: Error, context?: string) {
    this.trackUserInteraction('error', 'application_error', context || error.message);
  }

  // Set current user
  setCurrentUser(userId: string) {
    this.currentUserId = userId;
    this.trackUserEngagement('login');
  }

  // Clear current user
  clearCurrentUser() {
    this.trackUserEngagement('logout');
    this.currentUserId = undefined;
  }

  // Add event to analytics
  private addEvent(event: AnalyticsEvent) {
    const currentEvents = this.eventsSubject.value;
    this.eventsSubject.next([...currentEvents, event]);
    
    // Send to analytics backend (if configured)
    this.sendToAnalyticsBackend(event);
  }

  // Send event to analytics backend
  private sendToAnalyticsBackend(event: AnalyticsEvent) {
    // This would typically send to Google Analytics, Mixpanel, or custom backend
    if (typeof gtag !== 'undefined') {
      gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        custom_parameters: event.customProperties
      });
    }

    // Send to custom analytics endpoint
    this.sendToCustomAnalytics(event);
  }

  // Send to custom analytics endpoint
  private async sendToCustomAnalytics(event: AnalyticsEvent) {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
    }
  }

  // Update page views
  private updatePageViews() {
    const currentBehavior = this.userBehaviorSubject.value;
    this.userBehaviorSubject.next({
      ...currentBehavior,
      pageViews: currentBehavior.pageViews + 1,
      lastActivity: new Date()
    });
  }

  // Update interactions
  private updateInteractions() {
    const currentBehavior = this.userBehaviorSubject.value;
    this.userBehaviorSubject.next({
      ...currentBehavior,
      interactions: currentBehavior.interactions + 1,
      lastActivity: new Date()
    });
  }

  // Update post interactions
  private updatePostInteractions() {
    const currentBehavior = this.userBehaviorSubject.value;
    this.userBehaviorSubject.next({
      ...currentBehavior,
      postInteractions: currentBehavior.postInteractions + 1,
      lastActivity: new Date()
    });
  }

  // Update search queries
  private updateSearchQueries(query: string) {
    const currentBehavior = this.userBehaviorSubject.value;
    const updatedQueries = [...currentBehavior.searchQueries, query];
    
    this.userBehaviorSubject.next({
      ...currentBehavior,
      searchQueries: updatedQueries.slice(-10), // Keep last 10 queries
      lastActivity: new Date()
    });
  }

  // Update chat messages
  private updateChatMessages() {
    const currentBehavior = this.userBehaviorSubject.value;
    this.userBehaviorSubject.next({
      ...currentBehavior,
      chatMessages: currentBehavior.chatMessages + 1,
      lastActivity: new Date()
    });
  }

  // Update favorite pages
  private updateFavoritePages(url: string) {
    const currentBehavior = this.userBehaviorSubject.value;
    const updatedPages = [...currentBehavior.favoritePages];
    
    const existingIndex = updatedPages.indexOf(url);
    if (existingIndex !== -1) {
      updatedPages.splice(existingIndex, 1);
    }
    updatedPages.unshift(url);
    
    this.userBehaviorSubject.next({
      ...currentBehavior,
      favoritePages: updatedPages.slice(0, 5) // Keep top 5 pages
    });
  }

  // Update session duration
  private updateSessionDuration() {
    const currentBehavior = this.userBehaviorSubject.value;
    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    
    this.userBehaviorSubject.next({
      ...currentBehavior,
      sessionDuration
    });
  }

  // Track user activity
  private trackUserActivity() {
    const activityEvents = ['click', 'scroll', 'keydown', 'mousemove'];
    
    activityEvents.forEach(eventType => {
      document.addEventListener(eventType, () => {
        this.updateLastActivity();
      }, { passive: true });
    });
  }

  // Update last activity
  private updateLastActivity() {
    const currentBehavior = this.userBehaviorSubject.value;
    this.userBehaviorSubject.next({
      ...currentBehavior,
      lastActivity: new Date()
    });
  }

  // Generate session ID
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Get analytics metrics
  getAnalyticsMetrics(): Observable<AnalyticsMetrics> {
    // This would typically aggregate data from multiple users
    return this.userBehavior$.pipe(
      map(behavior => ({
        totalUsers: 1, // Single user for now
        activeUsers: behavior.lastActivity.getTime() > Date.now() - 300000 ? 1 : 0, // Active if last activity < 5 min ago
        pageViews: behavior.pageViews,
        averageSessionDuration: behavior.sessionDuration,
        bounceRate: behavior.pageViews <= 1 ? 100 : 0,
        conversionRate: behavior.postInteractions > 0 ? 100 : 0,
        topPages: behavior.favoritePages.map(page => ({ page, views: 1 })),
        userEngagement: this.calculateUserEngagement(behavior)
      }))
    );
  }

  // Calculate user engagement score
  private calculateUserEngagement(behavior: UserBehavior): number {
    let score = 0;
    
    // Page views (max 20 points)
    score += Math.min(behavior.pageViews * 2, 20);
    
    // Interactions (max 25 points)
    score += Math.min(behavior.interactions * 2.5, 25);
    
    // Post interactions (max 25 points)
    score += Math.min(behavior.postInteractions * 5, 25);
    
    // Chat messages (max 20 points)
    score += Math.min(behavior.chatMessages * 2, 20);
    
    // Session duration (max 10 points)
    score += Math.min(behavior.sessionDuration / 60, 10);
    
    return Math.round(score);
  }

  // Get user behavior summary
  getUserBehaviorSummary(): UserBehavior {
    return this.userBehaviorSubject.value;
  }

  // Export analytics data
  exportAnalyticsData(): string {
    const data = {
      events: this.eventsSubject.value,
      userBehavior: this.userBehaviorSubject.value,
      sessionInfo: {
        sessionId: this.sessionId,
        sessionStartTime: new Date(this.sessionStartTime),
        currentUserId: this.currentUserId
      }
    };
    
    return JSON.stringify(data, null, 2);
  }

  // Clear analytics data
  clearAnalyticsData() {
    this.eventsSubject.next([]);
    this.userBehaviorSubject.next({
      pageViews: 0,
      sessionDuration: 0,
      interactions: 0,
      lastActivity: new Date(),
      favoritePages: [],
      searchQueries: [],
      postInteractions: 0,
      chatMessages: 0
    });
  }

  // Get events by category
  getEventsByCategory(category: string): Observable<AnalyticsEvent[]> {
    return this.events$.pipe(
      map(events => events.filter(event => event.category === category))
    );
  }

  // Get events by time range
  getEventsByTimeRange(startTime: Date, endTime: Date): Observable<AnalyticsEvent[]> {
    return this.events$.pipe(
      map(events => events.filter(event => 
        event.timestamp >= startTime && event.timestamp <= endTime
      ))
    );
  }
}






