import React, {createContext, useContext, useEffect, useState} from 'react';
import {useColorScheme} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {MD3LightTheme, MD3DarkTheme} from 'react-native-paper';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: typeof MD3LightTheme;
  isDarkMode: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemeMode();
  }, []);

  useEffect(() => {
    updateTheme();
  }, [themeMode, systemColorScheme]);

  const loadThemeMode = async () => {
    try {
      const savedThemeMode = await AsyncStorage.getItem('theme_mode');
      if (savedThemeMode) {
        setThemeModeState(savedThemeMode as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme mode:', error);
    }
  };

  const updateTheme = () => {
    let shouldBeDark = false;

    switch (themeMode) {
      case 'light':
        shouldBeDark = false;
        break;
      case 'dark':
        shouldBeDark = true;
        break;
      case 'auto':
        shouldBeDark = systemColorScheme === 'dark';
        break;
    }

    setIsDarkMode(shouldBeDark);
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem('theme_mode', mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = themeMode === 'auto' ? 'light' : themeMode === 'light' ? 'dark' : 'auto';
    setThemeMode(newMode);
  };

  // Custom theme colors
  const customColors = {
    primary: '#667eea',
    secondary: '#764ba2',
    tertiary: '#f093fb',
    error: '#B3261E',
    neutral: '#6750A4',
    neutralVariant: '#625B71',
    background: isDarkMode ? '#121212' : '#ffffff',
    surface: isDarkMode ? '#1e1e1e' : '#ffffff',
    surfaceVariant: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    onBackground: isDarkMode ? '#ffffff' : '#000000',
    onSurface: isDarkMode ? '#ffffff' : '#000000',
    onSurfaceVariant: isDarkMode ? '#cccccc' : '#666666',
    outline: isDarkMode ? '#666666' : '#cccccc',
    outlineVariant: isDarkMode ? '#444444' : '#e0e0e0',
    shadow: isDarkMode ? '#000000' : '#000000',
    scrim: isDarkMode ? '#000000' : '#000000',
    inverseSurface: isDarkMode ? '#ffffff' : '#000000',
    inverseOnSurface: isDarkMode ? '#000000' : '#ffffff',
    inversePrimary: isDarkMode ? '#8b9eff' : '#4c5fea',
    elevation: {
      level0: 'transparent',
      level1: isDarkMode ? '#1e1e1e' : '#ffffff',
      level2: isDarkMode ? '#2d2d2d' : '#f5f5f5',
      level3: isDarkMode ? '#3d3d3d' : '#eeeeee',
      level4: isDarkMode ? '#4d4d4d' : '#e0e0e0',
      level5: isDarkMode ? '#5d5d5d' : '#d0d0d0',
    },
  };

  // Create custom theme based on Material Design 3
  const customTheme = {
    ...(isDarkMode ? MD3DarkTheme : MD3LightTheme),
    colors: {
      ...(isDarkMode ? MD3DarkTheme.colors : MD3LightTheme.colors),
      ...customColors,
    },
    // Custom component styles
    components: {
      Button: {
        style: {
          borderRadius: 8,
          elevation: 2,
        },
      },
      Card: {
        style: {
          borderRadius: 12,
          elevation: 4,
        },
      },
      TextInput: {
        style: {
          borderRadius: 8,
        },
      },
    },
  };

  const value: ThemeContextType = {
    theme: customTheme,
    isDarkMode,
    themeMode,
    setThemeMode,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};





