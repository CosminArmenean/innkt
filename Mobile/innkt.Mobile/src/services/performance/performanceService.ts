import { InteractionManager, Platform, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  cpuUsage: number;
  frameRate: number;
  networkLatency: number;
  cacheHitRate: number;
}

export interface PerformanceConfig {
  enableProfiling: boolean;
  enableMemoryMonitoring: boolean;
  enableNetworkMonitoring: boolean;
  enableCacheOptimization: boolean;
  maxCacheSize: number;
  renderThrottleMs: number;
  batchUpdateDelay: number;
}

export interface CacheStrategy {
  key: string;
  data: any;
  timestamp: number;
  ttl: number;
  priority: 'high' | 'medium' | 'low';
  size: number;
}

export interface BatchUpdate<T> {
  id: string;
  data: T;
  timestamp: number;
  priority: number;
}

export class PerformanceService {
  private static instance: PerformanceService;
  private metrics: PerformanceMetrics[] = [];
  private config: PerformanceConfig;
  private cache: Map<string, CacheStrategy> = new Map();
  private batchUpdates: Map<string, BatchUpdate<any>[]> = new Map();
  private renderQueue: (() => void)[] = [];
  private isProcessingQueue = false;
  private performanceObserver?: PerformanceObserver;

  private constructor() {
    this.config = {
      enableProfiling: __DEV__,
      enableMemoryMonitoring: true,
      enableNetworkMonitoring: true,
      enableCacheOptimization: true,
      maxCacheSize: 50 * 1024 * 1024, // 50MB
      renderThrottleMs: 16, // 60fps
      batchUpdateDelay: 100,
    };

    this.initializePerformanceMonitoring();
  }

  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  private initializePerformanceMonitoring(): void {
    if (this.config.enableProfiling) {
      this.setupPerformanceObserver();
    }

    if (this.config.enableMemoryMonitoring) {
      this.startMemoryMonitoring();
    }

    if (this.config.enableNetworkMonitoring) {
      this.startNetworkMonitoring();
    }
  }

  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'measure') {
              this.recordMetric('renderTime', entry.duration);
            }
          });
        });

        this.performanceObserver.observe({ entryTypes: ['measure'] });
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error);
      }
    }
  }

  private startMemoryMonitoring(): void {
    if (Platform.OS === 'ios') {
      // iOS memory monitoring
      setInterval(() => {
        this.checkMemoryUsage();
      }, 5000);
    } else if (Platform.OS === 'android') {
      // Android memory monitoring
      setInterval(() => {
        this.checkMemoryUsage();
      }, 5000);
    }
  }

  private startNetworkMonitoring(): void {
    // Monitor network performance
    setInterval(() => {
      this.checkNetworkPerformance();
    }, 10000);
  }

  private async checkMemoryUsage(): Promise<void> {
    try {
      // This would integrate with native memory monitoring
      const memoryInfo = await this.getMemoryInfo();
      this.recordMetric('memoryUsage', memoryInfo.usedMemory);
    } catch (error) {
      console.warn('Failed to check memory usage:', error);
    }
  }

  private async checkNetworkPerformance(): Promise<void> {
    try {
      const startTime = Date.now();
      // Ping a lightweight endpoint
      const response = await fetch('https://httpbin.org/ping');
      const endTime = Date.now();
      
      if (response.ok) {
        this.recordMetric('networkLatency', endTime - startTime);
      }
    } catch (error) {
      console.warn('Failed to check network performance:', error);
    }
  }

  private async getMemoryInfo(): Promise<{ usedMemory: number; totalMemory: number }> {
    // Mock implementation - would integrate with native modules
    return {
      usedMemory: Math.random() * 100,
      totalMemory: 100,
    };
  }

  private recordMetric(type: keyof PerformanceMetrics, value: number): void {
    const metric: PerformanceMetrics = {
      renderTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      frameRate: 0,
      networkLatency: 0,
      cacheHitRate: 0,
      [type]: value,
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Render optimization methods
  public throttleRender(callback: () => void, delay?: number): void {
    const throttleDelay = delay || this.config.renderThrottleMs;
    
    this.renderQueue.push(callback);
    
    if (!this.isProcessingQueue) {
      this.processRenderQueue(throttleDelay);
    }
  }

  private async processRenderQueue(delay: number): Promise<void> {
    this.isProcessingQueue = true;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const callbacks = [...this.renderQueue];
    this.renderQueue = [];
    
    // Use InteractionManager for better performance
    InteractionManager.runAfterInteractions(() => {
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in render callback:', error);
        }
      });
    });
    
    this.isProcessingQueue = false;
    
    // Process remaining items if any
    if (this.renderQueue.length > 0) {
      this.processRenderQueue(delay);
    }
  }

  public debounceRender(callback: () => void, delay: number): () => void {
    let timeoutId: NodeJS.Timeout;
    
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        InteractionManager.runAfterInteractions(callback);
      }, delay);
    };
  }

  // Cache optimization methods
  public async setCacheItem(key: string, data: any, options?: Partial<CacheStrategy>): Promise<void> {
    const strategy: CacheStrategy = {
      key,
      data,
      timestamp: Date.now(),
      ttl: options?.ttl || 3600000, // 1 hour default
      priority: options?.priority || 'medium',
      size: JSON.stringify(data).length,
      ...options,
    };

    // Check cache size limits
    await this.enforceCacheLimits();

    this.cache.set(key, strategy);
    await this.persistCache();
  }

  public async getCacheItem<T>(key: string): Promise<T | null> {
    const strategy = this.cache.get(key);
    
    if (!strategy) {
      return null;
    }

    // Check if expired
    if (Date.now() - strategy.timestamp > strategy.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update cache hit rate
    this.updateCacheHitRate(true);
    return strategy.data as T;
  }

  public async removeCacheItem(key: string): Promise<void> {
    this.cache.delete(key);
    await this.persistCache();
  }

  public async clearCache(): Promise<void> {
    this.cache.clear();
    await AsyncStorage.removeItem('performance_cache');
  }

  private async enforceCacheLimits(): Promise<void> {
    let totalSize = 0;
    const entries = Array.from(this.cache.entries());
    
    // Sort by priority and timestamp
    entries.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a[1].priority];
      const bPriority = priorityOrder[b[1].priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b[1].timestamp - a[1].timestamp;
    });

    // Remove items until under limit
    for (const [key, strategy] of entries) {
      if (totalSize + strategy.size > this.config.maxCacheSize) {
        this.cache.delete(key);
      } else {
        totalSize += strategy.size;
      }
    }
  }

  private async persistCache(): Promise<void> {
    try {
      const cacheData = Array.from(this.cache.entries());
      await AsyncStorage.setItem('performance_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to persist cache:', error);
    }
  }

  private updateCacheHitRate(hit: boolean): void {
    // Calculate cache hit rate over time
    const totalRequests = this.metrics.length;
    const hitCount = this.metrics.filter(m => m.cacheHitRate > 0).length;
    const hitRate = totalRequests > 0 ? (hitCount / totalRequests) * 100 : 0;
    
    this.recordMetric('cacheHitRate', hitRate);
  }

  // Batch update methods
  public addToBatch<T>(batchId: string, data: T, priority: number = 1): void {
    const batch = this.batchUpdates.get(batchId) || [];
    
    batch.push({
      id: `${batchId}_${Date.now()}`,
      data,
      timestamp: Date.now(),
      priority,
    });

    // Sort by priority and timestamp
    batch.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });

    this.batchUpdates.set(batchId, batch);
    
    // Schedule batch processing
    this.scheduleBatchProcessing(batchId);
  }

  private scheduleBatchProcessing(batchId: string): void {
    setTimeout(() => {
      this.processBatch(batchId);
    }, this.config.batchUpdateDelay);
  }

  private async processBatch(batchId: string): Promise<void> {
    const batch = this.batchUpdates.get(batchId);
    if (!batch || batch.length === 0) return;

    try {
      // Process batch items
      const items = batch.splice(0, Math.min(batch.length, 10)); // Process max 10 items at once
      this.batchUpdates.set(batchId, batch);

      // Emit batch processed event
      this.emitBatchProcessed(batchId, items);

      // Continue processing if more items remain
      if (batch.length > 0) {
        this.scheduleBatchProcessing(batchId);
      }
    } catch (error) {
      console.error('Error processing batch:', error);
    }
  }

  private emitBatchProcessed(batchId: string, items: BatchUpdate<any>[]): void {
    // This would integrate with an event system
    console.log(`Batch ${batchId} processed ${items.length} items`);
  }

  // Performance measurement methods
  public startMeasure(name: string): void {
    if (this.config.enableProfiling && typeof performance !== 'undefined') {
      performance.mark(`${name}_start`);
    }
  }

  public endMeasure(name: string): void {
    if (this.config.enableProfiling && typeof performance !== 'undefined') {
      performance.mark(`${name}_end`);
      performance.measure(name, `${name}_start`, `${name}_end`);
    }
  }

  public measureAsync<T>(name: string, asyncFn: () => Promise<T>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      this.startMeasure(name);
      try {
        const result = await asyncFn();
        this.endMeasure(name);
        resolve(result);
      } catch (error) {
        this.endMeasure(name);
        reject(error);
      }
    });
  }

  // Performance analysis methods
  public getPerformanceReport(): {
    averageRenderTime: number;
    averageMemoryUsage: number;
    averageNetworkLatency: number;
    cacheHitRate: number;
    recommendations: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        averageRenderTime: 0,
        averageMemoryUsage: 0,
        averageNetworkLatency: 0,
        cacheHitRate: 0,
        recommendations: [],
      };
    }

    const avgRenderTime = this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / this.metrics.length;
    const avgMemoryUsage = this.metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / this.metrics.length;
    const avgNetworkLatency = this.metrics.reduce((sum, m) => sum + m.networkLatency, 0) / this.metrics.length;
    const avgCacheHitRate = this.metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / this.metrics.length;

    const recommendations: string[] = [];
    
    if (avgRenderTime > 16) {
      recommendations.push('Consider reducing render complexity or implementing virtualization');
    }
    
    if (avgMemoryUsage > 80) {
      recommendations.push('Memory usage is high, consider implementing memory cleanup');
    }
    
    if (avgNetworkLatency > 1000) {
      recommendations.push('Network latency is high, consider implementing request caching');
    }
    
    if (avgCacheHitRate < 50) {
      recommendations.push('Cache hit rate is low, consider optimizing cache strategy');
    }

    return {
      averageRenderTime: avgRenderTime,
      averageMemoryUsage: avgMemoryUsage,
      averageNetworkLatency: avgNetworkLatency,
      cacheHitRate: avgCacheHitRate,
      recommendations,
    };
  }

  // Configuration methods
  public updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.enableProfiling !== undefined) {
      if (newConfig.enableProfiling) {
        this.setupPerformanceObserver();
      } else if (this.performanceObserver) {
        this.performanceObserver.disconnect();
      }
    }
  }

  public getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  // Cleanup methods
  public cleanup(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    this.metrics = [];
    this.cache.clear();
    this.batchUpdates.clear();
    this.renderQueue = [];
  }
}

export const performanceService = PerformanceService.getInstance();
export default performanceService;





