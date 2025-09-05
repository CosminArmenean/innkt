import AsyncStorage from '@react-native-async-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import { officerApiClient, frontierApiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../../config/environment';

export interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'normal' | 'low';
  category: 'auth' | 'posts' | 'notifications' | 'profile' | 'media';
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingActions: number;
  failedActions: number;
  syncProgress: number;
}

export interface CacheConfig {
  maxSize: number; // MB
  maxAge: number; // milliseconds
  priority: 'high' | 'normal' | 'low';
  category: string;
}

export interface IOfflineService {
  // Connection Management
  isOnline(): boolean;
  onConnectionChange(callback: (isOnline: boolean) => void): void;
  
  // Cache Management
  setCache(key: string, data: any, config?: Partial<CacheConfig>): Promise<void>;
  getCache(key: string): Promise<any | null>;
  removeCache(key: string): Promise<void>;
  clearCache(category?: string): Promise<void>;
  getCacheInfo(): Promise<{ size: number; keys: string[]; categories: string[] }>;
  
  // Offline Actions
  queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void>;
  getPendingActions(category?: string): Promise<OfflineAction[]>;
  removeAction(actionId: string): Promise<void>;
  clearActions(category?: string): Promise<void>;
  
  // Sync Operations
  sync(): Promise<void>;
  getSyncStatus(): SyncStatus;
  onSyncStatusChange(callback: (status: SyncStatus) => void): void;
  
  // Utilities
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

export class OfflineService implements IOfflineService {
  private isOnlineState = true;
  private isSyncing = false;
  private lastSyncTime: Date | null = null;
  private pendingActions: OfflineAction[] = [];
  private failedActions: OfflineAction[] = [];
  private syncProgress = 0;
  private connectionListeners: Function[] = [];
  private syncStatusListeners: Function[] = [];
  private appState: AppStateStatus = 'active';
  
  // Cache configuration
  private readonly defaultCacheConfig: CacheConfig = {
    maxSize: 100, // 100 MB
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    priority: 'normal',
    category: 'general',
  };
  
  // MARK: - Initialization
  
  async initialize(): Promise<void> {
    try {
      // Set up network monitoring
      this.setupNetworkMonitoring();
      
      // Set up app state monitoring
      this.setupAppStateMonitoring();
      
      // Load pending actions from storage
      await this.loadPendingActions();
      
      // Check initial connection status
      const netInfo = await NetInfo.fetch();
      this.isOnlineState = netInfo.isConnected ?? false;
      
      // Start sync if online
      if (this.isOnlineState) {
        this.sync();
      }
      
      console.log('Offline service initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize offline service:', error);
      throw error;
    }
  }
  
  // MARK: - Connection Management
  
  isOnline(): boolean {
    return this.isOnlineState;
  }
  
  onConnectionChange(callback: (isOnline: boolean) => void): void {
    this.connectionListeners.push(callback);
  }
  
  private setupNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnlineState;
      this.isOnlineState = state.isConnected ?? false;
      
      // Notify listeners
      this.connectionListeners.forEach(callback => {
        try {
          callback(this.isOnlineState);
        } catch (error) {
          console.error('Error in connection change callback:', error);
        }
      });
      
      // Handle connection state changes
      if (!wasOnline && this.isOnlineState) {
        // Came back online, start sync
        console.log('Connection restored, starting sync');
        this.sync();
      } else if (wasOnline && !this.isOnlineState) {
        // Went offline, stop sync
        console.log('Connection lost, stopping sync');
        this.isSyncing = false;
      }
    });
  }
  
  private setupAppStateMonitoring(): void {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      this.appState = nextAppState;
      
      if (nextAppState === 'active' && this.isOnlineState) {
        // App became active and we're online, try to sync
        this.sync();
      }
    });
  }
  
  // MARK: - Cache Management
  
  async setCache(key: string, data: any, config: Partial<CacheConfig> = {}): Promise<void> {
    try {
      const cacheConfig = { ...this.defaultCacheConfig, ...config };
      const cacheItem = {
        data,
        config: cacheConfig,
        timestamp: Date.now(),
        size: this.estimateSize(data),
      };
      
      // Check cache size limit
      await this.enforceCacheSizeLimit();
      
      // Store in AsyncStorage
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
      
      // Update cache metadata
      await this.updateCacheMetadata(key, cacheItem);
      
    } catch (error) {
      console.error('Failed to set cache:', error);
      throw error;
    }
  }
  
  async getCache(key: string): Promise<any | null> {
    try {
      const stored = await AsyncStorage.getItem(`cache_${key}`);
      if (!stored) return null;
      
      const cacheItem = JSON.parse(stored);
      
      // Check if cache is expired
      if (Date.now() - cacheItem.timestamp > cacheItem.config.maxAge) {
        await this.removeCache(key);
        return null;
      }
      
      return cacheItem.data;
      
    } catch (error) {
      console.error('Failed to get cache:', error);
      return null;
    }
  }
  
  async removeCache(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`cache_${key}`);
      await this.removeCacheMetadata(key);
    } catch (error) {
      console.error('Failed to remove cache:', error);
    }
  }
  
  async clearCache(category?: string): Promise<void> {
    try {
      const cacheInfo = await this.getCacheInfo();
      const keysToRemove = category 
        ? cacheInfo.keys.filter(key => key.startsWith(`cache_${category}_`))
        : cacheInfo.keys.filter(key => key.startsWith('cache_'));
      
      await Promise.all(keysToRemove.map(key => AsyncStorage.removeItem(key)));
      
      // Clear metadata
      if (category) {
        await AsyncStorage.removeItem(`cache_metadata_${category}`);
      } else {
        await AsyncStorage.removeItem('cache_metadata');
      }
      
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
  
  async getCacheInfo(): Promise<{ size: number; keys: string[]; categories: string[] }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith('cache_'));
      const metadataKeys = allKeys.filter(key => key.startsWith('cache_metadata'));
      
      let totalSize = 0;
      const categories = new Set<string>();
      
      for (const key of cacheKeys) {
        try {
          const stored = await AsyncStorage.getItem(key);
          if (stored) {
            const cacheItem = JSON.parse(stored);
            totalSize += cacheItem.size || 0;
            categories.add(cacheItem.config?.category || 'general');
          }
        } catch (error) {
          console.warn('Failed to read cache item:', key, error);
        }
      }
      
      return {
        size: totalSize,
        keys: cacheKeys,
        categories: Array.from(categories),
      };
      
    } catch (error) {
      console.error('Failed to get cache info:', error);
      return { size: 0, keys: [], categories: [] };
    }
  }
  
  // MARK: - Offline Actions
  
  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const offlineAction: OfflineAction = {
        ...action,
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      };
      
      this.pendingActions.push(offlineAction);
      
      // Save to storage
      await this.savePendingActions();
      
      // Try to sync if online
      if (this.isOnlineState && !this.isSyncing) {
        this.sync();
      }
      
    } catch (error) {
      console.error('Failed to queue action:', error);
      throw error;
    }
  }
  
  async getPendingActions(category?: string): Promise<OfflineAction[]> {
    if (category) {
      return this.pendingActions.filter(action => action.category === category);
    }
    return [...this.pendingActions];
  }
  
  async removeAction(actionId: string): Promise<void> {
    this.pendingActions = this.pendingActions.filter(action => action.id !== actionId);
    await this.savePendingActions();
  }
  
  async clearActions(category?: string): Promise<void> {
    if (category) {
      this.pendingActions = this.pendingActions.filter(action => action.category !== category);
    } else {
      this.pendingActions = [];
    }
    await this.savePendingActions();
  }
  
  // MARK: - Sync Operations
  
  async sync(): Promise<void> {
    if (this.isSyncing || !this.isOnlineState || this.pendingActions.length === 0) {
      return;
    }
    
    this.isSyncing = true;
    this.syncProgress = 0;
    this.emitSyncStatusChange();
    
    try {
      // Sort actions by priority and timestamp
      const sortedActions = this.sortActionsByPriority(this.pendingActions);
      
      for (let i = 0; i < sortedActions.length; i++) {
        const action = sortedActions[i];
        
        try {
          await this.executeAction(action);
          
          // Remove successful action
          await this.removeAction(action.id);
          
          // Update progress
          this.syncProgress = ((i + 1) / sortedActions.length) * 100;
          this.emitSyncStatusChange();
          
        } catch (error) {
          console.error(`Failed to execute action ${action.id}:`, error);
          
          // Increment retry count
          action.retryCount++;
          
          if (action.retryCount >= action.maxRetries) {
            // Move to failed actions
            this.failedActions.push(action);
            await this.removeAction(action.id);
          }
        }
      }
      
      this.lastSyncTime = new Date();
      console.log('Sync completed successfully');
      
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
      this.syncProgress = 0;
      this.emitSyncStatusChange();
    }
  }
  
  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnlineState,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      pendingActions: this.pendingActions.length,
      failedActions: this.failedActions.length,
      syncProgress: this.syncProgress,
    };
  }
  
  onSyncStatusChange(callback: (status: SyncStatus) => void): void {
    this.syncStatusListeners.push(callback);
  }
  
  // MARK: - Utilities
  
  async cleanup(): Promise<void> {
    try {
      // Clear expired cache
      await this.clearExpiredCache();
      
      // Clear old failed actions
      await this.clearOldFailedActions();
      
      console.log('Offline service cleanup completed');
      
    } catch (error) {
      console.error('Failed to cleanup offline service:', error);
    }
  }
  
  // MARK: - Private Methods
  
  private async executeAction(action: OfflineAction): Promise<void> {
    const client = action.endpoint.includes('/api/') ? frontierApiClient : officerApiClient;
    
    switch (action.method) {
      case 'GET':
        await client.get(action.endpoint, action.headers);
        break;
      case 'POST':
        await client.post(action.endpoint, action.data, action.headers);
        break;
      case 'PUT':
        await client.put(action.endpoint, action.data, action.headers);
        break;
      case 'DELETE':
        await client.delete(action.endpoint, action.headers);
        break;
      case 'PATCH':
        await client.patch(action.endpoint, action.data, action.headers);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${action.method}`);
    }
  }
  
  private sortActionsByPriority(actions: OfflineAction[]): OfflineAction[] {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    
    return actions.sort((a, b) => {
      // First by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by timestamp (oldest first)
      return a.timestamp - b.timestamp;
    });
  }
  
  private async loadPendingActions(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('pending_actions');
      if (stored) {
        this.pendingActions = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load pending actions:', error);
    }
  }
  
  private async savePendingActions(): Promise<void> {
    try {
      await AsyncStorage.setItem('pending_actions', JSON.stringify(this.pendingActions));
    } catch (error) {
      console.error('Failed to save pending actions:', error);
    }
  }
  
  private async enforceCacheSizeLimit(): Promise<void> {
    const cacheInfo = await this.getCacheInfo();
    const maxSizeBytes = this.defaultCacheConfig.maxSize * 1024 * 1024; // Convert MB to bytes
    
    if (cacheInfo.size > maxSizeBytes) {
      // Remove oldest cache items until under limit
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith('cache_'));
      
      const cacheItems = await Promise.all(
        cacheKeys.map(async key => {
          try {
            const stored = await AsyncStorage.getItem(key);
            if (stored) {
              const cacheItem = JSON.parse(stored);
              return { key, ...cacheItem };
            }
          } catch (error) {
            console.warn('Failed to read cache item:', key, error);
          }
          return null;
        })
      );
      
      // Sort by timestamp (oldest first)
      const validItems = cacheItems.filter(item => item !== null).sort((a, b) => a.timestamp - b.timestamp);
      
      let currentSize = cacheInfo.size;
      for (const item of validItems) {
        if (currentSize <= maxSizeBytes) break;
        
        await AsyncStorage.removeItem(item.key);
        currentSize -= item.size || 0;
      }
    }
  }
  
  private async updateCacheMetadata(key: string, cacheItem: any): Promise<void> {
    try {
      const metadataKey = `cache_metadata_${cacheItem.config.category}`;
      const stored = await AsyncStorage.getItem(metadataKey);
      const metadata = stored ? JSON.parse(stored) : { keys: [], totalSize: 0 };
      
      metadata.keys.push(key);
      metadata.totalSize += cacheItem.size || 0;
      
      await AsyncStorage.setItem(metadataKey, JSON.stringify(metadata));
      
    } catch (error) {
      console.error('Failed to update cache metadata:', error);
    }
  }
  
  private async removeCacheMetadata(key: string): Promise<void> {
    try {
      // Find which category this key belongs to
      const stored = await AsyncStorage.getItem(`cache_${key}`);
      if (stored) {
        const cacheItem = JSON.parse(stored);
        const category = cacheItem.config?.category || 'general';
        const metadataKey = `cache_metadata_${category}`;
        
        const storedMetadata = await AsyncStorage.getItem(metadataKey);
        if (storedMetadata) {
          const metadata = JSON.parse(storedMetadata);
          metadata.keys = metadata.keys.filter((k: string) => k !== key);
          metadata.totalSize = Math.max(0, metadata.totalSize - (cacheItem.size || 0));
          
          await AsyncStorage.setItem(metadataKey, JSON.stringify(metadata));
        }
      }
    } catch (error) {
      console.error('Failed to remove cache metadata:', error);
    }
  }
  
  private estimateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch (error) {
      return JSON.stringify(data).length;
    }
  }
  
  private async clearExpiredCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith('cache_'));
      
      for (const key of cacheKeys) {
        try {
          const stored = await AsyncStorage.getItem(key);
          if (stored) {
            const cacheItem = JSON.parse(stored);
            if (Date.now() - cacheItem.timestamp > cacheItem.config.maxAge) {
              await AsyncStorage.removeItem(key);
            }
          }
        } catch (error) {
          console.warn('Failed to read cache item during cleanup:', key, error);
        }
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }
  
  private async clearOldFailedActions(): Promise<void> {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.failedActions = this.failedActions.filter(action => action.timestamp > oneWeekAgo);
  }
  
  private emitSyncStatusChange(): void {
    const status = this.getSyncStatus();
    this.syncStatusListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in sync status change callback:', error);
      }
    });
  }
}

export const offlineService = new OfflineService();
export default offlineService;






