import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
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

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'gradient'
  | 'outline';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  hapticFeedback?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  hapticFeedback = true,
  ...props
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      overflow: 'hidden',
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      small: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        minHeight: verticalScale(40),
      },
      medium: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        minHeight: verticalScale(48),
      },
      large: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xxl,
        minHeight: verticalScale(56),
      },
    };

    // Variant styles
    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: theme.primary,
        ...theme.elevation.medium,
      },
      secondary: {
        backgroundColor: theme.secondary,
        ...theme.elevation.small,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      danger: {
        backgroundColor: theme.error,
        ...theme.elevation.medium,
      },
      gradient: {
        backgroundColor: 'transparent',
        ...theme.elevation.medium,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.primary,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth && { width: '100%' }),
      ...(disabled && { opacity: 0.5 }),
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles: Record<ButtonSize, TextStyle> = {
      small: theme.typography.caption,
      medium: theme.typography.bodyMedium,
      large: theme.typography.bodySemibold,
    };

    const variantStyles: Record<ButtonVariant, TextStyle> = {
      primary: {
        color: theme.textOnPrimary,
      },
      secondary: {
        color: theme.textOnPrimary,
      },
      ghost: {
        color: theme.text,
      },
      danger: {
        color: theme.textOnPrimary,
      },
      gradient: {
        color: theme.textOnPrimary,
      },
      outline: {
        color: theme.primary,
      },
    };

    return {
      ...sizeStyles[size],
      ...variantStyles[variant],
      fontWeight: '600',
    };
  };

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'ghost' || variant === 'outline'
              ? theme.primary
              : theme.textOnPrimary
          }
        />
      ) : (
        <>
          {icon}
          <Text style={getTextStyle()}>{children}</Text>
        </>
      )}
    </>
  );

  if (variant === 'gradient') {
    return (
      <AnimatedTouchable
        style={[animatedStyle, getButtonStyle(), style]}
        disabled={disabled || loading}
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
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
            borderRadius: borderRadius.lg,
          }}
        />
        {renderContent()}
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      style={[animatedStyle, getButtonStyle(), style]}
      disabled={disabled || loading}
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      {renderContent()}
    </AnimatedTouchable>
  );
};

export default Button;
