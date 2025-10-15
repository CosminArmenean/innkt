import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { SunIcon, MoonIcon, PaintBrushIcon } from '@heroicons/react/24/outline';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = true }) => {
  const { t } = useTranslation();
  const { theme, toggleTheme, getNextTheme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return SunIcon;
      case 'purple':
        return PaintBrushIcon;
      case 'black':
        return MoonIcon;
      default:
        return SunIcon;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return t('theme.lightMode');
      case 'purple':
        return t('theme.purpleMode');
      case 'black':
        return t('theme.blackMode');
      default:
        return t('theme.lightMode');
    }
  };

  const getNextThemeLabel = () => {
    const nextTheme = getNextTheme();
    switch (nextTheme) {
      case 'light':
        return t('theme.switchToLight');
      case 'purple':
        return t('theme.switchToPurple');
      case 'black':
        return t('theme.switchToBlack');
      default:
        return t('theme.switchToLight');
    }
  };

  const getThemeColor = () => {
    switch (theme) {
      case 'light':
        return 'bg-yellow-400';
      case 'purple':
        return 'bg-purple-600';
      case 'black':
        return 'bg-gray-800';
      default:
        return 'bg-yellow-400';
    }
  };

  const IconComponent = getThemeIcon();

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-hover ${className}`}
      title={getNextThemeLabel()}
    >
      {/* Theme Indicator Circle */}
      <div className={`relative w-8 h-8 rounded-full ${getThemeColor()} flex items-center justify-center transition-all duration-200`}>
        <IconComponent className="h-4 w-4 text-white" />
      </div>
      
      {/* Label */}
      {showLabel && (
        <span className="text-sm text-primary font-medium">
          {getThemeLabel()}
        </span>
      )}
      
      {/* Next Theme Indicator */}
      {showLabel && (
        <span className="text-xs text-secondary">
          → {getNextThemeLabel().replace('Switch to ', '')}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
