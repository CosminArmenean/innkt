import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { offlineService, OfflineAction, SyncStatus, CacheConfig } from '../offline/offlineService';
import { officerApiClient, frontierApiClient } from '../api/apiClient';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
}));

jest.mock('../api/apiClient', () => ({
  officerApiClient: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  frontierApiClient: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('OfflineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset service state
    offlineService.clearCache();
    offlineService.clearOfflineActions();
  });

  describe('Network monitoring', () => {
    it('should initialize network monitoring', () => {
      offlineService.initialize();

      expect(NetInfo.addEventListener).toHaveBeenCalled();
      expect(AppState.addEventListener).toHaveBeenCalled();
    });

    it('should handle network status changes', () => {
      const mockListener = jest.fn();
      offlineService.onNetworkStatusChange(mockListener);

      // Simulate network status change
      const networkListener = (NetInfo.addEventListener as jest.Mock).mock.calls.find(
        call => call[0] === 'connectionChange'
      )?.[1];

      if (networkListener) {
        networkListener({ isConnected: false, type: 'none' });
        expect(mockListener).toHaveBeenCalledWith(false);
      }
    });

    it('should handle app state changes', () => {
      const mockListener = jest.fn();
      offlineService.onAppStateChange(mockListener);

      // Simulate app state change
      const appStateListener = (AppState.addEventListener as jest.Mock).mock.calls.find(
        call => call[0] === 'change'
      )?.[1];

      if (appStateListener) {
        appStateListener('active');
        expect(mockListener).toHaveBeenCalledWith('active');
      }
    });

    it('should check current network status', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true, type: 'wifi' });

      const status = await offlineService.getNetworkStatus();

      expect(status).toEqual({ isConnected: true, type: 'wifi' });
      expect(NetInfo.fetch).toHaveBeenCalled();
    });
  });

  describe('Cache management', () => {
    it('should set cache item with metadata', async () => {
      const key = 'test-key';
      const data = { id: 1, name: 'Test' };
      const metadata = { timestamp: Date.now(), ttl: 3600000 };

      await offlineService.setCacheItem(key, data, metadata);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `cache_${key}`,
        JSON.stringify({ data, metadata })
      );
    });

    it('should get cache item', async () => {
      const key = 'test-key';
      const cachedData = {
        data: { id: 1, name: 'Test' },
        metadata: { timestamp: Date.now(), ttl: 3600000 },
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const result = await offlineService.getCacheItem(key);

      expect(result).toEqual(cachedData.data);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(`cache_${key}`);
    });

    it('should return null for non-existent cache item', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await offlineService.getCacheItem('non-existent');

      expect(result).toBeNull();
    });

    it('should remove cache item', async () => {
      const key = 'test-key';

      await offlineService.removeCacheItem(key);

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(`cache_${key}`);
    });

    it('should clear all cache', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(['cache_key1', 'cache_key2', 'other_key']);
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue();

      await offlineService.clearCache();

      expect(AsyncStorage.getAllKeys).toHaveBeenCalled();
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['cache_key1', 'cache_key2']);
    });

    it('should get cache info', async () => {
      const mockKeys = ['cache_key1', 'cache_key2', 'cache_key3'];
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys);

      const info = await offlineService.getCacheInfo();

      expect(info.totalItems).toBe(3);
      expect(info.keys).toEqual(mockKeys);
    });

    it('should enforce cache size limits', async () => {
      const config: CacheConfig = {
        maxSize: 1024 * 1024, // 1MB
        maxItems: 100,
        defaultTTL: 3600000, // 1 hour
      };

      offlineService.setCacheConfig(config);

      // Mock cache items exceeding limits
      const mockKeys = Array.from({ length: 150 }, (_, i) => `cache_key${i}`);
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys);

      await offlineService.enforceCacheLimits();

      // Should remove excess items
      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
    });
  });

  describe('Offline action queuing', () => {
    it('should queue offline action', async () => {
      const action: OfflineAction = {
        id: 'action1',
        type: 'CREATE_POST',
        payload: { content: 'Test post' },
        timestamp: Date.now(),
        retryCount: 0,
      };

      await offlineService.queueOfflineAction(action);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'offline_actions',
        expect.stringContaining(action.id)
      );
    });

    it('should get all offline actions', async () => {
      const actions: OfflineAction[] = [
        {
          id: 'action1',
          type: 'CREATE_POST',
          payload: { content: 'Test post' },
          timestamp: Date.now(),
          retryCount: 0,
        },
        {
          id: 'action2',
          type: 'LIKE_POST',
          payload: { postId: '123' },
          timestamp: Date.now(),
          retryCount: 0,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(actions));

      const result = await offlineService.getOfflineActions();

      expect(result).toEqual(actions);
    });

    it('should remove offline action', async () => {
      const actionId = 'action1';

      await offlineService.removeOfflineAction(actionId);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'offline_actions',
        expect.not.stringContaining(actionId)
      );
    });

    it('should clear all offline actions', async () => {
      await offlineService.clearOfflineActions();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('offline_actions');
    });

    it('should get offline actions by type', async () => {
      const actions: OfflineAction[] = [
        {
          id: 'action1',
          type: 'CREATE_POST',
          payload: { content: 'Test post' },
          timestamp: Date.now(),
          retryCount: 0,
        },
        {
          id: 'action2',
          type: 'LIKE_POST',
          payload: { postId: '123' },
          timestamp: Date.now(),
          retryCount: 0,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(actions));

      const createPostActions = await offlineService.getOfflineActionsByType('CREATE_POST');

      expect(createPostActions).toHaveLength(1);
      expect(createPostActions[0].type).toBe('CREATE_POST');
    });
  });

  describe('Synchronization', () => {
    it('should sync offline actions when online', async () => {
      const actions: OfflineAction[] = [
        {
          id: 'action1',
          type: 'CREATE_POST',
          payload: { content: 'Test post' },
          timestamp: Date.now(),
          retryCount: 0,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(actions));
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      (frontierApiClient.post as jest.Mock).mockResolvedValue({ data: { id: 'post123' } });

      const status = await offlineService.sync();

      expect(status.success).toBe(true);
      expect(status.syncedActions).toBe(1);
      expect(frontierApiClient.post).toHaveBeenCalledWith('/api/posts', actions[0].payload);
    });

    it('should handle sync failures gracefully', async () => {
      const actions: OfflineAction[] = [
        {
          id: 'action1',
          type: 'CREATE_POST',
          payload: { content: 'Test post' },
          timestamp: Date.now(),
          retryCount: 0,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(actions));
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      (frontierApiClient.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      const status = await offlineService.sync();

      expect(status.success).toBe(false);
      expect(status.failedActions).toBe(1);
      expect(status.errors).toHaveLength(1);
    });

    it('should retry failed actions with exponential backoff', async () => {
      const action: OfflineAction = {
        id: 'action1',
        type: 'CREATE_POST',
        payload: { content: 'Test post' },
        timestamp: Date.now(),
        retryCount: 2,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([action]));
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      (frontierApiClient.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      const status = await offlineService.sync();

      expect(status.success).toBe(false);
      expect(status.failedActions).toBe(1);
      // Should not retry if max retries exceeded
      expect(action.retryCount).toBe(2);
    });

    it('should not sync when offline', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

      const status = await offlineService.sync();

      expect(status.success).toBe(false);
      expect(status.error).toBe('No network connection');
    });

    it('should get sync status', () => {
      const status = offlineService.getSyncStatus();

      expect(status).toEqual({
        lastSync: null,
        isSyncing: false,
        pendingActions: 0,
        failedActions: 0,
      });
    });
  });

  describe('Event listeners', () => {
    it('should add and remove sync listeners', () => {
      const mockListener = jest.fn();

      offlineService.onSyncComplete(mockListener);
      offlineService.offSyncComplete(mockListener);

      // Verify listener was added and removed
      expect(offlineService['syncListeners']).toHaveLength(0);
    });

    it('should notify sync listeners on completion', async () => {
      const mockListener = jest.fn();
      offlineService.onSyncComplete(mockListener);

      // Trigger a sync
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

      await offlineService.sync();

      expect(mockListener).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        syncedActions: 0,
      }));
    });
  });

  describe('Utility methods', () => {
    it('should check if action should be retried', () => {
      const action: OfflineAction = {
        id: 'action1',
        type: 'CREATE_POST',
        payload: { content: 'Test post' },
        timestamp: Date.now(),
        retryCount: 1,
      };

      const shouldRetry = offlineService.shouldRetryAction(action);
      expect(shouldRetry).toBe(true);

      action.retryCount = 5;
      const shouldNotRetry = offlineService.shouldRetryAction(action);
      expect(shouldNotRetry).toBe(false);
    });

    it('should calculate retry delay with exponential backoff', () => {
      const delay1 = offlineService.calculateRetryDelay(1);
      const delay2 = offlineService.calculateRetryDelay(2);
      const delay3 = offlineService.calculateRetryDelay(3);

      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
      expect(delay1).toBeGreaterThan(0);
    });

    it('should validate offline action', () => {
      const validAction: OfflineAction = {
        id: 'action1',
        type: 'CREATE_POST',
        payload: { content: 'Test post' },
        timestamp: Date.now(),
        retryCount: 0,
      };

      const isValid = offlineService.validateOfflineAction(validAction);
      expect(isValid).toBe(true);

      const invalidAction = { ...validAction, type: '' };
      const isInvalid = offlineService.validateOfflineAction(invalidAction);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle storage errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(offlineService.setCacheItem('key', 'data')).rejects.toThrow('Storage error');
    });

    it('should handle network errors during sync', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));
      (NetInfo.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const status = await offlineService.sync();

      expect(status.success).toBe(false);
      expect(status.error).toBe('Network error');
    });

    it('should handle invalid JSON in storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid-json');

      const result = await offlineService.getCacheItem('key');
      expect(result).toBeNull();

      const actions = await offlineService.getOfflineActions();
      expect(actions).toEqual([]);
    });
  });
});






