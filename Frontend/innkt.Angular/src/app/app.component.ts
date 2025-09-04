import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { FooterComponent } from './components/shared/footer/footer.component';
import { LanguageService } from './services/language.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, TranslateModule, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  protected readonly title = signal('Innkt');
  currentLanguage = 'en';
  currentTheme = 'light';

  constructor(
    private translate: TranslateService,
    private languageService: LanguageService,
    private themeService: ThemeService
  ) {
    // Set default language
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  ngOnInit() {
    // Initialize language and theme from services
    this.languageService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
      this.translate.use(lang);
      this.updateDocumentDirection(lang);
    });

    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
      this.updateDocumentTheme(theme);
    });
  }

  private updateDocumentDirection(language: string) {
    const isRTL = language === 'he' || language === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }

  private updateDocumentTheme(theme: string) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = `theme-${theme}`;
  }
}
