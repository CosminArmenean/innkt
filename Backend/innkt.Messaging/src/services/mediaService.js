const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

class MediaService {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.bucketName = process.env.AWS_S3_BUCKET || 'innkt-messaging-files';
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    this.setupMulter();
  }

  setupMulter() {
    const storage = multer.memoryStorage();
    
    this.upload = multer({
      storage,
      limits: {
        fileSize: this.maxFileSize
      },
      fileFilter: (req, file, cb) => {
        if (this.allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`File type ${file.mimetype} not allowed`), false);
        }
      }
    });
  }

  // Upload file to S3
  async uploadFile(file, conversationId, userId) {
    try {
      const fileExtension = path.extname(file.originalname);
      const fileName = this.generateFileName(fileExtension);
      const key = `conversations/${conversationId}/${fileName}`;
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedBy: userId,
          conversationId: conversationId,
          uploadedAt: new Date().toISOString()
        },
        ACL: 'private' // Files are private by default
      };

      const result = await this.s3.upload(uploadParams).promise();
      
      const fileInfo = {
        id: crypto.randomUUID(),
        url: result.Location,
        key: key,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: userId,
        conversationId: conversationId,
        uploadedAt: new Date().toISOString()
      };

      logger.info(`File uploaded successfully: ${file.originalname} to ${key}`);
      return fileInfo;
    } catch (error) {
      logger.error('Error uploading file to S3:', error);
      throw error;
    }
  }

  // Generate signed URL for file access
  async generateSignedUrl(key, expiresIn = 3600) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn
      };

      const signedUrl = await this.s3.getSignedUrlPromise('getObject', params);
      return signedUrl;
    } catch (error) {
      logger.error('Error generating signed URL:', error);
      throw error;
    }
  }

  // Delete file from S3
  async deleteFile(key) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      await this.s3.deleteObject(params).promise();
      logger.info(`File deleted successfully: ${key}`);
    } catch (error) {
      logger.error('Error deleting file from S3:', error);
      throw error;
    }
  }

  // Get file metadata
  async getFileMetadata(key) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      const result = await this.s3.headObject(params).promise();
      return {
        size: result.ContentLength,
        mimeType: result.ContentType,
        lastModified: result.LastModified,
        metadata: result.Metadata
      };
    } catch (error) {
      logger.error('Error getting file metadata:', error);
      throw error;
    }
  }

  // Generate unique filename
  generateFileName(extension) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    return `${timestamp}_${randomString}${extension}`;
  }

  // Validate file
  validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return errors;
    }

    if (file.size > this.maxFileSize) {
      errors.push(`File size exceeds limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} not allowed`);
    }

    return errors;
  }

  // Get file type category
  getFileTypeCategory(mimeType) {
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType.startsWith('audio/')) {
      return 'audio';
    } else {
      return 'document';
    }
  }

  // Generate thumbnail for images
  async generateThumbnail(file) {
    try {
      // This would require additional image processing library like sharp
      // For now, return the original file
      return file;
    } catch (error) {
      logger.error('Error generating thumbnail:', error);
      return file;
    }
  }

  // Get storage usage for conversation
  async getConversationStorageUsage(conversationId) {
    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: `conversations/${conversationId}/`
      };

      const result = await this.s3.listObjectsV2(params).promise();
      let totalSize = 0;
      let fileCount = 0;

      if (result.Contents) {
        for (const object of result.Contents) {
          totalSize += object.Size;
          fileCount++;
        }
      }

      return {
        totalSize,
        fileCount,
        conversationId
      };
    } catch (error) {
      logger.error('Error getting conversation storage usage:', error);
      return { totalSize: 0, fileCount: 0, conversationId };
    }
  }

  // Clean up old files
  async cleanupOldFiles(olderThanDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const params = {
        Bucket: this.bucketName,
        Prefix: 'conversations/'
      };

      const result = await this.s3.listObjectsV2(params).promise();
      const filesToDelete = [];

      if (result.Contents) {
        for (const object of result.Contents) {
          if (object.LastModified < cutoffDate) {
            filesToDelete.push({ Key: object.Key });
          }
        }
      }

      if (filesToDelete.length > 0) {
        const deleteParams = {
          Bucket: this.bucketName,
          Delete: {
            Objects: filesToDelete
          }
        };

        await this.s3.deleteObjects(deleteParams).promise();
        logger.info(`Cleaned up ${filesToDelete.length} old files`);
      }
    } catch (error) {
      logger.error('Error cleaning up old files:', error);
    }
  }

  // Get multer middleware
  getMulterMiddleware() {
    return this.upload;
  }
}

module.exports = { MediaService };

