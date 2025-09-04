import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LanguageService, Language } from '../../../services/language.service';
import { ThemeService, Theme } from '../../../services/theme.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TranslateModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  supportedLanguages: Language[] = [];
  availableThemes: Theme[] = [];
  currentLanguage: string = 'en';
  currentTheme: string = 'light';
  isAuthenticated: boolean = false;
  currentUser: any = null;

  constructor(
    private languageService: LanguageService,
    private themeService: ThemeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.supportedLanguages = this.languageService.getSupportedLanguages();
    this.availableThemes = this.themeService.getAvailableThemes();
    
    this.languageService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
    });
    
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  onLanguageChange(languageCode: string): void {
    this.languageService.setLanguage(languageCode);
  }

  onThemeChange(themeId: string): void {
    this.themeService.setTheme(themeId);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.authService.logout();
  }

  getLanguageDisplayName(language: Language): string {
    return `${language.flag} ${language.nativeName}`;
  }

  getThemeDisplayName(theme: Theme): string {
    return `${theme.icon} ${theme.name}`;
  }
}
