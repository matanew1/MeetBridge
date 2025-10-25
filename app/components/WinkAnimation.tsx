// app/components/WinkAnimation.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Eye } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

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
  const eyeScale = useSharedValue(1);
  const eyeOpacity = useSharedValue(1);
  const sparkleScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset values
      eyeScale.value = 1;
      eyeOpacity.value = 1;
      sparkleScale.value = 0;

      // Wink animation sequence
      eyeScale.value = withSequence(
        // Quick close
        withTiming(0.1, { duration: 100 }),
        // Stay closed briefly
        withTiming(0.1, { duration: 200 }),
        // Open back up
        withTiming(1, { duration: 150 }),
        // Add sparkle effect
        withDelay(200, withTiming(1.2, { duration: 300 }))
      );

      // Fade out sparkle
      sparkleScale.value = withDelay(500, withTiming(0, { duration: 300 }));

      // Complete animation after delay
      setTimeout(() => {
        runOnJS(onComplete)();
      }, 1000);
    }
  }, [visible, onComplete]);

  const eyeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: eyeScale.value }],
    opacity: eyeOpacity.value,
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkleScale.value }],
    opacity: sparkleScale.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <View style={styles.eyeContainer}>
          <Animated.View style={eyeAnimatedStyle}>
            <Eye size={80} color={theme.primary} />
          </Animated.View>
          <Animated.Text style={[styles.sparkle, sparkleAnimatedStyle]}>
            ✨
          </Animated.Text>
        </View>
        <Animated.Text style={[styles.message, { color: theme.text }]}>
          Wink sent! 💕
        </Animated.Text>
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
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    top: -20,
    right: -20,
    fontSize: 24,
  },
  message: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
