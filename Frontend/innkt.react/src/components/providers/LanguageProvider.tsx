import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { languageService, LanguageDetectionResult, LanguageMetadata } from '../../services/languageService';
import useRTL from '../../hooks/useRTL';

interface LanguageContextType {
  currentLanguage: string;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
  languageMetadata: LanguageMetadata | null;
  supportedLanguages: LanguageMetadata[];
  isLoading: boolean;
  setLanguage: (language: string) => Promise<void>;
  refreshLanguage: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const { isRTL, direction } = useRTL();
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [languageMetadata, setLanguageMetadata] = useState<LanguageMetadata | null>(null);
  const [supportedLanguages, setSupportedLanguages] = useState<LanguageMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize language detection
  useEffect(() => {
    initializeLanguage();
  }, []);

  const initializeLanguage = async () => {
    try {
      setIsLoading(true);
      
      // Load supported languages first
      const supported = await languageService.getSupportedLanguages();
      setSupportedLanguages(supported);

      // Detect current language
      const detection = await languageService.detectLanguage();
      setCurrentLanguage(detection.language);
      setLanguageMetadata(detection.metadata);

      // Apply to i18next
      await i18n.changeLanguage(detection.language);

      console.log('Language initialized:', {
        language: detection.language,
        source: detection.source,
        isRTL: detection.metadata.isRtl,
        metadata: detection.metadata
      });

    } catch (error) {
      console.error('Failed to initialize language:', error);
      
      // Fallback to browser language or default
      const fallbackLanguage = navigator.language.split('-')[0];
      const supportedCodes = supportedLanguages.map(lang => lang.code);
      const language = supportedCodes.includes(fallbackLanguage) ? fallbackLanguage : 'en';
      
      setCurrentLanguage(language);
      await i18n.changeLanguage(language);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (language: string) => {
    try {
      setIsLoading(true);
      
      // Set language on backend
      const result = await languageService.setLanguage(language);
      
      if (result.success) {
        // Update local state
        setCurrentLanguage(language);
        setLanguageMetadata(result.metadata);
        
        // Apply to i18next
        await i18n.changeLanguage(language);
        
        console.log('Language changed successfully:', {
          language,
          isRTL: result.metadata.isRtl,
          metadata: result.metadata
        });
      }
    } catch (error) {
      console.error('Failed to set language:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLanguage = async () => {
    await initializeLanguage();
  };

  const contextValue: LanguageContextType = {
    currentLanguage,
    isRTL,
    direction,
    languageMetadata,
    supportedLanguages,
    isLoading,
    setLanguage,
    refreshLanguage,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageProvider;
