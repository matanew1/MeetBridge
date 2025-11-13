import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { isRTL } from '../i18n';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  colorScheme: ColorSchemeName;
  currentLanguage: string;
  isRTL: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  // Load saved theme preference on app start
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('darkMode');
        if (savedTheme !== null) {
          setIsDarkMode(JSON.parse(savedTheme));
        } else {
          // If no saved preference, use system preference
          const systemColorScheme = Appearance.getColorScheme();
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
        // Fallback to system preference
        const systemColorScheme = Appearance.getColorScheme();
        setIsDarkMode(systemColorScheme === 'dark');
      }
    };

    loadThemePreference();
  }, []);

  // Listen to system color scheme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  // Listen to i18n language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    // Set initial language
    setCurrentLanguage(i18n.language || 'en');

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  const toggleDarkMode = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    // Save preference to AsyncStorage
    try {
      await AsyncStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }

    // Also save to Firebase if user is logged in
    try {
      // We can't directly access user here, but we can emit an event or use a callback
      // For now, we'll handle Firebase saving in the settings component
    } catch (error) {
      console.error('Error saving theme to Firebase:', error);
    }
  };

  const value: ThemeContextType = {
    isDarkMode,
    toggleDarkMode,
    colorScheme,
    currentLanguage,
    isRTL: isRTL(),
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
