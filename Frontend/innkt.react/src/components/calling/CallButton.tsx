import React, { useState } from 'react';
import { useCall } from '../../contexts/CallContext';

interface CallButtonProps {
  userId: string;
  conversationId?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'voice' | 'video';
  disabled?: boolean;
  className?: string;
}

const CallButton: React.FC<CallButtonProps> = ({
  userId,
  conversationId,
  size = 'md',
  variant = 'voice',
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

    // Voice call icon (default)
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

  const getButtonClasses = () => {
    const baseClasses = `
      ${getSizeClasses()}
      rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
      flex items-center justify-center
      ${className}
    `;
    
    if (variant === 'video') {
      return `${baseClasses} text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20`;
    }
    
    // Voice call (default)
    return `${baseClasses} text-gray-400 hover:text-purple-600 hover:bg-gray-100 dark:hover:bg-gray-700`;
  };

  return (
    <button
      onClick={() => handleCall(variant)}
      disabled={disabled || isLoading || isInCall}
      className={getButtonClasses()}
      title={getTitle()}
    >
      {getIcon()}
    </button>
  );
};

export default CallButton;
