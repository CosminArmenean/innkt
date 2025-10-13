import React, { useState, useEffect } from 'react';
import { useLanguage } from '../providers/LanguageProvider';
import { useTranslation } from 'react-i18next';

interface LanguageSelectorProps {
  className?: string;
  showNativeNames?: boolean;
  compact?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  className = '', 
  showNativeNames = true,
  compact = false 
}) => {
  const { t } = useTranslation();
  const { 
    currentLanguage, 
    supportedLanguages, 
    languageMetadata, 
    isLoading, 
    setLanguage 
  } = useLanguage();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage || isChanging) return;

    try {
      setIsChanging(true);
      await setLanguage(languageCode);
      setIsOpen(false);
      
      // Show success message
      console.log(`Language changed to ${languageCode}`);
    } catch (error) {
      console.error('Failed to change language:', error);
      // You could show a toast notification here
    } finally {
      setIsChanging(false);
    }
  };

  const getCurrentLanguageDisplay = () => {
    if (!languageMetadata) return currentLanguage;
    
    if (showNativeNames) {
      return languageMetadata.nativeName;
    }
    return languageMetadata.name;
  };

  const getLanguageDisplay = (lang: any) => {
    if (showNativeNames) {
      return lang.nativeName;
    }
    return lang.name;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">{t('common.loading')}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={isChanging}
        >
          <span className="text-lg">🌐</span>
          <span>{getCurrentLanguageDisplay()}</span>
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
            <div className="py-1 max-h-60 overflow-y-auto">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                    lang.code === currentLanguage ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                  }`}
                  disabled={isChanging}
                >
                  <span className="flex items-center space-x-2">
                    <span className="text-lg">
                      {lang.code === 'en' ? '🇺🇸' : 
                       lang.code === 'he' ? '🇮🇱' : 
                       lang.code === 'ar' ? '🇸🇦' : 
                       lang.code === 'es' ? '🇪🇸' : 
                       lang.code === 'fr' ? '🇫🇷' : 
                       lang.code === 'de' ? '🇩🇪' : 
                       lang.code === 'it' ? '🇮🇹' : 
                       lang.code === 'pt' ? '🇵🇹' : 
                       lang.code === 'ru' ? '🇷🇺' : 
                       lang.code === 'zh' ? '🇨🇳' : 
                       lang.code === 'ja' ? '🇯🇵' : 
                       lang.code === 'ko' ? '🇰🇷' : 
                       lang.code === 'hi' ? '🇮🇳' : 
                       lang.code === 'tr' ? '🇹🇷' : 
                       lang.code === 'nl' ? '🇳🇱' : 
                       lang.code === 'pl' ? '🇵🇱' : 
                       lang.code === 'cs' ? '🇨🇿' : 
                       lang.code === 'hu' ? '🇭🇺' : 
                       lang.code === 'ro' ? '🇷🇴' : '🌐'}
                    </span>
                    <span>{getLanguageDisplay(lang)}</span>
                  </span>
                  {lang.code === currentLanguage && (
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="text-lg">🌐</span>
        <h3 className="text-lg font-semibold text-gray-900">{t('settings.language')}</h3>
      </div>
      
      <p className="text-sm text-gray-600">
        {t('settings.languageDescription')}
      </p>

      {/* Current Language Display */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t('settings.currentLanguage')}
        </label>
        <div className="flex items-center space-x-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <span className="text-2xl">
            {currentLanguage === 'he' ? '🇮🇱' : 
             currentLanguage === 'ar' ? '🇸🇦' : 
             currentLanguage === 'en' ? '🇺🇸' : 
             currentLanguage === 'es' ? '🇪🇸' : 
             currentLanguage === 'fr' ? '🇫🇷' : 
             currentLanguage === 'de' ? '🇩🇪' : 
             currentLanguage === 'it' ? '🇮🇹' : 
             currentLanguage === 'pt' ? '🇵🇹' : 
             currentLanguage === 'ru' ? '🇷🇺' : 
             currentLanguage === 'zh' ? '🇨🇳' : 
             currentLanguage === 'ja' ? '🇯🇵' : 
             currentLanguage === 'ko' ? '🇰🇷' : 
             currentLanguage === 'hi' ? '🇮🇳' : 
             currentLanguage === 'tr' ? '🇹🇷' : 
             currentLanguage === 'nl' ? '🇳🇱' : 
             currentLanguage === 'pl' ? '🇵🇱' : 
             currentLanguage === 'cs' ? '🇨🇿' : 
             currentLanguage === 'hu' ? '🇭🇺' : 
             currentLanguage === 'ro' ? '🇷🇴' : '🌐'}
          </span>
          <div>
            <div className="font-medium text-gray-900">
              {languageMetadata?.nativeName || currentLanguage}
            </div>
            <div className="text-sm text-gray-500">
              {languageMetadata?.name || currentLanguage}
            </div>
          </div>
          <div className="ml-auto">
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Language Selection Grid */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t('settings.selectLanguage')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              disabled={isChanging}
              className={`p-3 border rounded-lg text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                lang.code === currentLanguage 
                  ? 'border-purple-500 bg-purple-50 text-purple-700' 
                  : 'border-gray-300 text-gray-700'
              } ${isChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {lang.code === 'en' ? '🇺🇸' : 
                   lang.code === 'he' ? '🇮🇱' : 
                   lang.code === 'ar' ? '🇸🇦' : 
                   lang.code === 'es' ? '🇪🇸' : 
                   lang.code === 'fr' ? '🇫🇷' : 
                   lang.code === 'de' ? '🇩🇪' : 
                   lang.code === 'it' ? '🇮🇹' : 
                   lang.code === 'pt' ? '🇵🇹' : 
                   lang.code === 'ru' ? '🇷🇺' : 
                   lang.code === 'zh' ? '🇨🇳' : 
                   lang.code === 'ja' ? '🇯🇵' : 
                   lang.code === 'ko' ? '🇰🇷' : 
                   lang.code === 'hi' ? '🇮🇳' : 
                   lang.code === 'tr' ? '🇹🇷' : 
                   lang.code === 'nl' ? '🇳🇱' : 
                   lang.code === 'pl' ? '🇵🇱' : 
                   lang.code === 'cs' ? '🇨🇿' : 
                   lang.code === 'hu' ? '🇭🇺' : 
                   lang.code === 'ro' ? '🇷🇴' : '🌐'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {showNativeNames ? lang.nativeName : lang.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {showNativeNames ? lang.name : lang.nativeName}
                  </div>
                </div>
                {lang.code === currentLanguage && (
                  <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RTL Information */}
      {languageMetadata?.isRtl && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-blue-800">
              {t('settings.languageInfo')}: {t('settings.languageInfoDescription')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
