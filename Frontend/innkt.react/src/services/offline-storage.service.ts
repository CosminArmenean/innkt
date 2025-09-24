import { Notification } from './notification.service';

const DB_NAME = 'innkt_notifications';
const DB_VERSION = 1;
const STORE_NAME = 'notifications';

export interface OfflineNotification extends Notification {
  offlineId: string;
  synced: boolean;
  createdAt: string;
}

class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('📱 Offline storage initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'offlineId' });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  async storeNotification(notification: Notification): Promise<void> {
    await this.initialize();

    const offlineNotification: OfflineNotification = {
      ...notification,
      offlineId: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      synced: false,
      createdAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(offlineNotification);

      request.onsuccess = () => {
        console.log('📱 Notification stored offline:', offlineNotification.offlineId);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to store notification offline:', request.error);
        reject(request.error);
      };
    });
  }

  async getNotifications(userId: string, limit: number = 50): Promise<OfflineNotification[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const notifications = request.result
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
        resolve(notifications);
      };

      request.onerror = () => {
        console.error('Failed to get notifications from offline storage:', request.error);
        reject(request.error);
      };
    });
  }

  async getUnsyncedNotifications(): Promise<OfflineNotification[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(false));

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Failed to get unsynced notifications:', request.error);
        reject(request.error);
      };
    });
  }

  async markAsSynced(offlineId: string): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(offlineId);

      getRequest.onsuccess = () => {
        const notification = getRequest.result;
        if (notification) {
          notification.synced = true;
          const updateRequest = store.put(notification);
          
          updateRequest.onsuccess = () => {
            console.log('📱 Notification marked as synced:', offlineId);
            resolve();
          };
          
          updateRequest.onerror = () => {
            console.error('Failed to mark notification as synced:', updateRequest.error);
            reject(updateRequest.error);
          };
        } else {
          reject(new Error('Notification not found'));
        }
      };

      getRequest.onerror = () => {
        console.error('Failed to get notification for sync update:', getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const notification = cursor.value;
          if (notification.id === notificationId) {
            notification.read = true;
            cursor.update(notification);
            console.log('📱 Notification marked as read offline:', notificationId);
            resolve();
          } else {
            cursor.continue();
          }
        } else {
          resolve(); // Notification not found in offline storage
        }
      };

      request.onerror = () => {
        console.error('Failed to mark notification as read offline:', request.error);
        reject(request.error);
      };
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('userId');
      const request = index.openCursor(IDBKeyRange.only(userId));

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const notification = cursor.value;
          notification.read = true;
          cursor.update(notification);
          cursor.continue();
        } else {
          console.log('📱 All notifications marked as read offline for user:', userId);
          resolve();
        }
      };

      request.onerror = () => {
        console.error('Failed to mark all notifications as read offline:', request.error);
        reject(request.error);
      };
    });
  }

  async deleteNotification(offlineId: string): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(offlineId);

      request.onsuccess = () => {
        console.log('📱 Notification deleted from offline storage:', offlineId);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete notification from offline storage:', request.error);
        reject(request.error);
      };
    });
  }

  async clearOldNotifications(daysOld: number = 30): Promise<void> {
    await this.initialize();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const notification = cursor.value;
          const notificationDate = new Date(notification.timestamp);
          
          if (notificationDate < cutoffDate) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          console.log('📱 Old notifications cleaned up');
          resolve();
        }
      };

      request.onerror = () => {
        console.error('Failed to clear old notifications:', request.error);
        reject(request.error);
      };
    });
  }

  async getStorageStats(): Promise<{ total: number; unsynced: number; unread: number }> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const notifications = request.result;
        const stats = {
          total: notifications.length,
          unsynced: notifications.filter(n => !n.synced).length,
          unread: notifications.filter(n => !n.read).length
        };
        resolve(stats);
      };

      request.onerror = () => {
        console.error('Failed to get storage stats:', request.error);
        reject(request.error);
      };
    });
  }
}

// Export singleton instance
export const offlineStorageService = new OfflineStorageService();
export default offlineStorageService;
