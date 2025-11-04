import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { THEME } from '../../../constants/theme';
import { useTheme } from '../../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../../constants/theme';
import {
  spacing,
  borderRadius,
  moderateScale,
} from '../../../utils/responsive';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  illustration,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Floating animation
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.container}>
      {(icon || illustration) && (
        <Animated.View style={[styles.iconContainer, animatedStyle]}>
          {illustration || icon}
        </Animated.View>
      )}

      <Text
        style={[styles.title, { color: theme.text, ...theme.typography.h2 }]}
      >
        {title}
      </Text>

      {message && (
        <Text
          style={[
            styles.message,
            { color: theme.textSecondary, ...theme.typography.body },
          ]}
        >
          {message}
        </Text>
      )}

      {actionLabel && onAction && (
        <Button
          variant="gradient"
          size="large"
          onPress={onAction}
          style={{ marginTop: spacing['2xl'] }}
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
    paddingHorizontal: spacing['2xl'],
  },
  iconContainer: {
    marginBottom: spacing.xl,
    opacity: 0.8,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    textAlign: 'center',
    maxWidth: 320,
  },
});

export default EmptyState;
