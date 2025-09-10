export const environment = {
  production: false,
  
  // API Endpoints
  api: {
    officer: process.env.REACT_APP_OFFICER_API_URL || 'http://localhost:8080',
    neurospark: process.env.REACT_APP_NEUROSPARK_API_URL || 'http://localhost:5003',
    messaging: process.env.REACT_APP_MESSAGING_API_URL || 'http://localhost:3000',
    frontier: process.env.REACT_APP_FRONTIER_API_URL || 'http://localhost:51303',
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
    version: '1.0.0',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'he', 'ar'],
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



