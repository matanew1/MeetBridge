// app/components/DiscoveryAnimation.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Heart, Sparkles, Star, Users } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  isSmallDevice,
  isTablet,
  isLandscape,
} from '../../utils/responsive';

const { width, height } = Dimensions.get('window');

interface DiscoveryAnimationProps {
  theme: any;
  message?: string;
}

export default function DiscoveryAnimation({
  theme,
  message = 'Finding your perfect match...',
}: DiscoveryAnimationProps) {
  // Animation values using Animated API for compatibility
  const rotation = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const sparkleOpacity1 = React.useRef(new Animated.Value(0)).current;
  const sparkleOpacity2 = React.useRef(new Animated.Value(0)).current;
  const sparkleOpacity3 = React.useRef(new Animated.Value(0)).current;
  const sparkleOpacity4 = React.useRef(new Animated.Value(0)).current;
  const heartScale = React.useRef(new Animated.Value(1)).current;
  const glowOpacity = React.useRef(new Animated.Value(0.3)).current;
  const titleOpacity = React.useRef(new Animated.Value(0)).current;
  const titleTranslateY = React.useRef(new Animated.Value(30)).current;
  const subtitleOpacity = React.useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = React.useRef(new Animated.Value(20)).current;

  // Particle animations
  const particle1Scale = React.useRef(new Animated.Value(0)).current;
  const particle1TranslateX = React.useRef(new Animated.Value(0)).current;
  const particle1TranslateY = React.useRef(new Animated.Value(0)).current;
  const particle2Scale = React.useRef(new Animated.Value(0)).current;
  const particle2TranslateX = React.useRef(new Animated.Value(0)).current;
  const particle2TranslateY = React.useRef(new Animated.Value(0)).current;
  const particle3Scale = React.useRef(new Animated.Value(0)).current;
  const particle3TranslateX = React.useRef(new Animated.Value(0)).current;
  const particle3TranslateY = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(titleTranslateY, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(subtitleTranslateY, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    // Continuous rotation
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulsing scale animation
    const pulseScale = () => {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start(() => pulseScale());
    };
    pulseScale();

    // Heart pulsing
    const pulseHeart = () => {
      Animated.sequence([
        Animated.spring(heartScale, {
          toValue: 1.3,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(heartScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => pulseHeart());
    };
    setTimeout(pulseHeart, 500);

    // Sparkle animations with stagger
    setTimeout(() => {
      Animated.stagger(300, [
        Animated.loop(
          Animated.sequence([
            Animated.timing(sparkleOpacity1, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleOpacity1, {
              toValue: 0.2,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(sparkleOpacity2, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleOpacity2, {
              toValue: 0.2,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(sparkleOpacity3, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleOpacity3, {
              toValue: 0.2,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(sparkleOpacity4, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleOpacity4, {
              toValue: 0.2,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    }, 800);

    // Particle effects
    setTimeout(() => {
      Animated.stagger(200, [
        Animated.parallel([
          Animated.spring(particle1Scale, {
            toValue: 1,
            tension: 120,
            friction: 12,
            useNativeDriver: true,
          }),
          Animated.timing(particle1TranslateX, {
            toValue: -60,
            duration: 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(particle1TranslateY, {
            toValue: -40,
            duration: 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(particle2Scale, {
            toValue: 1,
            tension: 120,
            friction: 12,
            useNativeDriver: true,
          }),
          Animated.timing(particle2TranslateX, {
            toValue: 60,
            duration: 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(particle2TranslateY, {
            toValue: -50,
            duration: 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(particle3Scale, {
            toValue: 1,
            tension: 120,
            friction: 12,
            useNativeDriver: true,
          }),
          Animated.timing(particle3TranslateX, {
            toValue: 0,
            duration: 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(particle3TranslateY, {
            toValue: -70,
            duration: 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, 600);

    // Continuous glow pulsing
    const pulseGlow = () => {
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.8,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]).start(() => pulseGlow());
    };
    setTimeout(pulseGlow, 1000);
  }, []);

  const rotationInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.overlay}>
      <StatusBar style="light" />
      <BlurView intensity={80} style={StyleSheet.absoluteFill} />

      {/* Animated particles */}
      <Animated.View
        style={[
          styles.particle,
          styles.particle1,
          {
            transform: [
              { scale: particle1Scale },
              { translateX: particle1TranslateX },
              { translateY: particle1TranslateY },
            ],
          },
        ]}
      >
        <Sparkles size={isSmallDevice ? 18 : 22} color={theme.primary} />
      </Animated.View>

      <Animated.View
        style={[
          styles.particle,
          styles.particle2,
          {
            transform: [
              { scale: particle2Scale },
              { translateX: particle2TranslateX },
              { translateY: particle2TranslateY },
            ],
          },
        ]}
      >
        <Star size={isSmallDevice ? 14 : 18} color="#FFD700" fill="#FFD700" />
      </Animated.View>

      <Animated.View
        style={[
          styles.particle,
          styles.particle3,
          {
            transform: [
              { scale: particle3Scale },
              { translateX: particle3TranslateX },
              { translateY: particle3TranslateY },
            ],
          },
        ]}
      >
        <Users size={isSmallDevice ? 12 : 16} color="#FF69B4" />
      </Animated.View>

      <View style={styles.container}>
        <Animated.Text
          style={[
            styles.title,
            {
              color: theme.primary,
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          {message}
        </Animated.Text>

        {/* Main animation container */}
        <View style={styles.animationContainer}>
          {/* Floating sparkles background */}
          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkle1,
              { opacity: sparkleOpacity1 },
            ]}
          >
            <Sparkles size={isSmallDevice ? 16 : 20} color={theme.primary} />
          </Animated.View>
          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkle2,
              { opacity: sparkleOpacity2 },
            ]}
          >
            <Sparkles size={isSmallDevice ? 14 : 18} color={theme.primary} />
          </Animated.View>
          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkle3,
              { opacity: sparkleOpacity3 },
            ]}
          >
            <Sparkles size={isSmallDevice ? 15 : 19} color={theme.primary} />
          </Animated.View>
          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkle4,
              { opacity: sparkleOpacity4 },
            ]}
          >
            <Sparkles size={isSmallDevice ? 13 : 17} color={theme.primary} />
          </Animated.View>

          {/* Rotating outer ring with gradient */}
          <Animated.View
            style={[
              styles.outerRing,
              { transform: [{ rotate: rotationInterpolate }] },
            ]}
          >
            <LinearGradient
              colors={[
                `${theme.primary}40`,
                `${theme.primary}20`,
                `${theme.primary}40`,
              ]}
              style={styles.ringGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>

          {/* Center pulsing icon with glow */}
          <View style={styles.centerContainer}>
            <Animated.View
              style={[
                styles.glow,
                {
                  opacity: glowOpacity,
                  backgroundColor: theme.primary,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.centerIcon,
                {
                  transform: [{ scale: scaleAnim }],
                  backgroundColor: theme.primary,
                  shadowColor: theme.primary,
                },
              ]}
            >
              <LinearGradient
                colors={[theme.primary, theme.primaryVariant || theme.primary]}
                style={styles.iconGradient}
              >
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                  <Heart
                    size={isSmallDevice ? 32 : 40}
                    color="#FFF"
                    fill="#FFF"
                  />
                </Animated.View>
              </LinearGradient>
            </Animated.View>
          </View>
        </View>

        <Animated.Text
          style={[
            styles.subtitle,
            {
              color: theme.textSecondary,
              opacity: subtitleOpacity,
              transform: [{ translateY: subtitleTranslateY }],
            },
          ]}
        >
          Searching nearby profiles...
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: isSmallDevice ? verticalScale(40) : verticalScale(60),
    paddingHorizontal: spacing.lg,
    width: '100%',
    maxWidth: isTablet ? scale(400) : scale(320),
  },
  title: {
    fontSize: isSmallDevice ? moderateScale(20) : moderateScale(24),
    fontWeight: 'bold',
    marginBottom: isSmallDevice ? verticalScale(30) : verticalScale(40),
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  subtitle: {
    fontSize: isSmallDevice ? moderateScale(14) : moderateScale(16),
    marginTop: isSmallDevice ? verticalScale(30) : verticalScale(40),
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  animationContainer: {
    width: isSmallDevice ? scale(240) : isTablet ? scale(300) : scale(280),
    height: isSmallDevice ? scale(240) : isTablet ? scale(300) : scale(280),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: isSmallDevice ? moderateScale(120) : moderateScale(140),
    height: isSmallDevice ? moderateScale(120) : moderateScale(140),
    borderRadius: isSmallDevice ? moderateScale(60) : moderateScale(70),
    opacity: 0.3,
  },
  centerIcon: {
    position: 'absolute',
    zIndex: 10,
    width: isSmallDevice ? moderateScale(100) : moderateScale(120),
    height: isSmallDevice ? moderateScale(100) : moderateScale(120),
    borderRadius: isSmallDevice ? moderateScale(50) : moderateScale(60),
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: isSmallDevice ? moderateScale(50) : moderateScale(60),
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: isSmallDevice
      ? scale(120)
      : isTablet
      ? scale(150)
      : scale(140),
    borderWidth: isSmallDevice ? 2 : 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: isSmallDevice ? scale(20) : scale(25),
    left: isSmallDevice ? scale(30) : scale(40),
  },
  sparkle2: {
    top: isSmallDevice ? scale(25) : scale(30),
    right: isSmallDevice ? scale(25) : scale(35),
  },
  sparkle3: {
    bottom: isSmallDevice ? scale(35) : scale(45),
    left: isSmallDevice ? scale(25) : scale(35),
  },
  sparkle4: {
    bottom: isSmallDevice ? scale(25) : scale(35),
    right: isSmallDevice ? scale(35) : scale(45),
  },
  particle: {
    position: 'absolute',
    zIndex: 5,
  },
  particle1: {
    top: '50%',
    left: '50%',
    marginTop: isSmallDevice ? -scale(15) : -scale(20),
    marginLeft: isSmallDevice ? -scale(15) : -scale(20),
  },
  particle2: {
    top: '50%',
    left: '50%',
    marginTop: isSmallDevice ? -scale(10) : -scale(15),
    marginLeft: isSmallDevice ? -scale(10) : -scale(15),
  },
  particle3: {
    top: '50%',
    left: '50%',
    marginTop: isSmallDevice ? -scale(20) : -scale(25),
    marginLeft: isSmallDevice ? -scale(20) : -scale(25),
  },
});
