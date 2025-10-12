import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { getCurrentLanguagePreference } from './utils/jwtUtils';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    lng: getCurrentLanguagePreference(), // Use preferred language from JWT token
    supportedLngs: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'cs', 'hu', 'ro', 'he', 'ja', 'ko', 'hi'],
    
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'innkt-language',
    },
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    react: {
      useSuspense: true,
    },
  });

export default i18n;

