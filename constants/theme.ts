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
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F7',
  surfaceElevated: '#FFFFFF',
  surfaceElevated2: '#FEFEFE',

  // Primary colors
  primary: '#7C3AED',
  primaryLight: '#A855F7',
  primaryDark: '#6D28D9',
  primaryVariant: '#F3F0FF',
  secondary: '#06B6D4',
  secondaryLight: '#22D3EE',

  // Gradients
  primaryGradient: ['#7C3AED', '#A855F7', '#C084FC'],
  accentGradient: ['#F97316', '#FB923C'],
  successGradient: ['#10B981', '#34D399'],

  // Text colors
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FFFFFF',

  // Border colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderFocus: '#7C3AED',

  // Status colors
  error: '#EF4444',
  errorBackground: '#FEE2E2',
  errorLight: '#FCA5A5',
  success: '#10B981',
  successBackground: '#D1FAE5',
  successLight: '#6EE7B7',

  // Theme mode
  isDark: false,
  warning: '#F59E0B',
  warningBackground: '#FEF3C7',
  warningLight: '#FCD34D',
  info: '#3B82F6',
  infoBackground: '#DBEAFE',

  // Shadow
  shadow: '#000000',
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowMedium: 'rgba(0, 0, 0, 0.1)',
  shadowHeavy: 'rgba(0, 0, 0, 0.15)',
  shadowColored: 'rgba(124, 58, 237, 0.25)',

  // Tab bar
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#7C3AED',
  tabBarInactive: '#9CA3AF',
  tabBarBorder: '#F3F4F6',

  // Header
  headerBackground: '#FFFFFF',
  headerBlur: 'rgba(255, 255, 255, 0.8)',

  // Card
  cardBackground: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.08)',
  cardBorder: '#F3F4F6',

  // Responsive spacing
  spacing,

  // Responsive border radius
  borderRadius,

  // Responsive icon sizes
  iconSize,

  // Responsive typography
  typography: {
    display: {
      fontSize: fontScale(40),
      fontWeight: '800' as const,
      lineHeight: fontScale(48),
      letterSpacing: -0.5,
    },
    h1: {
      fontSize: fontScale(32),
      fontWeight: '700' as const,
      lineHeight: fontScale(40),
      letterSpacing: -0.25,
    },
    h2: {
      fontSize: fontScale(28),
      fontWeight: '600' as const,
      lineHeight: fontScale(36),
      letterSpacing: -0.15,
    },
    h3: {
      fontSize: fontScale(24),
      fontWeight: '600' as const,
      lineHeight: fontScale(32),
      letterSpacing: 0,
    },
    h4: {
      fontSize: fontScale(20),
      fontWeight: '500' as const,
      lineHeight: fontScale(28),
      letterSpacing: 0,
    },
    body: {
      fontSize: fontScale(16),
      fontWeight: '400' as const,
      lineHeight: fontScale(25.6),
      letterSpacing: -0.15,
    },
    bodyMedium: {
      fontSize: fontScale(16),
      fontWeight: '500' as const,
      lineHeight: fontScale(25.6),
      letterSpacing: -0.15,
    },
    bodySemibold: {
      fontSize: fontScale(16),
      fontWeight: '600' as const,
      lineHeight: fontScale(25.6),
      letterSpacing: -0.15,
    },
    caption: {
      fontSize: fontScale(14),
      fontWeight: '400' as const,
      lineHeight: fontScale(21),
      letterSpacing: 0,
    },
    captionMedium: {
      fontSize: fontScale(14),
      fontWeight: '500' as const,
      lineHeight: fontScale(21),
      letterSpacing: 0,
    },
    small: {
      fontSize: fontScale(12),
      fontWeight: '400' as const,
      lineHeight: fontScale(18),
      letterSpacing: 0,
    },
    tiny: {
      fontSize: fontScale(10),
      fontWeight: '400' as const,
      lineHeight: fontScale(14),
      letterSpacing: 0.5,
    },
  },

  // Animation durations
  animation: {
    fast: 150,
    normal: 250,
    slow: 400,
    verySlow: 600,
  },

  // Elevation system
  elevation: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 8,
    },
    xlarge: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 12,
    },
  },

  // Layout
  layout: {
    containerPadding: spacing.lg,
    screenPadding: spacing.xl,
    borderRadius: borderRadius.xl,
    cardPadding: spacing.lg,
    buttonHeight: verticalScale(48),
    inputHeight: verticalScale(48),
    maxContentWidth: 420,
  },
};

export const darkTheme = {
  // Background colors
  background: '#0A0A0A',
  surface: '#1C1C1E',
  surfaceVariant: '#2C2C2E',
  surfaceElevated: '#2C2C2E',
  surfaceElevated2: '#3A3A3C',

  // Primary colors
  primary: '#A855F7',
  primaryLight: '#C084FC',
  primaryDark: '#9333EA',
  primaryVariant: '#2D1B69',
  secondary: '#06B6D4',
  secondaryLight: '#22D3EE',

  // Gradients
  primaryGradient: ['#A855F7', '#C084FC', '#DDD6FE'],
  accentGradient: ['#F97316', '#FB923C'],
  successGradient: ['#10B981', '#34D399'],

  // Text colors
  text: '#E5E5E5',
  textSecondary: '#A1A1A1',
  textTertiary: '#737373',

  // Theme mode
  isDark: true,
  textOnPrimary: '#000000',
  textOnDark: '#FFFFFF',

  // Border colors
  border: '#3A3A3C',
  borderLight: '#2C2C2E',
  borderFocus: '#A855F7',

  // Status colors
  error: '#F87171',
  errorBackground: '#4A1F28',
  errorLight: '#FCA5A5',
  success: '#34D399',
  successBackground: '#1E4D3C',
  successLight: '#6EE7B7',
  warning: '#FBBF24',
  warningBackground: '#4A3A1F',
  warningLight: '#FCD34D',
  info: '#60A5FA',
  infoBackground: '#1E3A5F',

  // Shadow
  shadow: '#000000',
  shadowLight: 'rgba(0, 0, 0, 0.2)',
  shadowMedium: 'rgba(0, 0, 0, 0.4)',
  shadowHeavy: 'rgba(0, 0, 0, 0.6)',
  shadowColored: 'rgba(168, 85, 247, 0.4)',

  // Tab bar
  tabBarBackground: '#1C1C1E',
  tabBarActive: '#A855F7',
  tabBarInactive: '#A1A1A1',
  tabBarBorder: '#2C2C2E',

  // Header
  headerBackground: '#1C1C1E',
  headerBlur: 'rgba(28, 28, 30, 0.8)',

  // Card
  cardBackground: '#1C1C1E',
  cardShadow: 'rgba(0, 0, 0, 0.5)',
  cardBorder: '#2C2C2E',

  // Responsive spacing
  spacing,

  // Responsive border radius
  borderRadius,

  // Responsive icon sizes
  iconSize,

  // Responsive typography
  typography: {
    display: {
      fontSize: fontScale(40),
      fontWeight: '800' as const,
      lineHeight: fontScale(48),
      letterSpacing: -0.5,
    },
    h1: {
      fontSize: fontScale(32),
      fontWeight: '700' as const,
      lineHeight: fontScale(40),
      letterSpacing: -0.25,
    },
    h2: {
      fontSize: fontScale(28),
      fontWeight: '600' as const,
      lineHeight: fontScale(36),
      letterSpacing: -0.15,
    },
    h3: {
      fontSize: fontScale(24),
      fontWeight: '600' as const,
      lineHeight: fontScale(32),
      letterSpacing: 0,
    },
    h4: {
      fontSize: fontScale(20),
      fontWeight: '500' as const,
      lineHeight: fontScale(28),
      letterSpacing: 0,
    },
    body: {
      fontSize: fontScale(16),
      fontWeight: '400' as const,
      lineHeight: fontScale(25.6),
      letterSpacing: -0.15,
    },
    bodyMedium: {
      fontSize: fontScale(16),
      fontWeight: '500' as const,
      lineHeight: fontScale(25.6),
      letterSpacing: -0.15,
    },
    bodySemibold: {
      fontSize: fontScale(16),
      fontWeight: '600' as const,
      lineHeight: fontScale(25.6),
      letterSpacing: -0.15,
    },
    caption: {
      fontSize: fontScale(14),
      fontWeight: '400' as const,
      lineHeight: fontScale(21),
      letterSpacing: 0,
    },
    captionMedium: {
      fontSize: fontScale(14),
      fontWeight: '500' as const,
      lineHeight: fontScale(21),
      letterSpacing: 0,
    },
    small: {
      fontSize: fontScale(12),
      fontWeight: '400' as const,
      lineHeight: fontScale(18),
      letterSpacing: 0,
    },
    tiny: {
      fontSize: fontScale(10),
      fontWeight: '400' as const,
      lineHeight: fontScale(14),
      letterSpacing: 0.5,
    },
  },

  // Animation durations
  animation: {
    fast: 150,
    normal: 250,
    slow: 400,
    verySlow: 600,
  },

  // Elevation system
  elevation: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
    xlarge: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
      elevation: 12,
    },
  },

  // Layout
  layout: {
    containerPadding: spacing.lg,
    screenPadding: spacing.xl,
    borderRadius: borderRadius.xl,
    cardPadding: spacing.lg,
    buttonHeight: verticalScale(48),
    inputHeight: verticalScale(48),
    maxContentWidth: 420,
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
