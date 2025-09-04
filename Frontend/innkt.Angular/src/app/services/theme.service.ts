import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Theme {
  id: string;
  name: string;
  icon: string;
  isDark: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly AVAILABLE_THEMES: Theme[] = [
    { id: 'light', name: 'Light', icon: '☀️', isDark: false },
    { id: 'dark', name: 'Dark', icon: '🌙', isDark: true },
    { id: 'auto', name: 'Auto', icon: '🔄', isDark: false }
  ];

  private currentThemeSubject = new BehaviorSubject<string>('light');
  public currentTheme$: Observable<string> = this.currentThemeSubject.asObservable();

  private systemThemeSubject = new BehaviorSubject<string>('light');
  private mediaQuery!: MediaQueryList;

  constructor() {
    this.initializeTheme();
    this.setupSystemThemeDetection();
  }

  private initializeTheme(): void {
    // Try to get theme from localStorage
    const savedTheme = localStorage.getItem('innkt-theme');
    if (savedTheme && this.isThemeSupported(savedTheme)) {
      this.setTheme(savedTheme);
    } else {
      // Default to light theme
      this.setTheme('light');
    }
  }

  private setupSystemThemeDetection(): void {
    // Check if the browser supports prefers-color-scheme
    if (window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Set initial system theme
      this.systemThemeSubject.next(this.mediaQuery.matches ? 'dark' : 'light');
      
      // Listen for system theme changes
      this.mediaQuery.addEventListener('change', (e) => {
        this.systemThemeSubject.next(e.matches ? 'dark' : 'light');
        
        // If auto theme is selected, update accordingly
        if (this.currentThemeSubject.value === 'auto') {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  getAvailableThemes(): Theme[] {
    return [...this.AVAILABLE_THEMES];
  }

  getCurrentTheme(): string {
    return this.currentThemeSubject.value;
  }

  getCurrentThemeInfo(): Theme | undefined {
    return this.AVAILABLE_THEMES.find(theme => theme.id === this.currentThemeSubject.value);
  }

  setTheme(themeId: string): void {
    if (this.isThemeSupported(themeId)) {
      this.currentThemeSubject.next(themeId);
      localStorage.setItem('innkt-theme', themeId);
      
      // Apply the theme
      if (themeId === 'auto') {
        this.applyTheme(this.systemThemeSubject.value);
      } else {
        this.applyTheme(themeId);
      }
    }
  }

  private applyTheme(themeId: string): void {
    const theme = this.AVAILABLE_THEMES.find(t => t.id === themeId);
    if (theme) {
      // Remove all theme classes
      document.documentElement.classList.remove('theme-light', 'theme-dark');
      
      // Add current theme class
      document.documentElement.classList.add(`theme-${themeId}`);
      
      // Set data attribute for CSS custom properties
      document.documentElement.setAttribute('data-theme', themeId);
      
      // Update body class
      document.body.className = `theme-${themeId}`;
      
      // Emit theme change event for components that need it
      this.currentThemeSubject.next(themeId);
    }
  }

  isThemeSupported(themeId: string): boolean {
    return this.AVAILABLE_THEMES.some(theme => theme.id === themeId);
  }

  isCurrentThemeDark(): boolean {
    const currentTheme = this.getCurrentThemeInfo();
    if (currentTheme?.id === 'auto') {
      return this.systemThemeSubject.value === 'dark';
    }
    return currentTheme?.isDark || false;
  }

  getThemeName(themeId: string): string {
    const theme = this.AVAILABLE_THEMES.find(t => t.id === themeId);
    return theme ? theme.name : themeId;
  }

  getThemeIcon(themeId: string): string {
    const theme = this.AVAILABLE_THEMES.find(t => t.id === themeId);
    return theme ? theme.icon : '🎨';
  }

  toggleTheme(): void {
    const currentTheme = this.getCurrentTheme();
    if (currentTheme === 'light') {
      this.setTheme('dark');
    } else if (currentTheme === 'dark') {
      this.setTheme('light');
    } else {
      // For auto theme, toggle between light and dark
      const systemTheme = this.systemThemeSubject.value;
      this.setTheme(systemTheme === 'light' ? 'dark' : 'light');
    }
  }

  getSystemTheme(): string {
    return this.systemThemeSubject.value;
  }

  // Method to get computed theme (useful for components that need to know the actual applied theme)
  getComputedTheme(): string {
    const currentTheme = this.getCurrentTheme();
    if (currentTheme === 'auto') {
      return this.systemThemeSubject.value;
    }
    return currentTheme;
  }
}
