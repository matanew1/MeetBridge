import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { THEME } from '../../../constants/theme';
import { useTheme } from '../../../contexts/ThemeContext';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: THEME.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: THEME.spacing.sm,
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      small: {
        paddingVertical: THEME.spacing.xs,
        paddingHorizontal: THEME.spacing.md,
        minHeight: 36,
      },
      medium: {
        paddingVertical: THEME.spacing.sm,
        paddingHorizontal: THEME.spacing.lg,
        minHeight: 44,
      },
      large: {
        paddingVertical: THEME.spacing.md,
        paddingHorizontal: THEME.spacing.xl,
        minHeight: 52,
      },
    };

    // Variant styles
    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: theme.primary,
        ...THEME.shadows.medium,
      },
      secondary: {
        backgroundColor: theme.secondary,
        ...THEME.shadows.small,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.border,
      },
      danger: {
        backgroundColor: theme.error,
        ...THEME.shadows.medium,
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
      small: {
        fontSize: THEME.fonts.small,
      },
      medium: {
        fontSize: THEME.fonts.regular,
      },
      large: {
        fontSize: THEME.fonts.medium,
      },
    };

    const variantStyles: Record<ButtonVariant, TextStyle> = {
      primary: {
        color: theme.textOnPrimary,
        fontWeight: '600',
      },
      secondary: {
        color: theme.textOnPrimary,
        fontWeight: '600',
      },
      ghost: {
        color: theme.text,
        fontWeight: '500',
      },
      danger: {
        color: THEME.colors.white,
        fontWeight: '600',
      },
    };

    return {
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' ? theme.primary : theme.textOnPrimary}
        />
      ) : (
        <>
          {icon}
          <Text style={getTextStyle()}>{children}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
