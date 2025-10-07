import { BaseApiService, createApiInstance } from './api.service';

export interface CreateKidAccountRequest {
  username: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  country: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  independenceDate?: string;
  acceptTerms: boolean;
  acceptPrivacyPolicy: boolean;
}

export interface CreateKidAccountResponse {
  kidAccountId: string;
  message: string;
}

export interface KidAccountStatus {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  status: string;
  independenceDate?: string;
  isIndependent: boolean;
  profilePictureUrl?: string;
  createdAt: string;
  parentUserId: string;
  parentFullName: string;
}

class OfficerService extends BaseApiService {
  private readonly OFFICER_API_URL = 'http://localhost:5001';

  constructor() {
    super(createApiInstance('http://localhost:5001'));
  }

  /**
   * Create a new kid account
   */
  async createKidAccount(request: CreateKidAccountRequest): Promise<CreateKidAccountResponse> {
    try {
      const response = await this.api.post('/api/KidAccount/create', request);
      return response.data;
    } catch (error: any) {
      console.error('Error creating kid account:', error);
      // Preserve the original error structure so the component can access error.response.data
      throw error;
    }
  }

  /**
   * Get kid accounts for a parent
   */
  async getParentKidAccounts(parentUserId: string): Promise<KidAccountStatus[]> {
    try {
      const response = await this.api.get('/api/KidAccount/parent-accounts');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching parent kid accounts:', error);
      throw new Error(`Failed to fetch kid accounts: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get kid account status
   */
  async getKidAccountStatus(kidAccountId: string): Promise<KidAccountStatus> {
    try {
      const response = await this.api.get(`/api/kid-accounts/${kidAccountId}/status`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching kid account status:', error);
      throw new Error(`Failed to fetch kid account status: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Generate QR code for kid account
   */
  async generateKidQRCode(kidAccountId: string): Promise<{ qrCode: string; pairingCode: string }> {
    try {
      const response = await this.api.post(`/api/kid-accounts/${kidAccountId}/qr-code`);
      return response.data;
    } catch (error: any) {
      console.error('Error generating kid QR code:', error);
      throw new Error(`Failed to generate QR code: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Generate pairing code for kid account
   */
  async generateKidPairingCode(kidAccountId: string): Promise<{ pairingCode: string }> {
    try {
      const response = await this.api.post(`/api/kid-accounts/${kidAccountId}/pairing-code`);
      return response.data;
    } catch (error: any) {
      console.error('Error generating kid pairing code:', error);
      throw new Error(`Failed to generate pairing code: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Set kid account independence date
   */
  async setKidIndependenceDate(kidAccountId: string, independenceDate: string): Promise<{ success: boolean }> {
    try {
      const response = await this.api.put(`/api/kid-accounts/${kidAccountId}/independence`, {
        independenceDate
      });
      return response.data;
    } catch (error: any) {
      console.error('Error setting kid independence date:', error);
      throw new Error(`Failed to set independence date: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Make kid account independent
   */
  async makeKidAccountIndependent(kidAccountId: string, newPassword: string): Promise<{ success: boolean }> {
    try {
      const response = await this.api.post(`/api/kid-accounts/${kidAccountId}/make-independent`, {
        newPassword
      });
      return response.data;
    } catch (error: any) {
      console.error('Error making kid account independent:', error);
      throw new Error(`Failed to make account independent: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Deactivate kid account
   */
  async deactivateKidAccount(kidAccountId: string, reason: string): Promise<{ success: boolean }> {
    try {
      const response = await this.api.post(`/api/kid-accounts/${kidAccountId}/deactivate`, {
        reason
      });
      return response.data;
    } catch (error: any) {
      console.error('Error deactivating kid account:', error);
      throw new Error(`Failed to deactivate account: ${error.response?.data?.message || error.message}`);
    }
  }
}

export const officerService = new OfficerService();
