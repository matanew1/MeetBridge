import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../../../constants/theme';
import { useTheme } from '../../../contexts/ThemeContext';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}

      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

      {message && (
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {message}
        </Text>
      )}

      {actionLabel && onAction && (
        <Button
          variant="primary"
          size="medium"
          onPress={onAction}
          style={{ marginTop: THEME.spacing.lg }}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.xl,
  },
  iconContainer: {
    marginBottom: THEME.spacing.lg,
    opacity: 0.6,
  },
  title: {
    fontSize: THEME.fonts.large,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  message: {
    fontSize: THEME.fonts.regular,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
});

export default EmptyState;
