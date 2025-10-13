import { environment } from '../config/environment';

export interface LanguageMetadata {
  code: string;
  name: string;
  nativeName: string;
  isRtl: boolean;
}

export interface LanguageDetectionResult {
  language: string;
  metadata: LanguageMetadata;
  source: 'cookie' | 'database' | 'header' | 'default';
}

class LanguageService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = environment.api.officer;
  }

  /**
   * Detect user's preferred language from backend
   */
  async detectLanguage(): Promise<LanguageDetectionResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/language/detect`, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Failed to detect language from backend, using fallback:', error);
      
      // Check localStorage first
      const storedLanguage = localStorage.getItem('innkt_language');
      if (storedLanguage) {
        return {
          language: storedLanguage,
          metadata: this.getFallbackLanguageMetadata(storedLanguage),
          source: 'cookie'
        };
      }
      
      return this.getFallbackLanguage();
    }
  }

  /**
   * Get all supported languages
   */
  async getSupportedLanguages(): Promise<LanguageMetadata[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/language/supported`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.languages;
    } catch (error) {
      console.warn('Failed to get supported languages, using fallback:', error);
      return this.getFallbackLanguages();
    }
  }

  /**
   * Set user's preferred language
   */
  async setLanguage(language: string): Promise<{ success: boolean; language: string; metadata: LanguageMetadata }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/language/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ language }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Failed to set language on backend, using fallback:', error);
      
      // Fallback: Set language in localStorage and return success
      localStorage.setItem('innkt_language', language);
      const metadata = this.getFallbackLanguageMetadata(language);
      
      return {
        success: true,
        language,
        metadata
      };
    }
  }

  /**
   * Get current language from HttpContext
   */
  async getCurrentLanguage(): Promise<LanguageDetectionResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/language/current`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Failed to get current language, using fallback:', error);
      return this.getFallbackLanguage();
    }
  }

  /**
   * Get language metadata
   */
  async getLanguageMetadata(language: string): Promise<LanguageMetadata> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/language/metadata/${language}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Failed to get language metadata, using fallback:', error);
      return this.getFallbackLanguageMetadata(language);
    }
  }

  /**
   * Check if language is RTL
   */
  async isRtlLanguage(language: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/language/is-rtl/${language}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.isRtl;
    } catch (error) {
      console.warn('Failed to check RTL status, using fallback:', error);
      return this.isRtlLanguageFallback(language);
    }
  }

  /**
   * Fallback language detection from browser
   */
  private getFallbackLanguage(): LanguageDetectionResult {
    const browserLanguage = navigator.language.split('-')[0];
    const supportedLanguages = environment.app.supportedLanguages;
    const language = supportedLanguages.includes(browserLanguage) ? browserLanguage : 'en';
    
    return {
      language,
      metadata: this.getFallbackLanguageMetadata(language),
      source: 'header'
    };
  }

  /**
   * Fallback supported languages
   */
  private getFallbackLanguages(): LanguageMetadata[] {
    return environment.app.supportedLanguages.map(code => 
      this.getFallbackLanguageMetadata(code)
    );
  }

  /**
   * Fallback language metadata
   */
  private getFallbackLanguageMetadata(language: string): LanguageMetadata {
    const metadata: Record<string, LanguageMetadata> = {
      en: { code: 'en', name: 'English', nativeName: 'English', isRtl: false },
      ro: { code: 'ro', name: 'Romanian', nativeName: 'Română', isRtl: false },
      he: { code: 'he', name: 'Hebrew', nativeName: 'עברית', isRtl: true },
      ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRtl: true },
      es: { code: 'es', name: 'Spanish', nativeName: 'Español', isRtl: false },
      fr: { code: 'fr', name: 'French', nativeName: 'Français', isRtl: false },
      de: { code: 'de', name: 'German', nativeName: 'Deutsch', isRtl: false },
      it: { code: 'it', name: 'Italian', nativeName: 'Italiano', isRtl: false },
      pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', isRtl: false },
      ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', isRtl: false },
      zh: { code: 'zh', name: 'Chinese', nativeName: '中文', isRtl: false },
      ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', isRtl: false },
      ko: { code: 'ko', name: 'Korean', nativeName: '한국어', isRtl: false },
      hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isRtl: false },
      tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', isRtl: false },
      nl: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', isRtl: false },
      pl: { code: 'pl', name: 'Polish', nativeName: 'Polski', isRtl: false },
      cs: { code: 'cs', name: 'Czech', nativeName: 'Čeština', isRtl: false },
      hu: { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', isRtl: false },
    };

    return metadata[language] || metadata.en;
  }

  /**
   * Fallback RTL check
   */
  private isRtlLanguageFallback(language: string): boolean {
    const rtlLanguages = ['he', 'ar'];
    return rtlLanguages.includes(language);
  }
}

export const languageService = new LanguageService();
export default languageService;
