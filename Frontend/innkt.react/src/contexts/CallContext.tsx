import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { callService, Call, CallParticipant, CallEvent, WebRTCStats } from '../services/call.service';
import { useAuth } from './AuthContext';

interface CallContextType {
  // Call state
  currentCall: Call | null;
  isInCall: boolean;
  callStatus: 'idle' | 'ringing' | 'connecting' | 'active' | 'ending';
  
  // Connection state
  isConnected: boolean;
  connectionError: string | null;
  
  // Media state
  isMuted: boolean;
  isVideoEnabled: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionStats: WebRTCStats | null;
  
  // Call management
  startCall: (calleeId: string, type: 'voice' | 'video', conversationId?: string) => Promise<Call>;
  answerCall: (callId: string) => Promise<void>;
  rejectCall: (callId: string) => Promise<void>;
  endCall: (callId: string) => Promise<void>;
  
  // Media controls
  toggleMute: () => Promise<boolean>;
  toggleVideo: () => Promise<boolean>;
  
  // Video controls
  getCurrentCallType: () => 'voice' | 'video';
  getCurrentVideoQuality: () => 'low' | 'medium' | 'high' | 'hd';
  setVideoQuality: (quality: 'low' | 'medium' | 'high' | 'hd') => Promise<boolean>;
  upgradeToVideoCall: () => Promise<boolean>;
  
  // Participants
  participants: CallParticipant[];
  
  // Event handlers
  onIncomingCall: (call: Call) => void;
  onCallEnded: (callId: string) => void;
  onParticipantJoined: (participant: CallParticipant) => void;
  onParticipantLeft: (participantId: string) => void;
  
  // UI state
  showCallModal: boolean;
  setShowCallModal: (show: boolean) => void;
  incomingCall: Call | null;
  setIncomingCall: (call: Call | null) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

interface CallProviderProps {
  children: React.ReactNode;
}

export const CallProvider: React.FC<CallProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Call state
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connecting' | 'active' | 'ending'>('idle');
  
  // Flag to ensure setup is only called once
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  
  // Debug logging
  console.log('CallProvider: Component mounted/updated', { 
    isAuthenticated, 
    userId: user?.id, 
    username: user?.username,
    isSetupComplete 
  });
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Media state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionStats, setConnectionStats] = useState<WebRTCStats | null>(null);
  
  // Participants
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  
  // UI state
  const [showCallModal, setShowCallModal] = useState(false);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);

  const setupCallService = useCallback(() => {
    console.log('CallContext: Setting up call service event handlers');
    
    // Connection status events
    callService.on('connectionStatusChanged', (data: { connected: boolean; reconnecting?: boolean; error?: any }) => {
      console.log('CallContext: Call service connection status:', data);
      setIsConnected(data.connected);
      setConnectionError(data.error?.message || null);
    });

    // Call events
    callService.on('callStarted', (call: Call) => {
      console.log('CallContext: Call started event received:', call);
      setCurrentCall(call);
      setIsInCall(true);
      setCallStatus('ringing');
      setShowCallModal(true);
      setParticipants(call.participants || []);
    });

    callService.on('callAnswered', (data: { callId: string }) => {
      console.log('Call answered:', data);
      setCallStatus('active');
    });

    callService.on('callRejected', (data: { callId: string }) => {
      console.log('Call rejected:', data);
      setCallStatus('idle');
      setIsInCall(false);
      setCurrentCall(null);
      setShowCallModal(false);
    });

    callService.on('callEnded', (data: { callId: string }) => {
      console.log('Call ended:', data);
      setCallStatus('idle');
      setIsInCall(false);
      setCurrentCall(null);
      setShowCallModal(false);
      setParticipants([]);
      setLocalStream(null);
      setRemoteStream(null);
    });

    callService.on('incomingCall', (data: { CallId: string; CallerId: string; CallType: number; ConversationId?: string; CreatedAt: string }) => {
      console.log('CallContext: Incoming call received:', data);
      const call: Call = {
        id: data.CallId,
        callerId: data.CallerId,
        calleeId: user?.id || '',
        type: data.CallType === 1 ? 'video' : 'voice',
        status: 'ringing',
        conversationId: data.ConversationId,
        createdAt: new Date(data.CreatedAt),
        participants: [],
        roomId: ''
      };
      setIncomingCall(call);
      setShowCallModal(true);
      setCallStatus('ringing');
    });

    // Video-specific events
    callService.on('callTypeFallback', (data: { from: string; to: string; reason: string }) => {
      console.log('Call type fallback:', data);
      // You can show a notification to the user about the fallback
    });

    callService.on('videoQualityChanged', (data: { from?: string; to: string; manual?: boolean }) => {
      console.log('Video quality changed:', data);
      // Update UI to show current video quality
    });

    callService.on('videoQualityAutoAdjusted', (data: { from: string; to: string; reason: string }) => {
      console.log('Video quality auto-adjusted:', data);
      // Show notification about automatic quality adjustment
    });

    callService.on('callUpgradedToVideo', (data: { callId: string }) => {
      console.log('Call upgraded to video:', data);
      // Update UI to show video call is now active
    });

    callService.on('connectionQualityWarning', (stats: WebRTCStats) => {
      console.log('Connection quality warning:', stats);
      // Show warning about poor connection quality
    });

    // Participant events
    callService.on('participantJoined', (participant: CallParticipant) => {
      console.log('Participant joined:', participant);
      setParticipants(prev => [...prev.filter(p => p.id !== participant.id), participant]);
    });

    callService.on('participantLeft', (data: { participantId: string }) => {
      console.log('Participant left:', data);
      setParticipants(prev => prev.filter(p => p.id !== data.participantId));
    });

    // Media events
    callService.on('remoteStreamReceived', (stream: MediaStream) => {
      console.log('Remote stream received');
      setRemoteStream(stream);
    });

    callService.on('muteToggled', (data: { muted: boolean }) => {
      console.log('Mute toggled:', data);
      setIsMuted(data.muted);
    });

    callService.on('videoToggled', (data: { enabled: boolean }) => {
      console.log('Video toggled:', data);
      setIsVideoEnabled(data.enabled);
    });

    // WebRTC events
    callService.on('webRTCInitialized', () => {
      console.log('WebRTC initialized');
      setLocalStream(callService.getLocalStream());
    });

    callService.on('webRTCCleanedUp', () => {
      console.log('WebRTC cleaned up');
      setLocalStream(null);
      setRemoteStream(null);
      setIsMuted(false);
      setIsVideoEnabled(false);
    });

    callService.on('connectionStateChanged', (state: string) => {
      console.log('WebRTC connection state changed:', state);
      
      // Update call status based on WebRTC connection state
      switch (state) {
        case 'connecting':
          setCallStatus('connecting');
          break;
        case 'connected':
          setCallStatus('active');
          break;
        case 'disconnected':
        case 'failed':
          setCallStatus('ending');
          break;
      }
    });

    // Error handling
    callService.on('error', (error: { message: string; error?: any }) => {
      console.error('Call service error:', error);
      setConnectionError(error.message);
    });

  }, []);

  // Initialize call service when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isSetupComplete) {
      console.log('CallContext: Initializing call service for user:', user.id);
      setupCallService();
      setIsSetupComplete(true);
    } else if (!isAuthenticated) {
      console.log('CallContext: User not authenticated, skipping call service initialization');
    }

    return () => {
      // Cleanup on unmount
      if (isSetupComplete) {
        callService.dispose();
      }
    };
  }, [isAuthenticated, user, isSetupComplete, setupCallService]);

  // Call management functions
  const startCall = useCallback(async (calleeId: string, type: 'voice' | 'video' = 'voice', conversationId?: string): Promise<Call> => {
    try {
      console.log(`Starting ${type} call to ${calleeId}`);
      const call = await callService.startCall(calleeId, type, conversationId);
      return call;
    } catch (error) {
      console.error('Failed to start call:', error);
      setConnectionError('Failed to start call');
      throw error;
    }
  }, []);

  const answerCall = useCallback(async (callId: string): Promise<void> => {
    try {
      console.log('Answering call:', callId);
      await callService.answerCall(callId);
    } catch (error) {
      console.error('Failed to answer call:', error);
      setConnectionError('Failed to answer call');
      throw error;
    }
  }, []);

  const rejectCall = useCallback(async (callId: string): Promise<void> => {
    try {
      console.log('Rejecting call:', callId);
      await callService.rejectCall(callId);
      setIncomingCall(null);
    } catch (error) {
      console.error('Failed to reject call:', error);
      setConnectionError('Failed to reject call');
      throw error;
    }
  }, []);

  const endCall = useCallback(async (callId: string): Promise<void> => {
    try {
      console.log('Ending call:', callId);
      setCallStatus('ending');
      await callService.endCall(callId);
    } catch (error) {
      console.error('Failed to end call:', error);
      setConnectionError('Failed to end call');
      throw error;
    }
  }, []);

  // Media control functions
  const toggleMute = useCallback(async (): Promise<boolean> => {
    try {
      const muted = await callService.toggleMute();
      return muted;
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      setConnectionError('Failed to toggle mute');
      return false;
    }
  }, []);

  const toggleVideo = useCallback(async (): Promise<boolean> => {
    try {
      const enabled = await callService.toggleVideo();
      return enabled;
    } catch (error) {
      console.error('Failed to toggle video:', error);
      setConnectionError('Failed to toggle video');
      return false;
    }
  }, []);

  // Video control functions
  const getCurrentCallType = useCallback((): 'voice' | 'video' => {
    return callService.getCurrentCallType();
  }, []);

  const getCurrentVideoQuality = useCallback((): 'low' | 'medium' | 'high' | 'hd' => {
    return callService.getCurrentVideoQuality();
  }, []);

  const setVideoQuality = useCallback(async (quality: 'low' | 'medium' | 'high' | 'hd'): Promise<boolean> => {
    try {
      const success = await callService.setVideoQuality(quality);
      return success;
    } catch (error) {
      console.error('Failed to set video quality:', error);
      setConnectionError('Failed to set video quality');
      return false;
    }
  }, []);

  const upgradeToVideoCall = useCallback(async (): Promise<boolean> => {
    try {
      const success = await callService.upgradeToVideoCall();
      return success;
    } catch (error) {
      console.error('Failed to upgrade to video call:', error);
      setConnectionError('Failed to upgrade to video call');
      return false;
    }
  }, []);

  // Event handlers for external components
  const onIncomingCall = useCallback((call: Call) => {
    console.log('Incoming call:', call);
    setIncomingCall(call);
    setCurrentCall(call);
    setCallStatus('ringing');
    setShowCallModal(true);
    setParticipants(call.participants || []);
  }, []);

  const onCallEnded = useCallback((callId: string) => {
    console.log('Call ended externally:', callId);
    setCallStatus('idle');
    setIsInCall(false);
    setCurrentCall(null);
    setShowCallModal(false);
    setIncomingCall(null);
    setParticipants([]);
  }, []);

  const onParticipantJoined = useCallback((participant: CallParticipant) => {
    console.log('Participant joined externally:', participant);
    setParticipants(prev => [...prev.filter(p => p.id !== participant.id), participant]);
  }, []);

  const onParticipantLeft = useCallback((participantId: string) => {
    console.log('Participant left externally:', participantId);
    setParticipants(prev => prev.filter(p => p.id !== participantId));
  }, []);

  // Monitor connection stats
  useEffect(() => {
    if (!isInCall || callStatus !== 'active') {
      setConnectionStats(null);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const stats = await callService.getConnectionStats();
        setConnectionStats(stats);
      } catch (error) {
        console.error('Failed to get connection stats:', error);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isInCall, callStatus]);

  const value: CallContextType = {
    // Call state
    currentCall,
    isInCall,
    callStatus,
    
    // Connection state
    isConnected,
    connectionError,
    
    // Media state
    isMuted,
    isVideoEnabled,
    localStream,
    remoteStream,
    connectionStats,
    
    // Call management
    startCall,
    answerCall,
    rejectCall,
    endCall,
    
    // Media controls
    toggleMute,
    toggleVideo,
    
    // Video controls
    getCurrentCallType,
    getCurrentVideoQuality,
    setVideoQuality,
    upgradeToVideoCall,
    
    // Participants
    participants,
    
    // Event handlers
    onIncomingCall,
    onCallEnded,
    onParticipantJoined,
    onParticipantLeft,
    
    // UI state
    showCallModal,
    setShowCallModal,
    incomingCall,
    setIncomingCall,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};

export default CallProvider;
