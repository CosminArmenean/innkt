import { neurosparkApi } from './api.service';

export interface BackgroundRemovalOptions {
  model?: string;
  outputFormat?: string;
  quality?: number;
  preserveTransparency?: boolean;
  maxSize?: number;
  optimizeForWeb?: boolean;
}

export interface AvatarProcessingOptions {
  removeBackground?: boolean;
  resizeTo?: number;
  format?: string;
  quality?: number;
  addBorder?: boolean;
  borderColor?: string;
  borderWidth?: number;
  roundCorners?: boolean;
  cornerRadius?: number;
}

export interface BackgroundRemovalResult {
  userId: string;
  timestamp: string;
  success: boolean;
  processedImagePath?: string;
  processedImageData?: string; // Base64 encoded
  originalImagePath?: string;
  options?: BackgroundRemovalOptions;
  error?: string;
  processingTime?: string;
}

export interface BackgroundRemovalModelInfo {
  modelName: string;
  version: string;
  isAvailable: boolean;
  availableModels: string[];
  error?: string;
}

export class BackgroundRemovalService {
  private baseUrl = '/api/backgroundremoval';

  /**
   * Remove background from an uploaded image
   */
  async removeBackground(
    imageFile: File,
    options?: BackgroundRemovalOptions
  ): Promise<BackgroundRemovalResult> {
    const formData = new FormData();
    formData.append('imageFile', imageFile);
    
    if (options) {
      if (options.model) formData.append('model', options.model);
      if (options.outputFormat) formData.append('outputFormat', options.outputFormat);
      if (options.quality) formData.append('quality', options.quality.toString());
      if (options.preserveTransparency !== undefined) {
        formData.append('preserveTransparency', options.preserveTransparency.toString());
      }
      if (options.maxSize) formData.append('maxSize', options.maxSize.toString());
      if (options.optimizeForWeb !== undefined) {
        formData.append('optimizeForWeb', options.optimizeForWeb.toString());
      }
    }

    const response = await neurosparkApi.post(`${this.baseUrl}/remove`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  /**
   * Remove background from image URL
   */
  async removeBackgroundFromUrl(
    imageUrl: string,
    options?: BackgroundRemovalOptions
  ): Promise<BackgroundRemovalResult> {
    const response = await neurosparkApi.post(`${this.baseUrl}/remove/url`, {
      imageUrl,
      ...options,
    });

    return response.data.data;
  }

  /**
   * Process avatar with background removal and optimization
   */
  async processAvatar(
    imageFile: File,
    options?: AvatarProcessingOptions
  ): Promise<Blob> {
    const formData = new FormData();
    formData.append('imageFile', imageFile);
    
    if (options) {
      if (options.removeBackground !== undefined) {
        formData.append('removeBackground', options.removeBackground.toString());
      }
      if (options.resizeTo) formData.append('resizeTo', options.resizeTo.toString());
      if (options.format) formData.append('format', options.format);
      if (options.quality) formData.append('quality', options.quality.toString());
      if (options.addBorder !== undefined) {
        formData.append('addBorder', options.addBorder.toString());
      }
      if (options.borderColor) formData.append('borderColor', options.borderColor);
      if (options.borderWidth) formData.append('borderWidth', options.borderWidth.toString());
      if (options.roundCorners !== undefined) {
        formData.append('roundCorners', options.roundCorners.toString());
      }
      if (options.cornerRadius) formData.append('cornerRadius', options.cornerRadius.toString());
    }

    const response = await neurosparkApi.post(`${this.baseUrl}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
    });

    return response.data;
  }

  /**
   * Batch remove background from multiple images
   */
  async batchRemoveBackground(
    imageFiles: File[],
    options?: BackgroundRemovalOptions
  ): Promise<BackgroundRemovalResult[]> {
    const formData = new FormData();
    
    imageFiles.forEach((file) => {
      formData.append('imageFiles', file);
    });
    
    if (options) {
      if (options.model) formData.append('model', options.model);
      if (options.outputFormat) formData.append('outputFormat', options.outputFormat);
      if (options.quality) formData.append('quality', options.quality.toString());
      if (options.preserveTransparency !== undefined) {
        formData.append('preserveTransparency', options.preserveTransparency.toString());
      }
      if (options.maxSize) formData.append('maxSize', options.maxSize.toString());
      if (options.optimizeForWeb !== undefined) {
        formData.append('optimizeForWeb', options.optimizeForWeb.toString());
      }
    }

    const response = await neurosparkApi.post(`${this.baseUrl}/batch`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  /**
   * Get background removal model information
   */
  async getModelInfo(): Promise<BackgroundRemovalModelInfo> {
    const response = await neurosparkApi.get(`${this.baseUrl}/info`);
    return response.data.data;
  }

  /**
   * Check if background removal service is available
   */
  async getServiceStatus(): Promise<boolean> {
    const response = await neurosparkApi.get(`${this.baseUrl}/status`);
    return response.data.data;
  }

  /**
   * Get processed image by path
   */
  async getProcessedImage(imagePath: string): Promise<Blob> {
    const response = await neurosparkApi.get(`${this.baseUrl}/image/${imagePath}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Create a preview URL for processed image
   */
  createProcessedImageUrl(imagePath: string): string {
    return `${neurosparkApi.defaults.baseURL}${this.baseUrl}/image/${imagePath}`;
  }

  /**
   * Convert blob to data URL for preview
   */
  async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Download processed image
   */
  downloadProcessedImage(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      return { isValid: false, error: 'Image size must be less than 10MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Only JPEG, PNG, and WebP images are supported' };
    }

    return { isValid: true };
  }

  /**
   * Get default avatar processing options
   */
  getDefaultAvatarOptions(): AvatarProcessingOptions {
    return {
      removeBackground: true,
      resizeTo: 512,
      format: 'PNG',
      quality: 95,
      addBorder: true,
      borderColor: '#FFFFFF',
      borderWidth: 4,
      roundCorners: true,
      cornerRadius: 256,
    };
  }

  /**
   * Get default background removal options
   */
  getDefaultBackgroundRemovalOptions(): BackgroundRemovalOptions {
    return {
      model: 'u2net',
      outputFormat: 'PNG',
      quality: 95,
      preserveTransparency: true,
      maxSize: 2048,
      optimizeForWeb: true,
    };
  }
}

export const backgroundRemovalService = new BackgroundRemovalService();
