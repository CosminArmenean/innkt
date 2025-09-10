import { BaseApiService } from './api.service';
import { apiConfig } from './api.config';

export interface FileUploadLimits {
  maxFileSize: number; // in MB
  allowedTypes: string[];
  allowedExtensions: string[];
}

export interface FileInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  preview?: {
    type: 'image' | 'pdf' | 'text' | 'unknown';
    url?: string;
    thumbnail?: string;
    preview?: string;
    icon?: string;
  };
  uploadedAt: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class FileUploadService extends BaseApiService {
  private readonly allowedFileTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain'
  ];

  private readonly allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt'];
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  constructor() {
    super(apiConfig.messagingApi);
  }

  // Validate file before upload
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!this.allowedFileTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not allowed. Only photos (JPG, PNG, GIF), PDF, and TXT files are permitted.'
      };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`
      };
    }

    // Check file extension
    const extension = this.getFileExtension(file.name);
    if (!this.allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: 'File extension not allowed'
      };
    }

    return { valid: true };
  }

  // Upload file to conversation
  async uploadFile(
    conversationId: string,
    file: File,
    message?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ messageId: string; file: FileInfo }> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const formData = new FormData();
    formData.append('file', file);
    if (message) {
      formData.append('message', message);
    }

    try {
      const response = await this.post<{ messageId: string; file: FileInfo }>(
        `/file-upload/upload/${conversationId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress: UploadProgress = {
                loaded: progressEvent.loaded,
                total: progressEvent.total,
                percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
              };
              onProgress(progress);
            }
          }
        }
      );

      return response;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }

  // Get file info
  async getFileInfo(messageId: string): Promise<{ file: FileInfo }> {
    try {
      const response = await this.get<{ file: FileInfo }>(`/file-upload/info/${messageId}`);
      return response;
    } catch (error) {
      console.error('Failed to get file info:', error);
      throw error;
    }
  }

  // Delete file
  async deleteFile(messageId: string): Promise<{ message: string }> {
    try {
      const response = await this.delete<{ message: string }>(`/file-upload/${messageId}`);
      return response;
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  // Get upload limits
  async getUploadLimits(): Promise<FileUploadLimits> {
    try {
      const response = await this.get<FileUploadLimits>('/file-upload/limits');
      return response;
    } catch (error) {
      console.error('Failed to get upload limits:', error);
      // Return default limits
      return {
        maxFileSize: this.maxFileSize / (1024 * 1024),
        allowedTypes: this.allowedFileTypes,
        allowedExtensions: this.allowedExtensions
      };
    }
  }

  // Get file URL for serving
  getFileUrl(category: string, filename: string): string {
    return `${apiConfig.messagingApi.baseUrl}/file-upload/serve/${category}/${filename}`;
  }

  // Utility methods
  getFileExtension(filename: string): string {
    return filename.toLowerCase().substring(filename.lastIndexOf('.'));
  }

  getFileTypeCategory(mimetype: string): 'images' | 'documents' {
    if (mimetype.startsWith('image/')) {
      return 'images';
    }
    return 'documents';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(mimetype: string): string {
    if (mimetype.startsWith('image/')) {
      return '🖼️';
    } else if (mimetype === 'application/pdf') {
      return '📄';
    } else if (mimetype === 'text/plain') {
      return '📝';
    }
    return '📎';
  }

  isImageFile(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  isPdfFile(mimetype: string): boolean {
    return mimetype === 'application/pdf';
  }

  isTextFile(mimetype: string): boolean {
    return mimetype === 'text/plain';
  }

  // Create file preview
  createFilePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.isImageFile(file.type)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } else {
        reject(new Error('Preview not available for this file type'));
      }
    });
  }

  // Generate thumbnail for images
  generateThumbnail(file: File, maxWidth: number = 200, maxHeight: number = 200): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isImageFile(file.type)) {
        reject(new Error('Thumbnail can only be generated for image files'));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to data URL
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnail);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // Validate multiple files
  validateFiles(files: FileList | File[]): { valid: File[]; invalid: { file: File; error: string }[] } {
    const valid: File[] = [];
    const invalid: { file: File; error: string }[] = [];

    Array.from(files).forEach(file => {
      const validation = this.validateFile(file);
      if (validation.valid) {
        valid.push(file);
      } else {
        invalid.push({ file, error: validation.error || 'Unknown error' });
      }
    });

    return { valid, invalid };
  }
}

export const fileUploadService = new FileUploadService();
