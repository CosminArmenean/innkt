import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { callService, Call, CallParticipant, CallEvent, WebRTCStats } from '../services/call.service';
import { useAuth } from './AuthContext';

// Debug: Log when CallContext module is loaded
console.log('CallContext: Module loaded');

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
  console.log('CallProvider: Component function called');
  const { user, isAuthenticated } = useAuth();
  
  // Call state
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connecting' | 'active' | 'ending'>('idle');
  
  // Flag to ensure setup is only called once
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  
  // Use ref to store current user ID for event handlers
  const currentUserIdRef = useRef<string>('');
  
  // Update ref when user changes
  useEffect(() => {
    const newUserId = user?.id || '';
    currentUserIdRef.current = newUserId;
    console.log('CallContext: Updated currentUserIdRef to:', newUserId, 'from user?.id:', user?.id);
  }, [user?.id]);
  
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
    console.log('CallContext: Current callService instance:', callService);
    
    // Connection status events
    callService.on('connectionStatusChanged', (data: { connected: boolean; reconnecting?: boolean; error?: any }) => {
      console.log('CallContext: Call service connection status:', data);
      setIsConnected(data.connected);
      setConnectionError(data.error?.message || null);
      
      // If connection is lost, reset setup completion so it can retry
      if (!data.connected && data.error) {
        console.log('CallContext: SignalR connection lost, resetting setup completion to allow retry');
        setIsSetupComplete(false);
      }
    });

    // Call events
    callService.on('callStarted', (call: Call) => {
      console.log('CallContext: Call started event received:', call);
      setCurrentCall(call);
      setIsInCall(true);
      setCallStatus('ringing');
      setParticipants(call.participants || []);
      
      // Delay showing the modal to allow backend connection to establish
      console.log('CallContext: Delaying call modal display by 3 seconds for connection stability...');
      setTimeout(() => {
        console.log('CallContext: Showing call modal after delay for outgoing call');
        setShowCallModal(true);
      }, 3000);
    });

    callService.on('callAnswered', (data: { callId: string }) => {
      console.log('Call answered:', data);
      setCallStatus('active');
      setIsInCall(true);
      
      // Update current call status if we have an active call
      if (currentCall && currentCall.id === data.callId) {
        setCurrentCall(prev => prev ? { ...prev, status: 'active' } : null);
      }
      
      // If we already have a remote stream, the call should be active
      if (remoteStream) {
        console.log('CallContext: Call answered and remote stream already available, ensuring active status');
        setCallStatus('active');
      }
    });

    callService.on('callRejected', (data: { callId: string }) => {
      console.log('Call rejected:', data);
      setCallStatus('idle');
      setIsInCall(false);
      setCurrentCall(null);
      setShowCallModal(false);
    });

    callService.on('callEnded', (data: { callId: string; endedBy: string; reason: string }) => {
      console.log('Call ended:', data);
      setCallStatus('ending');
      
      // Show "Call ended" message briefly before closing
      setTimeout(() => {
        setCallStatus('idle');
        setIsInCall(false);
        setCurrentCall(null);
        setShowCallModal(false);
        setParticipants([]);
        setLocalStream(null);
        setRemoteStream(null);
      }, 2000); // Show for 2 seconds
    });

    callService.on('incomingCall', (data: { callId: string; callerId: string; callType: number; conversationId?: string; createdAt: string }) => {
      console.log('CallContext: Incoming call received:', data);
      
      // Get current user ID from ref (always up-to-date)
      const currentUserId = currentUserIdRef.current;
      console.log('CallContext: Debug - currentUserId from ref =', currentUserId);
      console.log('CallContext: Debug - user?.id from closure =', user?.id);
      
      const call: Call = {
        id: data.callId,        // Fix: Map callId to id
        callerId: data.callerId, // Fix: Map callerId to callerId  
        calleeId: currentUserId, // Fix: Set calleeId to current user ID for incoming calls
        type: data.callType === 1 ? 'video' : 'voice', // Fix: Map callType to type
        status: 'ringing',
        conversationId: data.conversationId, // Fix: Map conversationId to conversationId
        createdAt: new Date(data.createdAt), // Fix: Map createdAt to createdAt
        participants: [],
        roomId: ''
      };
      
      console.log('CallContext: Debug - currentUserId =', currentUserId, 'calleeId =', call.calleeId, 'isIncomingCall should be:', call.calleeId === currentUserId);
      console.log('CallContext: Setting incoming call and preparing modal:', call);
      setIncomingCall(call);
      setCurrentCall(call);  // Fix: Set currentCall so CallModal can render
      setCallStatus('ringing');
      
      // Delay showing the modal to allow backend connection to establish
      console.log('CallContext: Delaying incoming call modal display by 3 seconds for connection stability...');
      setTimeout(() => {
        console.log('CallContext: Showing incoming call modal after delay');
        setShowCallModal(true);
      }, 3000);
    });
    
    console.log('CallContext: incomingCall event handler registered');

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
      
      // If we receive a remote stream and we're still in connecting state,
      // it likely means the WebRTC connection is working but the state hasn't updated
      if (callStatus === 'connecting') {
        console.log('CallContext: Remote stream received while connecting, forcing call status to active');
        setTimeout(() => {
          if (callStatus === 'connecting') {
            console.log('CallContext: Timeout reached, forcing call status to active');
            setCallStatus('active');
          }
        }, 2000); // Wait 2 seconds for WebRTC state to catch up
      }
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
          console.log('CallContext: Setting call status to connecting');
          setCallStatus('connecting');
          break;
        case 'connected':
          console.log('CallContext: Setting call status to active - WebRTC connected!');
          setCallStatus('active');
          break;
        case 'disconnected':
        case 'failed':
          console.log('CallContext: WebRTC disconnected/failed, ending call');
          setCallStatus('ending');
          break;
        default:
          console.log('CallContext: Unknown WebRTC connection state:', state);
      }
    });

    // Also listen for ICE connection state changes
    callService.on('iceConnectionStateChanged', (state: string) => {
      console.log('ICE connection state changed:', state);
      
      // ICE connection state can also indicate when the call is truly connected
      if (state === 'connected' || state === 'completed') {
        console.log('CallContext: ICE connected, ensuring call status is active');
        setCallStatus('active');
      } else if (state === 'failed' || state === 'disconnected') {
        console.log('CallContext: ICE failed/disconnected, ending call');
        setCallStatus('ending');
      }
    });

    // Error handling
    callService.on('error', (error: { message: string; error?: any }) => {
      console.error('Call service error:', error);
      setConnectionError(error.message);
    });

    // Debug: Confirm event listeners are registered
    console.log('CallContext: Event listeners registered successfully!');
    console.log('CallContext: All major events should now be handled:', [
      'connectionStatusChanged', 'callStarted', 'callAnswered', 'callEnded',
      'participantJoined', 'participantLeft', 'remoteStreamReceived',
      'webRTCInitialized', 'connectionStateChanged', 'error'
    ].join(', '));

  }, []);

  // Additional effect to handle call status updates based on stream availability
  useEffect(() => {
    if (callStatus === 'connecting' && remoteStream && currentCall) {
      console.log('CallContext: Call is connecting but remote stream is available, updating to active');
      setCallStatus('active');
    }
  }, [callStatus, remoteStream, currentCall]);

  // Initialize call service when user is authenticated
  useEffect(() => {
    console.log('CallContext: Main useEffect running. isAuthenticated:', isAuthenticated, 'user:', user, 'isSetupComplete:', isSetupComplete);
    
    if (isAuthenticated && user && !isSetupComplete) {
      console.log('CallContext: Initializing call service for user:', user.id);
      console.log('CallContext: About to call setupCallService()');
      setupCallService();
      console.log('CallContext: setupCallService() completed');
      
      // Proactively connect to SignalR hub to receive incoming calls
      console.log('CallContext: Establishing SignalR connection for incoming calls');
      callService.connect().then(() => {
        console.log('CallContext: SignalR connection established for user:', user.id);
        setIsSetupComplete(true);
        console.log('CallContext: isSetupComplete set to true');
      }).catch((error) => {
        console.error('CallContext: Failed to establish SignalR connection:', error);
        console.log('CallContext: Retrying SignalR connection in 2 seconds...');
        // Retry connection after 2 seconds
        setTimeout(() => {
          console.log('CallContext: Retrying SignalR connection...');
          callService.connect().then(() => {
            console.log('CallContext: SignalR connection established on retry for user:', user.id);
            setIsSetupComplete(true);
            console.log('CallContext: isSetupComplete set to true on retry');
          }).catch((retryError) => {
            console.error('CallContext: Failed to establish SignalR connection on retry:', retryError);
          });
        }, 2000);
      });
    } else if (!isAuthenticated) {
      console.log('CallContext: User not authenticated, skipping call service initialization');
    } else if (!user) {
      console.log('CallContext: User is null, skipping call service initialization');
    } else if (isSetupComplete) {
      console.log('CallContext: Call service already initialized, skipping');
    }

    return () => {
      // Cleanup on unmount - but don't dispose the call service as it's shared
      console.log('CallContext: Component unmounting, but keeping CallService alive for other components');
      // Note: We don't call callService.dispose() here because it would clear event handlers
      // that might be needed by other components. The CallService is a singleton.
    };
  }, [isAuthenticated, user, isSetupComplete]);

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
      
      // Ensure call service is connected before answering
      if (!isConnected) {
        console.log('CallContext: SignalR not connected, attempting to connect before answering...');
        await callService.connect();
        // Wait for connection to be established
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      await callService.answerCall(callId);
    } catch (error) {
      console.error('Failed to answer call:', error);
      setConnectionError('Failed to answer call');
      throw error;
    }
  }, [isConnected]);

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
