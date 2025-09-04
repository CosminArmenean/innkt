import { BaseApiService, neurosparkApi } from './api.service';

export interface ImageProcessingOptions {
  backgroundRemoval?: boolean;
  enhancement?: boolean;
  cropping?: boolean;
  resize?: {
    width?: number;
    height?: number;
  };
  filters?: string[];
}

export interface ImageProcessingResult {
  id: string;
  originalUrl: string;
  processedUrl: string;
  processingOptions: ImageProcessingOptions;
  processingTime: number;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface ImageUploadRequest {
  file: File;
  options: ImageProcessingOptions;
  userId: string;
}

export class ImageProcessingService extends BaseApiService {
  constructor() {
    super(neurosparkApi);
  }

  // Upload and process image
  async processImage(request: ImageUploadRequest): Promise<ImageProcessingResult> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('options', JSON.stringify(request.options));
    formData.append('userId', request.userId);

    return this.upload<ImageProcessingResult>('/api/image/process', formData);
  }

  // Get processing history
  async getProcessingHistory(userId: string): Promise<ImageProcessingResult[]> {
    return this.get<ImageProcessingResult[]>(`/api/image/history/${userId}`);
  }

  // Get specific processing result
  async getProcessingResult(id: string): Promise<ImageProcessingResult> {
    return this.get<ImageProcessingResult>(`/api/image/result/${id}`);
  }

  // Cancel processing
  async cancelProcessing(id: string): Promise<void> {
    return this.delete<void>(`/api/image/cancel/${id}`);
  }

  // Get processing status
  async getProcessingStatus(id: string): Promise<{ status: string; progress?: number }> {
    return this.get<{ status: string; progress?: number }>(`/api/image/status/${id}`);
  }
}

export const imageProcessingService = new ImageProcessingService();


