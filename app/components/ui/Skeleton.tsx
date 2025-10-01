import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { THEME } from '../../../constants/theme';
import { useTheme } from '../../../contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = THEME.borderRadius.sm,
  style,
}) => {
  const { theme } = useTheme();
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedValue.value,
      [0, 0.5, 1],
      [0.3, 0.7, 0.3]
    );
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export default Skeleton;

// Preset skeleton components for common use cases
export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 56 }) => (
  <Skeleton width={size} height={size} borderRadius={size / 2} />
);

export const SkeletonText: React.FC<{ lines?: number; width?: string }> = ({
  lines = 1,
  width = '100%',
}) => (
  <View>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        width={index === lines - 1 ? '60%' : width}
        height={16}
        style={{ marginBottom: THEME.spacing.xs }}
      />
    ))}
  </View>
);

export const SkeletonCard: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.cardBackground,
        borderRadius: THEME.borderRadius.lg,
        padding: THEME.spacing.md,
        ...THEME.shadows.small,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: THEME.spacing.md,
        }}
      >
        <SkeletonAvatar size={56} />
        <View style={{ marginLeft: THEME.spacing.md, flex: 1 }}>
          <Skeleton
            width="60%"
            height={18}
            style={{ marginBottom: THEME.spacing.xs }}
          />
          <Skeleton width="40%" height={14} />
        </View>
      </View>
      <SkeletonText lines={3} />
    </View>
  );
};

export const SkeletonProfileCard: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.cardBackground,
        borderRadius: THEME.borderRadius.lg,
        overflow: 'hidden',
        ...THEME.shadows.medium,
      }}
    >
      {/* Profile Image */}
      <Skeleton width="100%" height={300} borderRadius={0} />

      {/* Profile Info */}
      <View style={{ padding: THEME.spacing.md }}>
        <Skeleton
          width="70%"
          height={24}
          style={{ marginBottom: THEME.spacing.sm }}
        />
        <Skeleton
          width="50%"
          height={16}
          style={{ marginBottom: THEME.spacing.md }}
        />
        <SkeletonText lines={2} />
      </View>
    </View>
  );
};
