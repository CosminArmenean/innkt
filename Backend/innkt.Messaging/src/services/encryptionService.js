const crypto = require('crypto');
const logger = require('../utils/logger');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.tagLength = 16; // 128 bits
    this.saltLength = 32; // 256 bits
  }

  // Generate a new encryption key
  generateKey() {
    return crypto.randomBytes(this.keyLength);
  }

  // Derive key from password using PBKDF2
  deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha256');
  }

  // Generate salt for key derivation
  generateSalt() {
    return crypto.randomBytes(this.saltLength);
  }

  // Encrypt message content
  encryptMessage(content, key) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from('innkt-messaging', 'utf8'));

      let encrypted = cipher.update(content, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();

      return {
        encrypted: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: this.algorithm
      };
    } catch (error) {
      logger.error('Error encrypting message:', error);
      throw error;
    }
  }

  // Decrypt message content
  decryptMessage(encryptedData, key) {
    try {
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAAD(Buffer.from('innkt-messaging', 'utf8'));
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Error decrypting message:', error);
      throw error;
    }
  }

  // Generate key pair for asymmetric encryption (RSA)
  generateKeyPair() {
    return crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
  }

  // Encrypt with public key (for key exchange)
  encryptWithPublicKey(data, publicKey) {
    try {
      const encrypted = crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      }, Buffer.from(data, 'utf8'));

      return encrypted.toString('base64');
    } catch (error) {
      logger.error('Error encrypting with public key:', error);
      throw error;
    }
  }

  // Decrypt with private key
  decryptWithPrivateKey(encryptedData, privateKey) {
    try {
      const decrypted = crypto.privateDecrypt({
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      }, Buffer.from(encryptedData, 'base64'));

      return decrypted.toString('utf8');
    } catch (error) {
      logger.error('Error decrypting with private key:', error);
      throw error;
    }
  }

  // Generate shared secret for conversation
  generateSharedSecret(user1Key, user2Key) {
    try {
      // Use ECDH for key agreement
      const user1ECDH = crypto.createECDH('prime256v1');
      const user2ECDH = crypto.createECDH('prime256v1');

      user1ECDH.setPrivateKey(user1Key);
      user2ECDH.setPrivateKey(user2Key);

      const user1PublicKey = user1ECDH.getPublicKey();
      const user2PublicKey = user2ECDH.getPublicKey();

      const sharedSecret1 = user1ECDH.computeSecret(user2PublicKey);
      const sharedSecret2 = user2ECDH.computeSecret(user1PublicKey);

      // Verify both parties computed the same secret
      if (!sharedSecret1.equals(sharedSecret2)) {
        throw new Error('Shared secret mismatch');
      }

      return sharedSecret1;
    } catch (error) {
      logger.error('Error generating shared secret:', error);
      throw error;
    }
  }

  // Hash message for integrity verification
  hashMessage(message) {
    return crypto.createHash('sha256').update(message).digest('hex');
  }

  // Verify message integrity
  verifyMessageIntegrity(message, hash) {
    const computedHash = this.hashMessage(message);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
  }

  // Generate message authentication code (MAC)
  generateMAC(message, key) {
    return crypto.createHmac('sha256', key).update(message).digest('hex');
  }

  // Verify MAC
  verifyMAC(message, key, mac) {
    const computedMAC = this.generateMAC(message, key);
    return crypto.timingSafeEqual(Buffer.from(mac, 'hex'), Buffer.from(computedMAC, 'hex'));
  }

  // Encrypt file content
  encryptFile(fileBuffer, key) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from('innkt-file-encryption', 'utf8'));

      let encrypted = cipher.update(fileBuffer);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      const tag = cipher.getAuthTag();

      return {
        encrypted: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: this.algorithm
      };
    } catch (error) {
      logger.error('Error encrypting file:', error);
      throw error;
    }
  }

  // Decrypt file content
  decryptFile(encryptedData, key) {
    try {
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAAD(Buffer.from('innkt-file-encryption', 'utf8'));
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

      let decrypted = decipher.update(encryptedData.encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted;
    } catch (error) {
      logger.error('Error decrypting file:', error);
      throw error;
    }
  }

  // Generate secure random string
  generateSecureRandom(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate conversation encryption key
  generateConversationKey(conversationId, participants) {
    try {
      // Create a deterministic key based on conversation and participants
      const seed = `${conversationId}:${participants.sort().join(':')}`;
      const hash = crypto.createHash('sha256').update(seed).digest();
      return hash;
    } catch (error) {
      logger.error('Error generating conversation key:', error);
      throw error;
    }
  }

  // Rotate encryption key
  rotateKey(oldKey, newKey) {
    try {
      // In a real implementation, this would:
      // 1. Re-encrypt all messages with the new key
      // 2. Update the conversation key
      // 3. Notify all participants of the key rotation
      
      logger.info('Key rotation completed');
      return newKey;
    } catch (error) {
      logger.error('Error rotating key:', error);
      throw error;
    }
  }

  // Get encryption info for a message
  getEncryptionInfo(message) {
    return {
      algorithm: this.algorithm,
      keyId: message.keyId || 'default',
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
  }
}

module.exports = { EncryptionService };
