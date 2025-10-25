// app/components/WinkAnimation.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  withRepeat,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Eye, Heart, Sparkles } from 'lucide-react-native';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
  deviceInfo,
} from '../../utils/responsive';

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
  // Main eye animation values
  const eyeScaleY = useSharedValue(1);
  const eyeRotation = useSharedValue(0);
  const eyeGlow = useSharedValue(0);
  const eyeBounce = useSharedValue(0);

  // Background effects
  const backgroundOpacity = useSharedValue(0);
  const backgroundScale = useSharedValue(0.8);
  const backgroundPulse = useSharedValue(1);

  // Floating hearts - increased to 5
  const hearts = Array.from({ length: 5 }, () => ({
    scale: useSharedValue(0),
    translateY: useSharedValue(0),
    translateX: useSharedValue(0),
    opacity: useSharedValue(0),
    rotation: useSharedValue(0),
  }));

  // Sparkle effects - increased to 4
  const sparkles = Array.from({ length: 4 }, () => ({
    scale: useSharedValue(0),
    rotation: useSharedValue(0),
    opacity: useSharedValue(0),
  }));

  // Rainbow particles
  const rainbowParticles = Array.from({ length: 8 }, () => ({
    scale: useSharedValue(0),
    translateY: useSharedValue(0),
    translateX: useSharedValue(0),
    opacity: useSharedValue(0),
  }));

  // Text animation
  const textScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textGlow = useSharedValue(0);

  // Emoji burst
  const emojiScale = useSharedValue(0);
  const emojiOpacity = useSharedValue(0);
  const emojiRotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset all values
      eyeScaleY.value = 1;
      eyeRotation.value = 0;
      eyeGlow.value = 0;
      backgroundOpacity.value = 0;
      backgroundScale.value = 0.8;

      // Reset text and emoji
      textScale.value = 0;
      textOpacity.value = 0;
      textGlow.value = 0;
      emojiScale.value = 0;
      emojiOpacity.value = 0;
      emojiRotation.value = 0;

      // Background fade in with scale
      backgroundOpacity.value = withTiming(0.7, { duration: 300 });
      backgroundScale.value = withSpring(1, { damping: 15, stiffness: 200 });

      // Eye wink sequence with enhanced effects
      eyeScaleY.value = withSequence(
        // Quick dramatic close
        withTiming(0.05, {
          duration: 80,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        }),
        // Stay closed
        withTiming(0.05, { duration: 150 }),
        // Slow open with bounce
        withSpring(1.1, { damping: 8, stiffness: 300 }),
        // Settle back
        withSpring(1, { damping: 12, stiffness: 200 })
      );

      // Eye rotation for playful effect
      eyeRotation.value = withSequence(
        withTiming(0, { duration: 80 }),
        withTiming(0, { duration: 150 }),
        withTiming(5, { duration: 200 }),
        withTiming(0, { duration: 150 })
      );

      // Eye glow effect
      eyeGlow.value = withSequence(
        withTiming(0, { duration: 80 }),
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 350 })
      );

      // Enhanced sparkles with continuous rotation
      sparkles.forEach((sparkle, index) => {
        const delay = 200 + index * 150;
        sparkle.scale.value = withSequence(
          withDelay(
            delay,
            withSpring(1.5 + index * 0.2, { damping: 6, stiffness: 300 })
          ),
          withDelay(1200, withTiming(0, { duration: 500 }))
        );
        sparkle.rotation.value = withRepeat(
          withTiming(360, {
            duration: 1500 + index * 200,
            easing: Easing.linear,
          }),
          -1,
          false
        );
        sparkle.opacity.value = withSequence(
          withDelay(delay, withTiming(1, { duration: 200 })),
          withDelay(1200, withTiming(0, { duration: 500 }))
        );
      });

      // Floating hearts with varied paths
      const heartConfigs = [
        { x: -80, y: -120, delay: 300, size: 1.0, color: '#FF69B4' },
        { x: 90, y: -140, delay: 400, size: 0.8, color: '#FF1493' },
        { x: -60, y: -160, delay: 500, size: 0.9, color: '#DC143C' },
        { x: 70, y: -110, delay: 600, size: 0.7, color: '#FF6347' },
        { x: 0, y: -180, delay: 700, size: 1.1, color: '#FF00FF' },
      ];

      hearts.forEach((heart, index) => {
        const config = heartConfigs[index];
        heart.scale.value = withSequence(
          withDelay(
            config.delay,
            withSpring(config.size, { damping: 10, stiffness: 200 })
          ),
          withDelay(1500, withTiming(0, { duration: 400 }))
        );
        heart.translateY.value = withSequence(
          withDelay(
            config.delay,
            withTiming(config.y, {
              duration: 1800,
              easing: Easing.out(Easing.quad),
            })
          ),
          withDelay(1500, withTiming(config.y - 50, { duration: 400 }))
        );
        heart.translateX.value = withSequence(
          withDelay(
            config.delay,
            withTiming(config.x, {
              duration: 1800,
              easing: Easing.out(Easing.quad),
            })
          ),
          withDelay(1500, withTiming(config.x + 20, { duration: 400 }))
        );
        heart.opacity.value = withSequence(
          withDelay(config.delay, withTiming(1, { duration: 300 })),
          withDelay(1500, withTiming(0, { duration: 400 }))
        );
        heart.rotation.value = withSequence(
          withDelay(
            config.delay,
            withTiming(15 * (index % 2 === 0 ? 1 : -1), { duration: 800 })
          ),
          withDelay(
            1500,
            withTiming(45 * (index % 2 === 0 ? 1 : -1), { duration: 400 })
          )
        );
      });

      // Rainbow particles explosion
      rainbowParticles.forEach((particle, index) => {
        const angle = (index / rainbowParticles.length) * 2 * Math.PI;
        const radius = 150;
        const delay = 800 + index * 50;

        particle.scale.value = withSequence(
          withDelay(
            delay,
            withSpring(0.8 + Math.random() * 0.4, {
              damping: 8,
              stiffness: 250,
            })
          ),
          withDelay(1200, withTiming(0, { duration: 600 }))
        );
        particle.translateY.value = withSequence(
          withDelay(
            delay,
            withTiming(-Math.cos(angle) * radius, {
              duration: 1400,
              easing: Easing.out(Easing.quad),
            })
          ),
          withDelay(
            1200,
            withTiming(-Math.cos(angle) * (radius + 50), { duration: 600 })
          )
        );
        particle.translateX.value = withSequence(
          withDelay(
            delay,
            withTiming(Math.sin(angle) * radius, {
              duration: 1400,
              easing: Easing.out(Easing.quad),
            })
          ),
          withDelay(
            1200,
            withTiming(Math.sin(angle) * (radius + 50), { duration: 600 })
          )
        );
        particle.opacity.value = withSequence(
          withDelay(delay, withTiming(1, { duration: 200 })),
          withDelay(1200, withTiming(0, { duration: 600 }))
        );
      });

      // Enhanced text animation
      textScale.value = withSequence(
        withDelay(1200, withSpring(1.3, { damping: 8, stiffness: 250 })),
        withSpring(1, { damping: 12, stiffness: 200 }),
        withDelay(300, withSpring(1.1, { damping: 10, stiffness: 300 })),
        withSpring(1, { damping: 15, stiffness: 250 })
      );
      textOpacity.value = withSequence(
        withDelay(1200, withTiming(1, { duration: 300 })),
        withDelay(1400, withTiming(0, { duration: 500 }))
      );
      textGlow.value = withSequence(
        withDelay(1200, withTiming(1, { duration: 300 })),
        withDelay(1400, withTiming(0, { duration: 500 }))
      );

      // Emoji burst animation
      emojiScale.value = withSequence(
        withDelay(1400, withSpring(2, { damping: 5, stiffness: 400 })),
        withSpring(1, { damping: 8, stiffness: 300 }),
        withDelay(200, withSpring(1.2, { damping: 6, stiffness: 350 })),
        withSpring(1, { damping: 10, stiffness: 280 })
      );
      emojiOpacity.value = withSequence(
        withDelay(1400, withTiming(1, { duration: 200 })),
        withDelay(1200, withTiming(0, { duration: 400 }))
      );
      emojiRotation.value = withSequence(
        withDelay(1400, withTiming(0, { duration: 200 })),
        withTiming(360, { duration: 800 }),
        withTiming(720, { duration: 600 })
      );

      // Complete animation after longer duration
      setTimeout(() => {
        runOnJS(onComplete)();
      }, 2800);
    }
  }, [visible, onComplete]);

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
    transform: [{ scale: backgroundScale.value * backgroundPulse.value }],
  }));

  const eyeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: eyeScaleY.value },
      { scale: eyeBounce.value },
      { rotate: `${eyeRotation.value}deg` },
    ] as const,
    shadowOpacity: eyeGlow.value * 0.5,
    shadowRadius: eyeGlow.value * 10,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
  }));

  const sparkleAnimatedStyles = sparkles.map((sparkle) =>
    useAnimatedStyle(() => ({
      transform: [
        { scale: sparkle.scale.value },
        { rotate: `${sparkle.rotation.value}deg` },
      ] as const,
      opacity: sparkle.opacity.value,
    }))
  );

  const heartAnimatedStyles = hearts.map((heart) =>
    useAnimatedStyle(() => ({
      transform: [
        { scale: heart.scale.value },
        { translateY: heart.translateY.value },
        { translateX: heart.translateX.value },
        { rotate: `${heart.rotation.value}deg` },
      ] as const,
      opacity: heart.opacity.value,
    }))
  );

  const rainbowParticleStyles = rainbowParticles.map((particle) =>
    useAnimatedStyle(() => ({
      transform: [
        { scale: particle.scale.value },
        { translateY: particle.translateY.value },
        { translateX: particle.translateX.value },
      ] as const,
      opacity: particle.opacity.value,
    }))
  );

  const textAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }] as const,
    opacity: textOpacity.value,
    textShadowOpacity: textGlow.value,
  }));

  const emojiAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: emojiScale.value },
      { rotate: `${emojiRotation.value}deg` },
    ] as const,
    opacity: emojiOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* Animated background */}
      <Animated.View style={[styles.background, backgroundAnimatedStyle]} />

      {/* Rainbow particles */}
      {rainbowParticles.map((_, index) => (
        <Animated.View
          key={`rainbow-${index}`}
          style={[styles.rainbowParticle, rainbowParticleStyles[index]]}
        >
          <View
            style={[
              styles.rainbowDot,
              { backgroundColor: `hsl(${index * 45}, 100%, 70%)` },
            ]}
          />
        </Animated.View>
      ))}

      {/* Main content */}
      <View style={styles.content}>
        {/* Floating hearts */}
        {hearts.map((_, index) => (
          <Animated.View
            key={`heart-${index}`}
            style={[styles.floatingHeart, heartAnimatedStyles[index]]}
          >
            <Heart
              size={20 + index * 4}
              color={`hsl(${index * 60}, 100%, 70%)`}
              fill={`hsl(${index * 60}, 100%, 70%)`}
            />
          </Animated.View>
        ))}

        {/* Eye container with sparkles */}
        <View style={styles.eyeContainer}>
          {sparkles.map((_, index) => (
            <Animated.View
              key={`sparkle-${index}`}
              style={[styles.sparkle, sparkleAnimatedStyles[index]]}
            >
              <Sparkles
                size={25 + index * 5}
                color={index % 2 === 0 ? '#FFD700' : '#FFA500'}
              />
            </Animated.View>
          ))}
          <Animated.View style={eyeAnimatedStyle}>
            <Eye size={120} color={theme.primary} />
          </Animated.View>
        </View>

        {/* Animated text */}
        <Animated.Text style={[styles.message, textAnimatedStyle]}>
          Cheeky wink delivered! 😘💖
        </Animated.Text>

        {/* Emoji burst */}
        <Animated.Text style={[styles.emoji, emojiAnimatedStyle]}>
          💋✨
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
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 105, 180, 0.1)',
    borderRadius: borderRadius.lg,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  eyeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  floatingHeart: {
    position: 'absolute',
  },
  sparkle: {
    position: 'absolute',
  },
  rainbowParticle: {
    position: 'absolute',
  },
  rainbowDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: borderRadius.sm,
  },
  emoji: {
    fontSize: moderateScale(32),
    marginTop: spacing.sm,
  },
  message: {
    marginTop: spacing.lg,
    fontSize: moderateScale(20),
    fontWeight: '700',
    textAlign: 'center',
    color: '#FF69B4',
    textShadowColor: 'rgba(255, 105, 180, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
