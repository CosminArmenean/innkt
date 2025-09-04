import { BaseApiService, neurosparkApi } from './api.service';

export interface QRCodeGenerationRequest {
  data: string;
  type: 'text' | 'url' | 'contact' | 'wifi' | 'custom';
  size?: number;
  format?: 'png' | 'svg' | 'pdf';
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
  foregroundColor?: string;
  backgroundColor?: string;
  logo?: string; // Base64 encoded logo
}

export interface QRCodeGenerationResult {
  id: string;
  qrCodeUrl: string;
  data: string;
  type: string;
  size: number;
  format: string;
  createdAt: string;
  expiresAt?: string;
}

export interface QRCodeScanRequest {
  imageFile: File;
  userId: string;
}

export interface QRCodeScanResult {
  id: string;
  scannedData: string;
  dataType: string;
  confidence: number;
  scannedAt: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface QRCodeValidationRequest {
  qrCodeId: string;
  userId: string;
}

export interface QRCodeValidationResult {
  isValid: boolean;
  validationTime: number;
  details: {
    dataIntegrity: boolean;
    expirationCheck: boolean;
    userPermissions: boolean;
  };
  message: string;
}

export class QRCodeService extends BaseApiService {
  constructor() {
    super(neurosparkApi);
  }

  // Generate QR code
  async generateQRCode(request: QRCodeGenerationRequest): Promise<QRCodeGenerationResult> {
    return this.post<QRCodeGenerationResult>('/api/qr/generate', request);
  }

  // Scan QR code from image
  async scanQRCode(request: QRCodeScanRequest): Promise<QRCodeScanResult> {
    const formData = new FormData();
    formData.append('imageFile', request.imageFile);
    formData.append('userId', request.userId);

    return this.upload<QRCodeScanResult>('/api/qr/scan', formData);
  }

  // Validate QR code
  async validateQRCode(request: QRCodeValidationRequest): Promise<QRCodeValidationResult> {
    return this.post<QRCodeValidationResult>('/api/qr/validate', request);
  }

  // Get QR code generation history
  async getGenerationHistory(userId: string): Promise<QRCodeGenerationResult[]> {
    return this.get<QRCodeGenerationResult[]>(`/api/qr/history/generated/${userId}`);
  }

  // Get QR code scan history
  async getScanHistory(userId: string): Promise<QRCodeScanResult[]> {
    return this.get<QRCodeScanResult[]>(`/api/qr/history/scanned/${userId}`);
  }

  // Delete generated QR code
  async deleteQRCode(id: string): Promise<void> {
    return this.delete<void>(`/api/qr/delete/${id}`);
  }

  // Bulk generate QR codes
  async bulkGenerateQRCodes(requests: QRCodeGenerationRequest[]): Promise<QRCodeGenerationResult[]> {
    return this.post<QRCodeGenerationResult[]>('/api/qr/bulk-generate', { requests });
  }
}

export const qrCodeService = new QRCodeService();


