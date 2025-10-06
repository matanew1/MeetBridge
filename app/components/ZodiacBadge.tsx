import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getZodiacEmoji } from '../../utils/dateUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';

interface ZodiacBadgeProps {
  zodiacSign?: string | null;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const ZodiacBadge: React.FC<ZodiacBadgeProps> = ({
  zodiacSign,
  size = 'medium',
  showLabel = true,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  if (!zodiacSign) return null;

  const sizeStyles = {
    small: {
      container: styles.smallContainer,
      emoji: styles.smallEmoji,
      label: styles.smallLabel,
    },
    medium: {
      container: styles.mediumContainer,
      emoji: styles.mediumEmoji,
      label: styles.mediumLabel,
    },
    large: {
      container: styles.largeContainer,
      emoji: styles.largeEmoji,
      label: styles.largeLabel,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        currentSize.container,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.emoji, currentSize.emoji]}>
        {getZodiacEmoji(zodiacSign)}
      </Text>
      {showLabel && (
        <Text style={[styles.label, currentSize.label, { color: theme.text }]}>
          {zodiacSign}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  emoji: {
    lineHeight: 20,
  },
  label: {
    fontWeight: '600',
  },
  // Small size
  smallContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  smallEmoji: {
    fontSize: 14,
  },
  smallLabel: {
    fontSize: 11,
  },
  // Medium size
  mediumContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  mediumEmoji: {
    fontSize: 16,
  },
  mediumLabel: {
    fontSize: 13,
  },
  // Large size
  largeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  largeEmoji: {
    fontSize: 20,
  },
  largeLabel: {
    fontSize: 15,
  },
});

export default ZodiacBadge;
