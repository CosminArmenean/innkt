import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, type: 'wifi' })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

// Mock react-native-linear-gradient
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

// Global test utilities
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Mock navigation
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  reset: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  dispatch: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => true),
  getParent: jest.fn(),
  getState: jest.fn(),
  setParams: jest.fn(),
  getParam: jest.fn(),
};

export const mockRoute = {
  params: {},
  key: 'test-key',
  name: 'TestScreen',
};

// Mock theme context
export const mockTheme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    error: '#FF3B30',
    text: '#000000',
    onSurface: '#000000',
    onSurfaceVariant: '#6D6D70',
    tertiary: '#FF9500',
    outline: '#C7C7CC',
  },
  dark: false,
  roundness: 8,
};

// Mock language context
export const mockLanguage = {
  t: (key: string) => key,
  currentLanguage: 'en',
  changeLanguage: jest.fn(),
  isRTL: false,
};

// Mock auth context
export const mockAuth = {
  user: null,
  isAuthenticated: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  updateUserProfile: jest.fn(),
  updateConsent: jest.fn(),
};

// Mock notification context
export const mockNotifications = {
  notifications: [],
  unreadCount: 0,
  isConnected: true,
  isLoading: false,
  preferences: {},
  markAsRead: jest.fn(),
  refreshNotifications: jest.fn(),
  updatePreferences: jest.fn(),
};

// Helper function to create test wrapper
export const createTestWrapper = (component: React.ReactElement) => {
  // This would typically wrap the component with necessary providers
  // For now, return the component as-is
  return component;
};
