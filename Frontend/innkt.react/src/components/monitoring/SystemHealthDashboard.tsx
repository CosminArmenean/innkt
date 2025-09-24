import React, { useState, useEffect } from 'react';
import { monitoringService, ServiceHealth, SystemAlert } from '../../services/monitoring.service';

const SystemHealthDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [selectedService, setSelectedService] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  useEffect(() => {
    loadSystemHealth();
    const interval = setInterval(loadSystemHealth, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    loadAlerts();
  }, [selectedService]);

  const loadSystemHealth = async () => {
    try {
      setIsLoading(true);
      const health = await monitoringService.getSystemHealth();
      setSystemHealth(health);
    } catch (error) {
      console.error('Failed to load system health:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const serviceAlerts = await monitoringService.getSystemAlerts(
        selectedService === 'all' ? undefined : selectedService
      );
      setAlerts(serviceAlerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await monitoringService.acknowledgeAlert(alertId, 'current-user');
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, isAcknowledged: true, acknowledgedBy: 'current-user', acknowledgedAt: new Date().toISOString() }
          : alert
      ));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '🟢';
      case 'degraded': return '🟡';
      case 'unhealthy': return '🔴';
      default: return '⚪';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading && !systemHealth) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-innkt-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">System Health Dashboard</h3>
          <p className="text-sm text-gray-600">Monitor the health and performance of all services</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="input-field text-sm"
          >
            <option value={15}>15s refresh</option>
            <option value={30}>30s refresh</option>
            <option value={60}>1m refresh</option>
            <option value={300}>5m refresh</option>
          </select>
          <button
            onClick={loadSystemHealth}
            className="btn-secondary text-sm px-3 py-2"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Overall System Status */}
      {systemHealth && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-900">System Overview</h4>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(systemHealth.overallHealth)}`}>
                {getStatusIcon(systemHealth.overallHealth)} {systemHealth.overallHealth.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {systemHealth.performanceSummary.totalRequests.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {systemHealth.performanceSummary.averageResponseTime.toFixed(2)}ms
              </div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {systemHealth.performanceSummary.errorRate.toFixed(2)}%
              </div>
              <div className="text-sm text-gray-600">Error Rate</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {formatUptime(systemHealth.performanceSummary.uptime)}
              </div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      )}

      {/* Service Health Status */}
      {systemHealth && (
        <div className="card">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Service Health</h4>
          <div className="space-y-4">
            {systemHealth.services.map((service: ServiceHealth) => (
              <div key={service.serviceName} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getStatusIcon(service.status)}</span>
                    <div>
                      <h5 className="font-medium text-gray-900 capitalize">
                        {service.serviceName} Service
                      </h5>
                      <p className="text-sm text-gray-500">Version {service.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}>
                      {service.status.toUpperCase()}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {service.responseTime}ms
                      </div>
                      <div className="text-xs text-gray-500">Response Time</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Uptime:</span>
                    <div className="text-gray-900">{formatUptime(service.uptime)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Last Check:</span>
                    <div className="text-gray-900">
                      {new Date(service.lastCheck).toLocaleTimeString()}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Endpoints:</span>
                    <div className="text-gray-900">{service.endpoints.length}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Errors:</span>
                    <div className="text-gray-900">
                      {service.errorCount}
                    </div>
                  </div>
                </div>

                {/* Endpoint Details */}
                <div className="mt-3 pt-3 border-t">
                  <h6 className="text-sm font-medium text-gray-700 mb-2">Endpoints</h6>
                  <div className="space-y-2">
                    {service.endpoints.map((endpoint, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{endpoint.name}: {endpoint.path}</span>
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(endpoint.status)}`}>
                            {endpoint.status}
                          </span>
                          <span className="text-gray-500">{endpoint.responseTime}ms</span>
                          {endpoint.errorCount > 0 && (
                            <span className="text-red-600 text-xs">
                              {endpoint.errorCount} errors
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Alerts */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-gray-900">System Alerts</h4>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="input-field text-sm"
          >
            <option value="all">All Services</option>
            <option value="officer">Officer Service</option>
            <option value="neurospark">NeuroSpark Service</option>
          </select>
        </div>

        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✅</span>
              </div>
              <p>No active alerts</p>
              <p className="text-sm">All systems are running normally</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-sm">{alert.title}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{alert.description}</p>
                    <div className="flex items-center space-x-4 text-xs">
                      <span>Service: {alert.serviceName}</span>
                      <span>Time: {new Date(alert.timestamp).toLocaleString()}</span>
                      {alert.isAcknowledged && (
                        <span>Acknowledged by {alert.acknowledgedBy}</span>
                      )}
                    </div>
                  </div>
                  {!alert.isAcknowledged && (
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="btn-secondary text-xs px-3 py-1 ml-4"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemHealthDashboard;
