import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { databaseOptimizationService, DatabaseHealthReport, SlowQuery, TableStats, IndexStats } from '../../services/databaseOptimization.service';
import { 
  ChartBarIcon, 
  CpuChipIcon, 
  CircleStackIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  WrenchScrewdriverIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface DatabaseOptimizationDashboardProps {
  className?: string;
}

const DatabaseOptimizationDashboard: React.FC<DatabaseOptimizationDashboardProps> = ({
  className = ''
}) => {
  const { t } = useTranslation();
  const [healthReport, setHealthReport] = useState<DatabaseHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'cache' | 'tables' | 'indexes'>('overview');
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    loadHealthReport();
  }, []);

  const loadHealthReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const report = await databaseOptimizationService.getDatabaseHealth();
      setHealthReport(report);
    } catch (err: any) {
      setError(err.message || 'Failed to load database health report');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeDatabase = async () => {
    try {
      setOptimizing(true);
      await databaseOptimizationService.optimizeDatabase();
      await loadHealthReport();
    } catch (err: any) {
      setError(err.message || 'Failed to optimize database');
    } finally {
      setOptimizing(false);
    }
  };

  const handleCreateIndexes = async () => {
    try {
      setOptimizing(true);
      await databaseOptimizationService.createIndexes();
      await loadHealthReport();
    } catch (err: any) {
      setError(err.message || 'Failed to create indexes');
    } finally {
      setOptimizing(false);
    }
  };

  const handleUpdateStatistics = async () => {
    try {
      setOptimizing(true);
      await databaseOptimizationService.updateStatistics();
      await loadHealthReport();
    } catch (err: any) {
      setError(err.message || 'Failed to update statistics');
    } finally {
      setOptimizing(false);
    }
  };

  const handleVacuumDatabase = async () => {
    try {
      setOptimizing(true);
      await databaseOptimizationService.vacuumDatabase();
      await loadHealthReport();
    } catch (err: any) {
      setError(err.message || 'Failed to vacuum database');
    } finally {
      setOptimizing(false);
    }
  };

  const handleFlushCache = async () => {
    try {
      setOptimizing(true);
      await databaseOptimizationService.flushCache();
      await loadHealthReport();
    } catch (err: any) {
      setError(err.message || 'Failed to flush cache');
    } finally {
      setOptimizing(false);
    }
  };

  const renderOverview = () => {
    if (!healthReport) return null;

    const { databaseStats, queryPerformance, connectionPool, cacheStats, slowQueries } = healthReport;

    return (
      <div className="space-y-6">
        {/* Health Score */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Database Health Score</h3>
            <div className={`text-3xl font-bold ${databaseOptimizationService.getHealthScoreColor(healthReport.healthScore)}`}>
              {healthReport.healthScore}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${databaseOptimizationService.getHealthScoreColor(healthReport.healthScore)}`}>
              {databaseOptimizationService.getHealthScoreLabel(healthReport.healthScore)}
            </span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  healthReport.healthScore >= 90 ? 'bg-green-500' :
                  healthReport.healthScore >= 70 ? 'bg-yellow-500' :
                  healthReport.healthScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${healthReport.healthScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CircleStackIcon className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tables</p>
                <p className="text-2xl font-semibold text-gray-900">{databaseStats.totalTables}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Indexes</p>
                <p className="text-2xl font-semibold text-gray-900">{databaseStats.totalIndexes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CpuChipIcon className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Connections</p>
                <p className="text-2xl font-semibold text-gray-900">{connectionPool.activeConnections}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Slow Queries</p>
                <p className="text-2xl font-semibold text-gray-900">{slowQueries.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Database Size */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Size</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Size</p>
              <p className="text-2xl font-semibold text-gray-900">
                {databaseOptimizationService.formatBytes(databaseStats.totalSize)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Index Size</p>
              <p className="text-2xl font-semibold text-gray-900">
                {databaseOptimizationService.formatBytes(databaseStats.indexSize)}
              </p>
            </div>
          </div>
        </div>

        {/* Connection Pool Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Pool</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Connections</p>
              <p className="text-2xl font-semibold text-gray-900">{connectionPool.activeConnections}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Max Connections</p>
              <p className="text-2xl font-semibold text-gray-900">{connectionPool.maxConnections}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Usage</p>
              <p className={`text-2xl font-semibold ${databaseOptimizationService.getConnectionUsageColor(
                databaseOptimizationService.getConnectionUsagePercentage(connectionPool.activeConnections, connectionPool.maxConnections)
              )}`}>
                {databaseOptimizationService.getConnectionUsagePercentage(connectionPool.activeConnections, connectionPool.maxConnections)}%
              </p>
            </div>
          </div>
        </div>

        {/* Cache Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cache Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Keys</p>
              <p className="text-2xl font-semibold text-gray-900">{cacheStats.totalKeys}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Memory Usage</p>
              <p className="text-2xl font-semibold text-gray-900">{cacheStats.usedMemory}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Hit Rate</p>
              <p className={`text-2xl font-semibold ${databaseOptimizationService.getCacheHitRateColor(cacheStats.hitRate)}`}>
                {cacheStats.hitRate}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPerformance = () => {
    if (!healthReport) return null;

    const { queryPerformance, slowQueries } = healthReport;

    return (
      <div className="space-y-6">
        {/* Query Performance Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Query Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Queries</p>
              <p className="text-2xl font-semibold text-gray-900">{queryPerformance.totalQueries}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Average Execution Time</p>
              <p className={`text-2xl font-semibold ${databaseOptimizationService.getQueryPerformanceColor(queryPerformance.averageExecutionTime)}`}>
                {databaseOptimizationService.formatDuration(queryPerformance.averageExecutionTime)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Slow Queries</p>
              <p className="text-2xl font-semibold text-gray-900">{queryPerformance.slowQueries}</p>
            </div>
          </div>
        </div>

        {/* Slow Queries */}
        {slowQueries.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Slow Queries</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Execution Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Call Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Executed</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {slowQueries.map((query, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                        {query.query}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${databaseOptimizationService.getQueryPerformanceColor(query.executionTime)}`}>
                        {databaseOptimizationService.formatDuration(query.executionTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {query.callCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(query.lastExecuted).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCache = () => {
    if (!healthReport) return null;

    const { cacheStats } = healthReport;

    return (
      <div className="space-y-6">
        {/* Cache Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cache Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Connected Clients</p>
              <p className="text-2xl font-semibold text-gray-900">{cacheStats.connectedClients}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Memory Usage</p>
              <p className="text-2xl font-semibold text-gray-900">{cacheStats.usedMemory}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Keys</p>
              <p className="text-2xl font-semibold text-gray-900">{cacheStats.totalKeys}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Hit Rate</p>
              <p className={`text-2xl font-semibold ${databaseOptimizationService.getCacheHitRateColor(cacheStats.hitRate)}`}>
                {cacheStats.hitRate}
              </p>
            </div>
          </div>
        </div>

        {/* Cache Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cache Management</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleFlushCache}
              disabled={optimizing}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Flush Cache</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTables = () => {
    if (!healthReport) return null;

    const { databaseStats } = healthReport;

    return (
      <div className="space-y-6">
        {/* Table Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Table Statistics</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Live Tuples</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dead Tuples</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inserts</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deletes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {databaseStats.tableStats.map((table, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {table.tableName}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${databaseOptimizationService.getTableSizeColor(table.sizeBytes)}`}>
                      {table.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {table.liveTuples.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {table.deadTuples.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {table.inserts.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {table.updates.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {table.deletes.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderIndexes = () => {
    if (!healthReport) return null;

    const { databaseStats } = healthReport;

    return (
      <div className="space-y-6">
        {/* Index Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Index Statistics</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Index</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scans</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tuples Read</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {databaseStats.indexStats.map((index, indexIndex) => (
                  <tr key={indexIndex}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index.indexName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index.tableName}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${databaseOptimizationService.getTableSizeColor(index.sizeBytes)}`}>
                      {index.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index.scans.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index.tuplesRead.toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${databaseOptimizationService.getIndexEfficiencyColor(index.scans, index.tuplesRead)}`}>
                      {index.scans > 0 ? (index.tuplesRead / index.scans).toFixed(2) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading database health report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadHealthReport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Database Optimization</h1>
            <p className="text-gray-600">Monitor and optimize database performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={loadHealthReport}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleOptimizeDatabase}
              disabled={optimizing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <WrenchScrewdriverIcon className={`w-4 h-4 ${optimizing ? 'animate-spin' : ''}`} />
              <span>Optimize</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: EyeIcon },
            { id: 'performance', name: 'Performance', icon: ChartBarIcon },
            { id: 'cache', name: 'Cache', icon: CpuChipIcon },
            { id: 'tables', name: 'Tables', icon: CircleStackIcon },
            { id: 'indexes', name: 'Indexes', icon: ChartBarIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'performance' && renderPerformance()}
      {activeTab === 'cache' && renderCache()}
      {activeTab === 'tables' && renderTables()}
      {activeTab === 'indexes' && renderIndexes()}
    </div>
  );
};

export default DatabaseOptimizationDashboard;
