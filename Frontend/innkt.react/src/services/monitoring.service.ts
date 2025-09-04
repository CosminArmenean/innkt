import { BaseApiService, officerApi, neurosparkApi } from './api.service';

export interface ServiceHealth {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastCheck: string;
  uptime: number;
  version: string;
  endpoints: EndpointHealth[];
}

export interface EndpointHealth {
  name: string;
  path: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: string;
  errorCount: number;
}

export interface PerformanceMetrics {
  serviceName: string;
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  activeConnections: number;
  requestRate: number;
  errorRate: number;
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
  };
}

export interface SystemAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  serviceName: string;
  timestamp: string;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolution?: string;
}

export interface MonitoringDashboard {
  overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealth[];
  recentAlerts: SystemAlert[];
  performanceSummary: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

export class MonitoringService extends BaseApiService {
  constructor() {
    super(officerApi); // Base service, but we'll make calls to both services
  }

  // Get overall system health
  async getSystemHealth(): Promise<MonitoringDashboard> {
    try {
      // Check both services
      const [officerHealth, neurosparkHealth] = await Promise.all([
        this.checkServiceHealth('officer'),
        this.checkServiceHealth('neurospark')
      ]);

      const services = [officerHealth, neurosparkHealth];
      const overallHealth = this.calculateOverallHealth(services);

      return {
        overallHealth,
        services,
        recentAlerts: [], // TODO: Implement alerts
        performanceSummary: {
          totalRequests: services.reduce((sum, s) => sum + (s.endpoints?.[0]?.responseTime || 0), 0),
          averageResponseTime: services.reduce((sum, s) => sum + (s.endpoints?.[0]?.responseTime || 0), 0) / services.length,
          errorRate: 0, // TODO: Calculate from metrics
          uptime: Math.min(...services.map(s => s.uptime))
        }
      };
    } catch (error) {
      console.error('Failed to get system health:', error);
      throw error;
    }
  }

  // Check individual service health
  async checkServiceHealth(serviceName: string): Promise<ServiceHealth> {
    const baseUrl = serviceName === 'officer' ? officerApi.defaults.baseURL : neurosparkApi.defaults.baseURL;
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/health`);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const healthData = await response.json();
        return {
          serviceName,
          status: 'healthy',
          responseTime,
          lastCheck: new Date().toISOString(),
          uptime: healthData.uptime || 0,
          version: healthData.version || 'unknown',
          endpoints: [
            {
              name: 'Health Check',
              path: '/health',
              status: 'healthy',
              responseTime,
              lastCheck: new Date().toISOString(),
              errorCount: 0
            }
          ]
        };
      } else {
        return {
          serviceName,
          status: 'unhealthy',
          responseTime,
          lastCheck: new Date().toISOString(),
          uptime: 0,
          version: 'unknown',
          endpoints: [
            {
              name: 'Health Check',
              path: '/health',
              status: 'unhealthy',
              responseTime,
              lastCheck: new Date().toISOString(),
              errorCount: 1
            }
          ]
        };
      }
    } catch (error) {
      return {
        serviceName,
        status: 'unknown',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        uptime: 0,
        version: 'unknown',
        endpoints: [
          {
            name: 'Health Check',
            path: '/health',
            status: 'unhealthy',
            responseTime: 0,
            lastCheck: new Date().toISOString(),
            errorCount: 1
          }
        ]
      };
    }
  }

  // Get performance metrics for a service
  async getPerformanceMetrics(serviceName: string, timeRange: string = '1h'): Promise<PerformanceMetrics[]> {
    try {
      const baseUrl = serviceName === 'officer' ? officerApi.defaults.baseURL : neurosparkApi.defaults.baseURL;
      const response = await fetch(`${baseUrl}/metrics?range=${timeRange}`);
      
      if (response.ok) {
        const metrics = await response.json();
        return metrics.map((metric: any) => ({
          serviceName,
          timestamp: metric.timestamp,
          cpuUsage: metric.cpu || 0,
          memoryUsage: metric.memory || 0,
          diskUsage: metric.disk || 0,
          networkLatency: metric.network || 0,
          activeConnections: metric.connections || 0,
          requestRate: metric.requests || 0,
          errorRate: metric.errors || 0,
          responseTime: {
            p50: metric.responseTime?.p50 || 0,
            p95: metric.responseTime?.p95 || 0,
            p99: metric.responseTime?.p99 || 0
          }
        }));
      }
      
      return [];
    } catch (error) {
      console.error(`Failed to get performance metrics for ${serviceName}:`, error);
      return [];
    }
  }

  // Get system alerts
  async getSystemAlerts(serviceName?: string): Promise<SystemAlert[]> {
    try {
      // TODO: Implement actual alert fetching from backend
      // For now, return mock data
      return [
        {
          id: '1',
          severity: 'medium' as const,
          title: 'High Memory Usage',
          description: 'Memory usage is above 80% threshold',
          serviceName: 'neurospark',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          isAcknowledged: false
        },
        {
          id: '2',
          severity: 'low' as const,
          title: 'Slow Response Time',
          description: 'API response time is above normal threshold',
          serviceName: 'officer',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          isAcknowledged: true,
          acknowledgedBy: 'admin',
          acknowledgedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        }
      ].filter(alert => !serviceName || alert.serviceName === serviceName);
    } catch (error) {
      console.error('Failed to get system alerts:', error);
      return [];
    }
  }

  // Acknowledge an alert
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    try {
      // TODO: Implement actual alert acknowledgment
      console.log(`Alert ${alertId} acknowledged by ${acknowledgedBy}`);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      throw error;
    }
  }

  // Get service logs
  async getServiceLogs(serviceName: string, level: string = 'info', limit: number = 100): Promise<any[]> {
    try {
      const baseUrl = serviceName === 'officer' ? officerApi.defaults.baseURL : neurosparkApi.defaults.baseURL;
      const response = await fetch(`${baseUrl}/logs?level=${level}&limit=${limit}`);
      
      if (response.ok) {
        return await response.json();
      }
      
      return [];
    } catch (error) {
      console.error(`Failed to get logs for ${serviceName}:`, error);
      return [];
    }
  }

  // Calculate overall system health
  private calculateOverallHealth(services: ServiceHealth[]): 'healthy' | 'degraded' | 'unhealthy' {
    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    
    if (unhealthyCount > 0) return 'unhealthy';
    if (healthyCount === services.length) return 'healthy';
    return 'degraded';
  }
}

export const monitoringService = new MonitoringService();
