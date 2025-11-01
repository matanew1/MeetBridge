import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
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

export type CardVariant = 'elevated' | 'outlined' | 'flat';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof THEME.spacing;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  onPress,
  style,
  padding = 'md',
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.lg,
      backgroundColor: theme.cardBackground,
      padding: spacing[padding],
    };

    const variantStyles: Record<CardVariant, ViewStyle> = {
      elevated: {
        ...THEME.shadows.medium,
      },
      outlined: {
        borderWidth: 1,
        borderColor: theme.border,
      },
      flat: {
        backgroundColor: theme.surfaceVariant,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
    };
  };

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[getCardStyle(), style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {children}
    </Wrapper>
  );
};

export default Card;
