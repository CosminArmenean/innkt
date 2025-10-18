export const environment = {
  production: false,
  
  // API Endpoints - Configured for multi-device testing with IP 192.168.1.6
  api: {
    officer: process.env.REACT_APP_OFFICER_API_URL || 'http://192.168.1.6:5001',
    social: process.env.REACT_APP_SOCIAL_API_URL || 'http://192.168.1.6:8081',
    groups: process.env.REACT_APP_GROUPS_API_URL || 'http://192.168.1.6:5002',
    neurospark: process.env.REACT_APP_NEUROSPARK_API_URL || 'http://192.168.1.6:5003',
    messaging: process.env.REACT_APP_MESSAGING_API_URL || 'http://192.168.1.6:3000',
    notifications: process.env.REACT_APP_NOTIFICATIONS_API_URL || 'http://192.168.1.6:5006',
    frontier: process.env.REACT_APP_FRONTIER_API_URL || 'http://192.168.1.6:51303',
    seer: process.env.REACT_APP_SEER_API_URL || 'http://192.168.1.6:5267',
  },
  
  // Feature Flags
  features: {
    jointAccounts: true,
    kidAccounts: true,
    aiImageProcessing: true,
    qrCodes: true,
    blockchain: true,
    multiLanguage: true,
    rtlSupport: true,
  },
  
  // App Configuration
  app: {
    name: 'INNKT',
    version: '1.0.9',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'ro', 'he', 'ar', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'hi', 'tr'],
    theme: {
      primaryColor: '#6E31A6',
      secondaryColor: '#8B5CF6',
      accentColor: '#A855F7',
    },
  },
  
  // Security
  security: {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },
  
  // File Upload
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxFiles: 10,
  },
};



