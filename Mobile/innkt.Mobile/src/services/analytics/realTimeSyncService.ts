import {AnalyticsBackendService} from './analyticsBackendService';

// Real-time Sync Service Interfaces
export interface RealTimeSyncConfig {
  websocketUrl: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  connectionTimeout: number;
  enableCompression: boolean;
}

export interface RealTimeMessage {
  type: 'analytics_update' | 'health_check' | 'config_update' | 'sync_request' | 'error';
  id: string;
  timestamp: string;
  payload: any;
  metadata?: {
    source: string;
    version: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface AnalyticsUpdateMessage {
  type: 'analytics_update';
  payload: {
    metricId: string;
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
    timestamp: string;
    userId?: string;
  };
}

export interface HealthCheckMessage {
  type: 'health_check';
  payload: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    errorRate: number;
    lastCheck: string;
  };
}

export interface ConfigUpdateMessage {
  type: 'config_update';
  payload: {
    configKey: string;
    newValue: any;
    reason: string;
    effectiveFrom: string;
  };
}

export interface SyncRequestMessage {
  type: 'sync_request';
  payload: {
    requestId: string;
    syncType: 'full' | 'incremental' | 'specific';
    targetMetrics?: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface RealTimeSyncStatus {
  isConnected: boolean;
  connectionId: string | null;
  lastMessageTime: string | null;
  reconnectAttempts: number;
  messageCount: number;
  errorCount: number;
  latency: number;
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';
}

export interface RealTimeSyncMetrics {
  totalMessages: number;
  messagesPerSecond: number;
  averageLatency: number;
  connectionUptime: number;
  lastReconnectTime: string | null;
  compressionRatio: number;
}

// Real-time Sync Service
export class RealTimeSyncService {
  private static instance: RealTimeSyncService;
  private config: RealTimeSyncConfig;
  private websocket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private messageCount: number = 0;
  private errorCount: number = 0;
  private connectionStartTime: number | null = null;
  private lastMessageTime: number | null = null;
  private messageLatencies: number[] = [];
  private isReconnecting: boolean = false;
  private messageHandlers: Map<string, (message: RealTimeMessage) => void> = new Map();
  private analyticsBackendService: AnalyticsBackendService;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.analyticsBackendService = AnalyticsBackendService.getInstance();
  }

  public static getInstance(): RealTimeSyncService {
    if (!RealTimeSyncService.instance) {
      RealTimeSyncService.instance = new RealTimeSyncService();
    }
    return RealTimeSyncService.instance;
  }

  // Initialize the real-time sync service
  public async initialize(config?: Partial<RealTimeSyncConfig>): Promise<void> {
    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Register default message handlers
      this.registerDefaultHandlers();

      // Establish WebSocket connection
      await this.connect();

      console.log('Real-time Sync Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Real-time Sync Service:', error);
      throw error;
    }
  }

  // Connect to WebSocket server
  private async connect(): Promise<void> {
    try {
      if (this.websocket) {
        this.websocket.close();
      }

      this.isReconnecting = true;
      this.websocket = new WebSocket(this.config.websocketUrl);

      // Set up connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.websocket?.readyState === WebSocket.CONNECTING) {
          console.warn('WebSocket connection timeout');
          this.websocket.close();
        }
      }, this.config.connectionTimeout);

      // Set up event handlers
      this.setupWebSocketHandlers();

      console.log('WebSocket connection initiated');
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      this.handleConnectionError(error);
    }
  }

  // Set up WebSocket event handlers
  private setupWebSocketHandlers(): void {
    if (!this.websocket) return;

    this.websocket.onopen = () => {
      console.log('WebSocket connection established');
      this.handleConnectionOpen();
    };

    this.websocket.onmessage = (event) => {
      this.handleMessage(event);
    };

    this.websocket.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      this.handleConnectionClose(event);
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleConnectionError(error);
    };
  }

  // Handle connection open
  private handleConnectionOpen(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    this.connectionStartTime = Date.now();
    this.lastMessageTime = Date.now();

    // Start heartbeat
    this.startHeartbeat();

    // Send initial sync request
    this.sendMessage({
      type: 'sync_request',
      id: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      payload: {
        requestId: this.generateMessageId(),
        syncType: 'full',
        priority: 'medium',
      },
    });

    console.log('Real-time sync connection established');
  }

  // Handle connection close
  private handleConnectionClose(event: CloseEvent): void {
    this.isReconnecting = false;
    this.connectionStartTime = null;

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Attempt to reconnect if not manually closed
    if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  // Handle connection error
  private handleConnectionError(error: any): void {
    this.errorCount++;
    console.error('WebSocket connection error:', error);

    if (this.websocket?.readyState === WebSocket.CONNECTING) {
      this.scheduleReconnect();
    }
  }

  // Schedule reconnection
  private scheduleReconnect(): void {
    if (this.isReconnecting) return;

    this.isReconnecting = true;
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts);

    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts + 1} in ${delay}ms`);

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++;
      await this.connect();
    }, delay);
  }

  // Start heartbeat
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.sendMessage({
          type: 'health_check',
          id: this.generateMessageId(),
          timestamp: new Date().toISOString(),
          payload: {
            status: 'healthy',
            responseTime: 0,
            errorRate: 0,
            lastCheck: new Date().toISOString(),
          },
        });
      }
    }, this.config.heartbeatInterval);
  }

  // Handle incoming messages
  private handleMessage(event: MessageEvent): void {
    try {
      const message: RealTimeMessage = JSON.parse(event.data);
      this.lastMessageTime = Date.now();
      this.messageCount++;

      // Calculate latency if message has timestamp
      if (message.timestamp) {
        const latency = Date.now() - new Date(message.timestamp).getTime();
        this.messageLatencies.push(latency);
        
        // Keep only last 100 latencies for average calculation
        if (this.messageLatencies.length > 100) {
          this.messageLatencies.shift();
        }
      }

      // Route message to appropriate handler
      this.routeMessage(message);

      console.log('Real-time message received:', message.type);
    } catch (error) {
      console.error('Failed to parse real-time message:', error);
      this.errorCount++;
    }
  }

  // Route message to appropriate handler
  private routeMessage(message: RealTimeMessage): void {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      try {
        handler(message);
      } catch (error) {
        console.error(`Error in message handler for ${message.type}:`, error);
        this.errorCount++;
      }
    } else {
      console.warn(`No handler registered for message type: ${message.type}`);
    }
  }

  // Register default message handlers
  private registerDefaultHandlers(): void {
    // Analytics update handler
    this.registerMessageHandler('analytics_update', (message: RealTimeMessage) => {
      const updateMessage = message as AnalyticsUpdateMessage;
      this.handleAnalyticsUpdate(updateMessage.payload);
    });

    // Health check handler
    this.registerMessageHandler('health_check', (message: RealTimeMessage) => {
      const healthMessage = message as HealthCheckMessage;
      this.handleHealthCheck(healthMessage.payload);
    });

    // Config update handler
    this.registerMessageHandler('config_update', (message: RealTimeMessage) => {
      const configMessage = message as ConfigUpdateMessage;
      this.handleConfigUpdate(configMessage.payload);
    });

    // Sync request handler
    this.registerMessageHandler('sync_request', (message: RealTimeMessage) => {
      const syncMessage = message as SyncRequestMessage;
      this.handleSyncRequest(syncMessage.payload);
    });

    // Error handler
    this.registerMessageHandler('error', (message: RealTimeMessage) => {
      console.error('Real-time sync error:', message.payload);
      this.errorCount++;
    });
  }

  // Handle analytics updates
  private handleAnalyticsUpdate(payload: any): void {
    // Update local analytics data
    console.log('Analytics update received:', payload);
    
    // Emit event for other services to consume
    this.emit('analytics_update', payload);
  }

  // Handle health checks
  private handleHealthCheck(payload: any): void {
    // Update backend health status
    console.log('Health check received:', payload);
    
    // Emit event for other services to consume
    this.emit('health_check', payload);
  }

  // Handle config updates
  private handleConfigUpdate(payload: any): void {
    // Update local configuration
    console.log('Config update received:', payload);
    
    // Emit event for other services to consume
    this.emit('config_update', payload);
  }

  // Handle sync requests
  private async handleSyncRequest(payload: any): Promise<void> {
    try {
      console.log('Sync request received:', payload);
      
      // Trigger analytics sync based on request
      if (payload.syncType === 'full') {
        await this.analyticsBackendService.syncPendingEvents();
      } else if (payload.syncType === 'specific' && payload.targetMetrics) {
        // Sync specific metrics
        console.log('Syncing specific metrics:', payload.targetMetrics);
      }
      
      // Emit event for other services to consume
      this.emit('sync_request', payload);
    } catch (error) {
      console.error('Error handling sync request:', error);
      this.errorCount++;
    }
  }

  // Send message to WebSocket server
  public sendMessage(message: RealTimeMessage): boolean {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      try {
        const messageStr = JSON.stringify(message);
        this.websocket.send(messageStr);
        return true;
      } catch (error) {
        console.error('Failed to send message:', error);
        this.errorCount++;
        return false;
      }
    } else {
      console.warn('WebSocket not connected, message queued');
      return false;
    }
  }

  // Register custom message handler
  public registerMessageHandler(type: string, handler: (message: RealTimeMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  // Remove message handler
  public removeMessageHandler(type: string): void {
    this.messageHandlers.delete(type);
  }

  // Get connection status
  public getStatus(): RealTimeSyncStatus {
    return {
      isConnected: this.websocket?.readyState === WebSocket.OPEN,
      connectionId: this.connectionStartTime?.toString() || null,
      lastMessageTime: this.lastMessageTime ? new Date(this.lastMessageTime).toISOString() : null,
      reconnectAttempts: this.reconnectAttempts,
      messageCount: this.messageCount,
      errorCount: this.errorCount,
      latency: this.getAverageLatency(),
      status: this.getConnectionStatus(),
    };
  }

  // Get sync metrics
  public getMetrics(): RealTimeSyncMetrics {
    const uptime = this.connectionStartTime ? Date.now() - this.connectionStartTime : 0;
    
    return {
      totalMessages: this.messageCount,
      messagesPerSecond: this.calculateMessagesPerSecond(),
      averageLatency: this.getAverageLatency(),
      connectionUptime: uptime,
      lastReconnectTime: this.reconnectAttempts > 0 ? new Date().toISOString() : null,
      compressionRatio: this.config.enableCompression ? 0.8 : 1.0, // Mock compression ratio
    };
  }

  // Update configuration
  public updateConfig(config: Partial<RealTimeSyncConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart connection if URL changed
    if (config.websocketUrl && this.websocket) {
      this.reconnect();
    }
  }

  // Force reconnection
  public reconnect(): void {
    if (this.websocket) {
      this.websocket.close();
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.reconnectAttempts = 0;
    this.connect();
  }

  // Disconnect
  public disconnect(): void {
    if (this.websocket) {
      this.websocket.close(1000, 'Manual disconnect');
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    this.isReconnecting = false;
    this.connectionStartTime = null;
  }

  // Cleanup resources
  public cleanup(): void {
    this.disconnect();
    this.messageHandlers.clear();
    this.messageLatencies = [];
    this.messageCount = 0;
    this.errorCount = 0;
    this.reconnectAttempts = 0;
    
    console.log('Real-time Sync Service cleaned up');
  }

  // Private utility methods
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAverageLatency(): number {
    if (this.messageLatencies.length === 0) return 0;
    const sum = this.messageLatencies.reduce((a, b) => a + b, 0);
    return sum / this.messageLatencies.length;
  }

  private calculateMessagesPerSecond(): number {
    if (!this.connectionStartTime) return 0;
    const uptime = (Date.now() - this.connectionStartTime) / 1000;
    return uptime > 0 ? this.messageCount / uptime : 0;
  }

  private getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error' {
    if (this.isReconnecting) return 'reconnecting';
    if (this.websocket?.readyState === WebSocket.CONNECTING) return 'connecting';
    if (this.websocket?.readyState === WebSocket.OPEN) return 'connected';
    if (this.errorCount > 0) return 'error';
    return 'disconnected';
  }

  private getDefaultConfig(): RealTimeSyncConfig {
    return {
      websocketUrl: 'wss://api.innkt.com/analytics/realtime',
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      connectionTimeout: 10000,
      enableCompression: true,
    };
  }

  // Event emitter methods (simplified implementation)
  private eventListeners: Map<string, Function[]> = new Map();

  public on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  public off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}






