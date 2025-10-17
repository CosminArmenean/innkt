/**
 * WebRTC State Manager
 * Handles WebRTC states (negotiationneeded, iceconnectionstatechange) with proper reconnection logic
 */

export interface WebRTCConnectionState {
  connectionState: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
  iceConnectionState: 'new' | 'checking' | 'connected' | 'completed' | 'failed' | 'disconnected' | 'closed';
  iceGatheringState: 'new' | 'gathering' | 'complete';
  signalingState: 'stable' | 'have-local-offer' | 'have-remote-offer' | 'have-local-pranswer' | 'have-remote-pranswer' | 'closed';
  lastStateChange: number;
  reconnectionAttempts: number;
  maxReconnectionAttempts: number;
}

export interface ConnectionQualityMetrics {
  rtt: number; // Round-trip time in milliseconds
  packetsLost: number; // Number of packets lost
  jitter: number; // Jitter in milliseconds
  bandwidth: number; // Estimated bandwidth in kbps
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  timestamp: number;
}

export interface ReconnectionConfig {
  maxAttempts: number;
  baseDelay: number; // Base delay in milliseconds
  maxDelay: number; // Maximum delay in milliseconds
  backoffMultiplier: number; // Exponential backoff multiplier
}

export class WebRTCStateManager {
  private connectionStates: Map<string, WebRTCConnectionState> = new Map();
  private qualityMetrics: Map<string, ConnectionQualityMetrics> = new Map();
  private reconnectionTimers: Map<string, NodeJS.Timeout> = new Map();
  private eventHandlers: Map<string, Function[]> = new Map();
  private qualityMonitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  // Default configuration
  private readonly defaultReconnectionConfig: ReconnectionConfig = {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  };

  constructor() {
    console.log('WebRTCStateManager: Initialized');
  }

  /**
   * Add event listener
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
    console.log(`WebRTCStateManager: Added listener for '${event}' event`);
  }

  /**
   * Remove event listener
   */
  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        console.log(`WebRTCStateManager: Removed listener for '${event}' event`);
      }
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`WebRTCStateManager: Error in event handler for '${event}':`, error);
        }
      });
    }
  }

  /**
   * Register a WebRTC connection for monitoring
   */
  registerConnection(
    callId: string, 
    peerConnection: RTCPeerConnection, 
    config: ReconnectionConfig = this.defaultReconnectionConfig
  ): void {
    console.log(`WebRTCStateManager: Registering connection for call ${callId}`);

    // Initialize connection state
    const initialState: WebRTCConnectionState = {
      connectionState: 'new',
      iceConnectionState: 'new',
      iceGatheringState: 'new',
      signalingState: 'stable',
      lastStateChange: Date.now(),
      reconnectionAttempts: 0,
      maxReconnectionAttempts: config.maxAttempts
    };

    this.connectionStates.set(callId, initialState);

    // Set up event listeners
    this.setupConnectionEventListeners(callId, peerConnection, config);

    // Start quality monitoring
    this.startQualityMonitoring(callId, peerConnection);

    console.log(`WebRTCStateManager: Connection registered for call ${callId}`);
  }

  /**
   * Set up WebRTC connection event listeners
   */
  private setupConnectionEventListeners(
    callId: string, 
    peerConnection: RTCPeerConnection, 
    config: ReconnectionConfig
  ): void {
    // Connection state change
    peerConnection.onconnectionstatechange = () => {
      this.handleConnectionStateChange(callId, peerConnection, config);
    };

    // ICE connection state change
    peerConnection.oniceconnectionstatechange = () => {
      this.handleIceConnectionStateChange(callId, peerConnection, config);
    };

    // ICE gathering state change
    peerConnection.onicegatheringstatechange = () => {
      this.handleIceGatheringStateChange(callId, peerConnection);
    };

    // Signaling state change
    peerConnection.onsignalingstatechange = () => {
      this.handleSignalingStateChange(callId, peerConnection);
    };

    // Negotiation needed
    peerConnection.onnegotiationneeded = () => {
      this.handleNegotiationNeeded(callId, peerConnection);
    };

    // ICE candidates
    peerConnection.onicecandidate = (event) => {
      this.handleIceCandidate(callId, event);
    };

    // Data channel events
    peerConnection.ondatachannel = (event) => {
      this.handleDataChannel(callId, event);
    };
  }

  /**
   * Handle connection state changes
   */
  private handleConnectionStateChange(
    callId: string, 
    peerConnection: RTCPeerConnection, 
    config: ReconnectionConfig
  ): void {
    const currentState = this.connectionStates.get(callId);
    if (!currentState) return;

    const newState = peerConnection.connectionState;
    const previousState = currentState.connectionState;

    console.log(`WebRTCStateManager: Connection state changed for call ${callId}: ${previousState} -> ${newState}`);

    // Update state
    currentState.connectionState = newState as any;
    currentState.lastStateChange = Date.now();

    // Handle specific state transitions
    switch (newState) {
      case 'connected':
        this.handleConnectionEstablished(callId);
        break;

      case 'disconnected':
        this.handleConnectionDisconnected(callId, config);
        break;

      case 'failed':
        this.handleConnectionFailed(callId, config);
        break;

      case 'closed':
        this.handleConnectionClosed(callId);
        break;
    }

    // Emit state change event
    this.emit('connectionStateChanged', {
      callId,
      newState,
      previousState,
      timestamp: Date.now()
    });
  }

  /**
   * Handle ICE connection state changes
   */
  private handleIceConnectionStateChange(
    callId: string, 
    peerConnection: RTCPeerConnection, 
    config: ReconnectionConfig
  ): void {
    const currentState = this.connectionStates.get(callId);
    if (!currentState) return;

    const newState = peerConnection.iceConnectionState;
    const previousState = currentState.iceConnectionState;

    console.log(`WebRTCStateManager: ICE connection state changed for call ${callId}: ${previousState} -> ${newState}`);

    // Update state
    currentState.iceConnectionState = newState as any;

    // Handle specific ICE state transitions
    switch (newState) {
      case 'connected':
      case 'completed':
        this.handleIceConnectionEstablished(callId);
        break;

      case 'disconnected':
        this.handleIceConnectionDisconnected(callId, config);
        break;

      case 'failed':
        this.handleIceConnectionFailed(callId, config);
        break;

      case 'closed':
        this.handleIceConnectionClosed(callId);
        break;
    }

    // Emit ICE state change event
    this.emit('iceConnectionStateChanged', {
      callId,
      newState,
      previousState,
      timestamp: Date.now()
    });
  }

  /**
   * Handle ICE gathering state changes
   */
  private handleIceGatheringStateChange(callId: string, peerConnection: RTCPeerConnection): void {
    const currentState = this.connectionStates.get(callId);
    if (!currentState) return;

    const newState = peerConnection.iceGatheringState;
    const previousState = currentState.iceGatheringState;

    console.log(`WebRTCStateManager: ICE gathering state changed for call ${callId}: ${previousState} -> ${newState}`);

    // Update state
    currentState.iceGatheringState = newState as any;

    // Emit ICE gathering state change event
    this.emit('iceGatheringStateChanged', {
      callId,
      newState,
      previousState,
      timestamp: Date.now()
    });
  }

  /**
   * Handle signaling state changes
   */
  private handleSignalingStateChange(callId: string, peerConnection: RTCPeerConnection): void {
    const currentState = this.connectionStates.get(callId);
    if (!currentState) return;

    const newState = peerConnection.signalingState;
    const previousState = currentState.signalingState;

    console.log(`WebRTCStateManager: Signaling state changed for call ${callId}: ${previousState} -> ${newState}`);

    // Update state
    currentState.signalingState = newState as any;

    // Emit signaling state change event
    this.emit('signalingStateChanged', {
      callId,
      newState,
      previousState,
      timestamp: Date.now()
    });
  }

  /**
   * Handle negotiation needed
   */
  private handleNegotiationNeeded(callId: string, peerConnection: RTCPeerConnection): void {
    console.log(`WebRTCStateManager: Negotiation needed for call ${callId}`);

    // Emit negotiation needed event
    this.emit('negotiationNeeded', {
      callId,
      timestamp: Date.now(),
      peerConnection
    });
  }

  /**
   * Handle ICE candidate
   */
  private handleIceCandidate(callId: string, event: RTCPeerConnectionIceEvent): void {
    if (event.candidate) {
      console.log(`WebRTCStateManager: ICE candidate for call ${callId}:`, event.candidate.candidate);

      // Emit ICE candidate event
      this.emit('iceCandidate', {
        callId,
        candidate: event.candidate,
        timestamp: Date.now()
      });
    } else {
      console.log(`WebRTCStateManager: ICE gathering complete for call ${callId}`);
      
      // Emit ICE gathering complete event
      this.emit('iceGatheringComplete', {
        callId,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle data channel
   */
  private handleDataChannel(callId: string, event: RTCDataChannelEvent): void {
    console.log(`WebRTCStateManager: Data channel for call ${callId}:`, event.channel.label);

    // Emit data channel event
    this.emit('dataChannel', {
      callId,
      channel: event.channel,
      timestamp: Date.now()
    });
  }

  /**
   * Handle connection established
   */
  private handleConnectionEstablished(callId: string): void {
    console.log(`WebRTCStateManager: Connection established for call ${callId}`);
    
    // Reset reconnection attempts
    const state = this.connectionStates.get(callId);
    if (state) {
      state.reconnectionAttempts = 0;
    }

    // Clear any pending reconnection timers
    const timer = this.reconnectionTimers.get(callId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectionTimers.delete(callId);
    }

    // Emit connection established event
    this.emit('connectionEstablished', {
      callId,
      timestamp: Date.now()
    });
  }

  /**
   * Handle connection disconnected
   */
  private handleConnectionDisconnected(callId: string, config: ReconnectionConfig): void {
    console.log(`WebRTCStateManager: Connection disconnected for call ${callId}`);
    
    // Start reconnection attempt
    this.scheduleReconnection(callId, config);

    // Emit connection disconnected event
    this.emit('connectionDisconnected', {
      callId,
      timestamp: Date.now()
    });
  }

  /**
   * Handle connection failed
   */
  private handleConnectionFailed(callId: string, config: ReconnectionConfig): void {
    console.log(`WebRTCStateManager: Connection failed for call ${callId}`);
    
    // Start reconnection attempt
    this.scheduleReconnection(callId, config);

    // Emit connection failed event
    this.emit('connectionFailed', {
      callId,
      timestamp: Date.now()
    });
  }

  /**
   * Handle connection closed
   */
  private handleConnectionClosed(callId: string): void {
    console.log(`WebRTCStateManager: Connection closed for call ${callId}`);
    
    // Clean up
    this.cleanupConnection(callId);

    // Emit connection closed event
    this.emit('connectionClosed', {
      callId,
      timestamp: Date.now()
    });
  }

  /**
   * Handle ICE connection established
   */
  private handleIceConnectionEstablished(callId: string): void {
    console.log(`WebRTCStateManager: ICE connection established for call ${callId}`);

    // Emit ICE connection established event
    this.emit('iceConnectionEstablished', {
      callId,
      timestamp: Date.now()
    });
  }

  /**
   * Handle ICE connection disconnected
   */
  private handleIceConnectionDisconnected(callId: string, config: ReconnectionConfig): void {
    console.log(`WebRTCStateManager: ICE connection disconnected for call ${callId}`);
    
    // Start reconnection attempt
    this.scheduleReconnection(callId, config);

    // Emit ICE connection disconnected event
    this.emit('iceConnectionDisconnected', {
      callId,
      timestamp: Date.now()
    });
  }

  /**
   * Handle ICE connection failed
   */
  private handleIceConnectionFailed(callId: string, config: ReconnectionConfig): void {
    console.log(`WebRTCStateManager: ICE connection failed for call ${callId}`);
    
    // Start reconnection attempt
    this.scheduleReconnection(callId, config);

    // Emit ICE connection failed event
    this.emit('iceConnectionFailed', {
      callId,
      timestamp: Date.now()
    });
  }

  /**
   * Handle ICE connection closed
   */
  private handleIceConnectionClosed(callId: string): void {
    console.log(`WebRTCStateManager: ICE connection closed for call ${callId}`);

    // Emit ICE connection closed event
    this.emit('iceConnectionClosed', {
      callId,
      timestamp: Date.now()
    });
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnection(callId: string, config: ReconnectionConfig): void {
    const state = this.connectionStates.get(callId);
    if (!state) return;

    // Check if we've exceeded max attempts
    if (state.reconnectionAttempts >= state.maxReconnectionAttempts) {
      console.log(`WebRTCStateManager: Max reconnection attempts reached for call ${callId}`);
      this.emit('reconnectionFailed', {
        callId,
        attempts: state.reconnectionAttempts,
        timestamp: Date.now()
      });
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      config.baseDelay * Math.pow(config.backoffMultiplier, state.reconnectionAttempts),
      config.maxDelay
    );

    console.log(`WebRTCStateManager: Scheduling reconnection for call ${callId} in ${delay}ms (attempt ${state.reconnectionAttempts + 1})`);

    // Clear any existing timer
    const existingTimer = this.reconnectionTimers.get(callId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule reconnection
    const timer = setTimeout(() => {
      this.attemptReconnection(callId);
    }, delay);

    this.reconnectionTimers.set(callId, timer);
  }

  /**
   * Attempt reconnection
   */
  private attemptReconnection(callId: string): void {
    const state = this.connectionStates.get(callId);
    if (!state) return;

    state.reconnectionAttempts++;

    console.log(`WebRTCStateManager: Attempting reconnection for call ${callId} (attempt ${state.reconnectionAttempts})`);

    // Emit reconnection attempt event
    this.emit('reconnectionAttempt', {
      callId,
      attempt: state.reconnectionAttempts,
      timestamp: Date.now()
    });
  }

  /**
   * Start quality monitoring
   */
  private startQualityMonitoring(callId: string, peerConnection: RTCPeerConnection): void {
    console.log(`WebRTCStateManager: Starting quality monitoring for call ${callId}`);

    const interval = setInterval(async () => {
      try {
        // Check if connection still exists and is active
        const connectionState = this.connectionStates.get(callId);
        if (!connectionState) {
          console.log(`WebRTCStateManager: Connection no longer exists, stopping quality monitoring for call ${callId}`);
          clearInterval(interval);
          this.qualityMonitoringIntervals.delete(callId);
          return;
        }

        // Check if connection is closed or failed
        if (peerConnection.connectionState === 'closed' || peerConnection.connectionState === 'failed') {
          console.log(`WebRTCStateManager: Connection is closed/failed, stopping quality monitoring for call ${callId}`);
          clearInterval(interval);
          this.qualityMonitoringIntervals.delete(callId);
          return;
        }

        const stats = await peerConnection.getStats();
        const metrics = this.analyzeStats(stats);
        
        this.qualityMetrics.set(callId, metrics);

        // Emit quality metrics
        this.emit('qualityMetrics', {
          callId,
          metrics,
          timestamp: Date.now()
        });

        // Check for quality issues
        if (metrics.quality === 'poor') {
          this.emit('qualityWarning', {
            callId,
            metrics,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error(`WebRTCStateManager: Failed to get stats for call ${callId}:`, error);
        // If we can't get stats, the connection might be dead
        console.log(`WebRTCStateManager: Stopping quality monitoring due to stats error for call ${callId}`);
        clearInterval(interval);
        this.qualityMonitoringIntervals.delete(callId);
      }
    }, 5000); // Monitor every 5 seconds

    this.qualityMonitoringIntervals.set(callId, interval);
  }

  /**
   * Analyze WebRTC stats to determine connection quality
   */
  private analyzeStats(stats: RTCStatsReport): ConnectionQualityMetrics {
    let rtt = 0;
    let packetsLost = 0;
    let jitter = 0;
    let bandwidth = 0;

    stats.forEach((report) => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        rtt = report.currentRoundTripTime ? report.currentRoundTripTime * 1000 : 0;
      }
      
      if (report.type === 'inbound-rtp') {
        packetsLost += report.packetsLost || 0;
        jitter = report.jitter ? report.jitter * 1000 : 0;
      }
      
      if (report.type === 'outbound-rtp') {
        bandwidth = report.bytesSent ? (report.bytesSent * 8) / 1000 : 0; // Convert to kbps
      }
    });

    // Determine quality based on metrics
    let quality: ConnectionQualityMetrics['quality'] = 'excellent';
    
    if (rtt > 200 || packetsLost > 10 || jitter > 50) {
      quality = 'poor';
    } else if (rtt > 100 || packetsLost > 5 || jitter > 30) {
      quality = 'fair';
    } else if (rtt > 50 || packetsLost > 2 || jitter > 15) {
      quality = 'good';
    }

    return {
      rtt,
      packetsLost,
      jitter,
      bandwidth,
      quality,
      timestamp: Date.now()
    };
  }

  /**
   * Get connection state for a call
   */
  getConnectionState(callId: string): WebRTCConnectionState | null {
    return this.connectionStates.get(callId) || null;
  }

  /**
   * Get quality metrics for a call
   */
  getQualityMetrics(callId: string): ConnectionQualityMetrics | null {
    return this.qualityMetrics.get(callId) || null;
  }

  /**
   * Check if connection is healthy
   */
  isConnectionHealthy(callId: string): boolean {
    const state = this.connectionStates.get(callId);
    if (!state) return false;

    return state.connectionState === 'connected' && 
           (state.iceConnectionState === 'connected' || state.iceConnectionState === 'completed');
  }

  /**
   * Clean up connection monitoring
   */
  cleanupConnection(callId: string): void {
    console.log(`WebRTCStateManager: Cleaning up connection monitoring for call ${callId}`);

    // Clear reconnection timer
    const timer = this.reconnectionTimers.get(callId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectionTimers.delete(callId);
    }

    // Clear quality monitoring interval
    const interval = this.qualityMonitoringIntervals.get(callId);
    if (interval) {
      clearInterval(interval);
      this.qualityMonitoringIntervals.delete(callId);
    }

    // Remove state and metrics
    this.connectionStates.delete(callId);
    this.qualityMetrics.delete(callId);

    // Stop quality monitoring
    const qualityInterval = this.qualityMonitoringIntervals.get(callId);
    if (qualityInterval) {
      clearInterval(qualityInterval);
      this.qualityMonitoringIntervals.delete(callId);
      console.log(`WebRTCStateManager: Stopped quality monitoring for call ${callId}`);
    }

    console.log(`WebRTCStateManager: Connection monitoring cleaned up for call ${callId}`);
  }

  /**
   * Clean up all connections
   */
  dispose(): void {
    console.log('WebRTCStateManager: Disposing all connections');

    // Clean up all connections
    const callIds = Array.from(this.connectionStates.keys());
    for (const callId of callIds) {
      this.cleanupConnection(callId);
    }

    // Clear event handlers
    this.eventHandlers.clear();

    console.log('WebRTCStateManager: Disposed');
  }
}

// Export singleton instance
export const webrtcStateManager = new WebRTCStateManager();
