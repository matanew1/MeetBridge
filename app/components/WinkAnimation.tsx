// app/components/WinkAnimation.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Eye, Heart } from 'lucide-react-native';
import { moderateScale } from '../../utils/responsive';

interface WinkAnimationProps {
  visible: boolean;
  onComplete: () => void;
  theme: any;
}

export default function WinkAnimation({
  visible,
  onComplete,
  theme,
}: WinkAnimationProps) {
  // Main eye animation values
  const eyeScaleY = useSharedValue(1);
  const eyeGlow = useSharedValue(0);

  // Background effects
  const backgroundOpacity = useSharedValue(0);

  // Simple floating hearts - reduced to 3
  const hearts = Array.from({ length: 3 }, () => ({
    scale: useSharedValue(0),
    translateY: useSharedValue(0),
    translateX: useSharedValue(0),
    opacity: useSharedValue(0),
  }));

  useEffect(() => {
    if (visible) {
      // Reset all values
      eyeScaleY.value = 1;
      eyeGlow.value = 0;
      backgroundOpacity.value = 0;

      // Reset hearts
      hearts.forEach((heart) => {
        heart.scale.value = 0;
        heart.translateY.value = 0;
        heart.translateX.value = 0;
        heart.opacity.value = 0;
      });

      // Simple background fade in
      backgroundOpacity.value = withTiming(0.3, { duration: 200 });

      // Simple eye wink
      eyeScaleY.value = withSequence(
        // Quick close
        withTiming(0.1, { duration: 100 }),
        // Stay closed briefly
        withTiming(0.1, { duration: 200 }),
        // Open back up
        withTiming(1, { duration: 200 })
      );

      // Simple glow effect
      eyeGlow.value = withSequence(
        withTiming(0, { duration: 100 }),
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 300 })
      );

      // Simple floating hearts
      const heartConfigs = [
        { x: -60, y: -100, delay: 200 },
        { x: 60, y: -120, delay: 300 },
        { x: 0, y: -140, delay: 400 },
      ];

      hearts.forEach((heart, index) => {
        const config = heartConfigs[index];
        heart.scale.value = withSequence(
          withDelay(
            config.delay,
            withSpring(1, { damping: 12, stiffness: 200 })
          ),
          withDelay(800, withTiming(0, { duration: 300 }))
        );
        heart.translateY.value = withSequence(
          withDelay(config.delay, withTiming(config.y, { duration: 1000 })),
          withDelay(800, withTiming(config.y - 30, { duration: 300 }))
        );
        heart.translateX.value = withSequence(
          withDelay(config.delay, withTiming(config.x, { duration: 1000 })),
          withDelay(800, withTiming(config.x + 10, { duration: 300 }))
        );
        heart.opacity.value = withSequence(
          withDelay(config.delay, withTiming(1, { duration: 200 })),
          withDelay(800, withTiming(0, { duration: 300 }))
        );
      });

      // Complete animation after shorter duration
      setTimeout(() => {
        runOnJS(onComplete)();
      }, 1200);
    }
  }, [visible, onComplete]);

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const eyeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: eyeScaleY.value }] as const,
    shadowOpacity: eyeGlow.value * 0.3,
    shadowRadius: eyeGlow.value * 5,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
  }));

  const heartAnimatedStyles = hearts.map((heart) =>
    useAnimatedStyle(() => ({
      transform: [
        { scale: heart.scale.value },
        { translateY: heart.translateY.value },
        { translateX: heart.translateX.value },
      ] as const,
      opacity: heart.opacity.value,
    }))
  );

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* Animated background */}
      <Animated.View style={[styles.background, backgroundAnimatedStyle]} />

      {/* Main content */}
      <View style={styles.content}>
        {/* Floating hearts */}
        {hearts.map((_, index) => (
          <Animated.View
            key={`heart-${index}`}
            style={[styles.floatingHeart, heartAnimatedStyles[index]]}
          >
            <Heart size={moderateScale(24)} color="#FF69B4" fill="#FF69B4" />
          </Animated.View>
        ))}

        {/* Eye */}
        <Animated.View style={eyeAnimatedStyle}>
          <Eye size={moderateScale(100)} color={theme.primary} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 105, 180, 0.1)',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingHeart: {
    position: 'absolute',
  },
});
