import {
  scale,
  verticalScale,
  moderateScale,
  fontScale,
  spacing,
  borderRadius,
  iconSize,
} from '../utils/responsive';

export const lightTheme = {
  // Background colors
  background: '#fcf1fc',
  surface: '#FFFFFF',
  surfaceVariant: '#fcf1fc',

  // Primary colors
  primary: '#7C3AED',
  primaryVariant: '#F3F0FF',
  secondary: '#06B6D4',

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

  // Responsive spacing
  spacing,

  // Responsive border radius
  borderRadius,

  // Responsive icon sizes
  iconSize,

  // Responsive typography
  typography: {
    h1: {
      fontSize: fontScale(32),
      fontWeight: '700' as const,
      lineHeight: fontScale(40),
    },
    h2: {
      fontSize: fontScale(28),
      fontWeight: '600' as const,
      lineHeight: fontScale(36),
    },
    h3: {
      fontSize: fontScale(24),
      fontWeight: '600' as const,
      lineHeight: fontScale(32),
    },
    h4: {
      fontSize: fontScale(20),
      fontWeight: '500' as const,
      lineHeight: fontScale(28),
    },
    body: {
      fontSize: fontScale(16),
      fontWeight: '400' as const,
      lineHeight: fontScale(24),
    },
    caption: {
      fontSize: fontScale(14),
      fontWeight: '400' as const,
      lineHeight: fontScale(20),
    },
    small: {
      fontSize: fontScale(12),
      fontWeight: '400' as const,
      lineHeight: fontScale(16),
    },
  },

  // Layout
  layout: {
    containerPadding: spacing.md,
    screenPadding: spacing.lg,
    borderRadius: borderRadius.md,
    cardPadding: spacing.md,
    buttonHeight: verticalScale(48),
    inputHeight: verticalScale(48),
  },
};

export const darkTheme = {
  // Background colors
  background: '#2D2D2D',
  surface: '#1E1E1E',
  surfaceVariant: '#2D2D2D',

  // Primary colors
  primary: '#A855F7',
  primaryVariant: '#2D1B69',
  secondary: '#0891B2',

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

  // Responsive spacing
  spacing,

  // Responsive border radius
  borderRadius,

  // Responsive icon sizes
  iconSize,

  // Responsive typography
  typography: {
    h1: {
      fontSize: fontScale(32),
      fontWeight: '700' as const,
      lineHeight: fontScale(40),
    },
    h2: {
      fontSize: fontScale(28),
      fontWeight: '600' as const,
      lineHeight: fontScale(36),
    },
    h3: {
      fontSize: fontScale(24),
      fontWeight: '600' as const,
      lineHeight: fontScale(32),
    },
    h4: {
      fontSize: fontScale(20),
      fontWeight: '500' as const,
      lineHeight: fontScale(28),
    },
    body: {
      fontSize: fontScale(16),
      fontWeight: '400' as const,
      lineHeight: fontScale(24),
    },
    caption: {
      fontSize: fontScale(14),
      fontWeight: '400' as const,
      lineHeight: fontScale(20),
    },
    small: {
      fontSize: fontScale(12),
      fontWeight: '400' as const,
      lineHeight: fontScale(16),
    },
  },

  // Layout
  layout: {
    containerPadding: spacing.md,
    screenPadding: spacing.lg,
    borderRadius: borderRadius.md,
    cardPadding: spacing.md,
    buttonHeight: verticalScale(48),
    inputHeight: verticalScale(48),
  },
};

export type Theme = typeof lightTheme;

// Legacy THEME constant - kept for backward compatibility
// Components should migrate to using theme.spacing, theme.borderRadius, etc. from useTheme()
export const THEME = {
  colors: {
    ...lightTheme,
    white: '#FFFFFF',
    black: '#000000',
  },
  spacing: spacing,
  borderRadius: borderRadius,
  fonts: {
    small: fontScale(12),
    regular: fontScale(16),
    medium: fontScale(18),
    large: fontScale(24),
    xlarge: fontScale(32),
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
  },
} as const;
