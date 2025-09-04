import { EventEmitter } from 'events';

// Analytics Event Types
export enum AnalyticsEventType {
  // User Behavior Events
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_REGISTER = 'user_register',
  USER_PROFILE_UPDATE = 'user_profile_update',
  USER_PREFERENCE_CHANGE = 'user_preference_change',
  
  // Content Interaction Events
  POST_VIEW = 'post_view',
  POST_LIKE = 'post_like',
  POST_UNLIKE = 'post_unlike',
  POST_SHARE = 'post_share',
  POST_COMMENT = 'post_comment',
  POST_CREATE = 'post_create',
  POST_DELETE = 'post_delete',
  
  // Navigation Events
  SCREEN_VIEW = 'screen_view',
  NAVIGATION = 'navigation',
  SEARCH = 'search',
  FILTER_APPLIED = 'filter_applied',
  
  // Media Events
  MEDIA_VIEW = 'media_view',
  MEDIA_PLAY = 'media_play',
  MEDIA_PAUSE = 'media_pause',
  MEDIA_COMPLETE = 'media_complete',
  MEDIA_UPLOAD = 'media_upload',
  
  // Social Events
  FOLLOW_USER = 'follow_user',
  UNFOLLOW_USER = 'unfollow_user',
  MESSAGE_SENT = 'message_sent',
  NOTIFICATION_OPENED = 'notification_opened',
  
  // Performance Events
  APP_LAUNCH = 'app_launch',
  APP_BACKGROUND = 'app_background',
  APP_FOREGROUND = 'app_foreground',
  PERFORMANCE_METRIC = 'performance_metric',
  
  // Error Events
  ERROR_OCCURRED = 'error_occurred',
  CRASH = 'crash',
  
  // Business Events
  FEATURE_USAGE = 'feature_usage',
  SUBSCRIPTION_ACTION = 'subscription_action',
  PURCHASE = 'purchase',
  AD_VIEW = 'ad_view',
  AD_CLICK = 'ad_click'
}

// Analytics Event Interface
export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  userId?: string;
  sessionId: string;
  timestamp: number;
  properties: Record<string, any>;
  metadata: {
    appVersion: string;
    platform: 'ios' | 'android';
    deviceModel: string;
    osVersion: string;
    networkType: string;
    location?: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
  };
}

// User Behavior Metrics
export interface UserBehaviorMetrics {
  userId: string;
  sessionDuration: number;
  screenTime: Record<string, number>;
  featureUsage: Record<string, number>;
  contentInteractions: {
    postsViewed: number;
    postsLiked: number;
    postsShared: number;
    commentsPosted: number;
    mediaUploaded: number;
  };
  navigationPatterns: Array<{
    from: string;
    to: string;
    timestamp: number;
  }>;
  searchQueries: Array<{
    query: string;
    timestamp: number;
    resultsCount: number;
  }>;
}

// Content Performance Metrics
export interface ContentPerformanceMetrics {
  contentId: string;
  contentType: 'post' | 'media' | 'comment';
  views: number;
  uniqueViews: number;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    bookmarks: number;
  };
  reach: {
    followers: number;
    viralReach: number;
    organicReach: number;
  };
  performance: {
    avgViewTime: number;
    completionRate: number;
    bounceRate: number;
  };
  demographics: {
    ageGroups: Record<string, number>;
    genders: Record<string, number>;
    locations: Record<string, number>;
    interests: Record<string, number>;
  };
}

// Business Intelligence Metrics
export interface BusinessIntelligenceMetrics {
  userGrowth: {
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    churnRate: number;
    retentionRate: Record<string, number>;
  };
  engagement: {
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
    avgSessionDuration: number;
    avgPostsPerUser: number;
    avgLikesPerPost: number;
  };
  content: {
    totalPosts: number;
    totalMedia: number;
    avgPostQuality: number;
    trendingTopics: Array<{
      topic: string;
      mentions: number;
      growth: number;
    }>;
  };
  revenue: {
    totalRevenue: number;
    avgRevenuePerUser: number;
    subscriptionRevenue: number;
    adRevenue: number;
    conversionRate: number;
  };
}

// Analytics Configuration
export interface AnalyticsConfig {
  enabled: boolean;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  endpoint: string;
  apiKey: string;
  privacySettings: {
    trackLocation: boolean;
    trackDeviceInfo: boolean;
    trackUserBehavior: boolean;
    anonymizeData: boolean;
  };
}

// Analytics Service Class
export class AnalyticsService extends EventEmitter {
  private static instance: AnalyticsService;
  private config: AnalyticsConfig;
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private isInitialized: boolean = false;
  private flushTimer: NodeJS.Timeout | null = null;
  private retryCount: number = 0;

  private constructor() {
    super();
    this.sessionId = this.generateSessionId();
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Initialize the analytics service
  public async initialize(config?: Partial<AnalyticsConfig>): Promise<void> {
    if (this.isInitialized) return;

    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (!this.config.enabled) {
      console.log('Analytics service is disabled');
      return;
    }

    try {
      // Initialize session
      this.sessionId = this.generateSessionId();
      
      // Start flush timer
      this.startFlushTimer();
      
      // Track app launch
      this.trackEvent(AnalyticsEventType.APP_LAUNCH, {
        sessionId: this.sessionId,
        appVersion: this.config.metadata?.appVersion || 'unknown'
      });

      this.isInitialized = true;
      this.emit('initialized');
      console.log('Analytics service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize analytics service:', error);
      this.emit('error', error);
    }
  }

  // Track an analytics event
  public trackEvent(
    type: AnalyticsEventType,
    properties: Record<string, any> = {},
    userId?: string
  ): void {
    if (!this.isInitialized || !this.config.enabled) return;

    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      type,
      userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      properties,
      metadata: this.getDeviceMetadata()
    };

    this.events.push(event);
    this.emit('event_tracked', event);

    // Check if we should flush events
    if (this.events.length >= this.config.batchSize) {
      this.flushEvents();
    }
  }

  // Track user behavior
  public trackUserBehavior(metrics: Partial<UserBehaviorMetrics>): void {
    this.trackEvent(AnalyticsEventType.FEATURE_USAGE, {
      category: 'user_behavior',
      metrics
    });
  }

  // Track content performance
  public trackContentPerformance(metrics: Partial<ContentPerformanceMetrics>): void {
    this.trackEvent(AnalyticsEventType.FEATURE_USAGE, {
      category: 'content_performance',
      metrics
    });
  }

  // Track business metrics
  public trackBusinessMetrics(metrics: Partial<BusinessIntelligenceMetrics>): void {
    this.trackEvent(AnalyticsEventType.FEATURE_USAGE, {
      category: 'business_intelligence',
      metrics
    });
  }

  // Track screen view
  public trackScreenView(screenName: string, properties: Record<string, any> = {}): void {
    this.trackEvent(AnalyticsEventType.SCREEN_VIEW, {
      screenName,
      ...properties
    });
  }

  // Track user engagement
  public trackEngagement(action: string, target: string, properties: Record<string, any> = {}): void {
    this.trackEvent(AnalyticsEventType.FEATURE_USAGE, {
      category: 'engagement',
      action,
      target,
      ...properties
    });
  }

  // Track performance metrics
  public trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.trackEvent(AnalyticsEventType.PERFORMANCE_METRIC, {
      metric,
      value,
      unit
    });
  }

  // Track error
  public trackError(error: Error, context: Record<string, any> = {}): void {
    this.trackEvent(AnalyticsEventType.ERROR_OCCURRED, {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
      ...context
    });
  }

  // Flush events to backend
  private async flushEvents(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToFlush = [...this.events];
    this.events = [];

    try {
      // Send events to backend
      await this.sendEventsToBackend(eventsToFlush);
      
      this.retryCount = 0;
      this.emit('events_flushed', eventsToFlush);
    } catch (error) {
      console.error('Failed to flush events:', error);
      
      // Retry logic
      if (this.retryCount < this.config.maxRetries) {
        this.retryCount++;
        this.events.unshift(...eventsToFlush);
        
        // Exponential backoff
        setTimeout(() => {
          this.flushEvents();
        }, Math.pow(2, this.retryCount) * 1000);
      } else {
        this.emit('flush_failed', error, eventsToFlush);
      }
    }
  }

  // Send events to backend
  private async sendEventsToBackend(events: AnalyticsEvent[]): Promise<void> {
    // Implementation would send events to your analytics backend
    // For now, we'll simulate the API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve();
        } else {
          reject(new Error('Network error'));
        }
      }, 100);
    });
  }

  // Start flush timer
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.config.flushInterval);
  }

  // Generate unique event ID
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get device metadata
  private getDeviceMetadata(): AnalyticsEvent['metadata'] {
    return {
      appVersion: '1.0.0',
      platform: 'android', // This would be dynamic
      deviceModel: 'Unknown Device',
      osVersion: 'Unknown OS',
      networkType: 'Unknown Network'
    };
  }

  // Get default configuration
  private getDefaultConfig(): AnalyticsConfig {
    return {
      enabled: true,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      maxRetries: 3,
      endpoint: 'https://api.innkt.com/analytics',
      apiKey: '',
      privacySettings: {
        trackLocation: false,
        trackDeviceInfo: true,
        trackUserBehavior: true,
        anonymizeData: false
      }
    };
  }

  // Get current session ID
  public getSessionId(): string {
    return this.sessionId;
  }

  // Get pending events count
  public getPendingEventsCount(): number {
    return this.events.length;
  }

  // Get analytics configuration
  public getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  // Update configuration
  public updateConfig(updates: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...updates };
    
    if (updates.flushInterval) {
      this.startFlushTimer();
    }
  }

  // Force flush events
  public async forceFlush(): Promise<void> {
    await this.flushEvents();
  }

  // Clear all events
  public clearEvents(): void {
    this.events = [];
  }

  // Cleanup
  public cleanup(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    this.events = [];
    this.isInitialized = false;
    this.emit('cleanup');
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();





