import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../../../constants/theme';
import { useTheme } from '../../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../../constants/theme';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
} from '../../../utils/responsive';

export type CardVariant = 'elevated' | 'outlined' | 'flat' | 'gradient';
export type CardElevation = 'none' | 'small' | 'medium' | 'large' | 'xlarge';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  elevation?: CardElevation;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof spacing;
  gradientBorder?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  elevation = 'medium',
  onPress,
  style,
  padding = 'md',
  gradientBorder = false,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.xl,
      backgroundColor: theme.cardBackground,
      padding: spacing[padding],
      overflow: 'hidden',
    };

    const variantStyles: Record<CardVariant, ViewStyle> = {
      elevated: {
        ...theme.elevation[elevation],
      },
      outlined: {
        borderWidth: 1,
        borderColor: theme.border,
      },
      flat: {
        backgroundColor: theme.surfaceVariant,
      },
      gradient: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
    };
  };

  const renderContent = () => {
    if (variant === 'gradient') {
      return (
        <>
          <LinearGradient
            colors={theme.primaryGradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              opacity: 0.1,
            }}
          />
          {children}
        </>
      );
    }

    if (gradientBorder) {
      return (
        <>
          <LinearGradient
            colors={theme.primaryGradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              borderRadius: borderRadius.xl,
            }}
          />
          <View
            style={{
              backgroundColor: theme.cardBackground,
              borderRadius: borderRadius.xl - 1,
              padding: spacing[padding],
              flex: 1,
            }}
          >
            {children}
          </View>
        </>
      );
    }

    return children;
  };

  const Wrapper = onPress ? AnimatedTouchable : AnimatedView;

  return (
    <Wrapper
      style={[animatedStyle, getCardStyle(), style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={onPress ? 0.95 : 1}
    >
      {renderContent()}
    </Wrapper>
  );
};

export default Card;
