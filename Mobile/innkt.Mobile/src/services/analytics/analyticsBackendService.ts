import {ApiClient} from '../api/apiClient';

// Analytics Backend Service Interfaces
export interface AnalyticsBackendConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  batchSize: number;
  syncInterval: number;
}

export interface AnalyticsEventPayload {
  eventId: string;
  eventType: string;
  userId?: string;
  sessionId: string;
  timestamp: string;
  properties: Record<string, any>;
  deviceInfo: DeviceInfo;
  context: EventContext;
}

export interface DeviceInfo {
  platform: string;
  version: string;
  deviceId: string;
  appVersion: string;
  osVersion: string;
  screenResolution: string;
  language: string;
  timezone: string;
}

export interface EventContext {
  screen: string;
  previousScreen?: string;
  userAgent: string;
  networkType: string;
  isOnline: boolean;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export interface AnalyticsBatchPayload {
  events: AnalyticsEventPayload[];
  batchId: string;
  timestamp: string;
  deviceInfo: DeviceInfo;
}

export interface AnalyticsSyncResponse {
  success: boolean;
  batchId: string;
  processedEvents: number;
  failedEvents: string[];
  nextSyncTime: string;
  errors?: string[];
}

export interface AnalyticsBackendMetrics {
  totalEvents: number;
  eventsPerSecond: number;
  lastSyncTime: string;
  syncStatus: 'success' | 'failed' | 'pending';
  errorCount: number;
  retryCount: number;
}

export interface AnalyticsBackendHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  errorRate: number;
  lastCheck: string;
  details: string;
}

// Analytics Backend Service
export class AnalyticsBackendService {
  private static instance: AnalyticsBackendService;
  private config: AnalyticsBackendConfig;
  private apiClient: ApiClient;
  private syncTimer: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;
  private pendingEvents: AnalyticsEventPayload[] = [];
  private syncInProgress: boolean = false;
  private lastSyncTime: Date | null = null;
  private errorCount: number = 0;
  private retryCount: number = 0;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.apiClient = new ApiClient();
  }

  public static getInstance(): AnalyticsBackendService {
    if (!AnalyticsBackendService.instance) {
      AnalyticsBackendService.instance = new AnalyticsBackendService();
    }
    return AnalyticsBackendService.instance;
  }

  // Initialize the backend service
  public async initialize(config?: Partial<AnalyticsBackendConfig>): Promise<void> {
    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Test backend connectivity
      await this.checkBackendHealth();

      // Start sync timer
      this.startSyncTimer();

      console.log('Analytics Backend Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Analytics Backend Service:', error);
      throw error;
    }
  }

  // Send single event to backend
  public async sendEvent(event: AnalyticsEventPayload): Promise<boolean> {
    try {
      if (!this.isOnline) {
        this.pendingEvents.push(event);
        return false;
      }

      const response = await this.apiClient.post(
        `${this.config.baseUrl}/analytics/events`,
        event,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: this.config.timeout,
        }
      );

      if (response.success) {
        console.log('Event sent successfully:', event.eventId);
        return true;
      } else {
        console.warn('Failed to send event:', response.error);
        this.pendingEvents.push(event);
        return false;
      }
    } catch (error) {
      console.error('Error sending event:', error);
      this.pendingEvents.push(event);
      this.errorCount++;
      return false;
    }
  }

  // Send batch of events to backend
  public async sendBatch(events: AnalyticsEventPayload[]): Promise<AnalyticsSyncResponse> {
    if (events.length === 0) {
      return {
        success: true,
        batchId: this.generateBatchId(),
        processedEvents: 0,
        failedEvents: [],
        nextSyncTime: new Date().toISOString(),
      };
    }

    try {
      this.syncInProgress = true;

      const batchPayload: AnalyticsBatchPayload = {
        events,
        batchId: this.generateBatchId(),
        timestamp: new Date().toISOString(),
        deviceInfo: this.getDeviceInfo(),
      };

      const response = await this.apiClient.post(
        `${this.config.baseUrl}/analytics/batch`,
        batchPayload,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: this.config.timeout,
        }
      );

      if (response.success) {
        const syncResponse: AnalyticsSyncResponse = {
          success: true,
          batchId: batchPayload.batchId,
          processedEvents: events.length,
          failedEvents: [],
          nextSyncTime: new Date(Date.now() + this.config.syncInterval).toISOString(),
        };

        this.lastSyncTime = new Date();
        this.errorCount = 0;
        this.retryCount = 0;

        console.log(`Batch sent successfully: ${events.length} events`);
        return syncResponse;
      } else {
        throw new Error(response.error || 'Failed to send batch');
      }
    } catch (error) {
      console.error('Error sending batch:', error);
      this.errorCount++;
      this.retryCount++;

      // Retry logic
      if (this.retryCount < this.config.retryAttempts) {
        await this.delay(this.config.retryDelay * this.retryCount);
        return this.sendBatch(events);
      }

      return {
        success: false,
        batchId: this.generateBatchId(),
        processedEvents: 0,
        failedEvents: events.map(e => e.eventId),
        nextSyncTime: new Date(Date.now() + this.config.syncInterval).toISOString(),
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync pending events
  public async syncPendingEvents(): Promise<AnalyticsSyncResponse> {
    if (this.syncInProgress || this.pendingEvents.length === 0) {
      return {
        success: true,
        batchId: this.generateBatchId(),
        processedEvents: 0,
        failedEvents: [],
        nextSyncTime: new Date().toISOString(),
      };
    }

    try {
      const eventsToSync = [...this.pendingEvents];
      this.pendingEvents = [];

      const result = await this.sendBatch(eventsToSync);
      return result;
    } catch (error) {
      console.error('Error syncing pending events:', error);
      return {
        success: false,
        batchId: this.generateBatchId(),
        processedEvents: 0,
        failedEvents: this.pendingEvents.map(e => e.eventId),
        nextSyncTime: new Date(Date.now() + this.config.syncInterval).toISOString(),
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  // Check backend health
  public async checkBackendHealth(): Promise<AnalyticsBackendHealth> {
    try {
      const startTime = Date.now();
      
      const response = await this.apiClient.get(
        `${this.config.baseUrl}/analytics/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          timeout: this.config.timeout,
        }
      );

      const responseTime = Date.now() - startTime;

      if (response.success) {
        const health: AnalyticsBackendHealth = {
          status: 'healthy',
          responseTime,
          errorRate: 0,
          lastCheck: new Date().toISOString(),
          details: 'Backend is responding normally',
        };

        console.log('Backend health check passed');
        return health;
      } else {
        throw new Error(response.error || 'Health check failed');
      }
    } catch (error) {
      console.error('Backend health check failed:', error);
      
      const health: AnalyticsBackendHealth = {
        status: 'unhealthy',
        responseTime: 0,
        errorRate: 1,
        lastCheck: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Health check failed',
      };

      return health;
    }
  }

  // Get backend metrics
  public getBackendMetrics(): AnalyticsBackendMetrics {
    return {
      totalEvents: this.pendingEvents.length,
      eventsPerSecond: this.calculateEventsPerSecond(),
      lastSyncTime: this.lastSyncTime?.toISOString() || 'Never',
      syncStatus: this.getSyncStatus(),
      errorCount: this.errorCount,
      retryCount: this.retryCount,
    };
  }

  // Update network status
  public updateNetworkStatus(isOnline: boolean): void {
    this.isOnline = isOnline;
    
    if (isOnline && this.pendingEvents.length > 0) {
      // Trigger sync when coming back online
      this.syncPendingEvents();
    }
  }

  // Get pending events count
  public getPendingEventsCount(): number {
    return this.pendingEvents.length;
  }

  // Clear pending events
  public clearPendingEvents(): void {
    this.pendingEvents = [];
    console.log('Pending events cleared');
  }

  // Update configuration
  public updateConfig(config: Partial<AnalyticsBackendConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart sync timer with new interval
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.startSyncTimer();
    }
  }

  // Get current configuration
  public getConfig(): AnalyticsBackendConfig {
    return { ...this.config };
  }

  // Cleanup resources
  public cleanup(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    this.pendingEvents = [];
    this.syncInProgress = false;
    this.lastSyncTime = null;
    this.errorCount = 0;
    this.retryCount = 0;
    
    console.log('Analytics Backend Service cleaned up');
  }

  // Private methods
  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      if (this.isOnline && this.pendingEvents.length > 0) {
        await this.syncPendingEvents();
      }
    }, this.config.syncInterval);
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo(): DeviceInfo {
    // This would be populated with actual device information
    return {
      platform: 'react-native',
      version: '1.0.0',
      deviceId: 'device_123',
      appVersion: '1.0.0',
      osVersion: '14.0',
      screenResolution: '1080x1920',
      language: 'en',
      timezone: 'UTC',
    };
  }

  private calculateEventsPerSecond(): number {
    // Simple calculation - in a real implementation, this would track events over time
    return this.pendingEvents.length > 0 ? 1 : 0;
  }

  private getSyncStatus(): 'success' | 'failed' | 'pending' {
    if (this.syncInProgress) return 'pending';
    if (this.errorCount > 0) return 'failed';
    return 'success';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getDefaultConfig(): AnalyticsBackendConfig {
    return {
      baseUrl: 'https://api.innkt.com',
      apiKey: '',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      batchSize: 50,
      syncInterval: 30000, // 30 seconds
    };
  }
}






