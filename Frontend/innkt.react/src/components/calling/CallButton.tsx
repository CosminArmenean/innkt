import React, { useState } from 'react';
import { useCall } from '../../contexts/CallContext';

interface CallButtonProps {
  userId: string;
  conversationId?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'voice' | 'video' | 'auto';
  disabled?: boolean;
  className?: string;
}

const CallButton: React.FC<CallButtonProps> = ({
  userId,
  conversationId,
  size = 'md',
  variant = 'auto',
  disabled = false,
  className = ''
}) => {
  const { startCall, isInCall } = useCall();
  const [isLoading, setIsLoading] = useState(false);

  const handleCall = async (callType: 'voice' | 'video') => {
    if (disabled || isLoading || isInCall) return;

    setIsLoading(true);
    try {
      await startCall(userId, callType, conversationId);
    } catch (error) {
      console.error('Failed to start call:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 p-1';
      case 'lg':
        return 'w-12 h-12 p-2';
      default:
        return 'w-10 h-10 p-2';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-5 h-5';
    }
  };

  if (variant === 'auto') {
    // Auto variant shows both voice and video options in a dropdown
    const [showDropdown, setShowDropdown] = useState(false);
    
    return (
      <div className={`relative inline-block ${className}`}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={disabled || isLoading || isInCall}
          className={`
            ${getSizeClasses()}
            text-gray-400 hover:text-purple-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 
            transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center
          `}
          title="Start call"
        >
          {isLoading ? (
            <div className={`animate-spin rounded-full border-b-2 border-purple-600 ${getIconSize()}`}></div>
          ) : (
            <svg className={getIconSize()} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          )}
        </button>
        
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
            <div className="py-1">
              <button
                onClick={() => {
                  handleCall('voice');
                  setShowDropdown(false);
                }}
                disabled={disabled || isLoading || isInCall}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Voice Call</span>
              </button>
              <button
                onClick={() => {
                  handleCall('video');
                  setShowDropdown(false);
                }}
                disabled={disabled || isLoading || isInCall}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Video Call</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Click outside to close dropdown */}
        {showDropdown && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    );
  }

  const getIcon = () => {
    if (isLoading) {
      return (
        <div className={`animate-spin rounded-full border-b-2 border-purple-600 ${getIconSize()}`}></div>
      );
    }

    if (variant === 'video') {
      return (
        <svg className={getIconSize()} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    }

    // Voice call icon
    return (
      <svg className={getIconSize()} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    );
  };

  const getTitle = () => {
    if (isLoading) return 'Starting call...';
    if (isInCall) return 'Already in a call';
    if (variant === 'video') return 'Start video call';
    return 'Start voice call';
  };

  return (
    <button
      onClick={() => handleCall(variant)}
      disabled={disabled || isLoading || isInCall}
      className={`
        ${getSizeClasses()}
        text-gray-400 hover:text-purple-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center
        ${className}
      `}
      title={getTitle()}
    >
      {getIcon()}
    </button>
  );
};

export default CallButton;
