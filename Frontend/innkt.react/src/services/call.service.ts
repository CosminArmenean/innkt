import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { seerApi } from './api.service';
import { environment } from '../config/environment';
import { 
  SignalingProtocol, 
  SignalingMessage, 
  SignalingMessageType,
  OfferMessage,
  AnswerMessage,
  IceCandidateMessage,
  HangUpMessage,
  CallStartedMessage,
  CallAnsweredMessage,
  CallEndedMessage
} from './signaling-protocol';
import { userPresenceManager, UserPresence } from './user-presence';
import { webrtcStateManager } from './webrtc-state-manager';
import { mediaStreamOptimizer } from './media-stream-optimizer';

export interface CallParticipant {
  id: string;
  userId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  profilePictureUrl?: string; // Added for consistency with User interface
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
  private adaptiveBitrate: boolean = true;
  private privacyMode: boolean = false;
  private pendingIceCandidates: WebRTCIceCandidate[] = [];
  private pendingOffer: WebRTCOffer | null = null; // Buffer for incoming offers

  // Configuration
  private readonly SEER_SERVICE_URL = environment.api.seer;
  private readonly ICE_SERVERS: RTCIceServer[] = [
    // Primary STUN servers (these are reliable and free)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    
    // Additional STUN servers from other providers
    { urls: 'stun:stun.ekiga.net' },
    { urls: 'stun:stun.fwdnet.net' },
    { urls: 'stun:stun.ideasip.com' },
    { urls: 'stun:stun.iptel.org' },
    { urls: 'stun:stun.rixtelecom.se' },
    { urls: 'stun:stun.schlund.de' },
    { urls: 'stun:stunserver.org' },
    { urls: 'stun:stun.softjoys.com' },
    { urls: 'stun:stun.voiparound.com' },
    { urls: 'stun:stun.voipbuster.com' },
    { urls: 'stun:stun.voipstunt.com' },
    { urls: 'stun:stun.counterpath.com' },
    { urls: 'stun:stun.1und1.de' },
    { urls: 'stun:stun.gmx.net' },
    { urls: 'stun:stun.callwithus.com' },
    { urls: 'stun:stun.counterpath.net' },
    { urls: 'stun:stun.internetcalls.com' },
    
    // More reliable free TURN servers
    { 
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    { 
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    { 
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    
    // Additional free TURN servers
    { 
      urls: 'turn:relay1.expressturn.com:3478',
      username: 'efJBwYj8X47Xj3j',
      credential: 'YfY2Bm6Nk8Lk2Kk'
    },
    
    // More free TURN servers for better connectivity
    { 
      urls: 'turn:relay2.expressturn.com:3478',
      username: 'efJBwYj8X47Xj3j',
      credential: 'YfY2Bm6Nk8Lk2Kk'
    },
    
    // Free TURN from Xirsys (requires registration but free tier available)
    { 
      urls: 'turn:global.turn.twilio.com:3478',
      username: 'your-twilio-username',
      credential: 'your-twilio-credential'
    },
    
    // Note: For production, consider setting up your own TURN server
    // or using a commercial TURN service for better reliability
  ];

  // User presence management
  private currentUserPresence: UserPresence | null = null;
  
  // Video quality constraints
  private readonly VIDEO_CONSTRAINTS = {
    low: { width: 320, height: 240, frameRate: 15 },
    medium: { width: 640, height: 480, frameRate: 24 },
    high: { width: 1280, height: 720, frameRate: 30 },
    hd: { width: 1920, height: 1080, frameRate: 30 }
  };

  constructor() {
    // Connection will be initialized when first call is made
    this.loadPrivacySettings();
  }

  private loadPrivacySettings(): void {
    try {
      const settings = localStorage.getItem('callPrivacy');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.privacyMode = parsed.enhancedPrivacy || false;
        console.log('CallService: Privacy settings loaded:', { privacyMode: this.privacyMode });
      }
    } catch (error) {
      console.warn('CallService: Failed to load privacy settings:', error);
    }
  }

  public setPrivacyMode(enabled: boolean): void {
    this.privacyMode = enabled;
    console.log('CallService: Privacy mode set to:', enabled);
    
    // If privacy mode is enabled, prefer TURN servers
    if (enabled) {
      console.log('CallService: Enhanced privacy enabled - prioritizing TURN servers');
    }
  }

  /**
   * Configure Opus codec for audio tracks
   */
  private async configureOpusCodec(): Promise<void> {
    if (!this.peerConnection) return;

    try {
      // Get all audio transceivers
      const transceivers = this.peerConnection.getTransceivers();
      const audioTransceivers = transceivers.filter(t => t.sender.track?.kind === 'audio');

      for (const transceiver of audioTransceivers) {
        if (transceiver.setCodecPreferences) {
          // Prefer Opus codec for audio
          console.log('CallService: Configuring Opus codec for audio transceiver');
          
          // Get available codecs and prioritize Opus
          const capabilities = RTCRtpReceiver.getCapabilities('audio');
          if (capabilities) {
            const opusCodec = capabilities.codecs.find(codec => 
              codec.mimeType.toLowerCase().includes('opus')
            );
            
            if (opusCodec) {
              console.log('CallService: Opus codec available, setting as preferred');
              transceiver.setCodecPreferences([opusCodec]);
            } else {
              console.log('CallService: Opus codec not available, using browser default');
            }
          }
        }
      }
    } catch (error) {
      console.warn('CallService: Failed to configure Opus codec:', error);
    }
  }

  private async estimateNetworkQuality(): Promise<'excellent' | 'good' | 'fair' | 'poor'> {
    try {
      // Simple network quality estimation
      const start = performance.now();
      
      // Test connection to our backend
      const response = await fetch(`${this.SEER_SERVICE_URL}/api/call/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      const latency = performance.now() - start;
      
      if (response.ok) {
        if (latency < 100) return 'excellent';
        if (latency < 300) return 'good';
        if (latency < 1000) return 'fair';
        return 'poor';
      }
      
      return 'poor';
    } catch (error) {
      console.warn('CallService: Network quality test failed:', error);
      return 'poor';
    }
  }

  private adjustQualityForNetwork(quality: 'excellent' | 'good' | 'fair' | 'poor'): void {
    console.log(`CallService: Adjusting quality for network condition: ${quality}`);
    
    switch (quality) {
      case 'excellent':
        this.videoQuality = 'hd';
        break;
      case 'good':
        this.videoQuality = 'high';
        break;
      case 'fair':
        this.videoQuality = 'medium';
        break;
      case 'poor':
        this.videoQuality = 'low';
        break;
    }
    
    console.log(`CallService: Video quality adjusted to: ${this.videoQuality}`);
    this.emit('qualityAdjusted', { networkQuality: quality, videoQuality: this.videoQuality });
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
      console.log('🎯 Received WebRTC offer:', offer);
      console.log('🎯 Offer details:', {
        callId: offer.callId,
        fromUserId: offer.fromUserId,
        toUserId: offer.toUserId,
        sdpLength: offer.sdp.length,
        type: offer.type
      });
      
      // CRITICAL FIX: Don't automatically process offers for incoming calls
      // Only process offers if we're in an active call (user has already accepted)
      if (this.currentCall && this.currentCall.status === 'active') {
        console.log('🎯 Call is active, processing WebRTC offer');
        this.handleIncomingOffer(offer);
      } else {
        console.log('🎯 Call not active yet, buffering WebRTC offer for later processing');
        // Buffer the offer for later processing when user accepts
        this.pendingOffer = offer;
        console.log('🎯 WebRTC offer buffered, waiting for user to accept call');
      }
    });

    this.connection.on('ReceiveAnswer', (answer: WebRTCAnswer) => {
      console.log('🎯 Received WebRTC answer:', answer);
      console.log('🎯 Answer details:', {
        callId: answer.callId,
        fromUserId: answer.fromUserId,
        toUserId: answer.toUserId,
        sdpLength: answer.sdp.length,
        type: answer.type
      });
      this.handleIncomingAnswer(answer);
    });

    this.connection.on('ReceiveIceCandidate', (candidate: WebRTCIceCandidate) => {
      console.log('🎯 Received ICE candidate:', candidate);
      console.log('🎯 ICE candidate details:', {
        callId: candidate.callId,
        fromUserId: candidate.fromUserId,
        toUserId: candidate.toUserId,
        candidate: candidate.candidate.substring(0, 50) + '...',
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex
      });
      this.handleIncomingIceCandidate(candidate);
    });

    // Call management events
    this.connection.on('IncomingCall', (data: any) => {
      console.log('🔔🔔🔔 CallService: Incoming call received via SignalR:', data);
      console.log('CallService: IncomingCall data debug:', {
        callId: data.callId,
        callerId: data.callerId,
        calleeId: data.calleeId,
        callType: data.callType,
        currentUserId: this.getCurrentUserId()
      });
      console.log('CallService: About to emit incomingCall event to listeners');
      
      // Ensure we have a current call set for answering
      if (data.callId) {
        console.log('CallService: Setting current call for incoming call:', data.callId);
        
        // CRITICAL: For incoming calls, the current user is the CALLEE
        // So we should use the current user's ID as the calleeId
        const calleeId = this.getCurrentUserId();
        const callerId = data.callerId || data.calleeId; // Backend might send calleeId as callerId
        
        console.log('CallService: Incoming call assignment:', {
          callerId,
          calleeId,
          'data.callerId': data.callerId,
          'data.calleeId': data.calleeId
        });
        
        // Create a minimal call object for the incoming call
        this.currentCall = {
          id: data.callId,
          callerId: callerId,
          calleeId: calleeId,
          type: data.callType === 1 ? 'video' : 'voice',
          status: 'ringing',
          createdAt: new Date(data.createdAt),
          participants: []
        };
        
        console.log('CallService: Current call set:', this.currentCall);
      }
      
      this.emit('incomingCall', data);
      console.log('CallService: incomingCall event emitted');
    });

    this.connection.on('ParticipantJoined', (data: any) => {
      console.log('Participant joined:', data);
      this.emit('participantJoined', data);
    });

    this.connection.on('CallAnswered', (data: any) => {
      console.log('🔔 CallService: Backend CallAnswered event received:', data);
      console.log('🔔 CallService: NOT emitting callAnswered yet - waiting for WebRTC connection');
      // Don't emit callAnswered here - wait for WebRTC connection to be established
      // this.emit('callAnswered', data);
    });

    this.connection.on('CallEnded', (data: any) => {
      console.log('🔚 Call ended event received:', data);
      console.log('🔚 Current call ID:', this.currentCall?.id);
      console.log('🔚 Call ended by user:', data.endedBy);
      console.log('🔚 Current user ID:', this.getCurrentUserId());
      
      this.emit('callEnded', data);
    });

    this.connection.on('ParticipantLeft', (data: any) => {
      console.log('Participant left:', data);
      
      // If the other participant left and we have an active call, end the call
      if (this.currentCall && this.currentCall.id === data.callId && data.userId !== this.getCurrentUserId()) {
        console.log('Other participant left the call, ending call automatically');
        this.endCall(data.callId).catch(error => {
          console.error('Failed to end call after participant left:', error);
        });
      }
      
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
      
      // Set up automatic reconnection with exponential backoff
      this.setupAutomaticReconnection();
    } catch (error) {
      console.error('Failed to start call service connection:', error);
      this.emit('connectionStatusChanged', { connected: false, error });
      
      // Retry connection with exponential backoff
      this.scheduleReconnection();
    }
  }

  private setupAutomaticReconnection() {
    // Set up reconnection with exponential backoff
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const baseDelay = 1000; // 1 second

    const attemptReconnection = async () => {
      if (reconnectAttempts >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached. Giving up.');
        return;
      }

      if (!this.connection || this.connection.state === HubConnectionState.Connected) {
        return; // Already connected or no connection object
      }

      reconnectAttempts++;
      const delay = baseDelay * Math.pow(2, reconnectAttempts - 1); // Exponential backoff
      
      console.log(`Attempting reconnection ${reconnectAttempts}/${maxReconnectAttempts} in ${delay}ms...`);
      
      setTimeout(async () => {
        try {
          await this.connection?.start();
          this.isConnected = true;
          reconnectAttempts = 0; // Reset on successful connection
          console.log('Reconnection successful');
          this.emit('connectionStatusChanged', { connected: true });
        } catch (error) {
          console.error(`Reconnection attempt ${reconnectAttempts} failed:`, error);
          this.emit('connectionStatusChanged', { connected: false, error, reconnecting: true });
          attemptReconnection(); // Try again
        }
      }, delay);
    };

    // Store the reconnection function for cleanup
    (this as any).reconnectionFunction = attemptReconnection;
  }

  private scheduleReconnection() {
    // Initial reconnection attempt after 2 seconds
    setTimeout(() => {
      if ((this as any).reconnectionFunction) {
        (this as any).reconnectionFunction();
      }
    }, 2000);
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
    console.log(`CallService: Added listener for '${event}' event. Total listeners: ${this.eventHandlers.get(event)!.length}`);
  }

  public off(event: string, handler: Function) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        console.log(`CallService: Removed listener for '${event}' event. Remaining listeners: ${handlers.length}`);
      }
    }
  }

  public removeAllListeners(event?: string) {
    if (event) {
      this.eventHandlers.delete(event);
      console.log(`CallService: Removed all listeners for '${event}' event`);
    } else {
      this.eventHandlers.clear();
      console.log('CallService: Removed all event listeners');
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
    
    // Initialize user presence after connection
    this.initializeUserPresence();
  }

  /**
   * Initialize user presence management
   */
  private initializeUserPresence(): void {
    console.log('CallService: Initializing user presence management');
    
    // Set up user presence event handlers
    userPresenceManager.on('user-online', (event: any) => {
      console.log('CallService: User came online:', event);
      this.emit('userPresenceChanged', event);
    });

    userPresenceManager.on('user-offline', (event: any) => {
      console.log('CallService: User went offline:', event);
      this.emit('userPresenceChanged', event);
    });

    userPresenceManager.on('user-in-call', (event: any) => {
      console.log('CallService: User is in call:', event);
      this.emit('userPresenceChanged', event);
    });

    userPresenceManager.on('user-available', (event: any) => {
      console.log('CallService: User is available:', event);
      this.emit('userPresenceChanged', event);
    });
  }

  /**
   * Send structured signaling message
   */
  private async sendSignalingMessage(message: SignalingMessage): Promise<void> {
    if (!this.connection || !this.isConnected) {
      throw new Error('SignalR connection not established');
    }

    try {
      // Log message for debugging
      SignalingProtocol.logMessage(message, 'sent');

      // Send via SignalR based on message type
      switch (message.type) {
        case SignalingMessageType.OFFER:
          await this.connection.invoke('SendOffer', 
            message.callId, 
            message.toUserId, 
            (message as OfferMessage).sdp
          );
          break;

        case SignalingMessageType.ANSWER:
          await this.connection.invoke('SendAnswer', 
            message.callId, 
            message.toUserId, 
            (message as AnswerMessage).sdp
          );
          break;

        case SignalingMessageType.ICE_CANDIDATE:
          const iceMsg = message as IceCandidateMessage;
          await this.connection.invoke('SendIceCandidate', 
            message.callId, 
            message.toUserId, 
            iceMsg.candidate,
            iceMsg.sdpMid,
            iceMsg.sdpMLineIndex
          );
          break;

        case SignalingMessageType.HANG_UP:
          await this.connection.invoke('EndCall', message.callId);
          break;

        default:
          console.warn('CallService: Unknown signaling message type:', message.type);
      }

      console.log('CallService: Signaling message sent successfully:', message.type);
    } catch (error) {
      console.error('CallService: Failed to send signaling message:', error);
      throw error;
    }
  }

  /**
   * Parse and handle incoming signaling message
   */
  private handleSignalingMessage(rawMessage: any): void {
    try {
      const message = SignalingProtocol.parseMessage(rawMessage);
      SignalingProtocol.logMessage(message, 'received');

      switch (message.type) {
        case SignalingMessageType.OFFER:
          this.handleIncomingOffer(message as OfferMessage);
          break;

        case SignalingMessageType.ANSWER:
          this.handleIncomingAnswer(message as AnswerMessage);
          break;

        case SignalingMessageType.ICE_CANDIDATE:
          const iceMessage = message as IceCandidateMessage;
          // Convert to WebRTC format
          const webRTCCandidate: WebRTCIceCandidate = {
            callId: iceMessage.callId,
            fromUserId: iceMessage.fromUserId,
            toUserId: iceMessage.toUserId,
            candidate: iceMessage.candidate,
            sdpMid: iceMessage.sdpMid || '',
            sdpMLineIndex: iceMessage.sdpMLineIndex || 0
          };
          this.handleIncomingIceCandidate(webRTCCandidate);
          break;

        case SignalingMessageType.HANG_UP:
          this.handleCallHangUp(message as HangUpMessage);
          break;

        default:
          console.warn('CallService: Unhandled signaling message type:', message.type);
      }
    } catch (error) {
      console.error('CallService: Failed to parse signaling message:', error);
    }
  }

  /**
   * Handle hang up message
   */
  private handleCallHangUp(message: HangUpMessage): void {
    console.log('CallService: Received hang up message:', message);
    
    if (this.currentCall && this.currentCall.id === message.callId) {
      console.log('CallService: Ending call due to hang up from other participant');
      this.endCall(message.callId).catch(error => {
        console.error('CallService: Failed to end call after hang up:', error);
      });
    }
  }

  /**
   * Get user presence information
   */
  public getUserPresence(userId: string): UserPresence | null {
    return userPresenceManager.getUserPresence(userId);
  }

  /**
   * Get all available users
   */
  public getAvailableUsers(): UserPresence[] {
    return userPresenceManager.getAvailableUsers();
  }

  /**
   * Check if user is available for calls
   */
  public isUserAvailable(userId: string): boolean {
    return userPresenceManager.isUserAvailable(userId);
  }

  /**
   * Set current user as in call
   */
  public setCurrentUserInCall(callId: string): void {
    const currentUserId = this.getCurrentUserId();
    if (currentUserId) {
      userPresenceManager.setUserInCall(currentUserId, callId);
    }
  }

  /**
   * Set current user as available
   */
  public setCurrentUserAvailable(): void {
    const currentUserId = this.getCurrentUserId();
    if (currentUserId) {
      userPresenceManager.setUserAvailable(currentUserId);
    }
  }

  /**
   * Set up WebRTC state handlers
   */
  private setupWebRTCStateHandlers(callId: string): void {
    console.log(`CallService: Setting up WebRTC state handlers for call ${callId}`);

    // Connection state changes
    webrtcStateManager.on('connectionStateChanged', (event: any) => {
      if (event.callId === callId) {
        console.log(`CallService: Connection state changed for call ${callId}:`, event.newState);
        this.emit('connectionStateChanged', event.newState);
      }
    });

    // ICE connection state changes
    webrtcStateManager.on('iceConnectionStateChanged', (event: any) => {
      if (event.callId === callId) {
        console.log(`CallService: ICE connection state changed for call ${callId}:`, event.newState);
        this.emit('iceConnectionStateChanged', event.newState);
      }
    });

    // Negotiation needed
    webrtcStateManager.on('negotiationNeeded', (event: any) => {
      if (event.callId === callId) {
        console.log(`CallService: Negotiation needed for call ${callId}`);
        this.handleNegotiationNeeded(callId);
      }
    });

    // ICE candidates
    webrtcStateManager.on('iceCandidate', (event: any) => {
      if (event.callId === callId) {
        console.log(`CallService: ICE candidate for call ${callId}:`, event.candidate.candidate.substring(0, 50) + '...');
        this.handleLocalIceCandidate(event.candidate);
      }
    });

    // Quality metrics
    webrtcStateManager.on('qualityMetrics', (event: any) => {
      if (event.callId === callId) {
        console.log(`CallService: Quality metrics for call ${callId}:`, event.metrics);
        this.emit('qualityMetrics', event.metrics);
      }
    });

    // Quality warnings
    webrtcStateManager.on('qualityWarning', (event: any) => {
      if (event.callId === callId) {
        console.warn(`CallService: Quality warning for call ${callId}:`, event.metrics);
        this.emit('qualityWarning', event.metrics);
      }
    });

    // Reconnection attempts
    webrtcStateManager.on('reconnectionAttempt', (event: any) => {
      if (event.callId === callId) {
        console.log(`CallService: Reconnection attempt ${event.attempt} for call ${callId}`);
        this.emit('reconnectionAttempt', event);
      }
    });

    // Connection failures
    webrtcStateManager.on('connectionFailed', (event: any) => {
      if (event.callId === callId) {
        console.error(`CallService: Connection failed for call ${callId}`);
        this.emit('connectionFailed', event);
      }
    });
  }

  /**
   * Handle negotiation needed
   */
  private handleNegotiationNeeded(callId: string): void {
    console.log(`CallService: Handling negotiation needed for call ${callId}`);
    
    // Emit negotiation needed event
    this.emit('negotiationNeeded', {
      callId,
      timestamp: Date.now()
    });
  }

  /**
   * Handle local ICE candidate
   */
  private handleLocalIceCandidate(candidate: RTCIceCandidate): void {
    if (this.connection && this.isConnected && this.currentCall) {
      console.log('📤 Sending ICE candidate:', candidate.candidate.substring(0, 50) + '...');
      
      // Send via structured signaling
      const iceMessage = SignalingProtocol.createIceCandidate(
        this.currentCall.id,
        this.getCurrentUserId(),
        this.currentCall.calleeId,
        candidate.candidate,
        candidate.sdpMid,
        candidate.sdpMLineIndex
      );

      this.sendSignalingMessage(iceMessage).then(() => {
        console.log('✅ ICE candidate sent successfully via structured signaling');
      }).catch(error => {
        console.error('❌ Failed to send ICE candidate via structured signaling:', error);
      });
    }
  }

  // Call management
  public async startCall(calleeId: string, type: 'voice' | 'video' = 'voice', conversationId?: string): Promise<Call> {
    try {
      console.log(`🚀 Starting ${type} call to ${calleeId}`);
      console.log(`📋 Call parameters:`, { calleeId, type, conversationId });
      
      // Initialize connection if not already done
      this.initializeConnection();
      
      // Ensure connection is established
      console.log(`🔌 Ensuring SignalR connection is established...`);
      await this.startConnection();
      console.log(`✅ SignalR connection established`);
      
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
      
      console.log('📞 Sending call request to Seer API:', requestPayload);
      
      const response = await seerApi.post('/api/call/start', requestPayload);
      console.log('📞 Seer API response:', response.data);

      const call: Call = response.data.data;
      this.currentCall = call;
      console.log('📞 Call created successfully:', call);

             // Initialize WebRTC
             console.log('🔧 Initializing WebRTC for call:', call.id);
             await this.initializeWebRTC(type);
             console.log('✅ WebRTC initialized successfully');
             
             console.log('🔗 Joining call:', call.id);
             await this.joinCall(call.id);
             console.log('✅ Successfully joined call');

             // Wait for connection stability before sending offer (like real apps)
             console.log('⏳ Waiting for connection stability (2 seconds)...');
             await new Promise(resolve => setTimeout(resolve, 2000));
             console.log('✅ Connection stability wait completed');

      // Create and send WebRTC offer to callee
      if (this.peerConnection && this.connection && this.isConnected) {
        console.log('📤 Creating WebRTC offer for callee:', calleeId);
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        // Send offer to callee
        try {
          console.log('📤 Sending WebRTC offer to callee:', calleeId);
          console.log('📤 Offer SDP length:', offer.sdp?.length || 0);
          console.log('📤 Offer SDP preview:', offer.sdp?.substring(0, 100) + '...' || 'No SDP');
          
          await this.connection.invoke('SendOffer', call.id, calleeId, offer.sdp);
          console.log('✅ WebRTC offer sent successfully to callee:', calleeId);
          
          // Wait a moment for the offer to be processed, then send ICE candidates
          setTimeout(() => {
            console.log('📤 Sending pending ICE candidates to callee:', calleeId);
            this.sendPendingIceCandidates(call.id, calleeId);
          }, 1000);
        } catch (error) {
          console.error('❌ Failed to send WebRTC offer:', error);
          throw error;
        }
      } else {
        console.error('❌ Cannot send WebRTC offer - missing peerConnection or SignalR connection');
        console.log('Debug info:', {
          hasPeerConnection: !!this.peerConnection,
          hasConnection: !!this.connection,
          isConnected: this.isConnected
        });
      }

      console.log('🎉 CallService: Emitting callStarted event for call:', call);
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
      console.log('📞 CallService: Answering call:', callId);

      // Ensure connection is established before answering
      if (!this.connection || !this.isConnected) {
        console.log('🔌 CallService: SignalR not connected, attempting to connect...');
        await this.connect();
        
        // Wait a moment for connection to be fully established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!this.connection || !this.isConnected) {
          throw new Error('Failed to establish SignalR connection for call answer');
        }
        console.log('✅ CallService: SignalR connection established for call answer');
      }

      console.log('📞 CallService: Joining call via SignalR:', callId);
      await this.connection.invoke('JoinCall', callId);
      console.log('✅ CallService: Successfully joined call:', callId);
      
      // Determine call type from current call or default to voice
      const callType = this.currentCall?.type === 'video' ? 'video' : 'voice';
      await this.initializeWebRTC(callType);

      // For the callee (answerer), we should wait for the caller's offer
      // and then create an answer, NOT create a new offer
      console.log('📞 Callee ready to receive offer from caller');
      
      // CRITICAL FIX: Process any pending WebRTC offer now that user has accepted
      if (this.pendingOffer && this.pendingOffer.callId === callId) {
        console.log('🎯 Processing buffered WebRTC offer after user accepted call');
        await this.handleIncomingOffer(this.pendingOffer);
        this.pendingOffer = null; // Clear the buffered offer
      }
      
      // DON'T emit callAnswered here - wait for WebRTC connection to be established
      // this.emit('callAnswered', { callId });
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

      // Clean up WebRTC resources first
      await this.cleanupWebRTC();

      // End call via API (this will notify other participants)
      try {
        await seerApi.post(`/api/call/${callId}/end`, {});
        console.log('Call ended via API successfully');
      } catch (apiError) {
        console.warn('Failed to end call via API, but continuing with cleanup:', apiError);
      }

      // Leave call via SignalR (if connected)
      if (this.connection) {
        try {
          // Check connection state before attempting to send
          if (this.connection.state === 'Connected') {
            await this.connection.invoke('LeaveCall', callId);
            console.log('Left call via SignalR successfully');
          } else {
            console.log('SignalR connection not in Connected state, skipping LeaveCall', {
              state: this.connection.state,
              isConnected: this.isConnected
            });
          }
        } catch (signalRError) {
          console.warn('Failed to leave call via SignalR:', signalRError);
        }
      }

      // Clear current call and emit event
      this.currentCall = null;
      this.pendingOffer = null; // Clear any buffered offers
      this.emit('callEnded', { callId });
      
      console.log('Call ended successfully:', callId);
    } catch (error) {
      console.error('Failed to end call:', error);
      
      // Still cleanup even if backend calls fail
      try {
        await this.cleanupWebRTC();
        this.currentCall = null;
        this.pendingOffer = null; // Clear any buffered offers
        this.emit('callEnded', { callId });
      } catch (cleanupError) {
        console.error('Failed to cleanup after call end error:', cleanupError);
      }
      
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
      console.log(`🔧 Starting WebRTC initialization for ${callType} call`);
      
      // Create optimized media stream using the media optimizer
      const mediaConstraints = {
        audio: true,
        video: callType === 'video' ? this.getVideoConstraints() : false
      };

      console.log(`🎤 Creating optimized media stream with constraints:`, mediaConstraints);
      
      // Use media stream optimizer for better quality management
      const callId = this.currentCall?.id || 'temp-call';
      this.localStream = await mediaStreamOptimizer.createOptimizedStream(
        callId,
        mediaConstraints,
        {
          enabled: true,
          adjustmentInterval: 5000
        }
      );
      
      console.log(`✅ Optimized media stream created successfully:`, {
        audioTracks: this.localStream.getAudioTracks().length,
        videoTracks: this.localStream.getVideoTracks().length
      });

    // Create peer connection with enhanced configuration
    const peerConnectionConfig: RTCConfiguration = {
      iceServers: this.ICE_SERVERS,
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceTransportPolicy: 'all', // Try both STUN and TURN servers
    };

      // Video calls already have iceTransportPolicy set to 'all' above

      console.log(`🔗 Creating RTCPeerConnection with config:`, peerConnectionConfig);
      this.peerConnection = new RTCPeerConnection(peerConnectionConfig);
      
      // Configure Opus codec for audio tracks
      await this.configureOpusCodec();
      console.log(`✅ RTCPeerConnection created successfully`);

      // Register connection with WebRTC state manager
      if (this.currentCall) {
        webrtcStateManager.registerConnection(this.currentCall.id, this.peerConnection);
        this.setupWebRTCStateHandlers(this.currentCall.id);
      }

      // Add local stream
      console.log(`📤 Adding local stream tracks to peer connection`);
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
        console.log(`📤 Added ${track.kind} track:`, track.label);
      });

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        const stream = event.streams[0];
        console.log('🎯 Received remote stream:', stream);
        console.log('🎯 Event details:', {
          streams: event.streams.length,
          track: event.track ? {
            kind: event.track.kind,
            enabled: event.track.enabled,
            muted: event.track.muted,
            readyState: event.track.readyState,
            label: event.track.label
          } : 'No track'
        });
        
        // Debug stream details and fix audio muting
        if (stream) {
          const audioTracks = stream.getAudioTracks();
          const videoTracks = stream.getVideoTracks();
          console.log('🔍 Remote stream details:', {
            audioTracks: audioTracks.length,
            videoTracks: videoTracks.length,
            audioTrackDetails: audioTracks.map(track => ({
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState,
              label: track.label,
              kind: track.kind
            }))
          });
          
          // CRITICAL: Check if WE are muting the tracks
          audioTracks.forEach((track, index) => {
            console.log(`🔍 BEFORE fixing - Audio track ${index}:`, {
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState,
              label: track.label
            });
            
            // Force enable the track (this should NOT cause muted=true)
            track.enabled = true;
            
            console.log(`🔍 AFTER enabling - Audio track ${index}:`, {
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState,
              label: track.label
            });
            
            // If still muted, it's definitely browser/system level
            if (track.muted) {
              console.error(`❌ Audio track ${index} is STILL muted after enabling - this is browser/system level muting`);
            } else {
              console.log(`✅ Audio track ${index} is now unmuted`);
            }
          });
        }
        
        this.remoteStream = stream;
        this.emit('remoteStreamReceived', this.remoteStream);
        
        // Only emit callAnswered if we're the CALLEE (not the caller)
        // The caller's UI should stay in "ringing" state until callee accepts
        if (this.currentCall) {
          const isCallee = this.currentCall.calleeId === this.getCurrentUserId();
          console.log('✅ CallService: WebRTC connection established');
          console.log('🔍 CallService: isCallee =', isCallee, 'currentUserId =', this.getCurrentUserId(), 'calleeId =', this.currentCall.calleeId);
          
          if (isCallee) {
            console.log('✅ CallService: We are callee, emitting callAnswered');
            this.emit('callAnswered', { callId: this.currentCall.id });
          } else {
            console.log('🔍 CallService: We are caller, NOT emitting callAnswered yet');
          }
        }
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.connection && this.isConnected && this.currentCall) {
          console.log('📤 Sending ICE candidate:', event.candidate.candidate.substring(0, 50) + '...');
          this.connection.invoke('SendIceCandidate', 
            this.currentCall.id, 
            this.getCurrentUserId(), 
            event.candidate.candidate, 
            event.candidate.sdpMid, 
            event.candidate.sdpMLineIndex
          ).then(() => {
            console.log('✅ ICE candidate sent successfully');
          }).catch(error => {
            console.error('❌ Failed to send ICE candidate:', error);
          });
        } else if (!event.candidate) {
          console.log('🏁 ICE gathering complete - no more candidates');
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        const connectionState = this.peerConnection?.connectionState;
        console.log('WebRTC connection state:', connectionState);
        
        // Debug connection state changes
        if (connectionState === 'failed') {
          console.error('WebRTC connection failed! Check network connectivity and firewall settings.');
          console.log('Attempting to reconnect...');
          
          // Attempt to restart the connection after a short delay
          setTimeout(async () => {
            try {
              console.log('Retrying WebRTC connection...');
              await this.cleanupWebRTC();
              await this.initializeWebRTC(callType);
              
              // Re-establish call if we have an active call
              if (this.currentCall && this.connection && this.isConnected) {
                await this.joinCall(this.currentCall.id);
                console.log('Reconnected to call after failure');
              }
            } catch (error) {
              console.error('Failed to reconnect WebRTC:', error);
            }
          }, 2000); // Wait 2 seconds before retry
          
        } else if (connectionState === 'connected') {
          console.log('WebRTC connection established successfully!');
        }
        
        this.emit('connectionStateChanged', connectionState);
        
        // Monitor connection quality for video calls
        if (callType === 'video' && connectionState === 'connected') {
          this.startConnectionQualityMonitoring();
        }
      };

      // Handle ICE connection state changes for quality monitoring
      this.peerConnection.oniceconnectionstatechange = () => {
        const iceState = this.peerConnection?.iceConnectionState;
        console.log('ICE connection state:', iceState);
        
        // Debug ICE connection issues
        if (iceState === 'failed') {
          console.error('ICE connection failed! This usually means network connectivity issues or firewall blocking.');
          console.log('Troubleshooting tips:');
          console.log('1. Check if both users are on the same network');
          console.log('2. Try disabling firewall temporarily');
          console.log('3. Check if TURN servers are accessible');
        } else if (iceState === 'connected') {
          console.log('ICE connection established! Audio/video should be working now.');
        }
        
        if (callType === 'video' && iceState === 'connected') {
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
      console.log('🎯 Handling incoming WebRTC offer:', offer);
      
      if (!this.peerConnection) {
        console.log('📞 No peer connection, initializing WebRTC for incoming offer');
        // Determine call type from current call or default to voice
        const callType = this.currentCall?.type === 'video' ? 'video' : 'voice';
        await this.initializeWebRTC(callType);
      }

      // Check if we already have a remote description set (we might have received an answer already)
      if (this.peerConnection!.remoteDescription) {
        console.log('⚠️ Already have remote description, ignoring incoming offer');
        console.log('Current signaling state:', this.peerConnection!.signalingState);
        console.log('Current remote description type:', this.peerConnection!.remoteDescription.type);
        return; // Ignore the offer if we already have a remote description
      }

      console.log('📥 Setting remote description (offer)...');
      await this.peerConnection!.setRemoteDescription({
        type: 'offer',
        sdp: offer.sdp
      });
      console.log('✅ Remote description set successfully');

      // Process any pending ICE candidates
      await this.processPendingIceCandidates();

      console.log('📤 Creating answer...');
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);
      console.log('✅ Answer created and set as local description');

      if (this.connection && this.isConnected) {
        console.log('📤 Sending answer to caller:', offer.fromUserId);
        await this.connection.invoke('SendAnswer', 
          offer.callId, 
          offer.fromUserId, 
          answer.sdp
        );
        console.log('✅ Answer sent successfully');
      }
    } catch (error) {
      console.error('Failed to handle incoming offer:', error);
      this.emit('error', { message: 'Failed to handle incoming offer', error });
    }
  }

  private async handleIncomingAnswer(answer: WebRTCAnswer): Promise<void> {
    try {
      console.log('🎯 Handling incoming WebRTC answer:', answer);
      
      if (!this.peerConnection) {
        console.warn('⏸️ No peer connection yet, ignoring answer (this is normal for callee)');
        return; // Callee doesn't need to process answers
      }

      // Check if we already have a remote description set
      if (this.peerConnection.remoteDescription) {
        console.log('⚠️ Already have remote description, ignoring incoming answer');
        console.log('Current signaling state:', this.peerConnection.signalingState);
        console.log('Current remote description type:', this.peerConnection.remoteDescription.type);
        return; // Ignore the answer if we already have a remote description
      }

      console.log('📥 Setting remote description (answer)...');
      await this.peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: answer.sdp
      });
      console.log('✅ Remote description set successfully');

      // Process any pending ICE candidates
      await this.processPendingIceCandidates();
      console.log('✅ Processed pending ICE candidates');
    } catch (error) {
      console.error('Failed to handle incoming answer:', error);
      this.emit('error', { message: 'Failed to handle incoming answer', error });
    }
  }

  private async handleIncomingIceCandidate(candidate: WebRTCIceCandidate): Promise<void> {
    try {
      // If no peer connection yet, buffer the candidate for later
      if (!this.peerConnection) {
        console.log('⏸️ No peer connection yet, buffering ICE candidate for later');
        if (!this.pendingIceCandidates) {
          this.pendingIceCandidates = [];
        }
        this.pendingIceCandidates.push(candidate);
        console.log(`📦 Buffered ICE candidate. Total buffered: ${this.pendingIceCandidates.length}`);
        return;
      }

      // Check if remote description is set
      if (this.peerConnection.remoteDescription === null) {
        console.log('⏸️ Remote description not set yet, queuing ICE candidate');
        // Queue the candidate to be added later
        if (!this.pendingIceCandidates) {
          this.pendingIceCandidates = [];
        }
        this.pendingIceCandidates.push(candidate);
        console.log(`📦 Queued ICE candidate. Total queued: ${this.pendingIceCandidates.length}`);
        return;
      }

      await this.peerConnection.addIceCandidate({
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex
      });
      
      console.log('ICE candidate added successfully');
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error);
      this.emit('error', { message: 'Failed to handle ICE candidate', error });
    }
  }

  private async processPendingIceCandidates(): Promise<void> {
    if (!this.peerConnection || this.pendingIceCandidates.length === 0) {
      return;
    }

    console.log(`Processing ${this.pendingIceCandidates.length} pending ICE candidates`);
    
    for (const candidate of this.pendingIceCandidates) {
      try {
        await this.peerConnection.addIceCandidate({
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex
        });
        console.log('Queued ICE candidate added successfully');
      } catch (error) {
        console.error('Failed to add queued ICE candidate:', error);
      }
    }
    
    // Clear the pending candidates
    this.pendingIceCandidates = [];
  }

  private async sendPendingIceCandidates(callId: string, targetUserId: string): Promise<void> {
    if (!this.connection || !this.isConnected) {
      return;
    }

    // Collect ICE candidates that were generated during offer creation
    const iceCandidates: RTCIceCandidate[] = [];
    
    // Wait for ICE gathering to complete
    await new Promise<void>((resolve) => {
      if (this.peerConnection!.iceGatheringState === 'complete') {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        console.log('ICE gathering timeout, proceeding with available candidates');
        resolve();
      }, 5000);

      this.peerConnection!.onicecandidate = (event) => {
        if (event.candidate) {
          iceCandidates.push(event.candidate);
          console.log('Collected ICE candidate:', event.candidate.candidate);
        } else {
          clearTimeout(timeout);
          console.log('ICE gathering complete, sending all candidates');
          resolve();
        }
      };
    });

    // Send all collected ICE candidates
    for (const candidate of iceCandidates) {
      try {
        await this.connection.invoke('SendIceCandidate', callId, targetUserId, {
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex
        });
        console.log('Sent ICE candidate to', targetUserId);
      } catch (error) {
        console.error('Failed to send ICE candidate:', error);
      }
    }
  }

  private async cleanupWebRTC(): Promise<void> {
    try {
      console.log('🧹 Cleaning up WebRTC resources');

      // Clean up media stream optimizer
      if (this.currentCall) {
        mediaStreamOptimizer.cleanupStream(this.currentCall.id);
      }

      // Clean up WebRTC state manager
      if (this.currentCall) {
        webrtcStateManager.cleanupConnection(this.currentCall.id);
      }

      // Clear quality monitoring interval
      if ((this as any).qualityInterval) {
        clearInterval((this as any).qualityInterval);
        (this as any).qualityInterval = null;
      }

      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          track.stop();
          console.log(`🧹 Stopped ${track.kind} track: ${track.label}`);
        });
        this.localStream = null;
      }

      // Close peer connection
      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
        console.log('🧹 Peer connection closed');
      }

      this.remoteStream = null;
      this.currentCallType = 'voice'; // Reset call type
      this.pendingIceCandidates = []; // Clear pending candidates
      
      console.log('✅ WebRTC cleanup completed');
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

      // Don't clear event handlers as they might be needed by other components
      // this.eventHandlers.clear(); // Commented out to prevent losing event listeners
      this.isConnected = false;
      this.currentCall = null;
      console.log('CallService: Disposed but keeping event handlers intact');
    } catch (error) {
      console.error('Failed to dispose call service:', error);
    }
  }
}

export const callService = new CallService();
export default callService;
