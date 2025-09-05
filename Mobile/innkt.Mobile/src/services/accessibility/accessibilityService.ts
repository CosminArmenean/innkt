import { AccessibilityInfo, Platform, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AccessibilityConfig {
  enableScreenReader: boolean;
  enableHighContrast: boolean;
  enableLargeText: boolean;
  enableReducedMotion: boolean;
  enableVoiceControl: boolean;
  enableSwitchControl: boolean;
  enableAssistiveTouch: boolean;
  enableClosedCaptions: boolean;
  enableAudioDescriptions: boolean;
}

export interface AccessibilityFeatures {
  screenReader: boolean;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  voiceControl: boolean;
  switchControl: boolean;
  assistiveTouch: boolean;
  closedCaptions: boolean;
  audioDescriptions: boolean;
}

export interface AccessibilityAnnouncement {
  id: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
  category: 'navigation' | 'content' | 'error' | 'success' | 'warning';
}

export interface NavigationAccessibility {
  currentScreen: string;
  previousScreen: string;
  breadcrumbs: string[];
  landmarks: string[];
  focusableElements: string[];
}

export class AccessibilityService {
  private static instance: AccessibilityService;
  private config: AccessibilityConfig;
  private features: AccessibilityFeatures;
  private announcements: AccessibilityAnnouncement[] = [];
  private navigationState: NavigationAccessibility;
  private listeners: Map<string, Function[]> = new Map();
  private isInitialized = false;

  private constructor() {
    this.config = {
      enableScreenReader: true,
      enableHighContrast: true,
      enableLargeText: true,
      enableReducedMotion: true,
      enableVoiceControl: true,
      enableSwitchControl: true,
      enableAssistiveTouch: true,
      enableClosedCaptions: true,
      enableAudioDescriptions: true,
    };

    this.features = {
      screenReader: false,
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      voiceControl: false,
      switchControl: false,
      assistiveTouch: false,
      closedCaptions: false,
      audioDescriptions: false,
    };

    this.navigationState = {
      currentScreen: '',
      previousScreen: '',
      breadcrumbs: [],
      landmarks: [],
      focusableElements: [],
    };
  }

  public static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadConfiguration();
      await this.detectAccessibilityFeatures();
      this.setupEventListeners();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize accessibility service:', error);
    }
  }

  private async loadConfiguration(): Promise<void> {
    try {
      const storedConfig = await AsyncStorage.getItem('accessibility_config');
      if (storedConfig) {
        this.config = { ...this.config, ...JSON.parse(storedConfig) };
      }
    } catch (error) {
      console.warn('Failed to load accessibility configuration:', error);
    }
  }

  private async saveConfiguration(): Promise<void> {
    try {
      await AsyncStorage.setItem('accessibility_config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save accessibility configuration:', error);
    }
  }

  private async detectAccessibilityFeatures(): Promise<void> {
    try {
      // Detect screen reader
      const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      this.features.screenReader = screenReaderEnabled;

      // Detect other accessibility features based on platform
      if (Platform.OS === 'ios') {
        await this.detectIOSAccessibilityFeatures();
      } else if (Platform.OS === 'android') {
        await this.detectAndroidAccessibilityFeatures();
      }

      // Listen for screen reader changes
      AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
        this.features.screenReader = enabled;
        this.emit('screenReaderChanged', enabled);
      });

    } catch (error) {
      console.warn('Failed to detect accessibility features:', error);
    }
  }

  private async detectIOSAccessibilityFeatures(): Promise<void> {
    // iOS-specific accessibility detection
    try {
      // Check for VoiceOver
      this.features.screenReader = await AccessibilityInfo.isScreenReaderEnabled();
      
      // Check for other iOS accessibility features
      // This would integrate with native iOS accessibility APIs
    } catch (error) {
      console.warn('Failed to detect iOS accessibility features:', error);
    }
  }

  private async detectAndroidAccessibilityFeatures(): Promise<void> {
    // Android-specific accessibility detection
    try {
      // Check for TalkBack
      this.features.screenReader = await AccessibilityInfo.isScreenReaderEnabled();
      
      // Check for other Android accessibility features
      // This would integrate with native Android accessibility APIs
    } catch (error) {
      console.warn('Failed to detect Android accessibility features:', error);
    }
  }

  private setupEventListeners(): void {
    // Listen for accessibility announcements
    AccessibilityInfo.addEventListener('announcementFinished', (announcement) => {
      this.handleAnnouncementFinished(announcement);
    });

    // Listen for accessibility focus changes
    AccessibilityInfo.addEventListener('focusChanged', (event) => {
      this.handleFocusChanged(event);
    });
  }

  // Screen reader support methods
  public async announceForAccessibility(message: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    if (!this.features.screenReader || !this.config.enableScreenReader) {
      return;
    }

    try {
      const announcement: AccessibilityAnnouncement = {
        id: `announcement_${Date.now()}`,
        message,
        priority,
        timestamp: Date.now(),
        category: 'content',
      };

      this.announcements.push(announcement);
      await AccessibilityInfo.announceForAccessibility(message);
      
      this.emit('announcementMade', announcement);
    } catch (error) {
      console.warn('Failed to announce for accessibility:', error);
    }
  }

  public async announceScreenReader(message: string): Promise<void> {
    await this.announceForAccessibility(message, 'high');
  }

  public async announceNavigation(screenName: string): Promise<void> {
    const message = `Navigated to ${screenName}`;
    await this.announceForAccessibility(message, 'high');
  }

  public async announceContentUpdate(content: string): Promise<void> {
    await this.announceForAccessibility(content, 'medium');
  }

  public async announceError(error: string): Promise<void> {
    await this.announceForAccessibility(`Error: ${error}`, 'high');
  }

  public async announceSuccess(message: string): Promise<void> {
    await this.announceForAccessibility(message, 'medium');
  }

  // Navigation accessibility methods
  public updateNavigationState(screenName: string, breadcrumbs?: string[]): void {
    this.navigationState.previousScreen = this.navigationState.currentScreen;
    this.navigationState.currentScreen = screenName;
    
    if (breadcrumbs) {
      this.navigationState.breadcrumbs = breadcrumbs;
    }

    // Announce navigation change
    this.announceNavigation(screenName);

    // Update landmarks and focusable elements
    this.updateLandmarks(screenName);
    this.updateFocusableElements(screenName);

    this.emit('navigationChanged', this.navigationState);
  }

  public getNavigationState(): NavigationAccessibility {
    return { ...this.navigationState };
  }

  public getCurrentScreen(): string {
    return this.navigationState.currentScreen;
  }

  public getBreadcrumbs(): string[] {
    return [...this.navigationState.breadcrumbs];
  }

  private updateLandmarks(screenName: string): void {
    // Define landmarks for different screens
    const landmarks: { [key: string]: string[] } = {
      'Dashboard': ['main', 'navigation', 'content'],
      'Profile': ['main', 'navigation', 'content', 'form'],
      'Posts': ['main', 'navigation', 'content', 'list'],
      'Settings': ['main', 'navigation', 'content', 'form'],
    };

    this.navigationState.landmarks = landmarks[screenName] || ['main', 'navigation', 'content'];
  }

  private updateFocusableElements(screenName: string): void {
    // Define focusable elements for different screens
    const focusableElements: { [key: string]: string[] } = {
      'Dashboard': ['header', 'navigation', 'content', 'footer'],
      'Profile': ['header', 'form', 'buttons', 'content'],
      'Posts': ['header', 'list', 'filters', 'pagination'],
      'Settings': ['header', 'form', 'toggles', 'buttons'],
    };

    this.navigationState.focusableElements = focusableElements[screenName] || ['header', 'content', 'footer'];
  }

  // Focus management methods
  public async setAccessibilityFocus(elementId: string): Promise<void> {
    if (!this.features.screenReader) return;

    try {
      // This would integrate with native accessibility focus APIs
      await AccessibilityInfo.setAccessibilityFocus(elementId);
      this.emit('focusChanged', { elementId, type: 'programmatic' });
    } catch (error) {
      console.warn('Failed to set accessibility focus:', error);
    }
  }

  public async getAccessibilityFocus(): Promise<string | null> {
    try {
      // This would integrate with native accessibility focus APIs
      return null; // Placeholder
    } catch (error) {
      console.warn('Failed to get accessibility focus:', error);
      return null;
    }
  }

  private handleFocusChanged(event: any): void {
    this.emit('focusChanged', event);
  }

  // High contrast support
  public isHighContrastEnabled(): boolean {
    return this.features.highContrast && this.config.enableHighContrast;
  }

  public getHighContrastColors(): { primary: string; secondary: string; background: string; text: string } {
    if (this.isHighContrastEnabled()) {
      return {
        primary: '#FFFFFF',
        secondary: '#000000',
        background: '#000000',
        text: '#FFFFFF',
      };
    }

    return {
      primary: '#007AFF',
      secondary: '#5856D6',
      background: '#FFFFFF',
      text: '#000000',
    };
  }

  // Large text support
  public isLargeTextEnabled(): boolean {
    return this.features.largeText && this.config.enableLargeText;
  }

  public getLargeTextScale(): number {
    if (this.isLargeTextEnabled()) {
      return 1.5; // 150% scale
    }
    return 1.0; // 100% scale
  }

  // Reduced motion support
  public isReducedMotionEnabled(): boolean {
    return this.features.reducedMotion && this.config.enableReducedMotion;
  }

  public shouldReduceMotion(): boolean {
    return this.isReducedMotionEnabled();
  }

  // Voice control support
  public isVoiceControlEnabled(): boolean {
    return this.features.voiceControl && this.config.enableVoiceControl;
  }

  public getVoiceControlCommands(): string[] {
    if (!this.isVoiceControlEnabled()) return [];

    return [
      'go back',
      'go home',
      'go to profile',
      'go to posts',
      'go to settings',
      'refresh',
      'search',
      'like',
      'comment',
      'share',
    ];
  }

  // Switch control support
  public isSwitchControlEnabled(): boolean {
    return this.features.switchControl && this.config.enableSwitchControl;
  }

  public getSwitchControlElements(): string[] {
    if (!this.isSwitchControlEnabled()) return [];

    return this.navigationState.focusableElements;
  }

  // Assistive touch support
  public isAssistiveTouchEnabled(): boolean {
    return this.features.assistiveTouch && this.config.enableAssistiveTouch;
  }

  public getAssistiveTouchActions(): string[] {
    if (!this.isAssistiveTouchEnabled()) return [];

    return [
      'home',
      'back',
      'menu',
      'volume up',
      'volume down',
      'screenshot',
      'siri',
    ];
  }

  // Closed captions support
  public isClosedCaptionsEnabled(): boolean {
    return this.features.closedCaptions && this.config.enableClosedCaptions;
  }

  public getClosedCaptionsStyle(): {
    fontSize: number;
    fontFamily: string;
    backgroundColor: string;
    textColor: string;
  } {
    if (this.isClosedCaptionsEnabled()) {
      return {
        fontSize: 18,
        fontFamily: 'System',
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
      };
    }

    return {
      fontSize: 14,
      fontFamily: 'System',
      backgroundColor: 'transparent',
      textColor: '#000000',
    };
  }

  // Audio descriptions support
  public isAudioDescriptionsEnabled(): boolean {
    return this.features.audioDescriptions && this.config.enableAudioDescriptions;
  }

  public async playAudioDescription(description: string): Promise<void> {
    if (!this.isAudioDescriptionsEnabled()) return;

    try {
      // This would integrate with text-to-speech APIs
      await this.announceForAccessibility(description, 'high');
    } catch (error) {
      console.warn('Failed to play audio description:', error);
    }
  }

  // Configuration methods
  public updateConfiguration(newConfig: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfiguration();
    this.emit('configurationChanged', this.config);
  }

  public getConfiguration(): AccessibilityConfig {
    return { ...this.config };
  }

  public getFeatures(): AccessibilityFeatures {
    return { ...this.features };
  }

  // Event system
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in accessibility event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  public isAccessibilityEnabled(): boolean {
    return this.features.screenReader || 
           this.features.highContrast || 
           this.features.largeText || 
           this.features.reducedMotion;
  }

  public getAccessibilitySummary(): string {
    const enabledFeatures = Object.entries(this.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature)
      .join(', ');

    return `Accessibility features enabled: ${enabledFeatures || 'none'}`;
  }

  public async testAccessibility(): Promise<{
    screenReader: boolean;
    navigation: boolean;
    announcements: boolean;
    focus: boolean;
  }> {
    const results = {
      screenReader: this.features.screenReader,
      navigation: this.navigationState.currentScreen !== '',
      announcements: this.announcements.length > 0,
      focus: this.navigationState.focusableElements.length > 0,
    };

    return results;
  }

  // Cleanup methods
  public cleanup(): void {
    this.listeners.clear();
    this.announcements = [];
    this.isInitialized = false;
  }

  private handleAnnouncementFinished(announcement: any): void {
    this.emit('announcementFinished', announcement);
  }
}

export const accessibilityService = AccessibilityService.getInstance();
export default accessibilityService;






