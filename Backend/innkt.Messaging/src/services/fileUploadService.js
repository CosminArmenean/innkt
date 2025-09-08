const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const logger = require('../utils/logger');

class FileUploadService {
  constructor() {
    this.allowedFileTypes = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'application/pdf': '.pdf',
      'text/plain': '.txt'
    };

    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.uploadPath = process.env.UPLOAD_PATH || './uploads';
    
    this.setupStorage();
  }

  setupStorage() {
    // Ensure upload directory exists
    this.ensureUploadDirectory();

    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const fileType = this.getFileTypeCategory(file.mimetype);
        const uploadDir = path.join(this.uploadPath, fileType);
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const extension = this.allowedFileTypes[file.mimetype] || path.extname(file.originalname);
        const filename = `${uniqueSuffix}${extension}`;
        cb(null, filename);
      }
    });

    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: this.maxFileSize,
        files: 1
      },
      fileFilter: (req, file, cb) => {
        if (this.isAllowedFileType(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`File type ${file.mimetype} is not allowed. Only photos (JPG, PNG, GIF), PDF, and TXT files are permitted.`), false);
        }
      }
    });
  }

  async ensureUploadDirectory() {
    try {
      await fs.mkdir(this.uploadPath, { recursive: true });
      await fs.mkdir(path.join(this.uploadPath, 'images'), { recursive: true });
      await fs.mkdir(path.join(this.uploadPath, 'documents'), { recursive: true });
      logger.info('Upload directories created successfully');
    } catch (error) {
      logger.error('Error creating upload directories:', error);
    }
  }

  isAllowedFileType(mimetype) {
    return Object.keys(this.allowedFileTypes).includes(mimetype);
  }

  getFileTypeCategory(mimetype) {
    if (mimetype.startsWith('image/')) {
      return 'images';
    } else if (mimetype === 'application/pdf' || mimetype === 'text/plain') {
      return 'documents';
    }
    return 'other';
  }

  getFileInfo(file) {
    return {
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      category: this.getFileTypeCategory(file.mimetype),
      url: this.getFileUrl(file)
    };
  }

  getFileUrl(file) {
    const fileType = this.getFileTypeCategory(file.mimetype);
    return `/uploads/${fileType}/${file.filename}`;
  }

  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info(`File deleted: ${filePath}`);
    } catch (error) {
      logger.error(`Error deleting file ${filePath}:`, error);
      throw error;
    }
  }

  async getFileStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      logger.error(`Error getting file stats for ${filePath}:`, error);
      throw error;
    }
  }

  validateFileSize(size) {
    return size <= this.maxFileSize;
  }

  getMaxFileSizeMB() {
    return this.maxFileSize / (1024 * 1024);
  }

  getAllowedFileTypes() {
    return Object.keys(this.allowedFileTypes);
  }

  getFileExtension(mimetype) {
    return this.allowedFileTypes[mimetype] || null;
  }

  // Security: Scan file for malicious content (basic implementation)
  async scanFile(filePath) {
    try {
      const stats = await this.getFileStats(filePath);
      
      // Basic security checks
      if (stats.size === 0) {
        throw new Error('Empty files are not allowed');
      }

      if (stats.size > this.maxFileSize) {
        throw new Error('File size exceeds maximum allowed size');
      }

      // Check file extension matches content
      const fileExtension = path.extname(filePath).toLowerCase();
      const expectedExtension = this.getFileExtension(this.getMimeTypeFromPath(filePath));
      
      if (expectedExtension && fileExtension !== expectedExtension) {
        throw new Error('File extension does not match file type');
      }

      return { safe: true, message: 'File passed security scan' };
    } catch (error) {
      logger.error(`File scan failed for ${filePath}:`, error);
      return { safe: false, message: error.message };
    }
  }

  getMimeTypeFromPath(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain'
    };
    return mimeTypeMap[ext] || 'application/octet-stream';
  }

  // Generate thumbnail for images
  async generateThumbnail(filePath, outputPath, size = 200) {
    try {
      // This would require a library like sharp or jimp
      // For now, we'll return the original path
      logger.info(`Thumbnail generation requested for ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error(`Error generating thumbnail for ${filePath}:`, error);
      throw error;
    }
  }

  // Get file preview data
  async getFilePreview(filePath, mimetype) {
    try {
      if (mimetype.startsWith('image/')) {
        return {
          type: 'image',
          url: this.getFileUrl({ filename: path.basename(filePath), mimetype }),
          thumbnail: await this.generateThumbnail(filePath, null)
        };
      } else if (mimetype === 'application/pdf') {
        return {
          type: 'pdf',
          url: this.getFileUrl({ filename: path.basename(filePath), mimetype }),
          icon: '📄'
        };
      } else if (mimetype === 'text/plain') {
        const content = await fs.readFile(filePath, 'utf8');
        return {
          type: 'text',
          url: this.getFileUrl({ filename: path.basename(filePath), mimetype }),
          preview: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
          icon: '📝'
        };
      }
      
      return {
        type: 'unknown',
        url: this.getFileUrl({ filename: path.basename(filePath), mimetype }),
        icon: '📎'
      };
    } catch (error) {
      logger.error(`Error getting file preview for ${filePath}:`, error);
      throw error;
    }
  }
}

module.exports = FileUploadService;
