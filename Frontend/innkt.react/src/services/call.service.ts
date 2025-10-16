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

  // Configuration
  private readonly SEER_SERVICE_URL = 'http://localhost:5267';
  private readonly ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('No access token found for call service');
        return;
      }

      this.connection = new HubConnectionBuilder()
        .withUrl(`${this.SEER_SERVICE_URL}/hubs/signaling`, {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .build();

      this.setupEventHandlers();
      await this.startConnection();
    } catch (error) {
      console.error('Failed to initialize call service connection:', error);
    }
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
    this.connection.on('ParticipantJoined', (data: any) => {
      console.log('Participant joined:', data);
      this.emit('participantJoined', data);
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
    if (!this.connection || this.connection.state === HubConnectionState.Connected) {
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
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  // Call management
  public async startCall(calleeId: string, type: 'voice' | 'video' = 'voice', conversationId?: string): Promise<Call> {
    try {
      console.log(`Starting ${type} call to ${calleeId}`);

      // Create call via Seer service API
      // Match C# PascalCase property names and capitalize enum value
      const callType = type.charAt(0).toUpperCase() + type.slice(1);
      
      const requestPayload = {
        CalleeId: calleeId,  // PascalCase to match C# model
        Type: callType,      // PascalCase and capitalized enum value
        ConversationId: conversationId  // PascalCase to match C# model
      };
      
      console.log('📞 Sending call request:', requestPayload);
      
      const response = await seerApi.post('/api/call/start', requestPayload);

      const call: Call = response.data.data;
      this.currentCall = call;

      // Initialize WebRTC for voice calls
      if (type === 'voice') {
        await this.initializeWebRTC();
        await this.joinCall(call.id);
      }

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
      await this.initializeWebRTC();

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
  private async initializeWebRTC(): Promise<void> {
    try {
      // Get user media for voice
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: this.ICE_SERVERS
      });

      // Add local stream
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
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
      };

      this.emit('webRTCInitialized');
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      this.emit('error', { message: 'Failed to initialize WebRTC', error });
      throw error;
    }
  }

  private async handleIncomingOffer(offer: WebRTCOffer): Promise<void> {
    try {
      if (!this.peerConnection) {
        await this.initializeWebRTC();
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
