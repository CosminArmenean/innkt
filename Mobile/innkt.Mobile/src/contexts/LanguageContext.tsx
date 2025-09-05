import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNLocalize from 'react-native-localize';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  isRTL: boolean;
  flag: string;
}

export interface LanguageContextType {
  currentLanguage: Language;
  isRTL: boolean;
  setLanguage: (languageCode: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
  getAvailableLanguages: () => Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

// Available languages
const AVAILABLE_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    isRTL: false,
    flag: '🇺🇸',
  },
  {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    isRTL: true,
    flag: '🇮🇱',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    isRTL: true,
    flag: '🇸🇦',
  },
];

// Translation keys (in a real app, this would come from i18n files)
const translations: Record<string, Record<string, string>> = {
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.submit': 'Submit',
    'common.close': 'Close',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.ok': 'OK',
    
    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.rememberMe': 'Remember Me',
    'auth.dontHaveAccount': "Don't have an account?",
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.signUp': 'Sign Up',
    'auth.signIn': 'Sign In',
    
    // Registration
    'register.firstName': 'First Name',
    'register.lastName': 'Last Name',
    'register.language': 'Language',
    'register.jointAccount': 'Joint Account',
    'register.jointAccountDescription': 'Create a joint account with another person',
    'register.secondUserFirstName': 'Second User First Name',
    'register.secondUserLastName': 'Second User Last Name',
    'register.secondUserPassword': 'Second User Password',
    'register.secondUserPasswordConfirmation': 'Second User Password Confirmation',
    'register.acceptTerms': 'I accept the Terms of Service',
    'register.acceptPrivacyPolicy': 'I accept the Privacy Policy',
    'register.acceptMarketing': 'I accept marketing communications',
    'register.acceptCookies': 'I accept cookies',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome back!',
    'dashboard.recentPosts': 'Recent Posts',
    'dashboard.friends': 'Friends',
    'dashboard.notifications': 'Notifications',
    
    // Profile
    'profile.title': 'Profile',
    'profile.edit': 'Edit Profile',
    'profile.settings': 'Settings',
    'profile.friends': 'Friends',
    'profile.posts': 'Posts',
    'profile.photos': 'Photos',
    
    // Posts
    'posts.title': 'Posts',
    'posts.create': 'Create Post',
    'posts.edit': 'Edit Post',
    'posts.delete': 'Delete Post',
    'posts.content': 'What\'s on your mind?',
    'posts.addPhoto': 'Add Photo',
    'posts.addLocation': 'Add Location',
    'posts.post': 'Post',
    
    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.notifications': 'Notifications',
    'settings.privacy': 'Privacy',
    'settings.about': 'About',
    'settings.help': 'Help',
    
    // Errors
    'error.network': 'Network error. Please check your connection.',
    'error.unknown': 'An unknown error occurred.',
    'error.validation': 'Please check your input and try again.',
    'error.auth': 'Authentication failed. Please try again.',
  },
  he: {
    // Common
    'common.loading': 'טוען...',
    'common.error': 'שגיאה',
    'common.success': 'הצלחה',
    'common.cancel': 'ביטול',
    'common.save': 'שמור',
    'common.delete': 'מחק',
    'common.edit': 'ערוך',
    'common.back': 'חזור',
    'common.next': 'הבא',
    'common.previous': 'הקודם',
    'common.submit': 'שלח',
    'common.close': 'סגור',
    'common.yes': 'כן',
    'common.no': 'לא',
    'common.ok': 'אישור',
    
    // Auth
    'auth.login': 'התחברות',
    'auth.register': 'הרשמה',
    'auth.logout': 'התנתקות',
    'auth.email': 'אימייל',
    'auth.password': 'סיסמה',
    'auth.confirmPassword': 'אימות סיסמה',
    'auth.forgotPassword': 'שכחת סיסמה?',
    'auth.rememberMe': 'זכור אותי',
    'auth.dontHaveAccount': 'אין לך חשבון?',
    'auth.alreadyHaveAccount': 'יש לך כבר חשבון?',
    'auth.signUp': 'הרשמה',
    'auth.signIn': 'התחברות',
    
    // Registration
    'register.firstName': 'שם פרטי',
    'register.lastName': 'שם משפחה',
    'register.language': 'שפה',
    'register.jointAccount': 'חשבון משותף',
    'register.jointAccountDescription': 'צור חשבון משותף עם אדם אחר',
    'register.secondUserFirstName': 'שם פרטי של המשתמש השני',
    'register.secondUserLastName': 'שם משפחה של המשתמש השני',
    'register.secondUserPassword': 'סיסמה של המשתמש השני',
    'register.secondUserPasswordConfirmation': 'אימות סיסמה של המשתמש השני',
    'register.acceptTerms': 'אני מקבל את תנאי השירות',
    'register.acceptPrivacyPolicy': 'אני מקבל את מדיניות הפרטיות',
    'register.acceptMarketing': 'אני מקבל תקשורת שיווקית',
    'register.acceptCookies': 'אני מקבל עוגיות',
    
    // Dashboard
    'dashboard.title': 'לוח בקרה',
    'dashboard.welcome': 'ברוך הבא!',
    'dashboard.recentPosts': 'פוסטים אחרונים',
    'dashboard.friends': 'חברים',
    'dashboard.notifications': 'התראות',
    
    // Profile
    'profile.title': 'פרופיל',
    'profile.edit': 'ערוך פרופיל',
    'profile.settings': 'הגדרות',
    'profile.friends': 'חברים',
    'profile.posts': 'פוסטים',
    'profile.photos': 'תמונות',
    
    // Posts
    'posts.title': 'פוסטים',
    'posts.create': 'צור פוסט',
    'posts.edit': 'ערוך פוסט',
    'posts.delete': 'מחק פוסט',
    'posts.content': 'מה על דעתך?',
    'posts.addPhoto': 'הוסף תמונה',
    'posts.addLocation': 'הוסף מיקום',
    'posts.post': 'פרסם',
    
    // Settings
    'settings.title': 'הגדרות',
    'settings.language': 'שפה',
    'settings.theme': 'ערכת נושא',
    'settings.notifications': 'התראות',
    'settings.privacy': 'פרטיות',
    'settings.about': 'אודות',
    'settings.help': 'עזרה',
    
    // Errors
    'error.network': 'שגיאת רשת. אנא בדוק את החיבור שלך.',
    'error.unknown': 'אירעה שגיאה לא ידועה.',
    'error.validation': 'אנא בדוק את הקלט שלך ונסה שוב.',
    'error.auth': 'האימות נכשל. אנא נסה שוב.',
  },
  ar: {
    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.back': 'رجوع',
    'common.next': 'التالي',
    'common.previous': 'السابق',
    'common.submit': 'إرسال',
    'common.close': 'إغلاق',
    'common.yes': 'نعم',
    'common.no': 'لا',
    'common.ok': 'موافق',
    
    // Auth
    'auth.login': 'تسجيل الدخول',
    'auth.register': 'تسجيل',
    'auth.logout': 'تسجيل الخروج',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.rememberMe': 'تذكرني',
    'auth.dontHaveAccount': 'ليس لديك حساب؟',
    'auth.alreadyHaveAccount': 'لديك حساب بالفعل؟',
    'auth.signUp': 'تسجيل',
    'auth.signIn': 'تسجيل الدخول',
    
    // Registration
    'register.firstName': 'الاسم الأول',
    'register.lastName': 'اسم العائلة',
    'register.language': 'اللغة',
    'register.jointAccount': 'حساب مشترك',
    'register.jointAccountDescription': 'إنشاء حساب مشترك مع شخص آخر',
    'register.secondUserFirstName': 'الاسم الأول للمستخدم الثاني',
    'register.secondUserLastName': 'اسم العائلة للمستخدم الثاني',
    'register.secondUserPassword': 'كلمة مرور المستخدم الثاني',
    'register.secondUserPasswordConfirmation': 'تأكيد كلمة مرور المستخدم الثاني',
    'register.acceptTerms': 'أوافق على شروط الخدمة',
    'register.acceptPrivacyPolicy': 'أوافق على سياسة الخصوصية',
    'register.acceptMarketing': 'أوافق على الاتصالات التسويقية',
    'register.acceptCookies': 'أوافق على ملفات تعريف الارتباط',
    
    // Dashboard
    'dashboard.title': 'لوحة التحكم',
    'dashboard.welcome': 'مرحباً بعودتك!',
    'dashboard.recentPosts': 'المنشورات الأخيرة',
    'dashboard.friends': 'الأصدقاء',
    'dashboard.notifications': 'الإشعارات',
    
    // Profile
    'profile.title': 'الملف الشخصي',
    'profile.edit': 'تعديل الملف الشخصي',
    'profile.settings': 'الإعدادات',
    'profile.friends': 'الأصدقاء',
    'profile.posts': 'المنشورات',
    'profile.photos': 'الصور',
    
    // Posts
    'posts.title': 'المنشورات',
    'posts.create': 'إنشاء منشور',
    'posts.edit': 'تعديل المنشور',
    'posts.delete': 'حذف المنشور',
    'posts.content': 'ماذا يدور في ذهنك؟',
    'posts.addPhoto': 'إضافة صورة',
    'posts.addLocation': 'إضافة موقع',
    'posts.post': 'نشر',
    
    // Settings
    'settings.title': 'الإعدادات',
    'settings.language': 'اللغة',
    'settings.theme': 'المظهر',
    'settings.notifications': 'الإشعارات',
    'settings.privacy': 'الخصوصية',
    'settings.about': 'حول',
    'settings.help': 'المساعدة',
    
    // Errors
    'error.network': 'خطأ في الشبكة. يرجى التحقق من الاتصال.',
    'error.unknown': 'حدث خطأ غير معروف.',
    'error.validation': 'يرجى التحقق من المدخلات والمحاولة مرة أخرى.',
    'error.auth': 'فشل المصادقة. يرجى المحاولة مرة أخرى.',
  },
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({children}) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(AVAILABLE_LANGUAGES[0]);
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    initializeLanguage();
  }, []);

  useEffect(() => {
    setIsRTL(currentLanguage.isRTL);
  }, [currentLanguage]);

  const initializeLanguage = async () => {
    try {
      const savedLanguageCode = await AsyncStorage.getItem('language_code');
      if (savedLanguageCode) {
        const savedLanguage = AVAILABLE_LANGUAGES.find(lang => lang.code === savedLanguageCode);
        if (savedLanguage) {
          setCurrentLanguage(savedLanguage);
          return;
        }
      }

      // Use system language if no saved language
      const systemLanguageCode = RNLocalize.getLocales()[0]?.languageCode;
      const systemLanguage = AVAILABLE_LANGUAGES.find(lang => lang.code === systemLanguageCode);
      if (systemLanguage) {
        setCurrentLanguage(systemLanguage);
      }
    } catch (error) {
      console.error('Failed to initialize language:', error);
    }
  };

  const setLanguage = async (languageCode: string) => {
    try {
      const language = AVAILABLE_LANGUAGES.find(lang => lang.code === languageCode);
      if (language) {
        setCurrentLanguage(language);
        await AsyncStorage.setItem('language_code', languageCode);
      }
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  const t = (key: string, params?: Record<string, any>): string => {
    const translation = translations[currentLanguage.code]?.[key] || key;
    
    if (params) {
      return translation.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param]?.toString() || match;
      });
    }
    
    return translation;
  };

  const getAvailableLanguages = (): Language[] => {
    return AVAILABLE_LANGUAGES;
  };

  const value: LanguageContextType = {
    currentLanguage,
    isRTL,
    setLanguage,
    t,
    getAvailableLanguages,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};






