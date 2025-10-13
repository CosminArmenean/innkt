import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { pwaService, PWACacheInfo } from '../../services/pwa.service';
import { 
  WifiIcon, 
  SignalSlashIcon,
  DevicePhoneMobileIcon,
  CpuChipIcon,
  BellIcon,
  CircleStackIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface PWAStatusProps {
  className?: string;
  showDetails?: boolean;
}

const PWAStatus: React.FC<PWAStatusProps> = ({
  className = '',
  showDetails = false
}) => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [appInfo, setAppInfo] = useState<any>(null);
  const [cacheInfo, setCacheInfo] = useState<PWACacheInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    updateStatus();
    
    // Listen for online/offline changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateStatus = async () => {
    setIsOnline(pwaService.isOnlineStatus());
    setIsInstalled(pwaService.isPWAInstalled());
    setAppInfo(pwaService.getAppInfo());
    
    if (showDetails) {
      const cache = await pwaService.getCacheInfo();
      setCacheInfo(cache);
    }
  };

  const handleClearCache = async (cacheName?: string) => {
    try {
      setLoading(true);
      await pwaService.clearCache(cacheName);
      await updateStatus();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckUpdates = async () => {
    try {
      setLoading(true);
      await pwaService.checkForUpdates();
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (status: boolean) => {
    return status ? CheckCircleIcon : XCircleIcon;
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Online Status */}
        <div className="flex items-center space-x-1">
          {isOnline ? (
            <WifiIcon className="w-4 h-4 text-green-500" />
          ) : (
            <SignalSlashIcon className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {isOnline ? t('pwa.online') : t('pwa.offline')}
          </span>
        </div>

        {/* PWA Status */}
        {isInstalled && (
          <div className="flex items-center space-x-1">
            <DevicePhoneMobileIcon className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-600">{t('pwa.app')}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('pwa.pwaStatus')}</h3>
        <button
          onClick={updateStatus}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('common.refresh')}</span>
        </button>
      </div>

      {/* Connection Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {isOnline ? (
              <WifiIcon className="w-6 h-6 text-green-500" />
            ) : (
              <SignalSlashIcon className="w-6 h-6 text-red-500" />
            )}
            <div>
              <p className="font-medium text-gray-900">Connection Status</p>
              <p className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? 'Connected to the internet' : 'No internet connection'}
              </p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      {/* App Status */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">App Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <DevicePhoneMobileIcon className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">PWA Installed</p>
              <p className={`text-sm ${getStatusColor(isInstalled)}`}>
                {isInstalled ? 'App is installed' : 'Not installed'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <CpuChipIcon className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Service Worker</p>
              <p className={`text-sm ${getStatusColor(appInfo?.hasServiceWorker)}`}>
                {appInfo?.hasServiceWorker ? 'Active' : 'Not available'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <BellIcon className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Notifications</p>
              <p className={`text-sm ${getStatusColor(appInfo?.hasNotifications)}`}>
                {appInfo?.hasNotifications ? 'Supported' : 'Not supported'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <CircleStackIcon className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Offline Storage</p>
              <p className={`text-sm ${getStatusColor(appInfo?.hasIndexedDB)}`}>
                {appInfo?.hasIndexedDB ? 'Available' : 'Not available'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cache Information */}
      {cacheInfo.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Cache Storage</h4>
            <button
              onClick={() => handleClearCache()}
              disabled={loading}
              className="flex items-center space-x-1 px-2 py-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          </div>
          
          <div className="space-y-2">
            {cacheInfo.map((cache) => (
              <div key={cache.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{cache.name}</p>
                  <p className="text-xs text-gray-600">
                    {pwaService.formatCacheSize(cache.size)} • {cache.entries} entries
                  </p>
                </div>
                <button
                  onClick={() => handleClearCache(cache.name)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCheckUpdates}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Check Updates</span>
        </button>
        
        {!isInstalled && (
          <button
            onClick={() => pwaService.installPWA()}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <DevicePhoneMobileIcon className="w-4 h-4" />
            <span>Install App</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PWAStatus;
