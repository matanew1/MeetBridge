// utils/responsive.ts
import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11/X)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Responsive breakpoints
export const BREAKPOINTS = {
  xs: 320,
  sm: 375,
  md: 414,
  lg: 768,
  xl: 1024,
} as const;

// Device type detection
export const isSmallDevice = SCREEN_WIDTH < BREAKPOINTS.sm;
export const isMediumDevice =
  SCREEN_WIDTH >= BREAKPOINTS.sm && SCREEN_WIDTH < BREAKPOINTS.md;
export const isLargeDevice = SCREEN_WIDTH >= BREAKPOINTS.md;
export const isTablet = SCREEN_WIDTH >= BREAKPOINTS.lg;
export const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;

// Scaling functions
export const scale = (size: number): number => {
  const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(PixelRatio.roundToNearestPixel(size * scaleFactor));
};

export const verticalScale = (size: number): number => {
  const scaleFactor = SCREEN_HEIGHT / BASE_HEIGHT;
  return Math.round(PixelRatio.roundToNearestPixel(size * scaleFactor));
};

export const moderateScale = (size: number, factor: number = 0.5): number => {
  const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size + (scaleFactor - 1) * (size * factor);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Font scaling
export const fontScale = (size: number): number => {
  const scaleFactor = Math.min(
    SCREEN_WIDTH / BASE_WIDTH,
    SCREEN_HEIGHT / BASE_HEIGHT
  );
  return Math.round(PixelRatio.roundToNearestPixel(size * scaleFactor));
};

// Spacing utilities
export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(48),
} as const;

// Border radius utilities
export const borderRadius = {
  sm: scale(4),
  md: scale(8),
  lg: scale(12),
  xl: scale(16),
  xxl: scale(24),
  full: 9999,
} as const;

// Icon size utilities
export const iconSize = {
  xs: scale(12),
  sm: scale(16),
  md: scale(20),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(48),
} as const;

// Responsive container utilities
export const getResponsiveWidth = (percentage: number): number => {
  return (SCREEN_WIDTH * percentage) / 100;
};

export const getResponsiveHeight = (percentage: number): number => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

// Safe area utilities
export const getSafeAreaInsets = () => {
  // This would typically use react-native-safe-area-context
  // For now, return basic insets
  return {
    top: Platform.OS === 'ios' ? (isLargeDevice ? 44 : 20) : 0,
    bottom: Platform.OS === 'ios' ? (isLargeDevice ? 34 : 0) : 0,
    left: 0,
    right: 0,
  };
};

// Grid utilities
export const getNumColumns = (minItemWidth: number = 120): number => {
  const availableWidth = SCREEN_WIDTH - spacing.lg * 2; // Account for padding
  return Math.floor(availableWidth / minItemWidth);
};

// Orientation utilities
export const useOrientation = () => {
  return {
    isPortrait: SCREEN_HEIGHT > SCREEN_WIDTH,
    isLandscape: SCREEN_WIDTH > SCREEN_HEIGHT,
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
  };
};

// Device info
export const deviceInfo = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
  isLandscape,
  pixelRatio: PixelRatio.get(),
  platform: Platform.OS,
} as const;
