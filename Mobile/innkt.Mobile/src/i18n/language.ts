export type Language = 
  | 'en'  // English
  | 'ro'  // Romanian
  | 'he'  // Hebrew
  | 'ar'  // Arabic
  | 'es'  // Spanish
  | 'fr'  // French
  | 'de'  // German
  | 'it'  // Italian
  | 'pt'  // Portuguese
  | 'ru'  // Russian
  | 'zh'  // Chinese
  | 'ja'  // Japanese
  | 'ko'  // Korean
  | 'hi'  // Hindi
  | 'tr'; // Turkish

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
  ro: {
    code: 'ro',
    name: 'Romanian',
    nativeName: 'Română',
    isRTL: false,
    dateFormat: 'DD.MM.YYYY',
    numberFormat: 'ro-RO',
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
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'es-ES',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'fr-FR',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    isRTL: false,
    dateFormat: 'DD.MM.YYYY',
    numberFormat: 'de-DE',
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'it-IT',
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'pt-PT',
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    isRTL: false,
    dateFormat: 'DD.MM.YYYY',
    numberFormat: 'ru-RU',
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    isRTL: false,
    dateFormat: 'YYYY/MM/DD',
    numberFormat: 'zh-CN',
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    isRTL: false,
    dateFormat: 'YYYY/MM/DD',
    numberFormat: 'ja-JP',
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    isRTL: false,
    dateFormat: 'YYYY. MM. DD.',
    numberFormat: 'ko-KR',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    isRTL: false,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'hi-IN',
  },
  tr: {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    isRTL: false,
    dateFormat: 'DD.MM.YYYY',
    numberFormat: 'tr-TR',
  },
};

export const getLanguage = (language: Language): LanguageConfig => {
  return SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.en;
};

export const isRTL = (language: Language): boolean => {
  return SUPPORTED_LANGUAGES[language]?.isRTL || false;
};






