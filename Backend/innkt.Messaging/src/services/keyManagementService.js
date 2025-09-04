const { EncryptionService } = require('./encryptionService');
const logger = require('../utils/logger');

class KeyManagementService {
  constructor(redisClient) {
    this.redis = redisClient;
    this.encryptionService = new EncryptionService();
    this.keyPrefix = 'encryption:keys';
    this.conversationKeyPrefix = 'conversation:keys';
    this.userKeyPrefix = 'user:keys';
  }

  // Generate and store user encryption keys
  async generateUserKeys(userId) {
    try {
      const keyPair = this.encryptionService.generateKeyPair();
      const symmetricKey = this.encryptionService.generateKey();
      
      const userKeys = {
        userId,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        symmetricKey: symmetricKey.toString('hex'),
        createdAt: new Date().toISOString(),
        version: '1.0'
      };

      // Store in Redis with expiration
      await this.redis.hSet(`${this.userKeyPrefix}:${userId}`, userKeys);
      await this.redis.expire(`${this.userKeyPrefix}:${userId}`, 86400 * 30); // 30 days

      logger.info(`Generated encryption keys for user ${userId}`);
      return userKeys;
    } catch (error) {
      logger.error('Error generating user keys:', error);
      throw error;
    }
  }

  // Get user encryption keys
  async getUserKeys(userId) {
    try {
      const keys = await this.redis.hGetAll(`${this.userKeyPrefix}:${userId}`);
      if (Object.keys(keys).length === 0) {
        return null;
      }
      return keys;
    } catch (error) {
      logger.error('Error getting user keys:', error);
      return null;
    }
  }

  // Generate conversation encryption key
  async generateConversationKey(conversationId, participants) {
    try {
      const conversationKey = this.encryptionService.generateConversationKey(conversationId, participants);
      const keyId = this.encryptionService.generateSecureRandom(16);
      
      const keyData = {
        conversationId,
        keyId,
        key: conversationKey.toString('hex'),
        participants,
        createdAt: new Date().toISOString(),
        version: '1.0'
      };

      // Store conversation key
      await this.redis.hSet(`${this.conversationKeyPrefix}:${conversationId}`, keyData);
      await this.redis.expire(`${this.conversationKeyPrefix}:${conversationId}`, 86400 * 365); // 1 year

      logger.info(`Generated conversation key for ${conversationId}`);
      return keyData;
    } catch (error) {
      logger.error('Error generating conversation key:', error);
      throw error;
    }
  }

  // Get conversation encryption key
  async getConversationKey(conversationId) {
    try {
      const keyData = await this.redis.hGetAll(`${this.conversationKeyPrefix}:${conversationId}`);
      if (Object.keys(keyData).length === 0) {
        return null;
      }
      return keyData;
    } catch (error) {
      logger.error('Error getting conversation key:', error);
      return null;
    }
  }

  // Rotate conversation key
  async rotateConversationKey(conversationId, participants) {
    try {
      const oldKeyData = await this.getConversationKey(conversationId);
      const newKeyData = await this.generateConversationKey(conversationId, participants);
      
      // Store key rotation history
      const rotationData = {
        conversationId,
        oldKeyId: oldKeyData?.keyId,
        newKeyId: newKeyData.keyId,
        rotatedAt: new Date().toISOString(),
        rotatedBy: participants[0] // First participant initiated rotation
      };

      await this.redis.lPush(`${this.conversationKeyPrefix}:${conversationId}:rotations`, JSON.stringify(rotationData));
      await this.redis.expire(`${this.conversationKeyPrefix}:${conversationId}:rotations`, 86400 * 365);

      logger.info(`Rotated conversation key for ${conversationId}`);
      return newKeyData;
    } catch (error) {
      logger.error('Error rotating conversation key:', error);
      throw error;
    }
  }

  // Share key with new participant
  async shareKeyWithParticipant(conversationId, newParticipantId, existingParticipantId) {
    try {
      const conversationKey = await this.getConversationKey(conversationId);
      const newParticipantKeys = await this.getUserKeys(newParticipantId);
      const existingParticipantKeys = await this.getUserKeys(existingParticipantId);

      if (!conversationKey || !newParticipantKeys || !existingParticipantKeys) {
        throw new Error('Required keys not found');
      }

      // Encrypt the conversation key with the new participant's public key
      const encryptedKey = this.encryptionService.encryptWithPublicKey(
        conversationKey.key,
        newParticipantKeys.publicKey
      );

      const keyShare = {
        conversationId,
        encryptedKey,
        sharedBy: existingParticipantId,
        sharedWith: newParticipantId,
        sharedAt: new Date().toISOString()
      };

      // Store key share
      await this.redis.lPush(`${this.conversationKeyPrefix}:${conversationId}:shares`, JSON.stringify(keyShare));
      await this.redis.expire(`${this.conversationKeyPrefix}:${conversationId}:shares`, 86400 * 7); // 7 days

      logger.info(`Shared conversation key with participant ${newParticipantId}`);
      return keyShare;
    } catch (error) {
      logger.error('Error sharing key with participant:', error);
      throw error;
    }
  }

  // Get key shares for a conversation
  async getKeyShares(conversationId) {
    try {
      const shares = await this.redis.lRange(`${this.conversationKeyPrefix}:${conversationId}:shares`, 0, -1);
      return shares.map(share => JSON.parse(share));
    } catch (error) {
      logger.error('Error getting key shares:', error);
      return [];
    }
  }

  // Validate key integrity
  async validateKeyIntegrity(conversationId, keyId) {
    try {
      const keyData = await this.getConversationKey(conversationId);
      if (!keyData || keyData.keyId !== keyId) {
        return false;
      }

      // Additional validation logic can be added here
      return true;
    } catch (error) {
      logger.error('Error validating key integrity:', error);
      return false;
    }
  }

  // Clean up expired keys
  async cleanupExpiredKeys() {
    try {
      const userKeyPattern = `${this.userKeyPrefix}:*`;
      const conversationKeyPattern = `${this.conversationKeyPrefix}:*`;
      
      const userKeys = await this.redis.keys(userKeyPattern);
      const conversationKeys = await this.redis.keys(conversationKeyPattern);

      let cleanedCount = 0;

      // Check user keys
      for (const key of userKeys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) { // No expiration set
          await this.redis.expire(key, 86400 * 30); // Set 30 days expiration
          cleanedCount++;
        }
      }

      // Check conversation keys
      for (const key of conversationKeys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) { // No expiration set
          await this.redis.expire(key, 86400 * 365); // Set 1 year expiration
          cleanedCount++;
        }
      }

      logger.info(`Cleaned up ${cleanedCount} expired keys`);
    } catch (error) {
      logger.error('Error cleaning up expired keys:', error);
    }
  }

  // Get key statistics
  async getKeyStatistics() {
    try {
      const userKeyCount = await this.redis.keys(`${this.userKeyPrefix}:*`).then(keys => keys.length);
      const conversationKeyCount = await this.redis.keys(`${this.conversationKeyPrefix}:*`).then(keys => keys.length);

      return {
        userKeys: userKeyCount,
        conversationKeys: conversationKeyCount,
        totalKeys: userKeyCount + conversationKeyCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting key statistics:', error);
      return {
        userKeys: 0,
        conversationKeys: 0,
        totalKeys: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Export keys for backup (encrypted)
  async exportKeys(userId, password) {
    try {
      const userKeys = await this.getUserKeys(userId);
      if (!userKeys) {
        throw new Error('No keys found for user');
      }

      const salt = this.encryptionService.generateSalt();
      const derivedKey = this.encryptionService.deriveKey(password, salt);
      
      const exportData = {
        userId,
        keys: userKeys,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      const encryptedExport = this.encryptionService.encryptMessage(JSON.stringify(exportData), derivedKey);

      return {
        encryptedData: encryptedExport,
        salt: salt.toString('hex'),
        algorithm: 'aes-256-gcm'
      };
    } catch (error) {
      logger.error('Error exporting keys:', error);
      throw error;
    }
  }

  // Import keys from backup
  async importKeys(userId, encryptedData, salt, password) {
    try {
      const derivedKey = this.encryptionService.deriveKey(password, Buffer.from(salt, 'hex'));
      const decryptedData = this.encryptionService.decryptMessage(encryptedData, derivedKey);
      
      const importData = JSON.parse(decryptedData);
      
      if (importData.userId !== userId) {
        throw new Error('User ID mismatch in import data');
      }

      // Store imported keys
      await this.redis.hSet(`${this.userKeyPrefix}:${userId}`, importData.keys);
      await this.redis.expire(`${this.userKeyPrefix}:${userId}`, 86400 * 30);

      logger.info(`Imported keys for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error importing keys:', error);
      throw error;
    }
  }
}

module.exports = { KeyManagementService };
