import { Inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  private selectedLanguageSubject: BehaviorSubject<string>;
  public selectedLanguage$: Observable<string>;
  constructor(private translateService: TranslateService) {
     // Initialize the subject with a default language, e.g., 'en' (English).
     this.selectedLanguageSubject = new BehaviorSubject<string>('en-EN');
     this.selectedLanguage$ = this.selectedLanguageSubject.asObservable();
   }
  

  setLanguage(language: string) {
    this.translateService.use(language);
    localStorage.setItem('userLanguage', language);
  }

  getLanguage() : string  {
    const savedLanguage = localStorage.getItem('userLanguage');
    
    return savedLanguage ?? (this.translateService.getBrowserLang() || 'en-EN');
  }

  isRtlLanguage(): boolean {      
    const currentLanguage = this.getLanguage().toLowerCase();    
    
    return currentLanguage === 'ar-ar' || currentLanguage === 'he-he';
  }
}
