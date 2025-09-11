import { BaseApiService } from './api.service';
import { apiConfig } from './api.config';

export interface QueryPerformanceStats {
  analysisTime: string;
  totalQueries: number;
  averageExecutionTime: number;
  slowQueries: number;
  fastQueries: number;
  queryTypes: Record<string, number>;
}

export interface SlowQuery {
  query: string;
  executionTime: number;
  callCount: number;
  totalTime: number;
  lastExecuted: string;
}

export interface DatabaseStats {
  analysisTime: string;
  totalTables: number;
  totalIndexes: number;
  totalSize: number;
  indexSize: number;
  tableStats: TableStats[];
  indexStats: IndexStats[];
}

export interface TableStats {
  schemaName: string;
  tableName: string;
  size: string;
  sizeBytes: number;
  inserts: number;
  updates: number;
  deletes: number;
  liveTuples: number;
  deadTuples: number;
}

export interface IndexStats {
  schemaName: string;
  indexName: string;
  tableName: string;
  size: string;
  sizeBytes: number;
  scans: number;
  tuplesRead: number;
  tuplesFetched: number;
}

export interface ConnectionPoolStats {
  analysisTime: string;
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  maxConnections: number;
  connectionWaitTime: number;
}

export interface CacheStats {
  connectedClients: string;
  usedMemory: string;
  totalKeys: string;
  hitRate: string;
  uptime: string;
}

export interface DatabaseHealthReport {
  reportTime: string;
  databaseStats: DatabaseStats;
  queryPerformance: QueryPerformanceStats;
  connectionPool: ConnectionPoolStats;
  cacheStats: CacheStats;
  slowQueries: SlowQuery[];
  healthScore: number;
}

class DatabaseOptimizationService extends BaseApiService {
  constructor() {
    super(apiConfig.socialApi.baseUrl);
  }

  // Get query performance statistics
  async getQueryPerformance(): Promise<QueryPerformanceStats> {
    try {
      const response = await this.get<{ data: QueryPerformanceStats }>('/database-optimization/performance');
      return response.data;
    } catch (error) {
      console.error('Failed to get query performance stats:', error);
      throw error;
    }
  }

  // Get slow queries
  async getSlowQueries(limit: number = 10): Promise<SlowQuery[]> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());

      const response = await this.get<{ data: SlowQuery[] }>(`/database-optimization/slow-queries?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get slow queries:', error);
      throw error;
    }
  }

  // Get database statistics
  async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      const response = await this.get<{ data: DatabaseStats }>('/database-optimization/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get database stats:', error);
      throw error;
    }
  }

  // Get connection pool statistics
  async getConnectionPoolStats(): Promise<ConnectionPoolStats> {
    try {
      const response = await this.get<{ data: ConnectionPoolStats }>('/database-optimization/connection-pool');
      return response.data;
    } catch (error) {
      console.error('Failed to get connection pool stats:', error);
      throw error;
    }
  }

  // Optimize database
  async optimizeDatabase(): Promise<void> {
    try {
      await this.post('/database-optimization/optimize', {});
    } catch (error) {
      console.error('Failed to optimize database:', error);
      throw error;
    }
  }

  // Create database indexes
  async createIndexes(): Promise<void> {
    try {
      await this.post('/database-optimization/indexes', {});
    } catch (error) {
      console.error('Failed to create indexes:', error);
      throw error;
    }
  }

  // Update database statistics
  async updateStatistics(): Promise<void> {
    try {
      await this.post('/database-optimization/statistics', {});
    } catch (error) {
      console.error('Failed to update statistics:', error);
      throw error;
    }
  }

  // Vacuum database
  async vacuumDatabase(): Promise<void> {
    try {
      await this.post('/database-optimization/vacuum', {});
    } catch (error) {
      console.error('Failed to vacuum database:', error);
      throw error;
    }
  }

  // Get cache statistics
  async getCacheStats(): Promise<CacheStats> {
    try {
      const response = await this.get<{ data: CacheStats }>('/database-optimization/cache/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      throw error;
    }
  }

  // Get cache keys by pattern
  async getCacheKeys(pattern: string = '*'): Promise<string[]> {
    try {
      const params = new URLSearchParams();
      params.append('pattern', pattern);

      const response = await this.get<{ data: string[] }>(`/database-optimization/cache/keys?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get cache keys:', error);
      throw error;
    }
  }

  // Remove cache key
  async removeCacheKey(key: string): Promise<boolean> {
    try {
      const response = await this.delete<{ success: boolean }>(`/database-optimization/cache/${key}`);
      return response.success;
    } catch (error) {
      console.error('Failed to remove cache key:', error);
      throw error;
    }
  }

  // Flush entire cache database
  async flushCache(): Promise<void> {
    try {
      await this.post('/database-optimization/cache/flush', {});
    } catch (error) {
      console.error('Failed to flush cache:', error);
      throw error;
    }
  }

  // Get cache key expiry
  async getCacheExpiry(key: string): Promise<number | null> {
    try {
      const response = await this.get<{ data: number | null }>(`/database-optimization/cache/${key}/expiry`);
      return response.data;
    } catch (error) {
      console.error('Failed to get cache expiry:', error);
      throw error;
    }
  }

  // Set cache key expiry
  async setCacheExpiry(key: string, expiry: number): Promise<boolean> {
    try {
      const response = await this.post<{ success: boolean }>(`/database-optimization/cache/${key}/expiry`, {
        expiry: expiry
      });
      return response.success;
    } catch (error) {
      console.error('Failed to set cache expiry:', error);
      throw error;
    }
  }

  // Get comprehensive database health report
  async getDatabaseHealth(): Promise<DatabaseHealthReport> {
    try {
      const response = await this.get<{ data: DatabaseHealthReport }>('/database-optimization/health');
      return response.data;
    } catch (error) {
      console.error('Failed to get database health report:', error);
      throw error;
    }
  }

  // Utility methods for formatting and analysis
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds.toFixed(2)}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(2)}s`;
    } else {
      return `${(milliseconds / 60000).toFixed(2)}m`;
    }
  }

  getHealthScoreColor(score: number): string {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  }

  getHealthScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  }

  getConnectionUsagePercentage(active: number, max: number): number {
    if (max === 0) return 0;
    return Math.round((active / max) * 100);
  }

  getConnectionUsageColor(percentage: number): string {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-orange-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  }

  getCacheHitRateColor(hitRate: string): string {
    const rate = parseFloat(hitRate.replace('%', ''));
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  }

  getQueryPerformanceColor(executionTime: number): string {
    if (executionTime < 100) return 'text-green-600';
    if (executionTime < 500) return 'text-yellow-600';
    if (executionTime < 1000) return 'text-orange-600';
    return 'text-red-600';
  }

  getTableSizeColor(sizeBytes: number): string {
    if (sizeBytes < 1024 * 1024) return 'text-green-600'; // < 1MB
    if (sizeBytes < 100 * 1024 * 1024) return 'text-yellow-600'; // < 100MB
    if (sizeBytes < 1024 * 1024 * 1024) return 'text-orange-600'; // < 1GB
    return 'text-red-600'; // >= 1GB
  }

  getIndexEfficiencyColor(scans: number, tuplesRead: number): string {
    if (scans === 0) return 'text-gray-600';
    
    const efficiency = tuplesRead / scans;
    if (efficiency < 10) return 'text-green-600';
    if (efficiency < 100) return 'text-yellow-600';
    if (efficiency < 1000) return 'text-orange-600';
    return 'text-red-600';
  }

  // Analysis methods
  analyzeSlowQueries(queries: SlowQuery[]): {
    totalSlowQueries: number;
    averageExecutionTime: number;
    mostFrequentQuery: SlowQuery | null;
    totalTimeWasted: number;
  } {
    if (queries.length === 0) {
      return {
        totalSlowQueries: 0,
        averageExecutionTime: 0,
        mostFrequentQuery: null,
        totalTimeWasted: 0
      };
    }

    const totalSlowQueries = queries.length;
    const averageExecutionTime = queries.reduce((sum, q) => sum + q.executionTime, 0) / totalSlowQueries;
    const mostFrequentQuery = queries.reduce((max, q) => q.callCount > max.callCount ? q : max, queries[0]);
    const totalTimeWasted = queries.reduce((sum, q) => sum + q.totalTime, 0);

    return {
      totalSlowQueries,
      averageExecutionTime,
      mostFrequentQuery,
      totalTimeWasted
    };
  }

  analyzeTableStats(tables: TableStats[]): {
    totalTables: number;
    totalSize: number;
    largestTable: TableStats | null;
    mostActiveTable: TableStats | null;
    deadTuplePercentage: number;
  } {
    if (tables.length === 0) {
      return {
        totalTables: 0,
        totalSize: 0,
        largestTable: null,
        mostActiveTable: null,
        deadTuplePercentage: 0
      };
    }

    const totalTables = tables.length;
    const totalSize = tables.reduce((sum, t) => sum + t.sizeBytes, 0);
    const largestTable = tables.reduce((max, t) => t.sizeBytes > max.sizeBytes ? t : max, tables[0]);
    const mostActiveTable = tables.reduce((max, t) => (t.inserts + t.updates + t.deletes) > (max.inserts + max.updates + max.deletes) ? t : max, tables[0]);
    
    const totalLiveTuples = tables.reduce((sum, t) => sum + t.liveTuples, 0);
    const totalDeadTuples = tables.reduce((sum, t) => sum + t.deadTuples, 0);
    const deadTuplePercentage = totalLiveTuples + totalDeadTuples > 0 ? (totalDeadTuples / (totalLiveTuples + totalDeadTuples)) * 100 : 0;

    return {
      totalTables,
      totalSize,
      largestTable,
      mostActiveTable,
      deadTuplePercentage
    };
  }

  analyzeIndexStats(indexes: IndexStats[]): {
    totalIndexes: number;
    totalSize: number;
    largestIndex: IndexStats | null;
    mostUsedIndex: IndexStats | null;
    unusedIndexes: IndexStats[];
    averageEfficiency: number;
  } {
    if (indexes.length === 0) {
      return {
        totalIndexes: 0,
        totalSize: 0,
        largestIndex: null,
        mostUsedIndex: null,
        unusedIndexes: [],
        averageEfficiency: 0
      };
    }

    const totalIndexes = indexes.length;
    const totalSize = indexes.reduce((sum, i) => sum + i.sizeBytes, 0);
    const largestIndex = indexes.reduce((max, i) => i.sizeBytes > max.sizeBytes ? i : max, indexes[0]);
    const mostUsedIndex = indexes.reduce((max, i) => i.scans > max.scans ? i : max, indexes[0]);
    const unusedIndexes = indexes.filter(i => i.scans === 0);
    
    const indexesWithScans = indexes.filter(i => i.scans > 0);
    const averageEfficiency = indexesWithScans.length > 0 
      ? indexesWithScans.reduce((sum, i) => sum + (i.tuplesRead / i.scans), 0) / indexesWithScans.length 
      : 0;

    return {
      totalIndexes,
      totalSize,
      largestIndex,
      mostUsedIndex,
      unusedIndexes,
      averageEfficiency
    };
  }
}

export const databaseOptimizationService = new DatabaseOptimizationService();
