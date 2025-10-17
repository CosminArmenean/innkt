import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { seerApi } from './api.service';

export interface CallParticipant {
  id: string;
  userId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  role: 'host' | 'moderator' | 'participant';
  status: 'invited' | 'joining' | 'connected' | 'disconnected' | 'left';
  isMuted: boolean;
  isVideoEnabled: boolean;
  joinedAt?: Date;
  leftAt?: Date;
}

export interface Call {
  id: string;
  callerId: string;
  calleeId: string;
  type: 'voice' | 'video';
  status: 'initiated' | 'ringing' | 'connecting' | 'active' | 'ended' | 'declined' | 'missed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  roomId?: string;
  participants: CallParticipant[];
  conversationId?: string;
}

export interface CallEvent {
  type: 'CallInitiated' | 'CallRinging' | 'CallAnswered' | 'CallRejected' | 'CallEnded' | 'CallMissed' | 'ParticipantJoined' | 'ParticipantLeft' | 'ParticipantMuted' | 'ParticipantVideoToggled' | 'QualityChanged' | 'CallFailed';
  callId: string;
  userId: string;
  timestamp: Date;
  data?: any;
}

export interface WebRTCOffer {
  callId: string;
  fromUserId: string;
  toUserId: string;
  sdp: string;
  type: 'offer';
}

export interface WebRTCAnswer {
  callId: string;
  fromUserId: string;
  toUserId: string;
  sdp: string;
  type: 'answer';
}

export interface WebRTCIceCandidate {
  callId: string;
  fromUserId: string;
  toUserId: string;
  candidate: string;
  sdpMid: string;
  sdpMLineIndex: number;
}

export interface WebRTCStats {
  latency: number;
  packetLoss: number;
  jitter: number;
  bitrate: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
}

class CallService {
  private connection: HubConnection | null = null;
  private isConnected = false;
  private currentCall: Call | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();
  
  // Video call state
  private currentCallType: 'voice' | 'video' = 'voice';
  private videoQuality: 'low' | 'medium' | 'high' | 'hd' = 'medium';
  private bandwidthEstimate: number = 0;
  private isVideoSupported: boolean = true;

  // Configuration
  private readonly SEER_SERVICE_URL = 'http://localhost:5267';
  private readonly ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];
  
  // Video quality constraints
  private readonly VIDEO_CONSTRAINTS = {
    low: { width: 320, height: 240, frameRate: 15 },
    medium: { width: 640, height: 480, frameRate: 24 },
    high: { width: 1280, height: 720, frameRate: 30 },
    hd: { width: 1920, height: 1080, frameRate: 30 }
  };

  constructor() {
    // Connection will be initialized when first call is made
  }

  private setupEventHandlers() {
    if (!this.connection) return;

    // Connection events
    this.connection.onclose(() => {
      console.log('Call service connection closed');
      this.isConnected = false;
      this.emit('connectionStatusChanged', { connected: false });
    });

    this.connection.onreconnecting(() => {
      console.log('Call service reconnecting...');
      this.emit('connectionStatusChanged', { connected: false, reconnecting: true });
    });

    this.connection.onreconnected(() => {
      console.log('Call service reconnected');
      this.isConnected = true;
      this.emit('connectionStatusChanged', { connected: true });
    });

    // WebRTC signaling events
    this.connection.on('ReceiveOffer', (offer: WebRTCOffer) => {
      console.log('Received WebRTC offer:', offer);
      this.handleIncomingOffer(offer);
    });

    this.connection.on('ReceiveAnswer', (answer: WebRTCAnswer) => {
      console.log('Received WebRTC answer:', answer);
      this.handleIncomingAnswer(answer);
    });

    this.connection.on('ReceiveIceCandidate', (candidate: WebRTCIceCandidate) => {
      console.log('Received ICE candidate:', candidate);
      this.handleIncomingIceCandidate(candidate);
    });

    // Call management events
    this.connection.on('IncomingCall', (data: any) => {
      console.log('CallService: Incoming call received via SignalR:', data);
      console.log('CallService: About to emit incomingCall event to listeners');
      this.emit('incomingCall', data);
      console.log('CallService: incomingCall event emitted');
    });

    this.connection.on('ParticipantJoined', (data: any) => {
      console.log('Participant joined:', data);
      this.emit('participantJoined', data);
    });

    this.connection.on('CallAnswered', (data: any) => {
      console.log('Call answered:', data);
      this.emit('callAnswered', data);
    });

    this.connection.on('ParticipantLeft', (data: any) => {
      console.log('Participant left:', data);
      this.emit('participantLeft', data);
    });

    this.connection.on('MediaStateChanged', (data: any) => {
      console.log('Media state changed:', data);
      this.emit('mediaStateChanged', data);
    });

    this.connection.on('Error', (error: string) => {
      console.error('Call service error:', error);
      this.emit('error', { message: error });
    });
  }

  private async startConnection() {
    if (!this.connection || this.connection.state !== HubConnectionState.Disconnected) {
      return;
    }

    try {
      await this.connection.start();
      this.isConnected = true;
      console.log('Call service connected to Seer service');
      this.emit('connectionStatusChanged', { connected: true });
    } catch (error) {
      console.error('Failed to start call service connection:', error);
      this.emit('connectionStatusChanged', { connected: false, error });
    }
  }

  private initializeConnection(): void {
    if (this.connection) {
      return; // Already initialized
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No access token found for call service');
      return;
    }

    // SignalR connection URL
    this.connection = new HubConnectionBuilder()
      .withUrl(`${this.SEER_SERVICE_URL}/hubs/signaling`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .build();

    // Set up event handlers
    this.setupEventHandlers();
  }

  // Event handling
  public on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off(event: string, handler: Function) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const handlers = this.eventHandlers.get(event);
    console.log(`CallService: Emitting event '${event}' to ${handlers ? handlers.length : 0} listeners`);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    } else {
      console.warn(`CallService: No listeners found for event '${event}'`);
    }
  }

  // Public method to establish SignalR connection proactively
  public async connect(): Promise<void> {
    console.log('CallService: Connecting to SignalR hub...');
    
    // Initialize connection if not already done
    this.initializeConnection();
    
    // Start the connection if not already connected
    if (this.connection && this.connection.state === HubConnectionState.Disconnected) {
      await this.startConnection();
    } else if (this.connection && this.connection.state === HubConnectionState.Connected) {
      console.log('CallService: Already connected to SignalR hub');
    }
  }

  // Call management
  public async startCall(calleeId: string, type: 'voice' | 'video' = 'voice', conversationId?: string): Promise<Call> {
    try {
      console.log(`Starting ${type} call to ${calleeId}`);
      
      // Initialize connection if not already done
      this.initializeConnection();
      
      // Ensure connection is established
      await this.startConnection();
      
      // Store current call type
      this.currentCallType = type;
      
      // Check video support and bandwidth for smart fallback
      if (type === 'video') {
        const videoSupport = await this.checkVideoSupport();
        const bandwidth = await this.estimateBandwidth();
        
        if (!videoSupport.supported) {
          console.warn('Video not supported, falling back to voice call');
          type = 'voice';
          this.currentCallType = 'voice';
          this.emit('callTypeFallback', { from: 'video', to: 'voice', reason: 'Video not supported' });
        } else if (bandwidth < 500) { // Less than 500 kbps
          console.warn('Low bandwidth detected, falling back to voice call');
          type = 'voice';
          this.currentCallType = 'voice';
          this.emit('callTypeFallback', { from: 'video', to: 'voice', reason: 'Low bandwidth' });
        } else {
          // Adjust video quality based on bandwidth
          this.adjustVideoQuality(bandwidth);
        }
      }

      // Create call via Seer service API
      // Match C# PascalCase property names and send enum as integer
      const callTypeValue = type === 'video' ? 1 : 0; // 0 = Voice, 1 = Video, 2 = ScreenShare
      
      const requestPayload = {
        CalleeId: calleeId,  // PascalCase to match C# model
        Type: callTypeValue, // Integer enum value (0 = Voice, 1 = Video)
        ConversationId: conversationId  // PascalCase to match C# model
      };
      
      console.log('📞 Sending call request:', requestPayload);
      
      const response = await seerApi.post('/api/call/start', requestPayload);

      const call: Call = response.data.data;
      this.currentCall = call;

      // Initialize WebRTC
      await this.initializeWebRTC(type);
      await this.joinCall(call.id);

      console.log('CallService: Emitting callStarted event for call:', call);
      this.emit('callStarted', call);
      return call;
    } catch (error) {
      console.error('Failed to start call:', error);
      this.emit('error', { message: 'Failed to start call', error });
      throw error;
    }
  }

  public async answerCall(callId: string): Promise<void> {
    try {
      console.log('Answering call:', callId);

      if (!this.connection || !this.isConnected) {
        throw new Error('Call service not connected');
      }

      await this.connection.invoke('JoinCall', callId);
      
      // Determine call type from current call or default to voice
      const callType = this.currentCall?.type === 'video' ? 'video' : 'voice';
      await this.initializeWebRTC(callType);

      this.emit('callAnswered', { callId });
    } catch (error) {
      console.error('Failed to answer call:', error);
      this.emit('error', { message: 'Failed to answer call', error });
      throw error;
    }
  }

  public async rejectCall(callId: string): Promise<void> {
    try {
      console.log('Rejecting call:', callId);

      // Update call status via API
      await seerApi.post(`/api/call/${callId}/end`, {});

      this.emit('callRejected', { callId });
    } catch (error) {
      console.error('Failed to reject call:', error);
      this.emit('error', { message: 'Failed to reject call', error });
      throw error;
    }
  }

  public async endCall(callId: string): Promise<void> {
    try {
      console.log('Ending call:', callId);

      // Clean up WebRTC
      await this.cleanupWebRTC();

      // End call via API
      await seerApi.post(`/api/call/${callId}/end`, {});

      if (!this.connection || !this.isConnected) {
        throw new Error('Call service not connected');
      }

      await this.connection.invoke('LeaveCall', callId);

      this.emit('callEnded', { callId });
      this.currentCall = null;
    } catch (error) {
      console.error('Failed to end call:', error);
      this.emit('error', { message: 'Failed to end call', error });
      throw error;
    }
  }

  public async joinCall(callId: string): Promise<void> {
    try {
      if (!this.connection || !this.isConnected) {
        throw new Error('Call service not connected');
      }

      await this.connection.invoke('JoinCall', callId);
      console.log('Joined call:', callId);
    } catch (error) {
      console.error('Failed to join call:', error);
      throw error;
    }
  }

  public async leaveCall(callId: string): Promise<void> {
    try {
      if (!this.connection || !this.isConnected) {
        throw new Error('Call service not connected');
      }

      await this.connection.invoke('LeaveCall', callId);
      console.log('Left call:', callId);
    } catch (error) {
      console.error('Failed to leave call:', error);
      throw error;
    }
  }

  // WebRTC management
  private async initializeWebRTC(callType: 'voice' | 'video' = 'voice'): Promise<void> {
    try {
      // Get user media based on call type
      const mediaConstraints = {
        audio: true,
        video: callType === 'video' ? this.getVideoConstraints() : false
      };

      console.log(`Initializing WebRTC for ${callType} call with constraints:`, mediaConstraints);
      
      this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

      // Create peer connection with video-specific configuration
      const peerConnectionConfig: RTCConfiguration = {
        iceServers: this.ICE_SERVERS,
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      };

      // Add video-specific constraints for better performance
      if (callType === 'video') {
        peerConnectionConfig.iceTransportPolicy = 'all';
      }

      this.peerConnection = new RTCPeerConnection(peerConnectionConfig);

      // Add local stream
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
        
        // Set video quality constraints for video tracks
        if (track.kind === 'video' && callType === 'video') {
          this.applyVideoConstraints(track);
        }
      });

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        console.log('Received remote stream');
        this.remoteStream = event.streams[0];
        this.emit('remoteStreamReceived', this.remoteStream);
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.connection && this.isConnected && this.currentCall) {
          this.connection.invoke('SendIceCandidate', 
            this.currentCall.id, 
            this.getCurrentUserId(), 
            event.candidate.candidate, 
            event.candidate.sdpMid, 
            event.candidate.sdpMLineIndex
          );
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        console.log('WebRTC connection state:', this.peerConnection?.connectionState);
        this.emit('connectionStateChanged', this.peerConnection?.connectionState);
        
        // Monitor connection quality for video calls
        if (callType === 'video' && this.peerConnection?.connectionState === 'connected') {
          this.startConnectionQualityMonitoring();
        }
      };

      // Handle ICE connection state changes for quality monitoring
      this.peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', this.peerConnection?.iceConnectionState);
        if (callType === 'video' && this.peerConnection?.iceConnectionState === 'connected') {
          this.monitorBandwidthAndAdjustQuality();
        }
      };

      this.emit('webRTCInitialized', { callType });
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      this.emit('error', { message: 'Failed to initialize WebRTC', error });
      throw error;
    }
  }

  private async handleIncomingOffer(offer: WebRTCOffer): Promise<void> {
    try {
      if (!this.peerConnection) {
        // Determine call type from current call or default to voice
        const callType = this.currentCall?.type === 'video' ? 'video' : 'voice';
        await this.initializeWebRTC(callType);
      }

      await this.peerConnection!.setRemoteDescription({
        type: 'offer',
        sdp: offer.sdp
      });

      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      if (this.connection && this.isConnected) {
        await this.connection.invoke('SendAnswer', 
          offer.callId, 
          offer.fromUserId, 
          answer.sdp
        );
      }
    } catch (error) {
      console.error('Failed to handle incoming offer:', error);
      this.emit('error', { message: 'Failed to handle incoming offer', error });
    }
  }

  private async handleIncomingAnswer(answer: WebRTCAnswer): Promise<void> {
    try {
      if (!this.peerConnection) {
        throw new Error('No peer connection available');
      }

      await this.peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: answer.sdp
      });
    } catch (error) {
      console.error('Failed to handle incoming answer:', error);
      this.emit('error', { message: 'Failed to handle incoming answer', error });
    }
  }

  private async handleIncomingIceCandidate(candidate: WebRTCIceCandidate): Promise<void> {
    try {
      if (!this.peerConnection) {
        throw new Error('No peer connection available');
      }

      await this.peerConnection.addIceCandidate({
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex
      });
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error);
      this.emit('error', { message: 'Failed to handle ICE candidate', error });
    }
  }

  private async cleanupWebRTC(): Promise<void> {
    try {
      // Clear quality monitoring interval
      if ((this as any).qualityInterval) {
        clearInterval((this as any).qualityInterval);
        (this as any).qualityInterval = null;
      }

      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      // Close peer connection
      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }

      this.remoteStream = null;
      this.currentCallType = 'voice'; // Reset call type
      this.emit('webRTCCleanedUp');
    } catch (error) {
      console.error('Failed to cleanup WebRTC:', error);
    }
  }

  // Media controls
  public async toggleMute(): Promise<boolean> {
    try {
      if (!this.localStream) {
        throw new Error('No local stream available');
      }

      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        
        // Notify other participants
        if (this.connection && this.isConnected && this.currentCall) {
          await this.connection.invoke('UpdateMediaState', 
            this.currentCall.id, 
            !audioTrack.enabled, 
            null, 
            null
          );
        }

        this.emit('muteToggled', { muted: !audioTrack.enabled });
        return !audioTrack.enabled;
      }

      return false;
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      this.emit('error', { message: 'Failed to toggle mute', error });
      return false;
    }
  }

  public async toggleVideo(): Promise<boolean> {
    try {
      if (!this.localStream) {
        throw new Error('No local stream available');
      }

      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        
        // Notify other participants
        if (this.connection && this.isConnected && this.currentCall) {
          await this.connection.invoke('UpdateMediaState', 
            this.currentCall.id, 
            null, 
            !videoTrack.enabled, 
            null
          );
        }

        this.emit('videoToggled', { enabled: !videoTrack.enabled });
        return !videoTrack.enabled;
      }

      return false;
    } catch (error) {
      console.error('Failed to toggle video:', error);
      this.emit('error', { message: 'Failed to toggle video', error });
      return false;
    }
  }

  // Video support and quality management
  private async checkVideoSupport(): Promise<{ supported: boolean; reason?: string }> {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { supported: false, reason: 'getUserMedia not supported' };
      }

      // Check if video is supported
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideoDevice = devices.some(device => device.kind === 'videoinput');
      
      if (!hasVideoDevice) {
        return { supported: false, reason: 'No video device found' };
      }

      // Test video access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240 } 
        });
        stream.getTracks().forEach(track => track.stop());
        return { supported: true };
      } catch (error) {
        return { supported: false, reason: 'Video access denied or failed' };
      }
    } catch (error) {
      console.error('Error checking video support:', error);
      return { supported: false, reason: 'Error checking video support' };
    }
  }

  private async estimateBandwidth(): Promise<number> {
    try {
      // Use Connection API if available
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection && connection.downlink) {
          // Convert Mbps to kbps
          return connection.downlink * 1000;
        }
      }

      // Fallback: estimate based on connection type
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection && connection.effectiveType) {
          const bandwidthMap: { [key: string]: number } = {
            'slow-2g': 50,
            '2g': 250,
            '3g': 750,
            '4g': 1600
          };
          return bandwidthMap[connection.effectiveType] || 500;
        }
      }

      // Default estimate
      return 1000;
    } catch (error) {
      console.error('Error estimating bandwidth:', error);
      return 500; // Conservative estimate
    }
  }

  private adjustVideoQuality(bandwidth: number): void {
    if (bandwidth < 500) {
      this.videoQuality = 'low';
    } else if (bandwidth < 1000) {
      this.videoQuality = 'medium';
    } else if (bandwidth < 2000) {
      this.videoQuality = 'high';
    } else {
      this.videoQuality = 'hd';
    }
    
    console.log(`Adjusted video quality to ${this.videoQuality} based on bandwidth: ${bandwidth} kbps`);
    this.emit('videoQualityChanged', { quality: this.videoQuality, bandwidth });
  }

  private getVideoConstraints(): MediaTrackConstraints {
    const constraints = this.VIDEO_CONSTRAINTS[this.videoQuality];
    return {
      width: { ideal: constraints.width },
      height: { ideal: constraints.height },
      frameRate: { ideal: constraints.frameRate },
      facingMode: 'user'
    };
  }

  private applyVideoConstraints(track: MediaStreamTrack): void {
    const constraints = this.getVideoConstraints();
    track.applyConstraints(constraints).catch(error => {
      console.warn('Failed to apply video constraints:', error);
    });
  }

  private startConnectionQualityMonitoring(): void {
    if (this.currentCallType !== 'video') return;

    // Monitor connection quality every 5 seconds
    const qualityInterval = setInterval(async () => {
      if (!this.peerConnection || this.peerConnection.connectionState !== 'connected') {
        clearInterval(qualityInterval);
        return;
      }

      try {
        const stats = await this.getConnectionStats();
        if (stats && stats.quality === 'poor') {
          console.warn('Poor connection quality detected, considering quality adjustment');
          this.emit('connectionQualityWarning', stats);
        }
      } catch (error) {
        console.error('Error monitoring connection quality:', error);
      }
    }, 5000);

    // Store interval ID for cleanup
    (this as any).qualityInterval = qualityInterval;
  }

  private async monitorBandwidthAndAdjustQuality(): Promise<void> {
    if (this.currentCallType !== 'video') return;

    try {
      const stats = await this.getConnectionStats();
      if (stats && stats.quality === 'poor') {
        // Downgrade video quality
        const currentQuality = this.videoQuality;
        if (currentQuality === 'hd') {
          this.videoQuality = 'high';
        } else if (currentQuality === 'high') {
          this.videoQuality = 'medium';
        } else if (currentQuality === 'medium') {
          this.videoQuality = 'low';
        }

        if (this.videoQuality !== currentQuality) {
          console.log(`Auto-adjusting video quality from ${currentQuality} to ${this.videoQuality}`);
          this.emit('videoQualityAutoAdjusted', { 
            from: currentQuality, 
            to: this.videoQuality, 
            reason: 'Poor connection quality' 
          });

          // Apply new constraints to video track
          const videoTrack = this.localStream?.getVideoTracks()[0];
          if (videoTrack) {
            this.applyVideoConstraints(videoTrack);
          }
        }
      }
    } catch (error) {
      console.error('Error monitoring bandwidth:', error);
    }
  }

  // Utility methods
  private getCurrentUserId(): string {
    // Get user ID from localStorage token or AuthContext
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token found for current user ID');
      return '';
    }
    
    try {
      // Decode JWT token to get user ID
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '';
    } catch (error) {
      console.error('Failed to decode token for user ID:', error);
      return '';
    }
  }

  public getCurrentCall(): Call | null {
    return this.currentCall;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  public isCallActive(): boolean {
    return this.currentCall !== null && this.currentCall.status === 'active';
  }

  public getCurrentCallType(): 'voice' | 'video' {
    return this.currentCallType;
  }

  public getCurrentVideoQuality(): 'low' | 'medium' | 'high' | 'hd' {
    return this.videoQuality;
  }

  public async setVideoQuality(quality: 'low' | 'medium' | 'high' | 'hd'): Promise<boolean> {
    try {
      if (this.currentCallType !== 'video' || !this.localStream) {
        return false;
      }

      const oldQuality = this.videoQuality;
      this.videoQuality = quality;

      // Apply new constraints to video track
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        this.applyVideoConstraints(videoTrack);
        this.emit('videoQualityChanged', { 
          from: oldQuality, 
          to: quality, 
          manual: true 
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to set video quality:', error);
      this.emit('error', { message: 'Failed to set video quality', error });
      return false;
    }
  }

  public async upgradeToVideoCall(): Promise<boolean> {
    try {
      if (this.currentCallType === 'video' || !this.currentCall) {
        return false;
      }

      // Check video support
      const videoSupport = await this.checkVideoSupport();
      if (!videoSupport.supported) {
        this.emit('error', { message: 'Video not supported on this device', error: videoSupport.reason });
        return false;
      }

      // Check bandwidth
      const bandwidth = await this.estimateBandwidth();
      if (bandwidth < 500) {
        this.emit('error', { message: 'Insufficient bandwidth for video call', error: 'Low bandwidth' });
        return false;
      }

      // Update call type and reinitialize WebRTC with video
      this.currentCallType = 'video';
      this.adjustVideoQuality(bandwidth);

      // Clean up current WebRTC and reinitialize with video
      await this.cleanupWebRTC();
      await this.initializeWebRTC('video');

      // Notify backend about call type change
      if (this.connection && this.isConnected) {
        await this.connection.invoke('UpdateCallType', this.currentCall.id, 'video');
      }

      this.emit('callUpgradedToVideo', { callId: this.currentCall.id });
      return true;
    } catch (error) {
      console.error('Failed to upgrade to video call:', error);
      this.emit('error', { message: 'Failed to upgrade to video call', error });
      return false;
    }
  }

  public async getConnectionStats(): Promise<WebRTCStats | null> {
    try {
      if (!this.peerConnection) {
        return null;
      }

      const stats = await this.peerConnection.getStats();
      let latency = 0;
      let packetLoss = 0;
      let bitrate = 0;

      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
          latency = report.roundTripTime || 0;
          packetLoss = report.packetsLost || 0;
          bitrate = report.bytesReceived || 0;
        }
      });

      const quality = this.determineQuality(latency, packetLoss);

      return {
        latency,
        packetLoss,
        jitter: 0, // Would need more complex calculation
        bitrate,
        quality
      };
    } catch (error) {
      console.error('Failed to get connection stats:', error);
      return null;
    }
  }

  private determineQuality(latency: number, packetLoss: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (latency > 300 || packetLoss > 5) return 'poor';
    if (latency > 150 || packetLoss > 2) return 'fair';
    if (latency > 100 || packetLoss > 1) return 'good';
    return 'excellent';
  }

  // Cleanup
  public async dispose(): Promise<void> {
    try {
      await this.cleanupWebRTC();
      
      if (this.connection) {
        await this.connection.stop();
        this.connection = null;
      }

      this.eventHandlers.clear();
      this.isConnected = false;
      this.currentCall = null;
    } catch (error) {
      console.error('Failed to dispose call service:', error);
    }
  }
}

export const callService = new CallService();
export default callService;
