// Environment Configuration for Innkt Mobile App
// This file contains all configuration constants and environment-specific settings

export const ENV = {
  // Backend Service URLs
  OFFICER_BASE_URL: 'https://localhost:5000',
  FRONTIER_BASE_URL: 'https://localhost:5002',
  
  // Feature Flags
  ENABLE_BIOMETRICS: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: true,
  ENABLE_DEBUG_MODE: __DEV__,
  
  // API Configuration
  API_TIMEOUT: 30000,
  API_RETRY_ATTEMPTS: 3,
  API_VERSION: 'v1',
  
  // Media Configuration
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  IMAGE_QUALITY: 0.8,
  MAX_IMAGES_PER_POST: 10,
  
  // Security Configuration
  ENABLE_SSL_PINNING: true,
  ENABLE_CERTIFICATE_PINNING: true,
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
  
  // Localization
  DEFAULT_LANGUAGE: 'en',
  SUPPORTED_LANGUAGES: ['en', 'he', 'ar'],
  RTL_LANGUAGES: ['he', 'ar'],
  
  // Theme Configuration
  DEFAULT_THEME: 'auto',
  ENABLE_CUSTOM_THEMES: true,
  
  // Storage Configuration
  ENABLE_ENCRYPTED_STORAGE: true,
  MAX_CACHE_SIZE: 100 * 1024 * 1024, // 100MB
  CACHE_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Network Configuration
  ENABLE_OFFLINE_MODE: true,
  ENABLE_BACKGROUND_SYNC: true,
  SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_OFFLINE_POSTS: 50,
  
  // Performance Configuration
  POSTS_PER_PAGE: 20,
  IMAGE_CACHE_SIZE: 50,
  DEBOUNCE_DELAY: 300,
  
  // Social Features
  MAX_POST_LENGTH: 1000,
  MAX_TAGS_PER_POST: 10,
  MAX_COMMENT_LENGTH: 500,
  
  // User Experience
  SPLASH_SCREEN_DURATION: 2000,
  ANIMATION_DURATION: 300,
  HAPTIC_FEEDBACK: true,
  
  // Development
  ENABLE_LOGGING: __DEV__,
  ENABLE_PERFORMANCE_MONITORING: __DEV__,
  ENABLE_CRASH_REPORTING: true,
  ENABLE_NETWORK_INSPECTOR: __DEV__,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  REFRESH_TOKEN: '/api/auth/refresh',
  LOGOUT: '/api/auth/logout',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  
  // User Management
  USER_PROFILE: '/api/users/profile',
  UPDATE_PROFILE: '/api/users/profile',
  UPLOAD_AVATAR: '/api/users/avatar',
  CHANGE_PASSWORD: '/api/users/change-password',
  
  // Posts
  POSTS: '/api/posts',
  CREATE_POST: '/api/posts',
  UPDATE_POST: '/api/posts/:id',
  DELETE_POST: '/api/posts/:id',
  LIKE_POST: '/api/posts/:id/like',
  UNLIKE_POST: '/api/posts/:id/unlike',
  COMMENT_POST: '/api/posts/:id/comments',
  
  // Social
  FRIENDS: '/api/users/friends',
  FOLLOW_USER: '/api/users/:id/follow',
  UNFOLLOW_USER: '/api/users/:id/unfollow',
  SEARCH_USERS: '/api/users/search',
  
  // Media
  UPLOAD_MEDIA: '/api/media/upload',
  DELETE_MEDIA: '/api/media/:id',
  
  // Notifications
  NOTIFICATIONS: '/api/notifications',
  MARK_READ: '/api/notifications/:id/read',
  MARK_ALL_READ: '/api/notifications/read-all',
  
  // Settings
  USER_SETTINGS: '/api/users/settings',
  PRIVACY_SETTINGS: '/api/users/privacy',
  NOTIFICATION_SETTINGS: '/api/users/notifications',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNKNOWN_ERROR: 'An unknown error occurred.',
  
  // Authentication Errors
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_LOCKED: 'Your account has been locked.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address.',
  TOO_MANY_ATTEMPTS: 'Too many login attempts. Please try again later.',
  
  // Post Errors
  POST_TOO_LONG: 'Post content is too long.',
  POST_TOO_SHORT: 'Post content is too short.',
  INVALID_MEDIA: 'Invalid media file.',
  MEDIA_TOO_LARGE: 'Media file is too large.',
  
  // User Errors
  USERNAME_TAKEN: 'Username is already taken.',
  EMAIL_TAKEN: 'Email is already registered.',
  WEAK_PASSWORD: 'Password is too weak.',
  PASSWORDS_DONT_MATCH: 'Passwords do not match.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTRATION_SUCCESS: 'Registration successful!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  POST_CREATED: 'Post created successfully!',
  POST_UPDATED: 'Post updated successfully!',
  POST_DELETED: 'Post deleted successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
};

// Validation Rules
export const VALIDATION_RULES = {
  // User Registration
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 30,
  MIN_FIRST_NAME_LENGTH: 2,
  MAX_FIRST_NAME_LENGTH: 50,
  MIN_LAST_NAME_LENGTH: 2,
  MAX_LAST_NAME_LENGTH: 50,
  
  // Posts
  MIN_POST_LENGTH: 10,
  MAX_POST_LENGTH: 1000,
  MAX_TAGS_PER_POST: 10,
  MAX_TAG_LENGTH: 20,
  
  // Comments
  MIN_COMMENT_LENGTH: 1,
  MAX_COMMENT_LENGTH: 500,
  
  // Media
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  SUPPORTED_VIDEO_FORMATS: ['mp4', 'mov', 'avi', 'mkv'],
};

// App Constants
export const APP_CONSTANTS = {
  APP_NAME: 'Innkt',
  APP_VERSION: '1.0.0',
  BUILD_NUMBER: '1',
  BUNDLE_ID: 'com.innkt.mobile',
  
  // Navigation
  NAVIGATION_TIMEOUT: 5000,
  BACK_BUTTON_TIMEOUT: 2000,
  
  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    THEME_MODE: 'theme_mode',
    LANGUAGE_CODE: 'language_code',
    SETTINGS: 'user_settings',
    CACHE_DATA: 'cache_data',
    OFFLINE_POSTS: 'offline_posts',
  },
  
  // Cache Keys
  CACHE_KEYS: {
    USER_PROFILE: 'user_profile',
    POSTS_FEED: 'posts_feed',
    USER_POSTS: 'user_posts',
    FRIENDS_LIST: 'friends_list',
    NOTIFICATIONS: 'notifications',
  },
};

// Feature Configuration
export const FEATURE_CONFIG = {
  // Authentication Features
  AUTH: {
    ENABLE_BIOMETRICS: true,
    ENABLE_FACE_ID: true,
    ENABLE_TOUCH_ID: true,
    ENABLE_GOOGLE_SIGNIN: true,
    ENABLE_FACEBOOK_SIGNIN: true,
    ENABLE_APPLE_SIGNIN: true,
    ENABLE_JOINT_ACCOUNTS: true,
    ENABLE_2FA: false,
  },
  
  // Social Features
  SOCIAL: {
    ENABLE_POSTS: true,
    ENABLE_COMMENTS: true,
    ENABLE_LIKES: true,
    ENABLE_SHARES: true,
    ENABLE_FRIENDS: true,
    ENABLE_FOLLOWING: true,
    ENABLE_MESSAGING: false,
    ENABLE_GROUPS: false,
  },
  
  // Media Features
  MEDIA: {
    ENABLE_IMAGE_UPLOADS: true,
    ENABLE_VIDEO_UPLOADS: false,
    ENABLE_CAMERA: true,
    ENABLE_GALLERY: true,
    ENABLE_IMAGE_EDITING: true,
    ENABLE_FILTERS: false,
  },
  
  // Notification Features
  NOTIFICATIONS: {
    ENABLE_PUSH: true,
    ENABLE_EMAIL: true,
    ENABLE_SMS: false,
    ENABLE_IN_APP: true,
    ENABLE_SOUND: true,
    ENABLE_VIBRATION: true,
  },
};

export default {
  ENV,
  API_ENDPOINTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION_RULES,
  APP_CONSTANTS,
  FEATURE_CONFIG,
};






