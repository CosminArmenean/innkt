import React, { useState, useEffect } from 'react';
import { pwaService } from '../../services/pwa.service';
import { 
  DevicePhoneMobileIcon, 
  XMarkIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  WifiIcon,
  WifiSlashIcon
} from '@heroicons/react/24/outline';

interface PWAInstallPromptProps {
  className?: string;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  className = ''
}) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [appInfo, setAppInfo] = useState<any>(null);

  useEffect(() => {
    // Check initial state
    setIsInstalled(pwaService.isPWAInstalled());
    setIsOnline(pwaService.isOnlineStatus());
    setAppInfo(pwaService.getAppInfo());

    // Show install prompt if not installed and conditions are met
    if (!pwaService.isPWAInstalled() && pwaService.isOnlineStatus()) {
      // Delay showing prompt to avoid being too aggressive
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstall = async () => {
    try {
      setIsInstalling(true);
      const success = await pwaService.installPWA();
      
      if (success) {
        setIsInstalled(true);
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleLater = () => {
    setShowPrompt(false);
    // Show again in 24 hours
    localStorage.setItem('pwa-install-later', Date.now().toString());
  };

  // Don't show if already installed or dismissed
  if (isInstalled || !showPrompt || sessionStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  // Check if user chose "later" and 24 hours have passed
  const laterTime = localStorage.getItem('pwa-install-later');
  if (laterTime && Date.now() - parseInt(laterTime) < 24 * 60 * 60 * 1000) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Install Innkt</h3>
              <p className="text-sm text-gray-600">Get the app experience</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits */}
        <div className="mb-4">
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center space-x-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Faster loading and better performance</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Works offline with cached content</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Push notifications for updates</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>App-like experience on your device</span>
            </li>
          </ul>
        </div>

        {/* Connection Status */}
        <div className="mb-4 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 text-sm">
            {isOnline ? (
              <>
                <WifiIcon className="w-4 h-4 text-green-500" />
                <span className="text-green-700">Online - Ready to install</span>
              </>
            ) : (
              <>
                <WifiSlashIcon className="w-4 h-4 text-red-500" />
                <span className="text-red-700">Offline - Install when online</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={handleInstall}
            disabled={isInstalling || !isOnline}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>{isInstalling ? 'Installing...' : 'Install'}</span>
          </button>
          <button
            onClick={handleLater}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Later
          </button>
        </div>

        {/* App Info */}
        {appInfo && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <div>Service Worker: {appInfo.hasServiceWorker ? '✓' : '✗'}</div>
              <div>Notifications: {appInfo.hasNotifications ? '✓' : '✗'}</div>
              <div>Offline Storage: {appInfo.hasIndexedDB ? '✓' : '✗'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
