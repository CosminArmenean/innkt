import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  isRTL: boolean;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly SUPPORTED_LANGUAGES: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', isRTL: false, flag: '🇺🇸' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', isRTL: true, flag: '🇮🇱' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRTL: true, flag: '🇸🇦' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', isRTL: false, flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', isRTL: false, flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', isRTL: false, flag: '🇩🇪' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', isRTL: false, flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', isRTL: false, flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', isRTL: false, flag: '🇷🇺' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', isRTL: false, flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', isRTL: false, flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', isRTL: false, flag: '🇰🇷' }
  ];

  private currentLanguageSubject = new BehaviorSubject<string>('en');
  public currentLanguage$: Observable<string> = this.currentLanguageSubject.asObservable();

  constructor() {
    this.initializeLanguage();
  }

  private initializeLanguage(): void {
    // Try to get language from localStorage
    const savedLanguage = localStorage.getItem('innkt-language');
    if (savedLanguage && this.isLanguageSupported(savedLanguage)) {
      this.setLanguage(savedLanguage);
    } else {
      // Try to detect browser language
      const browserLanguage = navigator.language.split('-')[0];
      if (this.isLanguageSupported(browserLanguage)) {
        this.setLanguage(browserLanguage);
      } else {
        // Default to English
        this.setLanguage('en');
      }
    }
  }

  getSupportedLanguages(): Language[] {
    return [...this.SUPPORTED_LANGUAGES];
  }

  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  getCurrentLanguageInfo(): Language | undefined {
    return this.SUPPORTED_LANGUAGES.find(lang => lang.code === this.currentLanguageSubject.value);
  }

  setLanguage(languageCode: string): void {
    if (this.isLanguageSupported(languageCode)) {
      this.currentLanguageSubject.next(languageCode);
      localStorage.setItem('innkt-language', languageCode);
      
      // Update document direction for RTL languages
      const languageInfo = this.SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
      if (languageInfo) {
        document.documentElement.dir = languageInfo.isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = languageCode;
      }
    }
  }

  isLanguageSupported(languageCode: string): boolean {
    return this.SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode);
  }

  isCurrentLanguageRTL(): boolean {
    const currentLang = this.getCurrentLanguageInfo();
    return currentLang ? currentLang.isRTL : false;
  }

  getLanguageName(languageCode: string): string {
    const language = this.SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
    return language ? language.name : languageCode;
  }

  getNativeLanguageName(languageCode: string): string {
    const language = this.SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
    return language ? language.nativeName : languageCode;
  }

  getLanguageFlag(languageCode: string): string {
    const language = this.SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
    return language ? language.flag : '🌐';
  }
}
