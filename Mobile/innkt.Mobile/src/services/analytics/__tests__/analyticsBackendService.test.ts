import {AnalyticsBackendService} from '../analyticsBackendService';

// Mock ApiClient
const mockApiClient = {
  post: jest.fn(),
  get: jest.fn(),
};

jest.mock('../api/apiClient', () => ({
  ApiClient: jest.fn().mockImplementation(() => mockApiClient),
}));

describe('AnalyticsBackendService', () => {
  let analyticsBackendService: AnalyticsBackendService;

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsBackendService = AnalyticsBackendService.getInstance();
    analyticsBackendService.cleanup();
  });

  afterEach(() => {
    analyticsBackendService.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with default config', async () => {
      mockApiClient.get.mockResolvedValue({success: true});
      
      await analyticsBackendService.initialize();
      
      const config = analyticsBackendService.getConfig();
      expect(config.baseUrl).toBe('https://api.innkt.com');
      expect(config.timeout).toBe(10000);
      expect(config.retryAttempts).toBe(3);
    });

    it('should initialize with custom config', async () => {
      mockApiClient.get.mockResolvedValue({success: true});
      
      const customConfig = {
        baseUrl: 'https://custom-api.innkt.com',
        timeout: 15000,
        retryAttempts: 5,
      };

      await analyticsBackendService.initialize(customConfig);
      
      const config = analyticsBackendService.getConfig();
      expect(config.baseUrl).toBe('https://custom-api.innkt.com');
      expect(config.timeout).toBe(15000);
      expect(config.retryAttempts).toBe(5);
    });

    it('should handle initialization errors gracefully', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Connection failed'));
      
      await expect(analyticsBackendService.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('Event Sending', () => {
    beforeEach(async () => {
      mockApiClient.get.mockResolvedValue({success: true});
      await analyticsBackendService.initialize();
    });

    it('should send single event successfully', async () => {
      mockApiClient.post.mockResolvedValue({success: true});
      
      const event = {
        eventId: 'event123',
        eventType: 'user_login',
        userId: 'user123',
        sessionId: 'session123',
        timestamp: new Date().toISOString(),
        properties: {method: 'email'},
        deviceInfo: {
          platform: 'ios',
          version: '1.0.0',
          deviceId: 'device123',
          appVersion: '1.0.0',
          osVersion: '14.0',
          screenResolution: '1080x1920',
          language: 'en',
          timezone: 'UTC',
        },
        context: {
          screen: 'Login',
          userAgent: 'ReactNative/1.0',
          networkType: 'wifi',
          isOnline: true,
        },
      };

      const result = await analyticsBackendService.sendEvent(event);
      
      expect(result).toBe(true);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        'https://api.innkt.com/analytics/events',
        event,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer ',
            'Content-Type': 'application/json',
          }),
          timeout: 10000,
        })
      );
    });

    it('should queue event when offline', async () => {
      analyticsBackendService.updateNetworkStatus(false);
      
      const event = {
        eventId: 'event123',
        eventType: 'user_login',
        sessionId: 'session123',
        timestamp: new Date().toISOString(),
        properties: {},
        deviceInfo: {
          platform: 'ios',
          version: '1.0.0',
          deviceId: 'device123',
          appVersion: '1.0.0',
          osVersion: '14.0',
          screenResolution: '1080x1920',
          language: 'en',
          timezone: 'UTC',
        },
        context: {
          screen: 'Login',
          userAgent: 'ReactNative/1.0',
          networkType: 'wifi',
          isOnline: false,
        },
      };

      const result = await analyticsBackendService.sendEvent(event);
      
      expect(result).toBe(false);
      expect(analyticsBackendService.getPendingEventsCount()).toBe(1);
    });

    it('should handle API errors gracefully', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network error'));
      
      const event = {
        eventId: 'event123',
        eventType: 'user_login',
        sessionId: 'session123',
        timestamp: new Date().toISOString(),
        properties: {},
        deviceInfo: {
          platform: 'ios',
          version: '1.0.0',
          deviceId: 'device123',
          appVersion: '1.0.0',
          osVersion: '14.0',
          screenResolution: '1080x1920',
          language: 'en',
          timezone: 'UTC',
        },
        context: {
          screen: 'Login',
          userAgent: 'ReactNative/1.0',
          networkType: 'wifi',
          isOnline: true,
        },
      };

      const result = await analyticsBackendService.sendEvent(event);
      
      expect(result).toBe(false);
      expect(analyticsBackendService.getPendingEventsCount()).toBe(1);
    });
  });

  describe('Batch Processing', () => {
    beforeEach(async () => {
      mockApiClient.get.mockResolvedValue({success: true});
      await analyticsBackendService.initialize();
    });

    it('should send batch of events successfully', async () => {
      mockApiClient.post.mockResolvedValue({success: true});
      
      const events = [
        {
          eventId: 'event1',
          eventType: 'user_login',
          sessionId: 'session123',
          timestamp: new Date().toISOString(),
          properties: {},
          deviceInfo: {
            platform: 'ios',
            version: '1.0.0',
            deviceId: 'device123',
            appVersion: '1.0.0',
            osVersion: '14.0',
            screenResolution: '1080x1920',
            language: 'en',
            timezone: 'UTC',
          },
          context: {
            screen: 'Login',
            userAgent: 'ReactNative/1.0',
            networkType: 'wifi',
            isOnline: true,
          },
        },
        {
          eventId: 'event2',
          eventType: 'screen_view',
          sessionId: 'session123',
          timestamp: new Date().toISOString(),
          properties: {screen: 'Dashboard'},
          deviceInfo: {
            platform: 'ios',
            version: '1.0.0',
            deviceId: 'device123',
            appVersion: '1.0.0',
            osVersion: '14.0',
            screenResolution: '1080x1920',
            language: 'en',
            timezone: 'UTC',
          },
          context: {
            screen: 'Dashboard',
            userAgent: 'ReactNative/1.0',
            networkType: 'wifi',
            isOnline: true,
          },
        },
      ];

      const result = await analyticsBackendService.sendBatch(events);
      
      expect(result.success).toBe(true);
      expect(result.processedEvents).toBe(2);
      expect(result.failedEvents).toHaveLength(0);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        'https://api.innkt.com/analytics/batch',
        expect.objectContaining({
          events,
          batchId: expect.any(String),
          timestamp: expect.any(String),
          deviceInfo: expect.any(Object),
        }),
        expect.any(Object)
      );
    });

    it('should handle empty batch gracefully', async () => {
      const result = await analyticsBackendService.sendBatch([]);
      
      expect(result.success).toBe(true);
      expect(result.processedEvents).toBe(0);
      expect(result.failedEvents).toHaveLength(0);
    });

    it('should retry failed batches', async () => {
      mockApiClient.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({success: true});
      
      const events = [
        {
          eventId: 'event1',
          eventType: 'user_login',
          sessionId: 'session123',
          timestamp: new Date().toISOString(),
          properties: {},
          deviceInfo: {
            platform: 'ios',
            version: '1.0.0',
            deviceId: 'device123',
            appVersion: '1.0.0',
            osVersion: '14.0',
            screenResolution: '1080x1920',
            language: 'en',
            timezone: 'UTC',
          },
          context: {
            screen: 'Login',
            userAgent: 'ReactNative/1.0',
            networkType: 'wifi',
            isOnline: true,
          },
        },
      ];

      const result = await analyticsBackendService.sendBatch(events);
      
      expect(result.success).toBe(true);
      expect(mockApiClient.post).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retry attempts', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network error'));
      
      const events = [
        {
          eventId: 'event1',
          eventType: 'user_login',
          sessionId: 'session123',
          timestamp: new Date().toISOString(),
          properties: {},
          deviceInfo: {
            platform: 'ios',
            version: '1.0.0',
            deviceId: 'device123',
            appVersion: '1.0.0',
            osVersion: '14.0',
            screenResolution: '1080x1920',
            language: 'en',
            timezone: 'UTC',
          },
          context: {
            screen: 'Login',
            userAgent: 'ReactNative/1.0',
            networkType: 'wifi',
            isOnline: true,
          },
        },
      ];

      const result = await analyticsBackendService.sendBatch(events);
      
      expect(result.success).toBe(false);
      expect(result.failedEvents).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(mockApiClient.post).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Pending Events Sync', () => {
    beforeEach(async () => {
      mockApiClient.get.mockResolvedValue({success: true});
      await analyticsBackendService.initialize();
    });

    it('should sync pending events when online', async () => {
      mockApiClient.post.mockResolvedValue({success: true});
      
      // Add some events to pending queue
      analyticsBackendService.updateNetworkStatus(false);
      await analyticsBackendService.sendEvent({
        eventId: 'event1',
        eventType: 'user_login',
        sessionId: 'session123',
        timestamp: new Date().toISOString(),
        properties: {},
        deviceInfo: {
          platform: 'ios',
          version: '1.0.0',
          deviceId: 'device123',
          appVersion: '1.0.0',
          osVersion: '14.0',
          screenResolution: '1080x1920',
          language: 'en',
          timezone: 'UTC',
        },
        context: {
          screen: 'Login',
          userAgent: 'ReactNative/1.0',
          networkType: 'wifi',
          isOnline: false,
        },
      });

      expect(analyticsBackendService.getPendingEventsCount()).toBe(1);

      // Go online and sync
      analyticsBackendService.updateNetworkStatus(true);
      
      // Wait for sync timer to trigger
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(analyticsBackendService.getPendingEventsCount()).toBe(0);
    });

    it('should handle sync when no pending events', async () => {
      const result = await analyticsBackendService.syncPendingEvents();
      
      expect(result.success).toBe(true);
      expect(result.processedEvents).toBe(0);
    });

    it('should handle sync errors gracefully', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Sync failed'));
      
      // Add some events to pending queue
      analyticsBackendService.updateNetworkStatus(false);
      await analyticsBackendService.sendEvent({
        eventId: 'event1',
        eventType: 'user_login',
        sessionId: 'session123',
        timestamp: new Date().toISOString(),
        properties: {},
        deviceInfo: {
          platform: 'ios',
          version: '1.0.0',
          deviceId: 'device123',
          appVersion: '1.0.0',
          osVersion: '14.0',
          screenResolution: '1080x1920',
          language: 'en',
          timezone: 'UTC',
        },
        context: {
          screen: 'Login',
          userAgent: 'ReactNative/1.0',
          networkType: 'wifi',
          isOnline: false,
        },
      });

      const result = await analyticsBackendService.syncPendingEvents();
      
      expect(result.success).toBe(false);
      expect(result.failedEvents).toHaveLength(1);
    });
  });

  describe('Backend Health Check', () => {
    beforeEach(async () => {
      await analyticsBackendService.initialize();
    });

    it('should check backend health successfully', async () => {
      mockApiClient.get.mockResolvedValue({success: true});
      
      const health = await analyticsBackendService.checkBackendHealth();
      
      expect(health.status).toBe('healthy');
      expect(health.responseTime).toBeGreaterThan(0);
      expect(health.errorRate).toBe(0);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        'https://api.innkt.com/analytics/health',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer ',
          }),
          timeout: 10000,
        })
      );
    });

    it('should handle health check failures', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Health check failed'));
      
      const health = await analyticsBackendService.checkBackendHealth();
      
      expect(health.status).toBe('unhealthy');
      expect(health.responseTime).toBe(0);
      expect(health.errorRate).toBe(1);
      expect(health.details).toBe('Health check failed');
    });
  });

  describe('Backend Metrics', () => {
    beforeEach(async () => {
      mockApiClient.get.mockResolvedValue({success: true});
      await analyticsBackendService.initialize();
    });

    it('should provide accurate backend metrics', () => {
      // Add some events to pending queue
      analyticsBackendService.updateNetworkStatus(false);
      analyticsBackendService.sendEvent({
        eventId: 'event1',
        eventType: 'user_login',
        sessionId: 'session123',
        timestamp: new Date().toISOString(),
        properties: {},
        deviceInfo: {
          platform: 'ios',
          version: '1.0.0',
          deviceId: 'device123',
          appVersion: '1.0.0',
          osVersion: '14.0',
          screenResolution: '1080x1920',
          language: 'en',
          timezone: 'UTC',
        },
        context: {
          screen: 'Login',
          userAgent: 'ReactNative/1.0',
          networkType: 'wifi',
          isOnline: false,
        },
      });

      const metrics = analyticsBackendService.getBackendMetrics();
      
      expect(metrics.totalEvents).toBe(1);
      expect(metrics.eventsPerSecond).toBeGreaterThanOrEqual(0);
      expect(metrics.syncStatus).toBe('failed');
      expect(metrics.errorCount).toBe(0);
      expect(metrics.retryCount).toBe(0);
    });

    it('should update metrics after operations', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network error'));
      
      await analyticsBackendService.sendEvent({
        eventId: 'event1',
        eventType: 'user_login',
        sessionId: 'session123',
        timestamp: new Date().toISOString(),
        properties: {},
        deviceInfo: {
          platform: 'ios',
          version: '1.0.0',
          deviceId: 'device123',
          appVersion: '1.0.0',
          osVersion: '14.0',
          screenResolution: '1080x1920',
          language: 'en',
          timezone: 'UTC',
        },
        context: {
          screen: 'Login',
          userAgent: 'ReactNative/1.0',
          networkType: 'wifi',
          isOnline: true,
        },
      });

      const metrics = analyticsBackendService.getBackendMetrics();
      
      expect(metrics.errorCount).toBe(1);
    });
  });

  describe('Network Status Management', () => {
    beforeEach(async () => {
      mockApiClient.get.mockResolvedValue({success: true});
      await analyticsBackendService.initialize();
    });

    it('should update network status correctly', () => {
      analyticsBackendService.updateNetworkStatus(false);
      
      // Add event while offline
      analyticsBackendService.sendEvent({
        eventId: 'event1',
        eventType: 'user_login',
        sessionId: 'session123',
        timestamp: new Date().toISOString(),
        properties: {},
        deviceInfo: {
          platform: 'ios',
          version: '1.0.0',
          deviceId: 'device123',
          appVersion: '1.0.0',
          osVersion: '14.0',
          screenResolution: '1080x1920',
          language: 'en',
          timezone: 'UTC',
        },
        context: {
          screen: 'Login',
          userAgent: 'ReactNative/1.0',
          networkType: 'wifi',
          isOnline: false,
        },
      });

      expect(analyticsBackendService.getPendingEventsCount()).toBe(1);

      // Go online
      analyticsBackendService.updateNetworkStatus(true);
      
      // Event should be queued for sync
      expect(analyticsBackendService.getPendingEventsCount()).toBe(1);
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      mockApiClient.get.mockResolvedValue({success: true});
      await analyticsBackendService.initialize();
    });

    it('should update configuration correctly', () => {
      const originalConfig = analyticsBackendService.getConfig();
      
      analyticsBackendService.updateConfig({
        timeout: 20000,
        retryAttempts: 5,
      });
      
      const updatedConfig = analyticsBackendService.getConfig();
      
      expect(updatedConfig.timeout).toBe(20000);
      expect(updatedConfig.retryAttempts).toBe(5);
      expect(updatedConfig.baseUrl).toBe(originalConfig.baseUrl);
    });

    it('should preserve existing config when updating', () => {
      const originalConfig = analyticsBackendService.getConfig();
      
      analyticsBackendService.updateConfig({
        timeout: 20000,
      });
      
      const updatedConfig = analyticsBackendService.getConfig();
      
      expect(updatedConfig.timeout).toBe(20000);
      expect(updatedConfig.retryAttempts).toBe(originalConfig.retryAttempts);
      expect(updatedConfig.baseUrl).toBe(originalConfig.baseUrl);
    });
  });

  describe('Cleanup and Resource Management', () => {
    beforeEach(async () => {
      mockApiClient.get.mockResolvedValue({success: true});
      await analyticsBackendService.initialize();
    });

    it('should cleanup resources correctly', () => {
      // Add some events
      analyticsBackendService.updateNetworkStatus(false);
      analyticsBackendService.sendEvent({
        eventId: 'event1',
        eventType: 'user_login',
        sessionId: 'session123',
        timestamp: new Date().toISOString(),
        properties: {},
        deviceInfo: {
          platform: 'ios',
          version: '1.0.0',
          deviceId: 'device123',
          appVersion: '1.0.0',
          osVersion: '14.0',
          screenResolution: '1080x1920',
          language: 'en',
          timezone: 'UTC',
        },
        context: {
          screen: 'Login',
          userAgent: 'ReactNative/1.0',
          networkType: 'wifi',
          isOnline: false,
        },
      });

      expect(analyticsBackendService.getPendingEventsCount()).toBe(1);

      analyticsBackendService.cleanup();
      
      expect(analyticsBackendService.getPendingEventsCount()).toBe(0);
    });

    it('should clear pending events', () => {
      // Add some events
      analyticsBackendService.updateNetworkStatus(false);
      analyticsBackendService.sendEvent({
        eventId: 'event1',
        eventType: 'user_login',
        sessionId: 'session123',
        timestamp: new Date().toISOString(),
        properties: {},
        deviceInfo: {
          platform: 'ios',
          version: '1.0.0',
          deviceId: 'device123',
          appVersion: '1.0.0',
          osVersion: '14.0',
          screenResolution: '1080x1920',
          language: 'en',
          timezone: 'UTC',
        },
        context: {
          screen: 'Login',
          userAgent: 'ReactNative/1.0',
          networkType: 'wifi',
          isOnline: false,
        },
      });

      expect(analyticsBackendService.getPendingEventsCount()).toBe(1);

      analyticsBackendService.clearPendingEvents();
      
      expect(analyticsBackendService.getPendingEventsCount()).toBe(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(async () => {
      mockApiClient.get.mockResolvedValue({success: true});
      await analyticsBackendService.initialize();
    });

    it('should handle malformed events gracefully', async () => {
      const malformedEvent = {
        eventId: 'event123',
        // Missing required fields
      } as any;

      const result = await analyticsBackendService.sendEvent(malformedEvent);
      
      expect(result).toBe(false);
    });

    it('should handle API response without success field', async () => {
      mockApiClient.post.mockResolvedValue({data: 'some data'});
      
      const event = {
        eventId: 'event123',
        eventType: 'user_login',
        sessionId: 'session123',
        timestamp: new Date().toISOString(),
        properties: {},
        deviceInfo: {
          platform: 'ios',
          version: '1.0.0',
          deviceId: 'device123',
          appVersion: '1.0.0',
          osVersion: '14.0',
          screenResolution: '1080x1920',
          language: 'en',
          timezone: 'UTC',
        },
        context: {
          screen: 'Login',
          userAgent: 'ReactNative/1.0',
          networkType: 'wifi',
          isOnline: true,
        },
      };

      const result = await analyticsBackendService.sendEvent(event);
      
      expect(result).toBe(false);
      expect(analyticsBackendService.getPendingEventsCount()).toBe(1);
    });

    it('should handle concurrent operations gracefully', async () => {
      mockApiClient.post.mockResolvedValue({success: true});
      
      const events = Array.from({length: 5}, (_, i) => ({
        eventId: `event${i}`,
        eventType: 'user_login',
        sessionId: 'session123',
        timestamp: new Date().toISOString(),
        properties: {},
        deviceInfo: {
          platform: 'ios',
          version: '1.0.0',
          deviceId: 'device123',
          appVersion: '1.0.0',
          osVersion: '14.0',
          screenResolution: '1080x1920',
          language: 'en',
          timezone: 'UTC',
        },
        context: {
          screen: 'Login',
          userAgent: 'ReactNative/1.0',
          networkType: 'wifi',
          isOnline: true,
        },
      }));

      // Send events concurrently
      const promises = events.map(event => analyticsBackendService.sendEvent(event));
      const results = await Promise.all(promises);
      
      expect(results.every(result => result === true)).toBe(true);
    });
  });
});






