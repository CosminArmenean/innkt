const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('../utils/logger');

const execAsync = promisify(exec);

class BackupService {
  constructor(redisClient, mongoConnection) {
    this.redis = redisClient;
    this.mongoConnection = mongoConnection;
    this.backupPrefix = 'backup';
    this.backupDir = process.env.BACKUP_DIR || './backups';
  }

  // Create full system backup
  async createFullBackup(backupName = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupId = backupName || `full-backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupId);

      // Create backup directory
      await fs.mkdir(backupPath, { recursive: true });

      logger.info(`Starting full backup: ${backupId}`);

      // Backup MongoDB
      await this.backupMongoDB(backupPath);

      // Backup Redis
      await this.backupRedis(backupPath);

      // Backup configuration files
      await this.backupConfiguration(backupPath);

      // Create backup manifest
      await this.createBackupManifest(backupPath, backupId, 'full');

      // Store backup metadata in Redis
      await this.storeBackupMetadata(backupId, 'full', backupPath);

      logger.info(`Full backup completed: ${backupId}`);
      return {
        backupId,
        backupPath,
        type: 'full',
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
    } catch (error) {
      logger.error('Error creating full backup:', error);
      throw error;
    }
  }

  // Create incremental backup
  async createIncrementalBackup(lastBackupId, backupName = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupId = backupName || `incremental-backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupId);

      // Create backup directory
      await fs.mkdir(backupPath, { recursive: true });

      logger.info(`Starting incremental backup: ${backupId}`);

      // Get last backup timestamp
      const lastBackup = await this.getBackupMetadata(lastBackupId);
      if (!lastBackup) {
        throw new Error(`Last backup not found: ${lastBackupId}`);
      }

      const lastBackupTime = new Date(lastBackup.timestamp);

      // Backup only changes since last backup
      await this.backupMongoDBIncremental(backupPath, lastBackupTime);
      await this.backupRedisIncremental(backupPath, lastBackupTime);

      // Create backup manifest
      await this.createBackupManifest(backupPath, backupId, 'incremental', lastBackupId);

      // Store backup metadata
      await this.storeBackupMetadata(backupId, 'incremental', backupPath, lastBackupId);

      logger.info(`Incremental backup completed: ${backupId}`);
      return {
        backupId,
        backupPath,
        type: 'incremental',
        timestamp: new Date().toISOString(),
        status: 'completed',
        parentBackup: lastBackupId
      };
    } catch (error) {
      logger.error('Error creating incremental backup:', error);
      throw error;
    }
  }

  // Backup MongoDB
  async backupMongoDB(backupPath) {
    try {
      const mongoBackupPath = path.join(backupPath, 'mongodb');
      await fs.mkdir(mongoBackupPath, { recursive: true });

      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/innkt_messaging';
      const dbName = mongoUri.split('/').pop().split('?')[0];

      // Use mongodump to create backup
      const command = `mongodump --uri="${mongoUri}" --out="${mongoBackupPath}"`;
      await execAsync(command);

      logger.info('MongoDB backup completed');
    } catch (error) {
      logger.error('Error backing up MongoDB:', error);
      throw error;
    }
  }

  // Backup Redis
  async backupRedis(backupPath) {
    try {
      const redisBackupPath = path.join(backupPath, 'redis');
      await fs.mkdir(redisBackupPath, { recursive: true });

      // Get all keys and their values
      const keys = await this.redis.keys('*');
      const redisData = {};

      for (const key of keys) {
        const type = await this.redis.type(key);
        let value;

        switch (type) {
          case 'string':
            value = await this.redis.get(key);
            break;
          case 'hash':
            value = await this.redis.hGetAll(key);
            break;
          case 'list':
            value = await this.redis.lRange(key, 0, -1);
            break;
          case 'set':
            value = await this.redis.sMembers(key);
            break;
          case 'zset':
            value = await this.redis.zRangeWithScores(key, 0, -1);
            break;
          default:
            value = null;
        }

        redisData[key] = { type, value };
      }

      // Save Redis data to file
      const redisBackupFile = path.join(redisBackupPath, 'redis-backup.json');
      await fs.writeFile(redisBackupFile, JSON.stringify(redisData, null, 2));

      logger.info('Redis backup completed');
    } catch (error) {
      logger.error('Error backing up Redis:', error);
      throw error;
    }
  }

  // Backup configuration files
  async backupConfiguration(backupPath) {
    try {
      const configPath = path.join(backupPath, 'config');
      await fs.mkdir(configPath, { recursive: true });

      // Copy environment files
      const envFiles = ['.env', 'env.example', 'package.json'];
      for (const file of envFiles) {
        try {
          await fs.copyFile(file, path.join(configPath, file));
        } catch (error) {
          // File might not exist, continue
        }
      }

      logger.info('Configuration backup completed');
    } catch (error) {
      logger.error('Error backing up configuration:', error);
      throw error;
    }
  }

  // Create backup manifest
  async createBackupManifest(backupPath, backupId, type, parentBackup = null) {
    try {
      const manifest = {
        backupId,
        type,
        timestamp: new Date().toISOString(),
        parentBackup,
        version: '1.0',
        components: {
          mongodb: await this.getDirectorySize(path.join(backupPath, 'mongodb')),
          redis: await this.getDirectorySize(path.join(backupPath, 'redis')),
          config: await this.getDirectorySize(path.join(backupPath, 'config'))
        },
        metadata: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        }
      };

      const manifestPath = path.join(backupPath, 'manifest.json');
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      logger.info('Backup manifest created');
    } catch (error) {
      logger.error('Error creating backup manifest:', error);
      throw error;
    }
  }

  // Store backup metadata in Redis
  async storeBackupMetadata(backupId, type, backupPath, parentBackup = null) {
    try {
      const metadata = {
        backupId,
        type,
        backupPath,
        parentBackup,
        timestamp: new Date().toISOString(),
        status: 'completed',
        size: await this.getDirectorySize(backupPath)
      };

      await this.redis.hSet(`${this.backupPrefix}:metadata:${backupId}`, metadata);
      await this.redis.lPush(`${this.backupPrefix}:list`, backupId);
      await this.redis.expire(`${this.backupPrefix}:metadata:${backupId}`, 86400 * 365); // 1 year

      logger.info(`Backup metadata stored: ${backupId}`);
    } catch (error) {
      logger.error('Error storing backup metadata:', error);
      throw error;
    }
  }

  // Get backup metadata
  async getBackupMetadata(backupId) {
    try {
      const metadata = await this.redis.hGetAll(`${this.backupPrefix}:metadata:${backupId}`);
      return Object.keys(metadata).length > 0 ? metadata : null;
    } catch (error) {
      logger.error('Error getting backup metadata:', error);
      return null;
    }
  }

  // List all backups
  async listBackups() {
    try {
      const backupIds = await this.redis.lRange(`${this.backupPrefix}:list`, 0, -1);
      const backups = [];

      for (const backupId of backupIds) {
        const metadata = await this.getBackupMetadata(backupId);
        if (metadata) {
          backups.push(metadata);
        }
      }

      return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      logger.error('Error listing backups:', error);
      return [];
    }
  }

  // Restore from backup
  async restoreFromBackup(backupId, targetPath = null) {
    try {
      const metadata = await this.getBackupMetadata(backupId);
      if (!metadata) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      const backupPath = metadata.backupPath;
      const restorePath = targetPath || path.join(this.backupDir, 'restore');

      logger.info(`Starting restore from backup: ${backupId}`);

      // Create restore directory
      await fs.mkdir(restorePath, { recursive: true });

      // Restore MongoDB
      await this.restoreMongoDB(backupPath, restorePath);

      // Restore Redis
      await this.restoreRedis(backupPath, restorePath);

      // Restore configuration
      await this.restoreConfiguration(backupPath, restorePath);

      logger.info(`Restore completed from backup: ${backupId}`);
      return {
        backupId,
        restorePath,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
    } catch (error) {
      logger.error('Error restoring from backup:', error);
      throw error;
    }
  }

  // Restore MongoDB
  async restoreMongoDB(backupPath, restorePath) {
    try {
      const mongoBackupPath = path.join(backupPath, 'mongodb');
      const mongoRestorePath = path.join(restorePath, 'mongodb');

      // Check if MongoDB backup exists
      try {
        await fs.access(mongoBackupPath);
      } catch (error) {
        logger.warn('MongoDB backup not found, skipping restore');
        return;
      }

      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/innkt_messaging';
      const dbName = mongoUri.split('/').pop().split('?')[0];

      // Use mongorestore to restore backup
      const command = `mongorestore --uri="${mongoUri}" --drop "${mongoBackupPath}/${dbName}"`;
      await execAsync(command);

      logger.info('MongoDB restore completed');
    } catch (error) {
      logger.error('Error restoring MongoDB:', error);
      throw error;
    }
  }

  // Restore Redis
  async restoreRedis(backupPath, restorePath) {
    try {
      const redisBackupFile = path.join(backupPath, 'redis', 'redis-backup.json');

      // Check if Redis backup exists
      try {
        await fs.access(redisBackupFile);
      } catch (error) {
        logger.warn('Redis backup not found, skipping restore');
        return;
      }

      // Read Redis backup data
      const redisData = JSON.parse(await fs.readFile(redisBackupFile, 'utf8'));

      // Clear existing Redis data
      await this.redis.flushAll();

      // Restore Redis data
      for (const [key, data] of Object.entries(redisData)) {
        const { type, value } = data;

        switch (type) {
          case 'string':
            await this.redis.set(key, value);
            break;
          case 'hash':
            if (value && Object.keys(value).length > 0) {
              await this.redis.hSet(key, value);
            }
            break;
          case 'list':
            if (value && value.length > 0) {
              await this.redis.lPush(key, ...value);
            }
            break;
          case 'set':
            if (value && value.length > 0) {
              await this.redis.sAdd(key, ...value);
            }
            break;
          case 'zset':
            if (value && value.length > 0) {
              const zsetData = value.flat();
              await this.redis.zAdd(key, ...zsetData);
            }
            break;
        }
      }

      logger.info('Redis restore completed');
    } catch (error) {
      logger.error('Error restoring Redis:', error);
      throw error;
    }
  }

  // Restore configuration
  async restoreConfiguration(backupPath, restorePath) {
    try {
      const configBackupPath = path.join(backupPath, 'config');
      const configRestorePath = path.join(restorePath, 'config');

      // Check if config backup exists
      try {
        await fs.access(configBackupPath);
      } catch (error) {
        logger.warn('Configuration backup not found, skipping restore');
        return;
      }

      // Copy configuration files
      const files = await fs.readdir(configBackupPath);
      for (const file of files) {
        await fs.copyFile(
          path.join(configBackupPath, file),
          path.join(configRestorePath, file)
        );
      }

      logger.info('Configuration restore completed');
    } catch (error) {
      logger.error('Error restoring configuration:', error);
      throw error;
    }
  }

  // Get directory size
  async getDirectorySize(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      if (stats.isFile()) {
        return stats.size;
      }

      let totalSize = 0;
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        totalSize += await this.getDirectorySize(filePath);
      }

      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  // Delete backup
  async deleteBackup(backupId) {
    try {
      const metadata = await this.getBackupMetadata(backupId);
      if (!metadata) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      // Delete backup files
      await fs.rm(metadata.backupPath, { recursive: true, force: true });

      // Remove from Redis
      await this.redis.del(`${this.backupPrefix}:metadata:${backupId}`);
      await this.redis.lRem(`${this.backupPrefix}:list`, 0, backupId);

      logger.info(`Backup deleted: ${backupId}`);
    } catch (error) {
      logger.error('Error deleting backup:', error);
      throw error;
    }
  }

  // Clean up old backups
  async cleanupOldBackups(keepCount = 10) {
    try {
      const backups = await this.listBackups();
      const backupsToDelete = backups.slice(keepCount);

      for (const backup of backupsToDelete) {
        await this.deleteBackup(backup.backupId);
      }

      logger.info(`Cleaned up ${backupsToDelete.length} old backups`);
    } catch (error) {
      logger.error('Error cleaning up old backups:', error);
    }
  }
}

module.exports = { BackupService };

