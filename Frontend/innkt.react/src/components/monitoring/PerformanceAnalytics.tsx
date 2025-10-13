import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { monitoringService, PerformanceMetrics } from '../../services/monitoring.service';

const PerformanceAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const [selectedService, setSelectedService] = useState<string>('officer');
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (autoRefresh) {
      loadMetrics();
      const interval = setInterval(loadMetrics, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedService, timeRange, autoRefresh]);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const performanceMetrics = await monitoringService.getPerformanceMetrics(selectedService, timeRange);
      setMetrics([performanceMetrics]); // Wrap in array since metrics expects PerformanceMetrics[]
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLatestMetrics = () => {
    return metrics.length > 0 ? metrics[metrics.length - 1] : null;
  };

  const getAverageMetric = (key: string) => {
    if (metrics.length === 0) return 0;
    
    const getNestedValue = (obj: PerformanceMetrics, path: string): number => {
      const keys = path.split('.');
      let value: any = obj;
      for (const k of keys) {
        value = value[k];
      }
      return typeof value === 'number' ? value : 0;
    };
    
    const values = metrics.map(m => getNestedValue(m, key)).filter(v => typeof v === 'number') as number[];
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  const getTrend = (key: string) => {
    if (metrics.length < 2) return 'stable';
    const recent = metrics.slice(-3);
    const older = metrics.slice(-6, -3);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const getNestedValue = (obj: PerformanceMetrics, path: string): number => {
      const keys = path.split('.');
      let value: any = obj;
      for (const k of keys) {
        value = value[k];
      }
      return typeof value === 'number' ? value : 0;
    };
    
    const recentAvg = recent.reduce((sum, m) => sum + getNestedValue(m, key), 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + getNestedValue(m, key), 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-red-600';
      case 'decreasing': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatMetricValue = (value: number, unit: string = '') => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M${unit}`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K${unit}`;
    return `${value.toFixed(1)}${unit}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatTime = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
    return `${value.toFixed(1)}ms`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Performance Analytics</h3>
          <p className="text-sm text-gray-600">Monitor real-time performance metrics and trends</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="input-field text-sm"
          >
            <option value="officer">Officer Service</option>
            <option value="neurospark">NeuroSpark Service</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field text-sm"
          >
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 text-innkt-primary focus:ring-innkt-primary border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Auto-refresh</span>
          </label>
          <button
            onClick={loadMetrics}
            disabled={isLoading}
            className="btn-secondary text-sm px-3 py-2"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Current Metrics Overview */}
      {getLatestMetrics() && (
        <div className="card">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Current Performance</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage(getLatestMetrics()!.system.cpuUsage)}
              </div>
              <div className="text-sm text-gray-600">CPU Usage</div>
              <div className={`text-xs mt-1 ${getTrendColor(getTrend('system.cpuUsage'))}`}>
                {getTrendIcon(getTrend('system.cpuUsage'))} {getTrend('system.cpuUsage')}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(getLatestMetrics()!.system.memoryUsage)}
              </div>
              <div className="text-sm text-gray-600">Memory Usage</div>
              <div className={`text-xs mt-1 ${getTrendColor(getTrend('system.memoryUsage'))}`}>
                {getTrendIcon(getTrend('system.memoryUsage'))} {getTrend('system.memoryUsage')}
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatTime(getLatestMetrics()!.system.networkLatency)}
              </div>
              <div className="text-sm text-gray-600">P95 Response Time</div>
              <div className={`text-xs mt-1 ${getTrendColor(getTrend('system.networkLatency'))}`}>
                {getTrendIcon(getTrend('system.networkLatency'))} {getTrend('system.networkLatency')}
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {formatMetricValue(getLatestMetrics()!.kafka.throughput, '/s')}
              </div>
              <div className="text-sm text-gray-600">Request Rate</div>
              <div className={`text-xs mt-1 ${getTrendColor(getTrend('kafka.throughput'))}`}>
                {getTrendIcon(getTrend('kafka.throughput'))} {getTrend('kafka.throughput')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Resources */}
        <div className="card">
          <h4 className="text-md font-semibold text-gray-900 mb-4">System Resources</h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">CPU Usage</span>
                <span className="font-medium">{formatPercentage(getAverageMetric('system.cpuUsage'))}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getLatestMetrics()?.system.cpuUsage || 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Memory Usage</span>
                <span className="font-medium">{formatPercentage(getAverageMetric('system.memoryUsage'))}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getLatestMetrics()?.system.memoryUsage || 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Disk Usage</span>
                <span className="font-medium">{formatPercentage(getAverageMetric('system.diskUsage'))}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getLatestMetrics()?.system.diskUsage || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Network & Performance */}
        <div className="card">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Network & Performance</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Network Latency</span>
              <span className="font-medium">{formatTime(getAverageMetric('system.networkLatency'))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Connections</span>
              <span className="font-medium">{formatMetricValue(getAverageMetric('connection.reconnectAttempts'))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className="font-medium">{formatPercentage(getAverageMetric('kafka.errors'))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Request Rate</span>
              <span className="font-medium">{formatMetricValue(getAverageMetric('kafka.throughput'), '/s')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Response Time Distribution */}
      <div className="card">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Response Time Distribution</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">
              {formatTime(getLatestMetrics()?.system.networkLatency || 0)}
            </div>
            <div className="text-sm text-gray-600">P50 (Median)</div>
            <div className="text-xs text-gray-500 mt-1">50% of requests</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">
              {formatTime(getLatestMetrics()?.system.networkLatency || 0)}
            </div>
            <div className="text-sm text-gray-600">P95</div>
            <div className="text-xs text-gray-500 mt-1">95% of requests</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">
              {formatTime(getLatestMetrics()?.system.networkLatency || 0)}
            </div>
            <div className="text-sm text-gray-600">P99</div>
            <div className="text-xs text-gray-500 mt-1">99% of requests</div>
          </div>
        </div>
      </div>

      {/* Metrics History */}
      {metrics.length > 0 && (
        <div className="card">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Metrics History</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Memory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requests/s
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Errors
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.slice(-10).reverse().map((metric, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(metric.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPercentage(metric.system.cpuUsage)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPercentage(metric.system.memoryUsage)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(metric.system.networkLatency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatMetricValue(metric.kafka.throughput, '/s')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPercentage(metric.kafka.errors)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {metrics.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-400">📊</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No performance data available</h3>
          <p className="text-gray-500 mb-4">
            Performance metrics will appear here once data is collected from the {selectedService} service.
          </p>
          <button
            onClick={loadMetrics}
            className="btn-primary px-4 py-2"
          >
            Load Metrics
          </button>
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalytics;
