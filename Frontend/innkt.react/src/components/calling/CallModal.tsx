import React, { useEffect, useRef, useState } from 'react';
import { useCall } from '../../contexts/CallContext';
import { convertToFullAvatarUrl } from '../../utils/avatarUtils';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CallModal: React.FC<CallModalProps> = ({ isOpen, onClose }) => {
  const {
    currentCall,
    callStatus,
    isMuted,
    isVideoEnabled,
    localStream,
    remoteStream,
    connectionStats,
    participants,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    getCurrentCallType,
    getCurrentVideoQuality,
    setVideoQuality,
    upgradeToVideoCall,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Set up video streams
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle modal close
  const handleClose = () => {
    if (currentCall && callStatus === 'active') {
      // Don't allow closing during active call without ending it
      return;
    }
    onClose();
  };

  // Handle call actions
  const handleAnswer = async () => {
    if (!currentCall) return;
    
    setIsLoading(true);
    try {
      await answerCall(currentCall.id);
    } catch (error) {
      console.error('Failed to answer call:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!currentCall) return;
    
    setIsLoading(true);
    try {
      await rejectCall(currentCall.id);
      onClose();
    } catch (error) {
      console.error('Failed to reject call:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCall = async () => {
    if (!currentCall) return;
    
    setIsLoading(true);
    try {
      await endCall(currentCall.id);
      onClose();
    } catch (error) {
      console.error('Failed to end call:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMute = async () => {
    try {
      await toggleMute();
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };

  const handleToggleVideo = async () => {
    try {
      await toggleVideo();
    } catch (error) {
      console.error('Failed to toggle video:', error);
    }
  };

  const handleUpgradeToVideo = async () => {
    setIsLoading(true);
    try {
      const success = await upgradeToVideoCall();
      if (!success) {
        // Show error message to user
        console.error('Failed to upgrade to video call');
      }
    } catch (error) {
      console.error('Failed to upgrade to video call:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetVideoQuality = async (quality: 'low' | 'medium' | 'high' | 'hd') => {
    try {
      await setVideoQuality(quality);
      setShowQualityMenu(false);
    } catch (error) {
      console.error('Failed to set video quality:', error);
    }
  };

  if (!isOpen || !currentCall) {
    return null;
  }

  // Get the other participant (not current user)
  const otherParticipant = participants.find(p => p.userId !== currentCall.callerId) || participants[0];
  const isIncomingCall = currentCall.calleeId === 'current-user-id'; // This should be the actual current user ID

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center mb-4">
            {otherParticipant?.avatarUrl ? (
              <img
                src={convertToFullAvatarUrl(otherParticipant.avatarUrl)}
                alt={otherParticipant.displayName || otherParticipant.username || 'Participant'}
                className="w-16 h-16 rounded-full object-cover"
                onError={(e) => {
                  console.log('Call modal avatar image failed to load:', otherParticipant.avatarUrl);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-semibold">
                  {(otherParticipant?.displayName || otherParticipant?.username || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {otherParticipant?.displayName || otherParticipant?.username || 'Unknown User'}
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {callStatus === 'ringing' && (isIncomingCall ? 'Incoming call' : 'Calling...')}
            {callStatus === 'connecting' && 'Connecting...'}
            {callStatus === 'active' && 'Connected'}
            {callStatus === 'ending' && 'Call ending...'}
          </p>

          {connectionStats && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Quality: {connectionStats.quality} | Latency: {Math.round(connectionStats.latency)}ms
            </div>
          )}
          
          {getCurrentCallType() === 'video' && (
            <div className="mt-1 text-xs text-purple-600 dark:text-purple-400">
              Video Quality: {getCurrentVideoQuality().toUpperCase()}
            </div>
          )}
        </div>

        {/* Video/Audio Area */}
        <div className="relative bg-gray-100 dark:bg-gray-700 h-64">
          {/* Remote video */}
          {remoteStream && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Local video (picture-in-picture) */}
          {localStream && isVideoEnabled && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute top-4 right-4 w-24 h-18 object-cover rounded-lg border-2 border-white shadow-lg"
            />
          )}

          {/* No video placeholder */}
          {!remoteStream && !isVideoEnabled && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-semibold">
                    {(otherParticipant?.displayName || otherParticipant?.username || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {callStatus === 'active' ? 'Voice call active' : 'Connecting...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6">
          {callStatus === 'ringing' && isIncomingCall ? (
            // Incoming call controls
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="flex items-center justify-center w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors disabled:opacity-50"
                title="Decline call"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <button
                onClick={handleAnswer}
                disabled={isLoading}
                className="flex items-center justify-center w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors disabled:opacity-50"
                title="Accept call"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          ) : callStatus === 'active' ? (
            // Active call controls
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleToggleMute}
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                  isMuted 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>

              {getCurrentCallType() === 'video' ? (
                <>
                  <button
                    onClick={handleToggleVideo}
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                      isVideoEnabled 
                        ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                    title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
                  >
                    {isVideoEnabled ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16l-4-4 4-4M6 18l4-4-4-4" />
                      </svg>
                    )}
                  </button>

                  {/* Video Quality Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowQualityMenu(!showQualityMenu)}
                      className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                      title="Video Quality"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </button>

                    {showQualityMenu && (
                      <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                        {(['low', 'medium', 'high', 'hd'] as const).map((quality) => (
                          <button
                            key={quality}
                            onClick={() => handleSetVideoQuality(quality)}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                              getCurrentVideoQuality() === quality 
                                ? 'text-purple-600 dark:text-purple-400 font-medium' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {quality.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Upgrade to Video Button */
                <button
                  onClick={handleUpgradeToVideo}
                  disabled={isLoading}
                  className="flex items-center justify-center w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors disabled:opacity-50"
                  title="Upgrade to video call"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              )}

              <button
                onClick={handleEndCall}
                disabled={isLoading}
                className="flex items-center justify-center w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors disabled:opacity-50"
                title="End call"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : callStatus === 'connecting' ? (
            // Connecting state
            <div className="flex justify-center">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="text-gray-600 dark:text-gray-400">Connecting...</span>
              </div>
            </div>
          ) : null}

          {/* Click outside to close quality menu */}
          {showQualityMenu && (
            <div 
              className="fixed inset-0 z-5" 
              onClick={() => setShowQualityMenu(false)}
            />
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallModal;
