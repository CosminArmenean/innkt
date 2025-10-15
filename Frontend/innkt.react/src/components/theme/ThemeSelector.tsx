import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { SunIcon, MoonIcon, PaintBrushIcon } from '@heroicons/react/24/outline';

interface ThemeSelectorProps {
  className?: string;
  showLabels?: boolean;
  compact?: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  className = '', 
  showLabels = true, 
  compact = false 
}) => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      id: 'light',
      name: t('theme.light'),
      label: t('theme.lightMode'),
      description: t('theme.lightThemeDescription'),
      icon: SunIcon,
      gradient: 'from-yellow-400 to-orange-500',
      bgColor: 'bg-white',
      borderColor: 'border-gray-300'
    },
    {
      id: 'purple',
      name: t('theme.purple'),
      label: t('theme.purpleMode'),
      description: t('theme.purpleThemeDescription'),
      icon: PaintBrushIcon,
      gradient: 'from-purple-600 to-purple-800',
      bgColor: 'bg-purple-600',
      borderColor: 'border-purple-500'
    },
    {
      id: 'black',
      name: t('theme.black'),
      label: t('theme.blackMode'),
      description: t('theme.blackThemeDescription'),
      icon: MoonIcon,
      gradient: 'from-gray-800 to-black',
      bgColor: 'bg-black',
      borderColor: 'border-gray-600'
    }
  ];

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {themes.map((themeOption) => {
          const IconComponent = themeOption.icon;
          const isActive = theme === themeOption.id;
          
          return (
            <button
              key={themeOption.id}
              onClick={() => setTheme(themeOption.id as any)}
              className={`relative p-2 rounded-lg transition-all duration-200 ${
                isActive 
                  ? `${themeOption.bgColor} ${themeOption.borderColor} border-2 shadow-lg scale-105` 
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border-2 border-transparent'
              }`}
              title={themeOption.label}
            >
              <IconComponent className={`h-5 w-5 ${
                isActive 
                  ? 'text-white' 
                  : 'text-gray-600 dark:text-gray-300'
              }`} />
              
              {isActive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {showLabels && (
        <div className="flex items-center space-x-2 mb-4">
          <PaintBrushIcon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-primary">{t('theme.appearance')}</h3>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-3">
        {themes.map((themeOption) => {
          const IconComponent = themeOption.icon;
          const isActive = theme === themeOption.id;
          
          return (
            <button
              key={themeOption.id}
              onClick={() => setTheme(themeOption.id as any)}
              className={`relative p-4 rounded-xl transition-all duration-200 text-left ${
                isActive 
                  ? 'ring-2 ring-primary ring-opacity-50 shadow-lg transform scale-[1.02]' 
                  : 'hover:shadow-md hover:scale-[1.01]'
              } ${
                theme === 'light' 
                  ? 'bg-white border border-gray-200' 
                  : theme === 'purple'
                  ? 'bg-gradient-to-br from-purple-900 to-indigo-900 border border-purple-700'
                  : 'bg-black border border-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* Theme Icon with Gradient Background */}
                <div className={`relative p-2 rounded-lg ${
                  isActive 
                    ? `bg-gradient-to-r ${themeOption.gradient}` 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <IconComponent className={`h-6 w-6 ${
                    isActive 
                      ? 'text-white' 
                      : 'text-gray-600 dark:text-gray-300'
                  }`} />
                </div>
                
                {/* Theme Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className={`font-semibold ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {themeOption.label}
                    </h4>
                    
                    {isActive && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className={`text-xs font-medium ${
                          theme === 'light' ? 'text-green-600' : 'text-green-400'
                        }`}>
                          Active
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <p className={`text-sm mt-1 ${
                    theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                  }`}>
                    {themeOption.description}
                  </p>
                </div>
                
                {/* Selection Indicator */}
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isActive 
                    ? 'border-primary bg-primary' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {isActive && (
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {showLabels && (
        <p className={`text-sm ${
          theme === 'light' ? 'text-gray-500' : 'text-gray-400'
        }`}>
          {t('theme.themeDescription')}
        </p>
      )}
    </div>
  );
};

export default ThemeSelector;
