import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription, map, switchMap } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  private selectedLanguageSubject: BehaviorSubject<string>;
  public selectedLanguage$: Observable<string>;
  public months: string[] = [];

  constructor(private translateService: TranslateService, private http: HttpClient) {
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

  getMonths(): Observable<string[]> {
   // Fetch month names based on the selected language
   const currentLanguage = this.getLanguage();    

  return this.http
    .get<{ [key: string]: string[] }>('../../../assets/i18n/months.json')
    .pipe(map((data) => {
      return (this.months = data[currentLanguage] ?? data['en-EN']); // Use English as the default language
    }));
    }


}
