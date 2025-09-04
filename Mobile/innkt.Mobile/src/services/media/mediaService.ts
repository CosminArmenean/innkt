import { Platform, Dimensions } from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { manipulateAsync, SaveFormat, ImageResult } from 'expo-image-manipulator';
import { Video, ResizeMode } from 'expo-av';
import { Camera } from 'expo-camera';
import { MediaLibrary } from 'expo-media-library';
import { FileSystem } from 'expo-file-system';
import { officerApiClient, frontierApiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../../config/environment';

export interface MediaFile {
  id: string;
  uri: string;
  type: 'image' | 'video' | 'audio';
  filename: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  mimeType: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface MediaProcessingOptions {
  quality: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
  format: 'jpeg' | 'png' | 'webp';
  compression: 'low' | 'medium' | 'high';
  filters?: MediaFilter[];
  watermark?: WatermarkOptions;
  crop?: CropOptions;
  resize?: ResizeOptions;
}

export interface MediaFilter {
  type: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'sharpen' | 'grayscale' | 'sepia';
  value: number;
}

export interface WatermarkOptions {
  text?: string;
  imageUri?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  fontSize?: number;
  color?: string;
}

export interface CropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio?: number;
}

export interface ResizeOptions {
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  fit: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
}

export interface MediaUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface IMediaService {
  // Media Capture
  captureImage(options?: ImageCaptureOptions): Promise<MediaFile | null>;
  captureVideo(options?: VideoCaptureOptions): Promise<MediaFile | null>;
  pickFromLibrary(options?: LibraryPickerOptions): Promise<MediaFile[]>;
  
  // Media Processing
  processImage(uri: string, options: MediaProcessingOptions): Promise<MediaFile>;
  processVideo(uri: string, options: VideoProcessingOptions): Promise<MediaFile>;
  applyFilters(uri: string, filters: MediaFilter[]): Promise<MediaFile>;
  addWatermark(uri: string, watermark: WatermarkOptions): Promise<MediaFile>;
  cropMedia(uri: string, crop: CropOptions): Promise<MediaFile>;
  resizeMedia(uri: string, resize: ResizeOptions): Promise<MediaFile>;
  
  // Media Management
  uploadMedia(file: MediaFile, onProgress?: (progress: MediaUploadProgress) => void): Promise<string>;
  deleteMedia(mediaId: string): Promise<void>;
  getMediaInfo(uri: string): Promise<Partial<MediaFile>>;
  saveToGallery(uri: string): Promise<void>;
  
  // Utilities
  getSupportedFormats(): string[];
  estimateFileSize(width: number, height: number, quality: number, format: string): number;
  validateMediaFile(file: MediaFile): boolean;
}

export interface ImageCaptureOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: number;
  allowEditing?: boolean;
  saveToPhotos?: boolean;
}

export interface VideoCaptureOptions {
  quality?: 'low' | 'medium' | 'high';
  maxDuration?: number;
  maxFileSize?: number;
  allowEditing?: boolean;
  saveToPhotos?: boolean;
}

export interface LibraryPickerOptions {
  mediaType?: 'photo' | 'video' | 'mixed';
  multiple?: boolean;
  maxFiles?: number;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface VideoProcessingOptions extends MediaProcessingOptions {
  codec?: 'h264' | 'h265' | 'vp9';
  bitrate?: number;
  frameRate?: number;
  audioQuality?: 'low' | 'medium' | 'high';
}

export class MediaService implements IMediaService {
  private readonly maxImageSize = 10 * 1024 * 1024; // 10MB
  private readonly maxVideoSize = 100 * 1024 * 1024; // 100MB
  private readonly supportedImageFormats = ['jpeg', 'jpg', 'png', 'webp', 'heic'];
  private readonly supportedVideoFormats = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
  
  // MARK: - Media Capture
  
  async captureImage(options: ImageCaptureOptions = {}): Promise<MediaFile | null> {
    try {
      // Request camera permission
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Camera permission not granted');
      }
      
      const result = await launchCamera({
        mediaType: 'photo',
        quality: options.quality || 0.8,
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight,
        aspectRatio: options.aspectRatio,
        saveToPhotos: options.saveToPhotos || false,
        includeBase64: false,
        includeExtra: true,
      });
      
      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return null;
      }
      
      const asset = result.assets[0];
      if (!asset.uri) return null;
      
      // Process and create MediaFile
      const mediaFile = await this.createMediaFileFromAsset(asset, 'image');
      
      // Apply processing options if specified
      if (options.quality || options.maxWidth || options.maxHeight) {
        return await this.processImage(mediaFile.uri, {
          quality: options.quality || 0.8,
          maxWidth: options.maxWidth,
          maxHeight: options.maxHeight,
          format: 'jpeg',
          compression: 'medium',
        });
      }
      
      return mediaFile;
      
    } catch (error) {
      console.error('Failed to capture image:', error);
      throw error;
    }
  }
  
  async captureVideo(options: VideoCaptureOptions = {}): Promise<MediaFile | null> {
    try {
      // Request camera permission
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Camera permission not granted');
      }
      
      const result = await launchCamera({
        mediaType: 'video',
        quality: options.quality || 'medium',
        maxDuration: options.maxDuration || 60,
        maxFileSize: options.maxFileSize || this.maxVideoSize,
        saveToPhotos: options.saveToPhotos || false,
        includeBase64: false,
        includeExtra: true,
      });
      
      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return null;
      }
      
      const asset = result.assets[0];
      if (!asset.uri) return null;
      
      return await this.createMediaFileFromAsset(asset, 'video');
      
    } catch (error) {
      console.error('Failed to capture video:', error);
      throw error;
    }
  }
  
  async pickFromLibrary(options: LibraryPickerOptions = {}): Promise<MediaFile[]> {
    try {
      // Request media library permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Media library permission not granted');
      }
      
      const result = await launchImageLibrary({
        mediaType: options.mediaType || 'mixed',
        multiple: options.multiple || false,
        maxFiles: options.maxFiles || 1,
        quality: options.quality || 0.8,
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight,
        includeBase64: false,
        includeExtra: true,
      });
      
      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return [];
      }
      
      const mediaFiles: MediaFile[] = [];
      
      for (const asset of result.assets) {
        if (asset.uri) {
          const mediaFile = await this.createMediaFileFromAsset(asset, asset.type || 'image');
          mediaFiles.push(mediaFile);
        }
      }
      
      return mediaFiles;
      
    } catch (error) {
      console.error('Failed to pick from library:', error);
      throw error;
    }
  }
  
  // MARK: - Media Processing
  
  async processImage(uri: string, options: MediaProcessingOptions): Promise<MediaFile> {
    try {
      let processedUri = uri;
      
      // Apply filters if specified
      if (options.filters && options.filters.length > 0) {
        processedUri = await this.applyFilters(processedUri, options.filters);
      }
      
      // Apply watermark if specified
      if (options.watermark) {
        processedUri = await this.addWatermark(processedUri, options.watermark);
      }
      
      // Apply crop if specified
      if (options.crop) {
        processedUri = await this.cropMedia(processedUri, options.crop);
      }
      
      // Apply resize if specified
      if (options.resize) {
        processedUri = await this.resizeMedia(processedUri, options.resize);
      }
      
      // Final processing with expo-image-manipulator
      const result = await manipulateAsync(
        processedUri,
        [
          {
            resize: {
              width: options.maxWidth || 1920,
              height: options.maxHeight || 1080,
            },
          },
        ],
        {
          compress: options.quality,
          format: SaveFormat[options.format.toUpperCase() as keyof typeof SaveFormat],
        }
      );
      
      // Create new MediaFile with processed data
      const originalFile = await this.getMediaInfo(uri);
      const processedFile: MediaFile = {
        id: `processed_${Date.now()}`,
        uri: result.uri,
        type: 'image',
        filename: `processed_${originalFile.filename || 'image'}`,
        size: await this.getFileSize(result.uri),
        width: result.width,
        height: result.height,
        mimeType: `image/${options.format}`,
        createdAt: new Date(),
        metadata: {
          originalUri: uri,
          processingOptions: options,
          processedAt: new Date().toISOString(),
        },
      };
      
      return processedFile;
      
    } catch (error) {
      console.error('Failed to process image:', error);
      throw error;
    }
  }
  
  async processVideo(uri: string, options: VideoProcessingOptions): Promise<MediaFile> {
    try {
      // For video processing, we'll use a simplified approach
      // In a production app, you'd use a native video processing library
      
      const originalFile = await this.getMediaInfo(uri);
      
      // Create processed MediaFile (simplified)
      const processedFile: MediaFile = {
        id: `processed_${Date.now()}`,
        uri: uri, // In real implementation, this would be the processed video URI
        type: 'video',
        filename: `processed_${originalFile.filename || 'video'}`,
        size: originalFile.size || 0,
        width: originalFile.width,
        height: originalFile.height,
        duration: originalFile.duration,
        mimeType: originalFile.mimeType || 'video/mp4',
        createdAt: new Date(),
        metadata: {
          originalUri: uri,
          processingOptions: options,
          processedAt: new Date().toISOString(),
        },
      };
      
      return processedFile;
      
    } catch (error) {
      console.error('Failed to process video:', error);
      throw error;
    }
  }
  
  async applyFilters(uri: string, filters: MediaFilter[]): Promise<MediaFile> {
    try {
      // This is a simplified implementation
      // In production, you'd use a native image processing library
      
      const originalFile = await this.getMediaInfo(uri);
      
      // For now, return the original file
      // In real implementation, apply filters and return processed file
      return {
        ...originalFile,
        id: `filtered_${Date.now()}`,
        metadata: {
          ...originalFile.metadata,
          appliedFilters: filters,
          processedAt: new Date().toISOString(),
        },
      } as MediaFile;
      
    } catch (error) {
      console.error('Failed to apply filters:', error);
      throw error;
    }
  }
  
  async addWatermark(uri: string, watermark: WatermarkOptions): Promise<MediaFile> {
    try {
      // This is a simplified implementation
      // In production, you'd use a native image processing library
      
      const originalFile = await this.getMediaInfo(uri);
      
      // For now, return the original file
      // In real implementation, add watermark and return processed file
      return {
        ...originalFile,
        id: `watermarked_${Date.now()}`,
        metadata: {
          ...originalFile.metadata,
          watermark,
          processedAt: new Date().toISOString(),
        },
      } as MediaFile;
      
    } catch (error) {
      console.error('Failed to add watermark:', error);
      throw error;
    }
  }
  
  async cropMedia(uri: string, crop: CropOptions): Promise<MediaFile> {
    try {
      const originalFile = await this.getMediaInfo(uri);
      
      // Use expo-image-manipulator for cropping
      const result = await manipulateAsync(
        uri,
        [
          {
            crop: {
              originX: crop.x,
              originY: crop.y,
              width: crop.width,
              height: crop.height,
            },
          },
        ],
        {
          compress: 1.0,
          format: SaveFormat.JPEG,
        }
      );
      
      return {
        ...originalFile,
        id: `cropped_${Date.now()}`,
        uri: result.uri,
        width: result.width,
        height: result.height,
        size: await this.getFileSize(result.uri),
        metadata: {
          ...originalFile.metadata,
          crop,
          processedAt: new Date().toISOString(),
        },
      } as MediaFile;
      
    } catch (error) {
      console.error('Failed to crop media:', error);
      throw error;
    }
  }
  
  async resizeMedia(uri: string, resize: ResizeOptions): Promise<MediaFile> {
    try {
      const originalFile = await this.getMediaInfo(uri);
      
      // Use expo-image-manipulator for resizing
      const result = await manipulateAsync(
        uri,
        [
          {
            resize: {
              width: resize.width,
              height: resize.height,
            },
          },
        ],
        {
          compress: 1.0,
          format: SaveFormat.JPEG,
        }
      );
      
      return {
        ...originalFile,
        id: `resized_${Date.now()}`,
        uri: result.uri,
        width: result.width,
        height: result.height,
        size: await this.getFileSize(result.uri),
        metadata: {
          ...originalFile.metadata,
          resize,
          processedAt: new Date().toISOString(),
        },
      } as MediaFile;
      
    } catch (error) {
      console.error('Failed to resize media:', error);
      throw error;
    }
  }
  
  // MARK: - Media Management
  
  async uploadMedia(file: MediaFile, onProgress?: (progress: MediaUploadProgress) => void): Promise<string> {
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType,
        name: file.filename,
      } as any);
      
      formData.append('metadata', JSON.stringify({
        type: file.type,
        width: file.width,
        height: file.height,
        duration: file.duration,
        size: file.size,
      }));
      
      // Upload to backend
      const response = await frontierApiClient.uploadFile(
        API_ENDPOINTS.FRONTIER.MEDIA_UPLOAD,
        file.uri,
        onProgress
      );
      
      if (response.success && response.data) {
        return response.data.mediaId || response.data.url;
      }
      
      throw new Error('Upload failed');
      
    } catch (error) {
      console.error('Failed to upload media:', error);
      throw error;
    }
  }
  
  async deleteMedia(mediaId: string): Promise<void> {
    try {
      await frontierApiClient.delete(`${API_ENDPOINTS.FRONTIER.MEDIA}/${mediaId}`);
    } catch (error) {
      console.error('Failed to delete media:', error);
      throw error;
    }
  }
  
  async getMediaInfo(uri: string): Promise<Partial<MediaFile>> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
      
      // Get file size
      const size = fileInfo.size || 0;
      
      // Get dimensions for images (simplified)
      let width, height;
      if (uri.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
        // In production, you'd use a native library to get image dimensions
        const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
        width = screenWidth;
        height = screenHeight;
      }
      
      return {
        uri,
        filename: fileInfo.uri.split('/').pop() || 'unknown',
        size,
        width,
        height,
        mimeType: this.getMimeType(uri),
        createdAt: new Date(fileInfo.modificationTime || Date.now()),
      };
      
    } catch (error) {
      console.error('Failed to get media info:', error);
      throw error;
    }
  }
  
  async saveToGallery(uri: string): Promise<void> {
    try {
      await MediaLibrary.saveToLibraryAsync(uri);
    } catch (error) {
      console.error('Failed to save to gallery:', error);
      throw error;
    }
  }
  
  // MARK: - Utilities
  
  getSupportedFormats(): string[] {
    return [...this.supportedImageFormats, ...this.supportedVideoFormats];
  }
  
  estimateFileSize(width: number, height: number, quality: number, format: string): number {
    // Rough estimation based on dimensions, quality, and format
    const baseSize = width * height * 3; // 3 bytes per pixel (RGB)
    const qualityMultiplier = quality;
    const formatMultiplier = format === 'png' ? 1.5 : format === 'webp' ? 0.8 : 1.0;
    
    return Math.round(baseSize * qualityMultiplier * formatMultiplier);
  }
  
  validateMediaFile(file: MediaFile): boolean {
    if (!file.uri || !file.filename || !file.mimeType) {
      return false;
    }
    
    if (file.size > (file.type === 'video' ? this.maxVideoSize : this.maxImageSize)) {
      return false;
    }
    
    return true;
  }
  
  // MARK: - Private Methods
  
  private async createMediaFileFromAsset(asset: any, type: 'image' | 'video'): Promise<MediaFile> {
    const mediaInfo = await this.getMediaInfo(asset.uri);
    
    return {
      id: `media_${Date.now()}`,
      uri: asset.uri,
      type,
      filename: asset.fileName || asset.uri.split('/').pop() || 'unknown',
      size: asset.fileSize || mediaInfo.size || 0,
      width: asset.width || mediaInfo.width,
      height: asset.height || mediaInfo.height,
      duration: asset.duration,
      mimeType: asset.type || mediaInfo.mimeType || this.getMimeType(asset.uri),
      createdAt: new Date(),
      metadata: {
        originalAsset: asset,
        ...mediaInfo.metadata,
      },
    };
  }
  
  private async getFileSize(uri: string): Promise<number> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.size || 0;
    } catch (error) {
      return 0;
    }
  }
  
  private getMimeType(uri: string): string {
    const extension = uri.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'heic':
        return 'image/heic';
      case 'mp4':
        return 'video/mp4';
      case 'mov':
        return 'video/quicktime';
      case 'avi':
        return 'video/x-msvideo';
      case 'mkv':
        return 'video/x-matroska';
      case 'webm':
        return 'video/webm';
      default:
        return 'application/octet-stream';
    }
  }
}

export const mediaService = new MediaService();
export default mediaService;





