import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook to handle RTL (Right-to-Left) layout for Hebrew and Arabic languages
 */
export const useRTL = () => {
  const { i18n } = useTranslation();
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    const currentLanguage = i18n.language;
    const rtlLanguages = ['he', 'ar']; // Hebrew and Arabic
    
    const shouldBeRTL = rtlLanguages.includes(currentLanguage);
    setIsRTL(shouldBeRTL);

    // Apply RTL to document
    if (shouldBeRTL) {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = currentLanguage;
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = currentLanguage;
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }

    // Add language-specific class for CSS targeting
    document.body.className = document.body.className
      .replace(/lang-\w+/g, '')
      .trim() + ` lang-${currentLanguage}`;

  }, [i18n.language]);

  return {
    isRTL,
    language: i18n.language,
    direction: isRTL ? 'rtl' : 'ltr'
  };
};

export default useRTL;
