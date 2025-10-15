import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('innkt-theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('innkt-theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update CSS custom properties based on theme
    const root = document.documentElement;
    
    if (theme === 'dark') {
      // Imperial Night Majesty (Dark Theme) - DISTINCT HIERARCHY
      // Level 1: Deepest Background
      root.style.setProperty('--background-color', '#1C1124'); // Dark Purple Void
      
      // Level 2: Navigation & Sidebars
      root.style.setProperty('--surface-color', '#2D1B3D'); // Dark Purple - Navigation, sidebars
      
      // Level 3: Content Areas
      root.style.setProperty('--content-bg', '#1F1A2E'); // Slightly lighter - Main content areas
      
      // Level 4: Cards & Elevated Elements
      root.style.setProperty('--card-bg', '#2A1F3D'); // Distinct purple - Post cards, dropdowns
      root.style.setProperty('--surface-hover', '#3A2A4A'); // Hover states
      
      // Level 5: Interactive Elements
      root.style.setProperty('--hover-bg', '#4A3A5A'); // Dark Purple Hover
      root.style.setProperty('--input-bg', '#1F1A2E'); // Same as content - Form inputs, search
      
      // Level 6: Borders & Accents
      root.style.setProperty('--border-color', '#4A5568'); // Dark border
      root.style.setProperty('--border-hover', '#6B7280'); // Lighter border on hover
      root.style.setProperty('--accent-color', '#C0C0C0'); // Silver
      
      // Text Colors
      root.style.setProperty('--text-color', '#E6D8F5'); // Pale Lilac
      root.style.setProperty('--text-secondary', '#B19CD9'); // Light Wisteria
      root.style.setProperty('--text-muted', '#9CA3AF'); // Muted text
      
      // Brand Colors
      root.style.setProperty('--primary-color', '#4B0082'); // Imperial Purple
      root.style.setProperty('--secondary-color', '#B19CD9'); // Light Wisteria
    } else {
      // Imperial Dawn (Light Theme)
      root.style.setProperty('--background-color', '#F8F6FF'); // Very Light Lavender
      root.style.setProperty('--text-color', '#2D1B3D'); // Deep Purple
      root.style.setProperty('--primary-color', '#4B0082'); // Imperial Purple
      root.style.setProperty('--secondary-color', '#6B46C1'); // Medium Purple
      root.style.setProperty('--accent-color', '#8B5CF6'); // Light Purple
      root.style.setProperty('--content-bg', '#FFFFFF'); // White Content
      root.style.setProperty('--card-bg', '#FFFFFF'); // White Cards
      root.style.setProperty('--border-color', '#E5E7EB'); // Light Gray Borders
      root.style.setProperty('--input-bg', '#FFFFFF'); // White Inputs
      root.style.setProperty('--hover-bg', '#F3F4F6'); // Light Gray Hover
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
