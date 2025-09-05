export type Language = 'en' | 'he' | 'ar';

export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  isRTL: boolean;
  dateFormat: string;
  numberFormat: string;
}

export const SUPPORTED_LANGUAGES: Record<Language, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    isRTL: false,
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'en-US',
  },
  he: {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    isRTL: true,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'he-IL',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    isRTL: true,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'ar-SA',
  },
};

export const getLanguage = (language: Language): LanguageConfig => {
  return SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.en;
};

export const isRTL = (language: Language): boolean => {
  return SUPPORTED_LANGUAGES[language]?.isRTL || false;
};






