import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'white' | 'purple' | 'gray' | 'black';
}

const Logo: React.FC<LogoProps> = ({ 
  variant = 'full', 
  size = 'md', 
  className = '',
  color = 'purple' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const getLogoSrc = () => {
    switch (variant) {
      case 'icon':
        return '/logos/svg/logo-icon-only.svg';
      case 'text':
        return '/logos/svg/logo-text-only.svg';
      case 'full':
      default:
        return '/logos/svg/logo-with-text.svg';
    }
  };

  const getAltText = () => {
    switch (variant) {
      case 'icon':
        return 'INNKT Logo';
      case 'text':
        return 'INNKT';
      case 'full':
      default:
        return 'INNKT Logo';
    }
  };

  return (
    <img 
      src={getLogoSrc()} 
      alt={getAltText()}
      className={`${sizeClasses[size]} ${className}`}
      style={{ 
        maxWidth: '100%', 
        height: 'auto',
        objectFit: 'contain'
      }}
    />
  );
};

export default Logo;
