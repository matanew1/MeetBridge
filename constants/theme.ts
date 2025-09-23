export const lightTheme = {
  // Background colors
  background: '#fcf1fc',
  surface: '#FFFFFF',
  surfaceVariant: '#fcf1fc',

  // Primary colors
  primary: '#8E44AD',
  primaryVariant: '#EDE7F6',
  secondary: '#4CAF50',

  // Text colors
  text: '#000000',
  textSecondary: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Border colors
  border: '#E1E5E9',
  borderLight: '#F0F0F0',

  // Status colors
  error: '#F44336',
  errorBackground: '#FFEBEE',
  success: '#4CAF50',
  warning: '#FF9800',

  // Shadow
  shadow: '#000000',

  // Tab bar
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#8E44AD',
  tabBarInactive: '#9CA3AF',

  // Header
  headerBackground: '#fcf1fc',

  // Card
  cardBackground: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
};

export const darkTheme = {
  // Background colors
  background: '#2D2D2D',
  surface: '#1E1E1E',
  surfaceVariant: '#2D2D2D',

  // Primary colors
  primary: '#BB86FC',
  primaryVariant: '#3F3F3F',
  secondary: '#03DAC6',

  // Text colors
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textOnPrimary: '#000000',

  // Border colors
  border: '#404040',
  borderLight: '#303030',

  // Status colors
  error: '#CF6679',
  errorBackground: '#4A1F28',
  success: '#03DAC6',
  warning: '#FFB74D',

  // Shadow
  shadow: '#000000',

  // Tab bar
  tabBarBackground: '#1E1E1E',
  tabBarActive: '#BB86FC',
  tabBarInactive: '#B0B0B0',

  // Header
  headerBackground: '#2D2D2D',

  // Card
  cardBackground: '#1E1E1E',
  cardShadow: 'rgba(0, 0, 0, 0.3)',
};

export type Theme = typeof lightTheme;
