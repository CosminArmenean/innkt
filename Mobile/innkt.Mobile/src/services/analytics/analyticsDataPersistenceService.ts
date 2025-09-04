import AsyncStorage from '@react-native-async-storage/async-storage';

// Analytics Data Persistence Service Interfaces
export interface AnalyticsDataPersistenceConfig {
  storageKey: string;
  maxStorageSize: number; // in bytes
  backupInterval: number; // in milliseconds
  retentionDays: number;
  enableCompression: boolean;
  enableEncryption: boolean;
  encryptionKey?: string;
}

export interface AnalyticsDataRecord {
  id: string;
  type: 'event' | 'metric' | 'session' | 'user_behavior';
  data: any;
  timestamp: string;
  userId?: string;
  sessionId: string;
  metadata?: {
    source: string;
    version: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface AnalyticsStorageInfo {
  totalRecords: number;
  totalSize: number;
  oldestRecord: string | null;
  newestRecord: string | null;
  storageUsage: number; // percentage
  lastBackupTime: string | null;
  backupCount: number;
}

export interface AnalyticsBackupInfo {
  backupId: string;
  timestamp: string;
  recordCount: number;
  size: number;
  checksum: string;
  status: 'success' | 'failed' | 'in_progress';
  error?: string;
}

export interface AnalyticsRecoveryInfo {
  recoveryId: string;
  timestamp: string;
  sourceBackup: string;
  recordsRecovered: number;
  status: 'success' | 'failed' | 'in_progress';
  error?: string;
}

// Analytics Data Persistence Service
export class AnalyticsDataPersistenceService {
  private static instance: AnalyticsDataPersistenceService;
  private config: AnalyticsDataPersistenceConfig;
  private backupTimer: NodeJS.Timeout | null = null;
  private isBackupInProgress: boolean = false;
  private backupHistory: AnalyticsBackupInfo[] = [];
  private recoveryHistory: AnalyticsRecoveryInfo[] = [];

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): AnalyticsDataPersistenceService {
    if (!AnalyticsDataPersistenceService.instance) {
      AnalyticsDataPersistenceService.instance = new AnalyticsDataPersistenceService();
    }
    return AnalyticsDataPersistenceService.instance;
  }

  // Initialize the persistence service
  public async initialize(config?: Partial<AnalyticsDataPersistenceConfig>): Promise<void> {
    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Load backup history
      await this.loadBackupHistory();

      // Start backup timer
      this.startBackupTimer();

      // Perform initial backup if needed
      await this.performBackup();

      console.log('Analytics Data Persistence Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Analytics Data Persistence Service:', error);
      throw error;
    }
  }

  // Store analytics data
  public async storeData(record: AnalyticsDataRecord): Promise<boolean> {
    try {
      // Check storage limits
      await this.enforceStorageLimits();

      // Store the record
      const key = `${this.config.storageKey}_${record.id}`;
      const value = JSON.stringify(record);
      
      await AsyncStorage.setItem(key, value);

      // Update storage info
      await this.updateStorageInfo();

      console.log('Analytics data stored successfully:', record.id);
      return true;
    } catch (error) {
      console.error('Failed to store analytics data:', error);
      return false;
    }
  }

  // Store multiple analytics data records
  public async storeBatchData(records: AnalyticsDataRecord[]): Promise<number> {
    try {
      let successCount = 0;

      for (const record of records) {
        const success = await this.storeData(record);
        if (success) {
          successCount++;
        }
      }

      console.log(`Batch storage completed: ${successCount}/${records.length} records stored`);
      return successCount;
    } catch (error) {
      console.error('Failed to store batch analytics data:', error);
      return 0;
    }
  }

  // Retrieve analytics data
  public async retrieveData(id: string): Promise<AnalyticsDataRecord | null> {
    try {
      const key = `${this.config.storageKey}_${id}`;
      const value = await AsyncStorage.getItem(key);
      
      if (value) {
        return JSON.parse(value) as AnalyticsDataRecord;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to retrieve analytics data:', error);
      return null;
    }
  }

  // Retrieve data by type
  public async retrieveDataByType(type: string, limit?: number): Promise<AnalyticsDataRecord[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const typeKeys = keys.filter(key => 
        key.startsWith(this.config.storageKey) && 
        key.includes(`_${type}_`)
      );

      const records: AnalyticsDataRecord[] = [];
      
      for (const key of typeKeys) {
        if (limit && records.length >= limit) break;
        
        const value = await AsyncStorage.getItem(key);
        if (value) {
          records.push(JSON.parse(value));
        }
      }

      // Sort by timestamp (newest first)
      records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return records;
    } catch (error) {
      console.error('Failed to retrieve data by type:', error);
      return [];
    }
  }

  // Retrieve data by date range
  public async retrieveDataByDateRange(
    startDate: Date,
    endDate: Date,
    type?: string
  ): Promise<AnalyticsDataRecord[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const filteredKeys = keys.filter(key => 
        key.startsWith(this.config.storageKey) &&
        (!type || key.includes(`_${type}_`))
      );

      const records: AnalyticsDataRecord[] = [];
      
      for (const key of filteredKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          const record = JSON.parse(value) as AnalyticsDataRecord;
          const recordDate = new Date(record.timestamp);
          
          if (recordDate >= startDate && recordDate <= endDate) {
            records.push(record);
          }
        }
      }

      // Sort by timestamp (newest first)
      records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return records;
    } catch (error) {
      console.error('Failed to retrieve data by date range:', error);
      return [];
    }
  }

  // Delete analytics data
  public async deleteData(id: string): Promise<boolean> {
    try {
      const key = `${this.config.storageKey}_${id}`;
      await AsyncStorage.removeItem(key);
      
      // Update storage info
      await this.updateStorageInfo();
      
      console.log('Analytics data deleted successfully:', id);
      return true;
    } catch (error) {
      console.error('Failed to delete analytics data:', error);
      return false;
    }
  }

  // Delete data by type
  public async deleteDataByType(type: string): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const typeKeys = keys.filter(key => 
        key.startsWith(this.config.storageKey) && 
        key.includes(`_${type}_`)
      );

      let deletedCount = 0;
      
      for (const key of typeKeys) {
        await AsyncStorage.removeItem(key);
        deletedCount++;
      }

      // Update storage info
      await this.updateStorageInfo();
      
      console.log(`Deleted ${deletedCount} records of type: ${type}`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to delete data by type:', error);
      return 0;
    }
  }

  // Clear all analytics data
  public async clearAllData(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const analyticsKeys = keys.filter(key => key.startsWith(this.config.storageKey));
      
      await AsyncStorage.multiRemove(analyticsKeys);
      
      // Reset storage info
      await this.resetStorageInfo();
      
      console.log('All analytics data cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear all analytics data:', error);
      return false;
    }
  }

  // Perform backup
  public async performBackup(): Promise<AnalyticsBackupInfo> {
    if (this.isBackupInProgress) {
      throw new Error('Backup already in progress');
    }

    try {
      this.isBackupInProgress = true;
      
      const backupId = this.generateBackupId();
      const timestamp = new Date().toISOString();
      
      // Get all analytics data
      const keys = await AsyncStorage.getAllKeys();
      const analyticsKeys = keys.filter(key => key.startsWith(this.config.storageKey));
      
      const backupData: Record<string, any> = {};
      let totalSize = 0;
      let recordCount = 0;
      
      for (const key of analyticsKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          backupData[key] = value;
          totalSize += value.length;
          recordCount++;
        }
      }

      // Create backup record
      const backupRecord: AnalyticsBackupInfo = {
        backupId,
        timestamp,
        recordCount,
        size: totalSize,
        checksum: this.generateChecksum(JSON.stringify(backupData)),
        status: 'success',
      };

      // Store backup
      const backupKey = `${this.config.storageKey}_backup_${backupId}`;
      await AsyncStorage.setItem(backupKey, JSON.stringify(backupRecord));
      
      // Update backup history
      this.backupHistory.push(backupRecord);
      await this.saveBackupHistory();

      // Update last backup time
      await this.updateLastBackupTime(timestamp);

      console.log(`Backup completed successfully: ${recordCount} records, ${totalSize} bytes`);
      return backupRecord;
    } catch (error) {
      console.error('Backup failed:', error);
      
      const backupRecord: AnalyticsBackupInfo = {
        backupId: this.generateBackupId(),
        timestamp: new Date().toISOString(),
        recordCount: 0,
        size: 0,
        checksum: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      return backupRecord;
    } finally {
      this.isBackupInProgress = false;
    }
  }

  // Restore from backup
  public async restoreFromBackup(backupId: string): Promise<AnalyticsRecoveryInfo> {
    try {
      const recoveryId = this.generateRecoveryId();
      const timestamp = new Date().toISOString();
      
      // Find backup
      const backupKey = `${this.config.storageKey}_backup_${backupId}`;
      const backupValue = await AsyncStorage.getItem(backupKey);
      
      if (!backupValue) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      const backup: AnalyticsBackupInfo = JSON.parse(backupValue);
      
      if (backup.status !== 'success') {
        throw new Error(`Backup status is not success: ${backup.status}`);
      }

      // Clear current data
      await this.clearAllData();

      // Restore data from backup
      const keys = await AsyncStorage.getAllKeys();
      const backupDataKeys = keys.filter(key => 
        key.startsWith(this.config.storageKey) && 
        key.includes('_backup_') &&
        key !== backupKey
      );

      let recordsRecovered = 0;
      
      for (const key of backupDataKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          const data = JSON.parse(value);
          const originalKey = key.replace('_backup_', '');
          await AsyncStorage.setItem(originalKey, JSON.stringify(data));
          recordsRecovered++;
        }
      }

      // Create recovery record
      const recoveryRecord: AnalyticsRecoveryInfo = {
        recoveryId,
        timestamp,
        sourceBackup: backupId,
        recordsRecovered,
        status: 'success',
      };

      // Store recovery record
      const recoveryKey = `${this.config.storageKey}_recovery_${recoveryId}`;
      await AsyncStorage.setItem(recoveryKey, JSON.stringify(recoveryRecord));
      
      // Update recovery history
      this.recoveryHistory.push(recoveryRecord);
      await this.saveRecoveryHistory();

      // Update storage info
      await this.updateStorageInfo();

      console.log(`Recovery completed successfully: ${recordsRecovered} records restored`);
      return recoveryRecord;
    } catch (error) {
      console.error('Recovery failed:', error);
      
      const recoveryRecord: AnalyticsRecoveryInfo = {
        recoveryId: this.generateRecoveryId(),
        timestamp: new Date().toISOString(),
        sourceBackup: backupId,
        recordsRecovered: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      return recoveryRecord;
    }
  }

  // Get storage information
  public async getStorageInfo(): Promise<AnalyticsStorageInfo> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const analyticsKeys = keys.filter(key => key.startsWith(this.config.storageKey));
      
      let totalRecords = 0;
      let totalSize = 0;
      let oldestRecord: string | null = null;
      let newestRecord: string | null = null;
      
      for (const key of analyticsKeys) {
        if (key.includes('_backup_') || key.includes('_recovery_')) continue;
        
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalRecords++;
          totalSize += value.length;
          
          const record = JSON.parse(value) as AnalyticsDataRecord;
          const recordTime = record.timestamp;
          
          if (!oldestRecord || recordTime < oldestRecord) {
            oldestRecord = recordTime;
          }
          
          if (!newestRecord || recordTime > newestRecord) {
            newestRecord = recordTime;
          }
        }
      }

      const storageUsage = (totalSize / this.config.maxStorageSize) * 100;
      const lastBackupTime = await this.getLastBackupTime();

      return {
        totalRecords,
        totalSize,
        oldestRecord,
        newestRecord,
        storageUsage: Math.min(storageUsage, 100),
        lastBackupTime,
        backupCount: this.backupHistory.length,
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {
        totalRecords: 0,
        totalSize: 0,
        oldestRecord: null,
        newestRecord: null,
        storageUsage: 0,
        lastBackupTime: null,
        backupCount: 0,
      };
    }
  }

  // Get backup history
  public getBackupHistory(): AnalyticsBackupInfo[] {
    return [...this.backupHistory];
  }

  // Get recovery history
  public getRecoveryHistory(): AnalyticsRecoveryInfo[] {
    return [...this.recoveryHistory];
  }

  // Update configuration
  public updateConfig(config: Partial<AnalyticsDataPersistenceConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart backup timer if interval changed
    if (config.backupInterval) {
      this.startBackupTimer();
    }
  }

  // Get current configuration
  public getConfig(): AnalyticsDataPersistenceConfig {
    return { ...this.config };
  }

  // Cleanup resources
  public cleanup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
    
    this.isBackupInProgress = false;
    this.backupHistory = [];
    this.recoveryHistory = [];
    
    console.log('Analytics Data Persistence Service cleaned up');
  }

  // Private methods
  private startBackupTimer(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    this.backupTimer = setInterval(async () => {
      try {
        await this.performBackup();
      } catch (error) {
        console.error('Scheduled backup failed:', error);
      }
    }, this.config.backupInterval);
  }

  private async enforceStorageLimits(): Promise<void> {
    try {
      const storageInfo = await this.getStorageInfo();
      
      if (storageInfo.totalSize > this.config.maxStorageSize) {
        // Remove oldest records until under limit
        const keys = await AsyncStorage.getAllKeys();
        const analyticsKeys = keys.filter(key => 
          key.startsWith(this.config.storageKey) &&
          !key.includes('_backup_') &&
          !key.includes('_recovery_')
        );

        const records: Array<{key: string, timestamp: string}> = [];
        
        for (const key of analyticsKeys) {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            const record = JSON.parse(value) as AnalyticsDataRecord;
            records.push({key, timestamp: record.timestamp});
          }
        }

        // Sort by timestamp (oldest first)
        records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Remove oldest records
        for (const record of records) {
          await AsyncStorage.removeItem(record.key);
          
          const newStorageInfo = await this.getStorageInfo();
          if (newStorageInfo.totalSize <= this.config.maxStorageSize) {
            break;
          }
        }

        console.log('Storage limits enforced, old records removed');
      }
    } catch (error) {
      console.error('Failed to enforce storage limits:', error);
    }
  }

  private async updateStorageInfo(): Promise<void> {
    // This method can be used to update storage statistics
    // Implementation depends on specific requirements
  }

  private async resetStorageInfo(): Promise<void> {
    // Reset storage statistics
    // Implementation depends on specific requirements
  }

  private async loadBackupHistory(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const backupKeys = keys.filter(key => 
        key.startsWith(this.config.storageKey) && 
        key.includes('_backup_')
      );

      this.backupHistory = [];
      
      for (const key of backupKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          this.backupHistory.push(JSON.parse(value));
        }
      }

      // Sort by timestamp (newest first)
      this.backupHistory.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Failed to load backup history:', error);
    }
  }

  private async saveBackupHistory(): Promise<void> {
    try {
      const key = `${this.config.storageKey}_backup_history`;
      await AsyncStorage.setItem(key, JSON.stringify(this.backupHistory));
    } catch (error) {
      console.error('Failed to save backup history:', error);
    }
  }

  private async saveRecoveryHistory(): Promise<void> {
    try {
      const key = `${this.config.storageKey}_recovery_history`;
      await AsyncStorage.setItem(key, JSON.stringify(this.recoveryHistory));
    } catch (error) {
      console.error('Failed to save recovery history:', error);
    }
  }

  private async updateLastBackupTime(timestamp: string): Promise<void> {
    try {
      const key = `${this.config.storageKey}_last_backup`;
      await AsyncStorage.setItem(key, timestamp);
    } catch (error) {
      console.error('Failed to update last backup time:', error);
    }
  }

  private async getLastBackupTime(): Promise<string | null> {
    try {
      const key = `${this.config.storageKey}_last_backup`;
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Failed to get last backup time:', error);
      return null;
    }
  }

  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRecoveryId(): string {
    return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChecksum(data: string): string {
    // Simple checksum implementation
    // In production, use a proper hashing algorithm
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private getDefaultConfig(): AnalyticsDataPersistenceConfig {
    return {
      storageKey: 'analytics_data',
      maxStorageSize: 50 * 1024 * 1024, // 50MB
      backupInterval: 24 * 60 * 60 * 1000, // 24 hours
      retentionDays: 30,
      enableCompression: true,
      enableEncryption: false,
    };
  }
}





