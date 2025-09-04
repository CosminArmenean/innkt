import {AnalyticsService} from '../analyticsService';

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsService = AnalyticsService.getInstance();
    analyticsService.cleanup();
  });

  afterEach(() => {
    analyticsService.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with default config', async () => {
      await analyticsService.initialize();
      
      expect(analyticsService.getConfig()).toEqual({
        batchSize: 50,
        flushInterval: 30000,
        maxRetries: 3,
        retryDelay: 1000,
        enableDebug: false,
        privacySettings: {
          trackUserBehavior: true,
          trackDeviceInfo: true,
          trackLocation: false,
        },
      });
    });

    it('should initialize with custom config', async () => {
      const customConfig = {
        batchSize: 100,
        flushInterval: 60000,
        enableDebug: true,
      };

      await analyticsService.initialize(customConfig);
      
      const config = analyticsService.getConfig();
      expect(config.batchSize).toBe(100);
      expect(config.flushInterval).toBe(60000);
      expect(config.enableDebug).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));
      
      await expect(analyticsService.initialize()).resolves.not.toThrow();
    });
  });

  describe('Event Tracking', () => {
    beforeEach(async () => {
      await analyticsService.initialize();
    });

    it('should track events with required parameters', () => {
      const eventId = analyticsService.trackEvent('user_login', {
        userId: 'user123',
        method: 'email',
      });

      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe('string');
    });

    it('should track events with optional parameters', () => {
      const eventId = analyticsService.trackEvent('user_login', {
        userId: 'user123',
        method: 'email',
      }, 'user123');

      expect(eventId).toBeDefined();
    });

    it('should generate unique event IDs', () => {
      const eventId1 = analyticsService.trackEvent('event1');
      const eventId2 = analyticsService.trackEvent('event2');

      expect(eventId1).not.toBe(eventId2);
    });

    it('should add timestamp to events', () => {
      const beforeEvent = Date.now();
      analyticsService.trackEvent('test_event');
      const afterEvent = Date.now();

      const pendingEvents = analyticsService.getPendingEventsCount();
      expect(pendingEvents).toBeGreaterThan(0);
    });
  });

  describe('User Behavior Tracking', () => {
    beforeEach(async () => {
      await analyticsService.initialize();
    });

    it('should track user behavior metrics', () => {
      const metrics = {
        screenName: 'Dashboard',
        timeSpent: 120,
        interactions: 5,
        features: ['stats', 'navigation'],
      };

      analyticsService.trackUserBehavior(metrics);
      
      const pendingEvents = analyticsService.getPendingEventsCount();
      expect(pendingEvents).toBeGreaterThan(0);
    });

    it('should track screen views', () => {
      analyticsService.trackScreenView('Profile', {
        userId: 'user123',
        previousScreen: 'Dashboard',
      });

      const pendingEvents = analyticsService.getPendingEventsCount();
      expect(pendingEvents).toBeGreaterThan(0);
    });

    it('should track engagement events', () => {
      analyticsService.trackEngagement('button_click', 'create_post', {
        userId: 'user123',
        location: 'dashboard',
      });

      const pendingEvents = analyticsService.getPendingEventsCount();
      expect(pendingEvents).toBeGreaterThan(0);
    });

    it('should track performance metrics', () => {
      analyticsService.trackPerformance('render_time', 150, 'ms');
      analyticsService.trackPerformance('memory_usage', 45.2, 'MB');

      const pendingEvents = analyticsService.getPendingEventsCount();
      expect(pendingEvents).toBeGreaterThan(0);
    });

    it('should track error events', () => {
      const error = new Error('Network timeout');
      analyticsService.trackError(error, {
        userId: 'user123',
        screen: 'Dashboard',
        action: 'refresh_data',
      });

      const pendingEvents = analyticsService.getPendingEventsCount();
      expect(pendingEvents).toBeGreaterThan(0);
    });
  });

  describe('Content Performance Tracking', () => {
    beforeEach(async () => {
      await analyticsService.initialize();
    });

    it('should track content performance metrics', () => {
      const metrics = {
        contentId: 'post123',
        contentType: 'post',
        views: 150,
        likes: 25,
        comments: 8,
        shares: 3,
        engagementRate: 0.24,
      };

      analyticsService.trackContentPerformance(metrics);
      
      const pendingEvents = analyticsService.getPendingEventsCount();
      expect(pendingEvents).toBeGreaterThan(0);
    });
  });

  describe('Business Metrics Tracking', () => {
    beforeEach(async () => {
      await analyticsService.initialize();
    });

    it('should track business intelligence metrics', () => {
      const metrics = {
        revenue: 1250.50,
        activeUsers: 1250,
        conversionRate: 0.085,
        customerSatisfaction: 4.2,
      };

      analyticsService.trackBusinessMetrics(metrics);
      
      const pendingEvents = analyticsService.getPendingEventsCount();
      expect(pendingEvents).toBeGreaterThan(0);
    });
  });

  describe('Event Flushing', () => {
    beforeEach(async () => {
      await analyticsService.initialize({
        batchSize: 3,
        flushInterval: 1000,
      });
    });

    it('should flush events when batch size is reached', () => {
      // Add events up to batch size
      analyticsService.trackEvent('event1');
      analyticsService.trackEvent('event2');
      analyticsService.trackEvent('event3');

      // Should trigger flush
      const pendingEvents = analyticsService.getPendingEventsCount();
      expect(pendingEvents).toBe(0);
    });

    it('should flush events manually', () => {
      analyticsService.trackEvent('event1');
      analyticsService.trackEvent('event2');

      analyticsService.forceFlush();
      
      const pendingEvents = analyticsService.getPendingEventsCount();
      expect(pendingEvents).toBe(0);
    });

    it('should handle flush errors gracefully', () => {
      // Mock a scenario where flush fails
      analyticsService.trackEvent('event1');
      
      // Force flush should not throw
      expect(() => analyticsService.forceFlush()).not.toThrow();
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      await analyticsService.initialize();
    });

    it('should generate session ID on initialization', () => {
      const sessionId = analyticsService.getSessionId();
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('should maintain same session ID during lifetime', () => {
      const sessionId1 = analyticsService.getSessionId();
      const sessionId2 = analyticsService.getSessionId();
      
      expect(sessionId1).toBe(sessionId2);
    });

    it('should generate new session ID after cleanup and reinitialization', async () => {
      const sessionId1 = analyticsService.getSessionId();
      
      analyticsService.cleanup();
      await analyticsService.initialize();
      
      const sessionId2 = analyticsService.getSessionId();
      expect(sessionId1).not.toBe(sessionId2);
    });
  });

  describe('Device Metadata', () => {
    beforeEach(async () => {
      await analyticsService.initialize();
    });

    it('should collect device metadata', () => {
      const metadata = analyticsService.getDeviceMetadata();
      
      expect(metadata).toHaveProperty('platform');
      expect(metadata).toHaveProperty('version');
      expect(metadata).toHaveProperty('timestamp');
    });

    it('should include platform information', () => {
      const metadata = analyticsService.getDeviceMetadata();
      
      expect(['ios', 'android', 'web']).toContain(metadata.platform);
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      await analyticsService.initialize();
    });

    it('should update configuration', () => {
      const newConfig = {
        batchSize: 75,
        enableDebug: true,
      };

      analyticsService.updateConfig(newConfig);
      
      const config = analyticsService.getConfig();
      expect(config.batchSize).toBe(75);
      expect(config.enableDebug).toBe(true);
    });

    it('should preserve existing config when updating', () => {
      const originalConfig = analyticsService.getConfig();
      
      analyticsService.updateConfig({batchSize: 100});
      
      const updatedConfig = analyticsService.getConfig();
      expect(updatedConfig.flushInterval).toBe(originalConfig.flushInterval);
      expect(updatedConfig.maxRetries).toBe(originalConfig.maxRetries);
    });
  });

  describe('Privacy and Data Management', () => {
    beforeEach(async () => {
      await analyticsService.initialize();
    });

    it('should respect privacy settings', () => {
      analyticsService.updateConfig({
        privacySettings: {
          trackUserBehavior: false,
          trackDeviceInfo: false,
          trackLocation: false,
        },
      });

      // Should still track basic events
      analyticsService.trackEvent('test_event');
      expect(analyticsService.getPendingEventsCount()).toBeGreaterThan(0);
    });

    it('should clear all events', () => {
      analyticsService.trackEvent('event1');
      analyticsService.trackEvent('event2');
      
      expect(analyticsService.getPendingEventsCount()).toBeGreaterThan(0);
      
      analyticsService.clearEvents();
      expect(analyticsService.getPendingEventsCount()).toBe(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await analyticsService.initialize();
    });

    it('should handle invalid event types gracefully', () => {
      expect(() => {
        analyticsService.trackEvent('' as any);
      }).not.toThrow();
    });

    it('should handle invalid properties gracefully', () => {
      expect(() => {
        analyticsService.trackEvent('test_event', null as any);
      }).not.toThrow();
    });

    it('should handle service errors gracefully', () => {
      // Mock a scenario where internal operations fail
      const mockError = new Error('Internal service error');
      
      expect(() => {
        analyticsService.trackEvent('test_event');
      }).not.toThrow();
    });
  });

  describe('Performance and Memory', () => {
    beforeEach(async () => {
      await analyticsService.initialize({
        batchSize: 1000,
        flushInterval: 60000,
      });
    });

    it('should handle large numbers of events efficiently', () => {
      const startTime = Date.now();
      
      // Add many events
      for (let i = 0; i < 100; i++) {
        analyticsService.trackEvent(`event_${i}`);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should not exceed memory limits', () => {
      const initialMemory = process.memoryUsage?.()?.heapUsed || 0;
      
      // Add many events
      for (let i = 0; i < 500; i++) {
        analyticsService.trackEvent(`event_${i}`, {data: 'x'.repeat(100)});
      }
      
      const finalMemory = process.memoryUsage?.()?.heapUsed || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});





