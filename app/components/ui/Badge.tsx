import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../../constants/theme';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
  fontScale,
} from '../../../utils/responsive';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'neutral';
export type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  children: string | number;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  style?: ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  dot = false,
  style,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const getBadgeStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
    };

    const sizeStyles: Record<BadgeSize, ViewStyle> = {
      small: {
        paddingHorizontal: dot ? 0 : spacing.xs,
        paddingVertical: dot ? 0 : spacing.xs / 2,
        minWidth: dot ? scale(8) : scale(20),
        minHeight: dot ? scale(8) : verticalScale(20),
      },
      medium: {
        paddingHorizontal: dot ? 0 : spacing.sm,
        paddingVertical: dot ? 0 : spacing.xs,
        minWidth: dot ? scale(10) : scale(24),
        minHeight: dot ? scale(10) : verticalScale(24),
      },
      large: {
        paddingHorizontal: dot ? 0 : spacing.md,
        paddingVertical: dot ? 0 : spacing.sm,
        minWidth: dot ? scale(12) : scale(28),
        minHeight: dot ? scale(12) : verticalScale(28),
      },
    };

    const variantStyles: Record<BadgeVariant, ViewStyle> = {
      primary: {
        backgroundColor: theme.primary,
      },
      secondary: {
        backgroundColor: theme.secondary,
      },
      success: {
        backgroundColor: theme.success,
      },
      error: {
        backgroundColor: theme.error,
      },
      warning: {
        backgroundColor: theme.warning,
      },
      info: {
        backgroundColor: theme.info,
      },
      neutral: {
        backgroundColor: theme.surfaceVariant,
        borderWidth: 1,
        borderColor: theme.border,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles: Record<BadgeSize, TextStyle> = {
      small: {
        fontSize: fontScale(10),
        lineHeight: fontScale(12),
      },
      medium: {
        fontSize: fontScale(12),
        lineHeight: fontScale(14),
      },
      large: {
        fontSize: fontScale(14),
        lineHeight: fontScale(16),
      },
    };

    const variantStyles: Record<BadgeVariant, TextStyle> = {
      primary: {
        color: theme.textOnPrimary,
      },
      secondary: {
        color: theme.textOnPrimary,
      },
      success: {
        color: theme.textOnPrimary,
      },
      error: {
        color: theme.textOnPrimary,
      },
      warning: {
        color: theme.textOnPrimary,
      },
      info: {
        color: theme.textOnPrimary,
      },
      neutral: {
        color: theme.text,
      },
    };

    return {
      ...sizeStyles[size],
      ...variantStyles[variant],
      fontWeight: '600',
      textAlign: 'center',
    };
  };

  if (dot) {
    return <View style={[getBadgeStyle(), style]} />;
  }

  return (
    <View style={[getBadgeStyle(), style]}>
      <Text style={getTextStyle()} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
};

export default Badge;
