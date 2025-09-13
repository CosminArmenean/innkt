import { BaseApiService } from './api.service';
import { apiConfig } from './api.config';

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWACacheInfo {
  name: string;
  size: number;
  lastUpdated: Date;
  entries: number;
}

export interface PWAOfflineData {
  posts: any[];
  messages: any[];
  notifications: any[];
  users: any[];
  groups: any[];
}

class PWAService extends BaseApiService {
  private installPrompt: PWAInstallPrompt | null = null;
  private isInstalled = false;
  private isOnline = navigator.onLine;
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    super(apiConfig.officerApi.baseUrl);
    this.initializePWA();
  }

  // Initialize PWA features
  private async initializePWA() {
    try {
      // Register service worker
      await this.registerServiceWorker();
      
      // Setup install prompt
      this.setupInstallPrompt();
      
      // Setup online/offline listeners
      this.setupConnectionListeners();
      
      // Wait a bit for service worker to be fully active, then setup periodic sync
      setTimeout(() => {
        this.setupPeriodicSync();
      }, 1000);
      
      console.log('PWA Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PWA:', error);
    }
  }

  // Register service worker
  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.registration = registration;

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              this.showUpdateNotification();
            }
          });
        }
      });

      console.log('Service Worker registered successfully');
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  // Setup install prompt
  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event as any;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.hideInstallButton();
      console.log('PWA installed successfully');
    });
  }

  // Setup connection listeners
  private setupConnectionListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onConnectionChange(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.onConnectionChange(false);
    });
  }

  // Setup periodic sync
  private setupPeriodicSync() {
    // Check if periodic sync is supported and registration is available
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported, skipping periodic sync');
      return;
    }

    if (!('periodicSync' in window.ServiceWorkerRegistration.prototype)) {
      console.log('Periodic sync not supported, skipping');
      return;
    }

    if (!this.registration) {
      console.log('Service Worker not registered yet, skipping periodic sync');
      return;
    }

    // Check if service worker is active
    if (this.registration.active) {
      this.registerPeriodicSync();
    } else {
      // Wait for service worker to become active
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              this.registerPeriodicSync();
            }
          });
        }
      });
    }
  }

  // Register periodic sync
  private registerPeriodicSync() {
    try {
      // @ts-ignore - periodicSync is experimental and not in TypeScript definitions
      this.registration?.periodicSync?.register('content-sync', {
        minInterval: 24 * 60 * 60 * 1000 // 24 hours
      });
      console.log('Periodic sync registered successfully');
    } catch (error) {
      console.warn('Periodic sync registration failed:', error);
    }
  }

  // Show install button
  private showInstallButton() {
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'block';
    }
  }

  // Hide install button
  private hideInstallButton() {
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }

  // Show update notification
  private showUpdateNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('App Update Available', {
        body: 'A new version of the app is available. Click to update.',
        icon: '/favicon.ico',
        tag: 'app-update'
      });
    }
  }

  // Handle connection change
  private onConnectionChange(isOnline: boolean) {
    if (isOnline) {
      this.syncOfflineData();
    }
  }

  // Install PWA
  async installPWA(): Promise<boolean> {
    if (!this.installPrompt) {
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const choiceResult = await this.installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        this.isInstalled = true;
        this.hideInstallButton();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('PWA installation failed:', error);
      return false;
    }
  }

  // Check if PWA is installed
  isPWAInstalled(): boolean {
    return this.isInstalled || window.matchMedia('(display-mode: standalone)').matches;
  }

  // Check if online
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Get cache information
  async getCacheInfo(): Promise<PWACacheInfo[]> {
    if (!('caches' in window)) {
      return [];
    }

    try {
      const cacheNames = await caches.keys();
      const cacheInfo: PWACacheInfo[] = [];

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        let totalSize = 0;

        for (const key of keys) {
          const response = await cache.match(key);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }

        cacheInfo.push({
          name: cacheName,
          size: totalSize,
          lastUpdated: new Date(),
          entries: keys.length
        });
      }

      return cacheInfo;
    } catch (error) {
      console.error('Failed to get cache info:', error);
      return [];
    }
  }

  // Clear cache
  async clearCache(cacheName?: string): Promise<void> {
    if (!('caches' in window)) {
      return;
    }

    try {
      if (cacheName) {
        await caches.delete(cacheName);
      } else {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // Store data offline
  async storeOfflineData(storeName: string, data: any): Promise<void> {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      if (Array.isArray(data)) {
        for (const item of data) {
          await store.put(item);
        }
      } else {
        await store.put(data);
      }
    } catch (error) {
      console.error('Failed to store offline data:', error);
    }
  }

  // Get offline data
  async getOfflineData(storeName: string): Promise<any[]> {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return [];
    }
  }

  // Sync offline data
  async syncOfflineData(): Promise<void> {
    try {
      const offlineData = await this.getAllOfflineData();
      
      // Sync posts
      if (offlineData.posts.length > 0) {
        await this.syncPosts(offlineData.posts);
      }
      
      // Sync messages
      if (offlineData.messages.length > 0) {
        await this.syncMessages(offlineData.messages);
      }
      
      // Sync notifications
      if (offlineData.notifications.length > 0) {
        await this.syncNotifications(offlineData.notifications);
      }
      
      console.log('Offline data synced successfully');
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }

  // Get all offline data
  private async getAllOfflineData(): Promise<PWAOfflineData> {
    const [posts, messages, notifications, users, groups] = await Promise.all([
      this.getOfflineData('posts'),
      this.getOfflineData('messages'),
      this.getOfflineData('notifications'),
      this.getOfflineData('users'),
      this.getOfflineData('groups')
    ]);

    return { posts, messages, notifications, users, groups };
  }

  // Sync posts
  private async syncPosts(posts: any[]): Promise<void> {
    for (const post of posts) {
      try {
        await this.post('/api/posts', post);
        await this.removeOfflineData('posts', post.id);
      } catch (error) {
        console.error('Failed to sync post:', error);
      }
    }
  }

  // Sync messages
  private async syncMessages(messages: any[]): Promise<void> {
    for (const message of messages) {
      try {
        await this.post('/api/messages', message);
        await this.removeOfflineData('messages', message.id);
      } catch (error) {
        console.error('Failed to sync message:', error);
      }
    }
  }

  // Sync notifications
  private async syncNotifications(notifications: any[]): Promise<void> {
    for (const notification of notifications) {
      try {
        await this.post('/api/notifications', notification);
        await this.removeOfflineData('notifications', notification.id);
      } catch (error) {
        console.error('Failed to sync notification:', error);
      }
    }
  }

  // Remove offline data
  private async removeOfflineData(storeName: string, id: string): Promise<void> {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await store.delete(id);
    } catch (error) {
      console.error('Failed to remove offline data:', error);
    }
  }

  // Open IndexedDB
  private openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('innkt-offline', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('posts')) {
          db.createObjectStore('posts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('notifications')) {
          db.createObjectStore('notifications', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('groups')) {
          db.createObjectStore('groups', { keyPath: 'id' });
        }
      };
    });
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.log('Notifications not supported in this browser');
        return false;
      }

      if (Notification.permission === 'granted') {
        return true;
      }

      if (Notification.permission === 'denied') {
        console.log('Notification permission denied by user');
        return false;
      }

      // Only request permission if it's not already denied
      if (Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        } catch (permissionError) {
          // Handle Edge browser specific permission errors
          if (permissionError instanceof Error && permissionError.name === 'NotAllowedError') {
            console.log('Notification permission denied by browser policy (Edge)');
            return false;
          }
          throw permissionError;
        }
      }

      return false;
    } catch (error) {
      console.warn('Failed to request notification permission:', error);
      return false;
    }
  }

  // Show notification
  showNotification(title: string, options?: NotificationOptions): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    }
  }

  // Get app info
  getAppInfo() {
    return {
      isInstalled: this.isPWAInstalled(),
      isOnline: this.isOnlineStatus(),
      hasServiceWorker: 'serviceWorker' in navigator,
      hasNotifications: 'Notification' in window,
      hasIndexedDB: 'indexedDB' in window,
      hasCacheAPI: 'caches' in window
    };
  }

  // Format cache size
  formatCacheSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check for updates
  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      await this.registration.update();
      return true;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return false;
    }
  }

  // Force update
  async forceUpdate(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      const newWorker = this.registration.installing;
      if (newWorker) {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to force update:', error);
    }
  }
}

export const pwaService = new PWAService();
