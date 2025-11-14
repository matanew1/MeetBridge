// app/components/EnhancedMatchAnimation.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { Heart, MessageCircle, X, Sparkles, Star } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Theme } from '../../constants/theme';
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
import { useTranslation } from 'react-i18next';

interface EnhancedMatchAnimationProps {
  visible: boolean;
  matchedUser: {
    name: string;
    age: number;
    image?: string;
  };
  currentUser: {
    image?: string;
  };
  onClose: () => void;
  onSendMessage: () => void;
  theme: Theme;
}

export default function EnhancedMatchAnimation({
  visible,
  matchedUser,
  currentUser,
  onClose,
  onSendMessage,
  theme,
}: EnhancedMatchAnimationProps) {
  const { t } = useTranslation();
  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.3)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartRotate = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(50)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(30)).current;
  const profilesOpacity = useRef(new Animated.Value(0)).current;
  const profilesTranslateY = useRef(new Animated.Value(40)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(20)).current;

  // Particle animations
  const particle1Scale = useRef(new Animated.Value(0)).current;
  const particle1TranslateX = useRef(new Animated.Value(0)).current;
  const particle1TranslateY = useRef(new Animated.Value(0)).current;
  const particle2Scale = useRef(new Animated.Value(0)).current;
  const particle2TranslateX = useRef(new Animated.Value(0)).current;
  const particle2TranslateY = useRef(new Animated.Value(0)).current;
  const particle3Scale = useRef(new Animated.Value(0)).current;
  const particle3TranslateX = useRef(new Animated.Value(0)).current;
  const particle3TranslateY = useRef(new Animated.Value(0)).current;

  // Pulsing glow effect
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  // Dynamic styles based on theme
  const dynamicStyles = React.useMemo(
    () => ({
      profileCard: {
        backgroundColor: theme.cardBackground,
        borderColor: theme.isDark
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(255, 255, 255, 0.3)',
      },
      closeButton: {
        backgroundColor: theme.isDark
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(255, 255, 255, 0.9)',
        borderColor: theme.isDark
          ? 'rgba(255, 255, 255, 0.2)'
          : 'rgba(0, 0, 0, 0.1)',
      },
      closeButtonText: {
        color: theme.text,
      },
    }),
    [theme]
  );

  // Handle orientation changes
  const [orientation, setOrientation] = useState(
    isLandscape ? 'landscape' : 'portrait'
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(isLandscape ? 'landscape' : 'portrait');
    };

    // Listen for dimension changes (orientation changes)
    const subscription = Dimensions.addEventListener(
      'change',
      handleOrientationChange
    );

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (visible) {
      // Reset all animations
      overlayOpacity.setValue(0);
      contentScale.setValue(0.3);
      contentOpacity.setValue(0);
      heartScale.setValue(0);
      heartRotate.setValue(0);
      titleOpacity.setValue(0);
      titleTranslateY.setValue(50);
      subtitleOpacity.setValue(0);
      subtitleTranslateY.setValue(30);
      profilesOpacity.setValue(0);
      profilesTranslateY.setValue(40);
      buttonOpacity.setValue(0);
      buttonTranslateY.setValue(20);

      // Reset particles
      particle1Scale.setValue(0);
      particle1TranslateX.setValue(0);
      particle1TranslateY.setValue(0);
      particle2Scale.setValue(0);
      particle2TranslateX.setValue(0);
      particle2TranslateY.setValue(0);
      particle3Scale.setValue(0);
      particle3TranslateX.setValue(0);
      particle3TranslateY.setValue(0);

      glowOpacity.setValue(0.3);

      // Start entrance animation sequence
      Animated.sequence([
        // Overlay fade in
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Content scale and fade in
        Animated.parallel([
          Animated.spring(contentScale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Heart animation with bounce
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(heartScale, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(heartRotate, {
            toValue: 1,
            duration: 600,
            easing: Easing.elastic(1.2),
            useNativeDriver: true,
          }),
        ]).start();
      }, 200);

      // Title animation
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(titleTranslateY, {
            toValue: 0,
            tension: 80,
            friction: 10,
            useNativeDriver: true,
          }),
        ]).start();
      }, 400);

      // Subtitle animation
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(subtitleOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(subtitleTranslateY, {
            toValue: 0,
            tension: 60,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }, 600);

      // Profiles animation
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(profilesOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(profilesTranslateY, {
            toValue: 0,
            tension: 70,
            friction: 9,
            useNativeDriver: true,
          }),
        ]).start();
      }, 800);

      // Button animation
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(buttonOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(buttonTranslateY, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      }, 1000);

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
              toValue: -80,
              duration: 800,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(particle1TranslateY, {
              toValue: -60,
              duration: 800,
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
              toValue: 80,
              duration: 800,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(particle2TranslateY, {
              toValue: -40,
              duration: 800,
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
              duration: 800,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(particle3TranslateY, {
              toValue: -80,
              duration: 800,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      }, 300);

      // Continuous glow pulsing
      const pulseGlow = () => {
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.8,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.3,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]).start(() => pulseGlow());
      };
      setTimeout(pulseGlow, 1200);
    } else {
      // Exit animation
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const heartRotation = heartRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[styles.overlay, { opacity: overlayOpacity }]}
      pointerEvents="box-none"
    >
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <BlurView intensity={90} style={StyleSheet.absoluteFill} />

      {/* Main content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ scale: contentScale }],
            maxWidth: isTablet
              ? scale(400)
              : isLandscape
              ? scale(280)
              : scale(320),
            paddingHorizontal: isSmallDevice
              ? spacing.md
              : isLandscape
              ? spacing.sm
              : spacing.lg,
          },
        ]}
      >
        {/* Big heart icon with glow */}
        <View style={styles.heartContainer}>
          <Animated.View
            style={[
              styles.heartGlow,
              {
                opacity: glowOpacity,
                backgroundColor: theme.primary,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.heartCircle,
              {
                backgroundColor: theme.primary,
                shadowColor: theme.primary,
                transform: [{ scale: heartScale }, { rotate: heartRotation }],
                width: isSmallDevice ? moderateScale(50) : moderateScale(100),
                height: isSmallDevice ? moderateScale(50) : moderateScale(100),
                borderRadius: isSmallDevice
                  ? moderateScale(50)
                  : moderateScale(60),
              },
            ]}
          >
            <LinearGradient
              colors={[theme.primary, theme.primaryVariant || theme.primary]}
              style={[
                styles.heartGradient,
                {
                  borderRadius: isSmallDevice
                    ? moderateScale(50)
                    : moderateScale(56),
                },
              ]}
            >
              <Heart size={isSmallDevice ? 40 : 48} color="#FFF" fill="#FFF" />
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Match text with modern typography */}
        <View style={styles.textContainer}>
          <Animated.Text
            style={[
              styles.matchTitle,
              {
                color: theme.primary,
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            It's a Match!
          </Animated.Text>
          <Animated.Text
            style={[
              styles.matchSubtitle,
              {
                color: theme.text,
                opacity: subtitleOpacity,
                transform: [{ translateY: subtitleTranslateY }],
              },
            ]}
          >
            {t('match.likedEachOther', { name: matchedUser.name })}
          </Animated.Text>
        </View>

        {/* Profile cards with enhanced styling */}
        <Animated.View
          style={[
            styles.profilesContainer,
            {
              opacity: profilesOpacity,
              transform: [{ translateY: profilesTranslateY }],
              marginBottom: isSmallDevice
                ? verticalScale(25)
                : verticalScale(35),
              flexDirection: isLandscape ? 'column' : 'row',
              gap: isLandscape ? spacing.md : 0,
            },
          ]}
        >
          <View
            style={[
              styles.profileCard,
              dynamicStyles.profileCard,
              {
                width: isSmallDevice ? moderateScale(110) : moderateScale(130),
                height: isSmallDevice ? verticalScale(145) : verticalScale(170),
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.1)']}
              style={styles.profileGradient}
            >
              <Image
                source={{
                  uri: currentUser.image || 'https://via.placeholder.com/150',
                }}
                style={styles.profileImage}
              />
            </LinearGradient>
          </View>

          <Animated.View
            style={[
              styles.heartBadge,
              {
                backgroundColor: theme.primary,
                transform: [{ scale: heartScale }],
                width: isSmallDevice ? moderateScale(55) : moderateScale(65),
                height: isSmallDevice ? moderateScale(55) : moderateScale(65),
                borderRadius: isSmallDevice
                  ? moderateScale(27.5)
                  : moderateScale(32.5),
                marginHorizontal: isLandscape
                  ? 0
                  : isSmallDevice
                  ? scale(-12)
                  : scale(-15),
                marginVertical: isLandscape ? spacing.sm : 0,
              },
            ]}
          >
            <LinearGradient
              colors={[theme.primary, theme.primaryVariant || theme.primary]}
              style={[
                styles.badgeGradient,
                {
                  borderRadius: isSmallDevice
                    ? moderateScale(22.5)
                    : moderateScale(27.5),
                },
              ]}
            >
              <Heart size={isSmallDevice ? 20 : 24} color="#FFF" fill="#FFF" />
            </LinearGradient>
          </Animated.View>

          <View
            style={[
              styles.profileCard,
              dynamicStyles.profileCard,
              {
                width: isSmallDevice ? moderateScale(110) : moderateScale(130),
                height: isSmallDevice ? verticalScale(145) : verticalScale(170),
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.1)']}
              style={styles.profileGradient}
            >
              <Image
                source={{
                  uri: matchedUser.image || 'https://via.placeholder.com/150',
                }}
                style={styles.profileImage}
              />
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Action buttons with modern design */}
        <Animated.View
          style={[
            styles.actions,
            {
              opacity: buttonOpacity,
              transform: [{ translateY: buttonTranslateY }],
              gap: isSmallDevice ? spacing.sm : spacing.md,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.button,
              styles.messageButton,
              { backgroundColor: theme.primary },
            ]}
            onPress={onSendMessage}
          >
            <LinearGradient
              colors={[theme.primary, theme.primaryVariant || theme.primary]}
              style={[
                styles.buttonGradient,
                {
                  height: isSmallDevice ? verticalScale(50) : verticalScale(60),
                  paddingVertical: isSmallDevice
                    ? verticalScale(14)
                    : verticalScale(16),
                  paddingHorizontal: isSmallDevice ? scale(20) : scale(24),
                },
              ]}
            >
              <MessageCircle size={isSmallDevice ? 20 : 24} color="#FFF" />
              <Text
                style={[
                  styles.buttonText,
                  {
                    fontSize: isSmallDevice
                      ? moderateScale(16)
                      : moderateScale(18),
                  },
                ]}
              >
                {t('match.sendMessage')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    width: '100%',
    maxWidth: scale(320),
  },
  heartContainer: {
    marginBottom: verticalScale(25),
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartGlow: {
    position: 'absolute',
    width: isSmallDevice ? moderateScale(120) : moderateScale(140),
    height: isSmallDevice ? moderateScale(120) : moderateScale(140),
    borderRadius: isSmallDevice ? moderateScale(60) : moderateScale(70),
    opacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: moderateScale(40),
    elevation: 30,
  },
  heartCircle: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: verticalScale(20) },
    shadowOpacity: 0.8,
    shadowRadius: moderateScale(35),
    elevation: 25,
    borderWidth: moderateScale(4),
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  heartGradient: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(56),
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(35),
  },
  matchTitle: {
    fontSize: isSmallDevice ? moderateScale(32) : moderateScale(38),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: verticalScale(6),
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  matchSubtitle: {
    fontSize: isSmallDevice ? moderateScale(14) : moderateScale(16),
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: isSmallDevice ? moderateScale(20) : moderateScale(22),
    fontWeight: '500',
  },
  profilesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(35),
  },
  profileCard: {
    width: moderateScale(130),
    height: verticalScale(170),
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(12) },
    shadowOpacity: 0.4,
    shadowRadius: moderateScale(20),
    elevation: 15,
    borderWidth: moderateScale(3),
  },
  profileGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    padding: spacing.sm,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
  },
  heartBadge: {
    width: moderateScale(65),
    height: moderateScale(65),
    borderRadius: moderateScale(32.5),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: scale(-15),
    zIndex: 2,
    borderWidth: moderateScale(5),
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(8) },
    shadowOpacity: 0.5,
    shadowRadius: moderateScale(15),
    elevation: 20,
  },
  badgeGradient: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(27.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    width: '100%',
    gap: spacing.md,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(8) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(12),
    elevation: 8,
  },
  messageButton: {
    height: verticalScale(60),
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(24),
  },
  closeButton: {
    height: verticalScale(50),
    borderWidth: moderateScale(1),
  },
  buttonText: {
    color: '#FFF',
    fontSize: moderateScale(18),
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  // Particle styles
  particle: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - verticalScale(50),
    left: SCREEN_WIDTH / 2 - moderateScale(12),
  },
  particle1: {
    top: SCREEN_HEIGHT / 2 - verticalScale(40),
    left: SCREEN_WIDTH / 2 - moderateScale(10),
  },
  particle2: {
    top: SCREEN_HEIGHT / 2 - verticalScale(45),
    left: SCREEN_WIDTH / 2 - moderateScale(8),
  },
  particle3: {
    top: SCREEN_HEIGHT / 2 - verticalScale(35),
    left: SCREEN_WIDTH / 2 - moderateScale(6),
  },
});
