import {MD3LightTheme, MD3DarkTheme} from 'react-native-paper';

export type ThemeMode = 'light' | 'dark' | 'auto';

export const getTheme = (themeMode: ThemeMode) => {
  const isDark = themeMode === 'dark' || (themeMode === 'auto' && false); // TODO: Add system theme detection

  if (isDark) {
    return {
      ...MD3DarkTheme,
      colors: {
        ...MD3DarkTheme.colors,
        primary: '#667eea',
        secondary: '#764ba2',
        background: '#121212',
        surface: '#1e1e1e',
        text: '#ffffff',
        onSurface: '#ffffff',
        error: '#cf6679',
        warning: '#ffb74d',
        success: '#81c784',
        info: '#64b5f6',
      },
    };
  }

  return {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: '#667eea',
      secondary: '#764ba2',
      background: '#ffffff',
      surface: '#ffffff',
      text: '#000000',
      onSurface: '#000000',
      error: '#b00020',
      warning: '#f57c00',
      success: '#388e3c',
      info: '#1976d2',
    },
  };
};






