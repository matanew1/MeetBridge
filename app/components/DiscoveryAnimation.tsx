// app/components/DiscoveryAnimation.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Heart, Sparkles, Users } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface DiscoveryAnimationProps {
  theme: any;
  message?: string;
}

export default function DiscoveryAnimation({
  theme,
  message = 'Finding your perfect match...',
}: DiscoveryAnimationProps) {
  // Animation values
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const cardOffset1 = useSharedValue(0);
  const cardOffset2 = useSharedValue(0);
  const cardOffset3 = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);
  const heartScale = useSharedValue(1);

  useEffect(() => {
    // Rotating circle animation
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 3000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Pulsing center
    scale.value = withRepeat(
      withSequence(
        withSpring(1.1, { damping: 2 }),
        withSpring(1, { damping: 2 })
      ),
      -1,
      true
    );

    // Floating cards
    cardOffset1.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    cardOffset2.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    cardOffset3.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Twinkling sparkles
    sparkleOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );

    // Beating heart
    heartScale.value = withRepeat(
      withSequence(
        withSpring(1.2, { damping: 3 }),
        withSpring(1, { damping: 3 })
      ),
      -1,
      true
    );
  }, []);

  // Animated styles
  const rotatingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const centerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const card1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: cardOffset1.value }],
  }));

  const card2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: cardOffset2.value }],
  }));

  const card3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: cardOffset3.value }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.primary }]}>{message}</Text>

      {/* Main animation container */}
      <View style={styles.animationContainer}>
        {/* Floating sparkles background */}
        <Animated.View style={[styles.sparkle, styles.sparkle1, sparkleStyle]}>
          <Sparkles size={20} color={theme.primary} opacity={0.6} />
        </Animated.View>
        <Animated.View style={[styles.sparkle, styles.sparkle2, sparkleStyle]}>
          <Sparkles size={16} color={theme.primary} opacity={0.6} />
        </Animated.View>
        <Animated.View style={[styles.sparkle, styles.sparkle3, sparkleStyle]}>
          <Sparkles size={18} color={theme.primary} opacity={0.6} />
        </Animated.View>
        <Animated.View style={[styles.sparkle, styles.sparkle4, sparkleStyle]}>
          <Sparkles size={14} color={theme.primary} opacity={0.6} />
        </Animated.View>

        {/* Rotating outer ring */}
        <Animated.View style={[styles.outerRing, rotatingStyle]}>
          <View
            style={[
              styles.ringGradient,
              {
                borderColor: theme.primary,
                backgroundColor: `${theme.primary}10`,
              },
            ]}
          />
        </Animated.View>

        {/* Floating profile cards */}
        <Animated.View style={[styles.floatingCard, styles.card1, card1Style]}>
          <View
            style={[styles.miniCard, { backgroundColor: theme.cardBackground }]}
          />
        </Animated.View>
        <Animated.View style={[styles.floatingCard, styles.card2, card2Style]}>
          <View
            style={[styles.miniCard, { backgroundColor: theme.cardBackground }]}
          />
        </Animated.View>
        <Animated.View style={[styles.floatingCard, styles.card3, card3Style]}>
          <View
            style={[styles.miniCard, { backgroundColor: theme.cardBackground }]}
          />
        </Animated.View>

        {/* Center pulsing icon */}
        <Animated.View style={[styles.centerIcon, centerStyle]}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: theme.primary,
                shadowColor: theme.primary,
              },
            ]}
          >
            <Animated.View style={heartStyle}>
              <Heart size={40} color="#FFF" fill="#FFF" />
            </Animated.View>
          </View>
        </Animated.View>
      </View>

      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Searching nearby profiles...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 40,
    textAlign: 'center',
  },
  animationContainer: {
    width: width * 0.7,
    height: width * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringGradient: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.35,
    borderWidth: 3,
  },
  centerIcon: {
    position: 'absolute',
    zIndex: 10,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingCard: {
    position: 'absolute',
  },
  miniCard: {
    width: 60,
    height: 80,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  card1: {
    top: 40,
    left: 30,
  },
  card2: {
    top: 50,
    right: 20,
  },
  card3: {
    bottom: 60,
    left: '50%',
    marginLeft: -30,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: 20,
    left: 40,
  },
  sparkle2: {
    top: 30,
    right: 30,
  },
  sparkle3: {
    bottom: 40,
    left: 30,
  },
  sparkle4: {
    bottom: 30,
    right: 40,
  },
});
