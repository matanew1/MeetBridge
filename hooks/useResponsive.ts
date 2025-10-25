// hooks/useResponsive.ts
import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import { deviceInfo, BREAKPOINTS, useOrientation } from '../utils/responsive';

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const orientation = useOrientation();

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const isSmallScreen = dimensions.width < BREAKPOINTS.sm;
  const isMediumScreen =
    dimensions.width >= BREAKPOINTS.sm && dimensions.width < BREAKPOINTS.md;
  const isLargeScreen = dimensions.width >= BREAKPOINTS.md;
  const isTablet = dimensions.width >= BREAKPOINTS.lg;

  return {
    // Current dimensions
    width: dimensions.width,
    height: dimensions.height,

    // Device type
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isTablet,

    // Orientation
    isPortrait: orientation.isPortrait,
    isLandscape: orientation.isLandscape,

    // Device info
    ...deviceInfo,
  };
};
