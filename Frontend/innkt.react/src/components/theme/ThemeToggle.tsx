import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = true }) => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-hover ${className}`}
      title={theme === 'light' ? t('theme.switchToDark') : t('theme.switchToLight')}
    >
      {/* Toggle Switch Visual */}
      <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
        theme === 'dark' ? 'bg-primary' : 'bg-gray-300'
      }`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
          theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
        }`} />
      </div>
      
      {/* Icon */}
      {theme === 'light' ? (
        <MoonIcon className="h-5 w-5 text-primary" />
      ) : (
        <SunIcon className="h-5 w-5 text-primary" />
      )}
      
      {/* Label */}
      {showLabel && (
        <span className="text-sm text-primary font-medium">
          {theme === 'light' ? t('theme.darkMode') : t('theme.lightMode')}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
