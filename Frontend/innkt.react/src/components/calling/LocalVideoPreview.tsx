/**
 * Local Video Preview Component
 * Provides self-view with muted video element for local preview
 */

import React, { useEffect, useRef, useState } from 'react';
import { convertToFullAvatarUrl } from '../../utils/avatarUtils';

interface LocalVideoPreviewProps {
  stream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  callType: 'voice' | 'video';
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showControls?: boolean;
  onMuteToggle?: () => void;
  onVideoToggle?: () => void;
}

const LocalVideoPreview: React.FC<LocalVideoPreviewProps> = ({
  stream,
  isMuted,
  isVideoEnabled,
  callType,
  className = '',
  size = 'medium',
  showControls = false,
  onMuteToggle,
  onVideoToggle
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Size configurations
  const sizeConfig = {
    small: { width: 120, height: 90, textSize: 'text-xs' },
    medium: { width: 160, height: 120, textSize: 'text-sm' },
    large: { width: 240, height: 180, textSize: 'text-base' }
  };

  const config = sizeConfig[size];

  // Set up video stream
  useEffect(() => {
    if (videoRef.current && stream && callType === 'video' && isVideoEnabled) {
      console.log('LocalVideoPreview: Setting up video stream');
      videoRef.current.srcObject = stream;
      setIsLoading(false);
      setHasError(false);

      // Handle video load
      const handleLoadedMetadata = () => {
        console.log('LocalVideoPreview: Video metadata loaded');
        setIsLoading(false);
      };

      const handleError = () => {
        console.error('LocalVideoPreview: Video error');
        setHasError(true);
        setIsLoading(false);
      };

      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoRef.current.addEventListener('error', handleError);

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          videoRef.current.removeEventListener('error', handleError);
        }
      };
    } else if (videoRef.current) {
      // Clear video source
      videoRef.current.srcObject = null;
      setIsLoading(false);
    }
  }, [stream, callType, isVideoEnabled]);

  // Monitor audio level for voice calls
  useEffect(() => {
    if (stream && callType === 'voice') {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        // Create audio context for level monitoring
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const updateAudioLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel(average / 255); // Normalize to 0-1
          requestAnimationFrame(updateAudioLevel);
        };

        updateAudioLevel();

        return () => {
          audioContext.close();
        };
      }
    }
  }, [stream, callType]);

  // Render video preview
  const renderVideoPreview = () => {
    if (callType === 'video' && isVideoEnabled && stream && !hasError) {
      return (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover rounded-lg ${className}`}
          style={{ width: config.width, height: config.height }}
        />
      );
    }
    return null;
  };

  // Render voice call indicator
  const renderVoiceIndicator = () => {
    if (callType === 'voice') {
      return (
        <div 
          className={`flex items-center justify-center bg-purple-600 rounded-lg ${className}`}
          style={{ width: config.width, height: config.height }}
        >
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-2">
              {/* Audio level indicator */}
              <div 
                className={`absolute inset-0 rounded-full border-2 border-white transition-all duration-150 ${
                  audioLevel > 0.1 ? 'bg-green-500' : 'bg-purple-600'
                }`}
                style={{
                  transform: `scale(${1 + audioLevel * 0.5})`,
                  opacity: audioLevel > 0.05 ? 0.8 : 0.4
                }}
              />
              <div className="absolute inset-2 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-semibold">You</span>
              </div>
            </div>
            <p className={`text-white ${config.textSize} font-medium`}>
              {isMuted ? 'Muted' : 'Speaking'}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Render loading state
  const renderLoading = () => {
    if (isLoading && callType === 'video' && isVideoEnabled) {
      return (
        <div 
          className={`flex items-center justify-center bg-gray-300 dark:bg-gray-700 rounded-lg ${className}`}
          style={{ width: config.width, height: config.height }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className={`text-gray-600 dark:text-gray-400 ${config.textSize}`}>Loading...</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Render error state
  const renderError = () => {
    if (hasError) {
      return (
        <div 
          className={`flex items-center justify-center bg-red-100 dark:bg-red-900 rounded-lg ${className}`}
          style={{ width: config.width, height: config.height }}
        >
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className={`text-red-600 dark:text-red-400 ${config.textSize}`}>Video Error</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Render controls
  const renderControls = () => {
    if (!showControls) return null;

    return (
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {/* Mute toggle */}
        <button
          onClick={onMuteToggle}
          className={`p-2 rounded-full transition-colors ${
            isMuted 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        {/* Video toggle */}
        {callType === 'video' && (
          <button
            onClick={onVideoToggle}
            className={`p-2 rounded-full transition-colors ${
              isVideoEnabled 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
          >
            {isVideoEnabled ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 13l-4-4-4 4" />
              </svg>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="relative inline-block">
      {renderVideoPreview()}
      {renderVoiceIndicator()}
      {renderLoading()}
      {renderError()}
      {renderControls()}
      
      {/* Status indicators */}
      <div className="absolute top-2 right-2 flex space-x-1">
        {/* Mute indicator */}
        {isMuted && (
          <div className="bg-red-500 text-white p-1 rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </div>
        )}
        
        {/* Video off indicator */}
        {callType === 'video' && !isVideoEnabled && (
          <div className="bg-red-500 text-white p-1 rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalVideoPreview;
