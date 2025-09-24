export interface PerformanceMetrics {
  connection: {
    isConnected: boolean;
    reconnectAttempts: number;
    lastPing: number;
  };
  notifications: {
    totalReceived: number;
    totalRead: number;
    byType: Record<string, number>;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
  kafka: {
    consumerLag: number;
    messagesProcessed: number;
    errors: number;
    throughput: number;
  };
  timestamp: number;
}

export interface EndpointInfo {
  name: string;
  path: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  errorCount: number;
}

export interface ServiceHealth {
  service: string;
  serviceName: string;
  version: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  responseTime: number;
  lastCheck: string;
  issues: string[];
  endpoints: EndpointInfo[];
  errorCount: number;
}

export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  description: string;
  timestamp: string;
  service: string;
  serviceName: string;
  resolved: boolean;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

class MonitoringService {
  private connectionMetrics = {
    isConnected: false,
    reconnectAttempts: 0,
    lastPing: 0
  };

  private notificationMetrics = {
    totalReceived: 0,
    totalRead: 0,
    byType: {} as Record<string, number>
  };

  updateConnectionStatus(isConnected: boolean) {
    this.connectionMetrics.isConnected = isConnected;
  }

  incrementNotificationReceived(type: string) {
    this.notificationMetrics.totalReceived++;
    this.notificationMetrics.byType[type] = (this.notificationMetrics.byType[type] || 0) + 1;
  }

  incrementNotificationRead() {
    this.notificationMetrics.totalRead++;
  }

  getHealthStatus() {
      return {
      isHealthy: this.connectionMetrics.isConnected,
      metrics: {
        connection: this.connectionMetrics,
        notifications: this.notificationMetrics,
        timestamp: Date.now()
      }
    };
  }

  async getPerformanceMetrics(service?: string, timeRange?: string): Promise<PerformanceMetrics> {
    // For now, return mock metrics regardless of service and timeRange
    // In a real implementation, you would filter by service and time range
    return {
      connection: this.connectionMetrics,
      notifications: this.notificationMetrics,
      system: {
        cpuUsage: Math.random() * 100, // Mock CPU usage 0-100%
        memoryUsage: Math.random() * 100, // Mock memory usage 0-100%
        diskUsage: Math.random() * 100, // Mock disk usage 0-100%
        networkLatency: Math.random() * 100 // Mock latency 0-100ms
      },
      kafka: {
        consumerLag: Math.floor(Math.random() * 1000), // Mock lag 0-1000 messages
        messagesProcessed: Math.floor(Math.random() * 10000), // Mock processed messages
        errors: Math.floor(Math.random() * 10), // Mock errors 0-10
        throughput: Math.random() * 1000 // Mock throughput 0-1000 msg/s
      },
      timestamp: Date.now()
    };
  }

  async getServiceHealth(): Promise<ServiceHealth[]> {
    // Mock service health data
    const services = [
      { 
        service: 'officer', 
        serviceName: 'Officer Service', 
        version: '1.2.3',
          endpoints: [
          { name: 'Authentication', path: '/api/auth', status: 'healthy' as const, responseTime: Math.floor(Math.random() * 200), errorCount: Math.floor(Math.random() * 3) },
          { name: 'Users', path: '/api/users', status: 'healthy' as const, responseTime: Math.floor(Math.random() * 200), errorCount: Math.floor(Math.random() * 3) },
          { name: 'Accounts', path: '/api/accounts', status: 'healthy' as const, responseTime: Math.floor(Math.random() * 200), errorCount: Math.floor(Math.random() * 3) },
          { name: 'Kids', path: '/api/kids', status: 'healthy' as const, responseTime: Math.floor(Math.random() * 200), errorCount: Math.floor(Math.random() * 3) }
        ]
      },
      { 
        service: 'social', 
        serviceName: 'Social Service', 
        version: '2.1.0',
        endpoints: [
          { name: 'Posts', path: '/api/posts', status: 'healthy' as const, responseTime: Math.floor(Math.random() * 200), errorCount: Math.floor(Math.random() * 3) },
          { name: 'Comments', path: '/api/comments', status: 'healthy' as const, responseTime: Math.floor(Math.random() * 200), errorCount: Math.floor(Math.random() * 3) },
          { name: 'Likes', path: '/api/likes', status: 'healthy' as const, responseTime: Math.floor(Math.random() * 200), errorCount: Math.floor(Math.random() * 3) },
          { name: 'Follows', path: '/api/follows', status: 'healthy' as const, responseTime: Math.floor(Math.random() * 200), errorCount: Math.floor(Math.random() * 3) }
        ]
      },
      { 
        service: 'notifications', 
        serviceName: 'Notification Service', 
        version: '1.0.5',
          endpoints: [
          { name: 'Notifications', path: '/api/notifications', status: 'healthy' as const, responseTime: Math.floor(Math.random() * 200), errorCount: Math.floor(Math.random() * 3) },
          { name: 'Alerts', path: '/api/alerts', status: 'healthy' as const, responseTime: Math.floor(Math.random() * 200), errorCount: Math.floor(Math.random() * 3) },
          { name: 'Events', path: '/api/events', status: 'healthy' as const, responseTime: Math.floor(Math.random() * 200), errorCount: Math.floor(Math.random() * 3) }
        ]
      },
      { 
        service: 'neurospark', 
        serviceName: 'NeuroSpark Service', 
        version: '3.0.1',
        endpoints: [
          { name: 'Grok AI', path: '/api/grok', status: 'healthy' as const, responseTime: Math.floor(Math.random() * 200), errorCount: Math.floor(Math.random() * 3) },
          { name: 'AI Chat', path: '/api/ai', status: 'healthy' as const, responseTime: Math.floor(Math.random() * 200), errorCount: Math.floor(Math.random() * 3) },
          { name: 'Chat', path: '/api/chat', status: 'healthy' as const, responseTime: Math.floor(Math.random() * 200), errorCount: Math.floor(Math.random() * 3) }
        ]
      },
      { 
        service: 'messaging', 
        serviceName: 'Messaging Service', 
        version: '1.5.2',
        endpoints: [
          { name: 'Messages', path: '/api/messages', status: 'healthy' as const, responseTime: Math.floor(Math.random() * 200), errorCount: Math.floor(Math.random() * 3) },
          { name: 'Chat', path: '/api/chat', status: 'healthy' as const, responseTime: Math.floor(Math.random() * 200), errorCount: Math.floor(Math.random() * 3) },
          { name: 'Rooms', path: '/api/rooms', status: 'healthy' as const, responseTime: Math.floor(Math.random() * 200), errorCount: Math.floor(Math.random() * 3) }
        ]
      }
    ];
    return services.map(({ service, serviceName, version, endpoints }) => ({
      service,
          serviceName,
      version,
      endpoints,
      errorCount: Math.floor(Math.random() * 10), // Mock error count 0-9
      status: Math.random() > 0.1 ? 'healthy' : (Math.random() > 0.5 ? 'degraded' : 'unhealthy'),
      uptime: Math.random() * 100, // Mock uptime percentage
      responseTime: Math.random() * 500, // Mock response time in ms
      lastCheck: new Date().toISOString(),
      issues: Math.random() > 0.8 ? ['High memory usage', 'Slow response time'] : []
        }));
      }
      
  async getSystemHealth(): Promise<any> {
    // Alias for getServiceHealth to maintain compatibility
    return this.getServiceHealth();
  }

  async getSystemAlerts(service?: string): Promise<SystemAlert[]> {
    // Mock system alerts
    const alertTypes = ['info', 'warning', 'error', 'critical'] as const;
    const severities = ['low', 'medium', 'high', 'critical'] as const;
    const services = [
      { service: 'officer', serviceName: 'Officer Service' },
      { service: 'social', serviceName: 'Social Service' },
      { service: 'notifications', serviceName: 'Notification Service' },
      { service: 'neurospark', serviceName: 'NeuroSpark Service' },
      { service: 'messaging', serviceName: 'Messaging Service' }
    ];
    
    const allAlerts = Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => {
      const selectedService = services[Math.floor(Math.random() * services.length)];
      const isAcknowledged = Math.random() > 0.5;
      const acknowledgedBy = isAcknowledged ? 'admin' : undefined;
      const acknowledgedAt = isAcknowledged ? new Date(Date.now() - Math.random() * 3600000).toISOString() : undefined;
      
      return {
        id: `alert-${i}`,
        type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        title: `System Alert ${i + 1}`,
        message: `This is a mock system alert for monitoring purposes`,
        description: `Detailed description of the system alert. This alert indicates a potential issue with the ${selectedService.serviceName} that requires attention.`,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Random time in last 24h
        service: selectedService.service,
        serviceName: selectedService.serviceName,
        resolved: Math.random() > 0.3,
        isAcknowledged,
        acknowledgedBy,
        acknowledgedAt
      };
    });

    // Filter by service if specified
    if (service && service !== 'all') {
      return allAlerts.filter(alert => alert.service === service);
    }
    
    return allAlerts;
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    // Mock alert acknowledgment
    // In a real implementation, this would update the alert in the database
    console.log(`Alert ${alertId} acknowledged by user ${userId}`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation
  }

  async resolveAlert(alertId: string, userId: string): Promise<void> {
    // Mock alert resolution
    // In a real implementation, this would update the alert in the database
    console.log(`Alert ${alertId} resolved by user ${userId}`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation
  }
}

export const monitoringService = new MonitoringService();
export default monitoringService;