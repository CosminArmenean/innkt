import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { updateUserLanguagePreference } from '../../utils/jwtUtils';

const LanguageSettings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
    { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
    { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' }
  ];

  const handleLanguageChange = async (languageCode: string) => {
    try {
      // Update i18n immediately for instant UI change
      await i18n.changeLanguage(languageCode);
      setCurrentLanguage(languageCode);
      localStorage.setItem('innkt-language', languageCode);
      
      // Update user's language preference on the server
      const success = await updateUserLanguagePreference(languageCode);
      if (success) {
        console.log(`Language changed to ${languageCode} and saved to server`);
      } else {
        console.warn(`Language changed to ${languageCode} but failed to save to server`);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const getCurrentLanguageInfo = () => {
    return languages.find(lang => lang.code === currentLanguage) || languages[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3">
            <GlobeAltIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('settings.language')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('settings.languageDescription')}
              </p>
            </div>
          </div>
        </div>

        {/* Current Language */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('settings.currentLanguage')}
          </h2>
          <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-2xl">{getCurrentLanguageInfo().flag}</span>
            <div>
              <div className="font-medium text-gray-900">
                {getCurrentLanguageInfo().nativeName}
              </div>
              <div className="text-sm text-gray-600">
                {getCurrentLanguageInfo().name}
              </div>
            </div>
            <CheckIcon className="h-5 w-5 text-blue-600 ml-auto" />
          </div>
        </div>

        {/* Language Options */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('settings.selectLanguage')}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                  currentLanguage === language.code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{language.flag}</span>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">
                      {language.nativeName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {language.name}
                    </div>
                  </div>
                  {currentLanguage === language.code && (
                    <CheckIcon className="h-5 w-5 text-blue-600 ml-auto" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mt-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <GlobeAltIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">
                {t('settings.languageInfo')}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                {t('settings.languageInfoDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSettings;
