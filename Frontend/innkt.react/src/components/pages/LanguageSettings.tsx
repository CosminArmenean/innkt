import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../language/LanguageSelector';
import { useLanguage } from '../providers/LanguageProvider';

const LanguageSettings: React.FC = () => {
  const { t } = useTranslation();
  const { currentLanguage, isRTL, languageMetadata } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('settings.language')}</h1>
          <p className="mt-2 text-gray-600">
            {t('settings.languageDescription')}
          </p>
        </div>

        {/* Language Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <LanguageSelector showNativeNames={true} />
        </div>

        {/* Current Language Info */}
        {languageMetadata && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('settings.languageInfo')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Language Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('settings.currentLanguage')}
                  </label>
                  <div className="mt-1 flex items-center space-x-3">
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
                        {languageMetadata.nativeName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {languageMetadata.name}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Language Code
                  </label>
                  <div className="mt-1 text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                    {currentLanguage}
                  </div>
                </div>
              </div>

              {/* RTL Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Text Direction
                  </label>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isRTL 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isRTL ? 'RTL (Right-to-Left)' : 'LTR (Left-to-Right)'}
                    </span>
                    {isRTL && (
                      <span className="text-sm text-blue-600">
                        ← {t('settings.languageInfoDescription')}
                      </span>
                    )}
                  </div>
                </div>

                {isRTL && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">RTL Layout Active</p>
                        <p className="mt-1">
                          The interface has been automatically adjusted for right-to-left reading. 
                          Text, navigation, and layout elements are now positioned for optimal 
                          reading experience in {languageMetadata.name}.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Need Help?
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              • Language changes are saved automatically and apply immediately
            </p>
            <p>
              • Your language preference is stored in your account settings
            </p>
            <p>
              • RTL languages (Hebrew, Arabic) automatically adjust the interface layout
            </p>
            <p>
              • You can change your language at any time from the settings menu
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSettings;
