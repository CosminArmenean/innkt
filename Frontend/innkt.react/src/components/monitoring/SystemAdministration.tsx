import React, { useState, useEffect } from 'react';

interface ServiceConfig {
  serviceName: string;
  isEnabled: boolean;
  maxConnections: number;
  timeout: number;
  retryAttempts: number;
  logLevel: string;
  environment: string;
}

interface SystemConfig {
  maintenanceMode: boolean;
  debugMode: boolean;
  logRetention: number;
  backupEnabled: boolean;
  autoScaling: boolean;
  maxInstances: number;
}

const SystemAdministration: React.FC = () => {
  const [serviceConfigs, setServiceConfigs] = useState<ServiceConfig[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    maintenanceMode: false,
    debugMode: false,
    logRetention: 30,
    backupEnabled: true,
    autoScaling: true,
    maxInstances: 5
  });
  const [selectedService, setSelectedService] = useState<string>('officer');
  const [isLoading, setIsLoading] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('');

  useEffect(() => {
    loadServiceConfigs();
  }, []);

  const loadServiceConfigs = async () => {
    // TODO: Load actual service configurations from backend
    setServiceConfigs([
      {
        serviceName: 'officer',
        isEnabled: true,
        maxConnections: 1000,
        timeout: 30000,
        retryAttempts: 3,
        logLevel: 'info',
        environment: 'production'
      },
      {
        serviceName: 'neurospark',
        isEnabled: true,
        maxConnections: 500,
        timeout: 60000,
        retryAttempts: 2,
        logLevel: 'debug',
        environment: 'production'
      }
    ]);
  };

  const handleServiceToggle = async (serviceName: string, enabled: boolean) => {
    try {
      setIsLoading(true);
      // TODO: Call backend to toggle service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setServiceConfigs(prev => prev.map(config =>
        config.serviceName === serviceName
          ? { ...config, isEnabled: enabled }
          : config
      ));
    } catch (error) {
      console.error('Failed to toggle service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigUpdate = async (serviceName: string, updates: Partial<ServiceConfig>) => {
    try {
      setIsLoading(true);
      // TODO: Call backend to update service configuration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setServiceConfigs(prev => prev.map(config =>
        config.serviceName === serviceName
          ? { ...config, ...updates }
          : config
      ));
    } catch (error) {
      console.error('Failed to update service configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSystemConfigUpdate = async (updates: Partial<SystemConfig>) => {
    try {
      setIsLoading(true);
      // TODO: Call backend to update system configuration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSystemConfig(prev => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Failed to update system configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaintenanceMode = async () => {
    if (!maintenanceReason.trim()) return;
    
    try {
      setIsLoading(true);
      await handleSystemConfigUpdate({ maintenanceMode: true });
      setShowMaintenanceModal(false);
      setMaintenanceReason('');
    } catch (error) {
      console.error('Failed to enable maintenance mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestartService = async (serviceName: string) => {
    if (!window.confirm(`Are you sure you want to restart the ${serviceName} service?`)) {
      return;
    }

    try {
      setIsLoading(true);
      // TODO: Call backend to restart service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reload configurations after restart
      await loadServiceConfigs();
    } catch (error) {
      console.error('Failed to restart service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupNow = async () => {
    try {
      setIsLoading(true);
      // TODO: Call backend to trigger backup
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Show success message
      alert('Backup completed successfully!');
    } catch (error) {
      console.error('Failed to create backup:', error);
      alert('Backup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentServiceConfig = () => {
    return serviceConfigs.find(config => config.serviceName === selectedService);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">System Administration</h3>
          <p className="text-sm text-gray-600">Manage system configuration and service settings</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowMaintenanceModal(true)}
            disabled={systemConfig.maintenanceMode}
            className="btn-secondary text-sm px-4 py-2"
          >
            Enable Maintenance Mode
          </button>
          <button
            onClick={handleBackupNow}
            disabled={isLoading}
            className="btn-primary text-sm px-4 py-2"
          >
            {isLoading ? 'Creating...' : 'Backup Now'}
          </button>
        </div>
      </div>

      {/* System Configuration */}
      <div className="card">
        <h4 className="text-md font-semibold text-gray-900 mb-4">System Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Maintenance Mode</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemConfig.maintenanceMode}
                  onChange={(e) => handleSystemConfigUpdate({ maintenanceMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-innkt-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-innkt-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Debug Mode</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemConfig.debugMode}
                  onChange={(e) => handleSystemConfigUpdate({ debugMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-innkt-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-innkt-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Auto Scaling</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemConfig.autoScaling}
                  onChange={(e) => handleSystemConfigUpdate({ autoScaling: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-innkt-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-innkt-primary"></div>
              </label>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Log Retention (days)</label>
              <input
                type="number"
                value={systemConfig.logRetention}
                onChange={(e) => handleSystemConfigUpdate({ logRetention: Number(e.target.value) })}
                className="input-field w-full"
                min="1"
                max="365"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Instances</label>
              <input
                type="number"
                value={systemConfig.maxInstances}
                onChange={(e) => handleSystemConfigUpdate({ maxInstances: Number(e.target.value) })}
                className="input-field w-full"
                min="1"
                max="20"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Backup Enabled</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemConfig.backupEnabled}
                  onChange={(e) => handleSystemConfigUpdate({ backupEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-innkt-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-innkt-primary"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Service Management */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-gray-900">Service Management</h4>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="input-field text-sm"
          >
            <option value="officer">Officer Service</option>
            <option value="neurospark">NeuroSpark Service</option>
          </select>
        </div>

        {getCurrentServiceConfig() && (
          <div className="space-y-6">
            {/* Service Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className={`w-3 h-3 rounded-full ${
                  getCurrentServiceConfig()!.isEnabled ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                <div>
                  <h5 className="font-medium text-gray-900 capitalize">
                    {selectedService} Service
                  </h5>
                  <p className="text-sm text-gray-500">
                    Status: {getCurrentServiceConfig()!.isEnabled ? 'Running' : 'Stopped'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleServiceToggle(selectedService, !getCurrentServiceConfig()!.isEnabled)}
                  disabled={isLoading}
                  className={`px-3 py-2 text-sm rounded ${
                    getCurrentServiceConfig()!.isEnabled
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {getCurrentServiceConfig()!.isEnabled ? 'Stop' : 'Start'}
                </button>
                <button
                  onClick={() => handleRestartService(selectedService)}
                  disabled={isLoading || !getCurrentServiceConfig()!.isEnabled}
                  className="btn-secondary text-sm px-3 py-2"
                >
                  Restart
                </button>
              </div>
            </div>

            {/* Service Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Connections</label>
                  <input
                    type="number"
                    value={getCurrentServiceConfig()!.maxConnections}
                    onChange={(e) => handleConfigUpdate(selectedService, { maxConnections: Number(e.target.value) })}
                    className="input-field w-full"
                    min="100"
                    max="10000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timeout (ms)</label>
                  <input
                    type="number"
                    value={getCurrentServiceConfig()!.timeout}
                    onChange={(e) => handleConfigUpdate(selectedService, { timeout: Number(e.target.value) })}
                    className="input-field w-full"
                    min="1000"
                    max="300000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Retry Attempts</label>
                  <input
                    type="number"
                    value={getCurrentServiceConfig()!.retryAttempts}
                    onChange={(e) => handleConfigUpdate(selectedService, { retryAttempts: Number(e.target.value) })}
                    className="input-field w-full"
                    min="0"
                    max="10"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Log Level</label>
                  <select
                    value={getCurrentServiceConfig()!.logLevel}
                    onChange={(e) => handleConfigUpdate(selectedService, { logLevel: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="trace">Trace</option>
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Error</option>
                    <option value="fatal">Fatal</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
                  <select
                    value={getCurrentServiceConfig()!.environment}
                    onChange={(e) => handleConfigUpdate(selectedService, { environment: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>
                
                <div className="pt-6">
                  <button
                    onClick={() => handleConfigUpdate(selectedService, getCurrentServiceConfig()!)}
                    disabled={isLoading}
                    className="w-full btn-primary py-2"
                  >
                    {isLoading ? 'Updating...' : 'Update Configuration'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Maintenance Mode Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enable Maintenance Mode</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will put the system into maintenance mode. Users will see a maintenance page and no new requests will be processed.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Maintenance</label>
              <textarea
                value={maintenanceReason}
                onChange={(e) => setMaintenanceReason(e.target.value)}
                placeholder="Describe the reason for maintenance..."
                rows={3}
                className="input-field w-full"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleMaintenanceMode}
                disabled={!maintenanceReason.trim() || isLoading}
                className="btn-primary flex-1"
              >
                {isLoading ? 'Enabling...' : 'Enable Maintenance Mode'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemAdministration;
