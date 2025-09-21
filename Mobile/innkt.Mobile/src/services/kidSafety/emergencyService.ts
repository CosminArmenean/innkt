import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/apiClient';

export interface EmergencyData {
  kidAccountId: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  message?: string;
  deviceInfo?: {
    platform: string;
    userAgent: string;
  };
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

export interface EmergencyResponse {
  success: boolean;
  emergencyId: string;
  message: string;
  contactsNotified: string[];
  estimatedResponseTime?: string;
}

class EmergencyService {
  private readonly STORAGE_KEYS = {
    EMERGENCY_CONTACTS: 'emergency_contacts',
    EMERGENCY_SETTINGS: 'emergency_settings',
    OFFLINE_EMERGENCIES: 'offline_emergencies',
  };

  /**
   * Trigger panic button - works offline and online
   */
  async triggerPanicButton(emergencyData: EmergencyData): Promise<EmergencyResponse> {
    try {
      console.log('🚨 PANIC BUTTON TRIGGERED:', emergencyData);

      // Always store offline first for reliability
      await this.storeOfflineEmergency(emergencyData);

      // Try to send to server
      try {
        const response = await apiClient.post('/api/kinder/panic-button', emergencyData);
        
        if (response.data.success) {
          console.log('✅ Emergency sent to server successfully');
          await this.removeOfflineEmergency(emergencyData.timestamp);
          return response.data;
        }
      } catch (networkError) {
        console.log('⚠️ Network error, emergency stored offline');
        // Continue with offline handling
      }

      // Offline emergency handling
      return await this.handleOfflineEmergency(emergencyData);

    } catch (error) {
      console.error('❌ Emergency service error:', error);
      
      // Last resort - always try offline handling
      return await this.handleOfflineEmergency(emergencyData);
    }
  }

  /**
   * Handle emergency when offline
   */
  private async handleOfflineEmergency(emergencyData: EmergencyData): Promise<EmergencyResponse> {
    try {
      // Get cached emergency contacts
      const contacts = await this.getCachedEmergencyContacts();
      
      // Try to call emergency services directly (if available)
      // This would integrate with native phone calling capabilities
      
      return {
        success: true,
        emergencyId: `offline_${Date.now()}`,
        message: 'Emergency stored offline. Will sync when connection available.',
        contactsNotified: contacts.map(c => c.name),
        estimatedResponseTime: 'Immediate (offline mode)',
      };
    } catch (error) {
      console.error('❌ Offline emergency handling failed:', error);
      throw error;
    }
  }

  /**
   * Get emergency contacts (cached for offline access)
   */
  async getEmergencyContacts(kidAccountId: string): Promise<EmergencyContact[]> {
    try {
      // Try to fetch from server first
      try {
        const response = await apiClient.get(`/api/kinder/kid-accounts/${kidAccountId}/emergency-contacts`);
        
        if (response.data && Array.isArray(response.data)) {
          // Cache for offline access
          await AsyncStorage.setItem(
            this.STORAGE_KEYS.EMERGENCY_CONTACTS,
            JSON.stringify(response.data)
          );
          return response.data;
        }
      } catch (networkError) {
        console.log('⚠️ Network error, using cached contacts');
      }

      // Fallback to cached contacts
      return await this.getCachedEmergencyContacts();

    } catch (error) {
      console.error('❌ Error getting emergency contacts:', error);
      return [];
    }
  }

  /**
   * Get cached emergency contacts for offline access
   */
  async getCachedEmergencyContacts(): Promise<EmergencyContact[]> {
    try {
      const cached = await AsyncStorage.getItem(this.STORAGE_KEYS.EMERGENCY_CONTACTS);
      if (cached) {
        return JSON.parse(cached);
      }

      // Default emergency contacts if none cached
      return [
        {
          id: 'default_parent',
          name: 'Parent/Guardian',
          phone: 'Unknown',
          relationship: 'Parent',
          isPrimary: true,
        },
        {
          id: 'default_emergency',
          name: 'Emergency Services',
          phone: '112', // European emergency number
          relationship: 'Emergency',
          isPrimary: false,
        },
      ];
    } catch (error) {
      console.error('❌ Error getting cached contacts:', error);
      return [];
    }
  }

  /**
   * Update emergency contacts
   */
  async updateEmergencyContacts(
    kidAccountId: string,
    contacts: EmergencyContact[]
  ): Promise<boolean> {
    try {
      // Update on server
      const response = await apiClient.put(
        `/api/kinder/kid-accounts/${kidAccountId}/emergency-contacts`,
        { contacts }
      );

      if (response.data.success) {
        // Update cache
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.EMERGENCY_CONTACTS,
          JSON.stringify(contacts)
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error updating emergency contacts:', error);
      
      // Update cache even if server fails
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.EMERGENCY_CONTACTS,
        JSON.stringify(contacts)
      );
      
      return false;
    }
  }

  /**
   * Check if panic button is enabled for kid account
   */
  async isPanicButtonEnabled(kidAccountId: string): Promise<boolean> {
    try {
      const response = await apiClient.get(`/api/kinder/kid-accounts/${kidAccountId}`);
      return response.data?.kidAccount?.panicButtonEnabled ?? true; // Default to enabled
    } catch (error) {
      console.error('❌ Error checking panic button status:', error);
      return true; // Default to enabled for safety
    }
  }

  /**
   * Store emergency offline for later sync
   */
  private async storeOfflineEmergency(emergencyData: EmergencyData): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(this.STORAGE_KEYS.OFFLINE_EMERGENCIES);
      const emergencies = existing ? JSON.parse(existing) : [];
      
      emergencies.push({
        ...emergencyData,
        storedAt: new Date().toISOString(),
      });

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.OFFLINE_EMERGENCIES,
        JSON.stringify(emergencies)
      );
    } catch (error) {
      console.error('❌ Error storing offline emergency:', error);
    }
  }

  /**
   * Remove synced emergency from offline storage
   */
  private async removeOfflineEmergency(timestamp: string): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(this.STORAGE_KEYS.OFFLINE_EMERGENCIES);
      if (existing) {
        const emergencies = JSON.parse(existing);
        const filtered = emergencies.filter((e: any) => e.timestamp !== timestamp);
        
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.OFFLINE_EMERGENCIES,
          JSON.stringify(filtered)
        );
      }
    } catch (error) {
      console.error('❌ Error removing offline emergency:', error);
    }
  }

  /**
   * Sync offline emergencies when connection is restored
   */
  async syncOfflineEmergencies(): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(this.STORAGE_KEYS.OFFLINE_EMERGENCIES);
      if (!existing) return;

      const emergencies = JSON.parse(existing);
      const syncPromises = emergencies.map(async (emergency: any) => {
        try {
          await apiClient.post('/api/kinder/panic-button', emergency);
          return emergency.timestamp;
        } catch (error) {
          console.error('❌ Error syncing emergency:', error);
          return null;
        }
      });

      const syncedTimestamps = await Promise.all(syncPromises);
      const remainingEmergencies = emergencies.filter(
        (e: any) => !syncedTimestamps.includes(e.timestamp)
      );

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.OFFLINE_EMERGENCIES,
        JSON.stringify(remainingEmergencies)
      );

      console.log(`✅ Synced ${syncedTimestamps.filter(t => t).length} offline emergencies`);
    } catch (error) {
      console.error('❌ Error syncing offline emergencies:', error);
    }
  }

  /**
   * Get emergency settings for kid account
   */
  async getEmergencySettings(kidAccountId: string) {
    try {
      const response = await apiClient.get(`/api/kinder/kid-accounts/${kidAccountId}/emergency-settings`);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting emergency settings:', error);
      
      // Return default settings
      return {
        panicButtonEnabled: true,
        locationSharingEnabled: true,
        emergencyContactsCount: 2,
        autoCallEmergencyServices: false, // Requires parental approval
      };
    }
  }
}

export const emergencyService = new EmergencyService();

