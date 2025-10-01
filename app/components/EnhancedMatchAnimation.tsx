// app/components/EnhancedMatchAnimation.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Heart, MessageCircle, X, Sparkles } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

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
  theme: any;
}

export default function EnhancedMatchAnimation({
  visible,
  matchedUser,
  currentUser,
  onClose,
  onSendMessage,
  theme,
}: EnhancedMatchAnimationProps) {
  // Animation values
  const overlayOpacity = useSharedValue(0);
  const heartScale = useSharedValue(0);
  const heartRotation = useSharedValue(-45);
  const confettiOpacity = useSharedValue(0);
  const profileScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0);

  // Sparkle positions
  const sparkle1 = useSharedValue(0);
  const sparkle2 = useSharedValue(0);
  const sparkle3 = useSharedValue(0);
  const sparkle4 = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 400, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });

      heartScale.value = withSequence(
        withDelay(200, withSpring(1.8, { damping: 3, stiffness: 120 })),
        withSpring(1, { damping: 5, stiffness: 100 })
      );
      heartRotation.value = withDelay(200, withSpring(0, { damping: 8, stiffness: 100 }));

      confettiOpacity.value = withDelay(
        400,
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
          withDelay(1800, withTiming(0, { duration: 600, easing: Easing.in(Easing.cubic) }))
        )
      );

      profileScale.value = withDelay(600, withSpring(1, { damping: 8, stiffness: 120 }));

      textOpacity.value = withDelay(900, withTiming(1, { duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }));

      buttonScale.value = withDelay(1200, withSpring(1, { damping: 6, stiffness: 150 }));

      sparkle1.value = withDelay(
        700,
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.bezier(0.34, 1.56, 0.64, 1) }),
          withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) })
        )
      );
      sparkle2.value = withDelay(
        800,
        withSequence(
          withTiming(1, { duration: 1100, easing: Easing.bezier(0.34, 1.56, 0.64, 1) }),
          withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) })
        )
      );
      sparkle3.value = withDelay(
        750,
        withSequence(
          withTiming(1, { duration: 1050, easing: Easing.bezier(0.34, 1.56, 0.64, 1) }),
          withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) })
        )
      );
      sparkle4.value = withDelay(
        850,
        withSequence(
          withTiming(1, { duration: 1150, easing: Easing.bezier(0.34, 1.56, 0.64, 1) }),
          withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) })
        )
      );
    } else {
      // Reset all animations
      overlayOpacity.value = 0;
      heartScale.value = 0;
      heartRotation.value = -45;
      confettiOpacity.value = 0;
      profileScale.value = 0;
      textOpacity.value = 0;
      buttonScale.value = 0;
      sparkle1.value = 0;
      sparkle2.value = 0;
      sparkle3.value = 0;
      sparkle4.value = 0;
    }
  }, [visible]);

  // Animated styles
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: heartScale.value },
      { rotate: `${heartRotation.value}deg` },
    ],
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  const profileStyle = useAnimatedStyle(() => ({
    transform: [{ scale: profileScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const sparkle1Style = useAnimatedStyle(() => ({
    opacity: sparkle1.value,
    transform: [
      { translateY: -(sparkle1.value * 80) },
      { translateX: sparkle1.value * 60 },
      { scale: 0.5 + sparkle1.value * 0.5 },
      { rotate: `${sparkle1.value * 360}deg` },
    ],
  }));

  const sparkle2Style = useAnimatedStyle(() => ({
    opacity: sparkle2.value,
    transform: [
      { translateY: -(sparkle2.value * 90) },
      { translateX: -(sparkle2.value * 70) },
      { scale: 0.5 + sparkle2.value * 0.5 },
      { rotate: `${-sparkle2.value * 360}deg` },
    ],
  }));

  const sparkle3Style = useAnimatedStyle(() => ({
    opacity: sparkle3.value,
    transform: [
      { translateY: -(sparkle3.value * 70) },
      { translateX: sparkle3.value * 50 },
      { scale: 0.5 + sparkle3.value * 0.5 },
      { rotate: `${sparkle3.value * 360}deg` },
    ],
  }));

  const sparkle4Style = useAnimatedStyle(() => ({
    opacity: sparkle4.value,
    transform: [
      { translateY: -(sparkle4.value * 85) },
      { translateX: -(sparkle4.value * 55) },
      { scale: 0.5 + sparkle4.value * 0.5 },
      { rotate: `${-sparkle4.value * 360}deg` },
    ],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <BlurView intensity={80} style={StyleSheet.absoluteFill} />

      {/* Confetti particles */}
      <Animated.View style={[styles.confetti, confettiStyle]}>
        {[...Array(20)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.confettiPiece,
              {
                backgroundColor:
                  i % 3 === 0
                    ? theme.primary
                    : i % 3 === 1
                    ? '#FFD700'
                    : '#FF69B4',
                left: `${(i * 5.5) % 100}%`,
                top: `${(i * 7) % 80}%`,
                transform: [{ rotate: `${i * 20}deg` }],
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Big heart icon */}
        <Animated.View style={[styles.heartContainer, heartStyle]}>
          <View
            style={[
              styles.heartCircle,
              {
                backgroundColor: theme.primary,
                shadowColor: theme.primary,
              },
            ]}
          >
            <Heart size={80} color="#FFF" fill="#FFF" />
          </View>

          {/* Floating sparkles around heart */}
          <Animated.View style={[styles.sparkle, sparkle1Style]}>
            <Sparkles size={24} color="#FFD700" />
          </Animated.View>
          <Animated.View style={[styles.sparkle, sparkle2Style]}>
            <Sparkles size={20} color="#FFD700" />
          </Animated.View>
          <Animated.View style={[styles.sparkle, sparkle3Style]}>
            <Sparkles size={22} color="#FFD700" />
          </Animated.View>
          <Animated.View style={[styles.sparkle, sparkle4Style]}>
            <Sparkles size={18} color="#FFD700" />
          </Animated.View>
        </Animated.View>

        {/* Match text */}
        <Animated.View style={textStyle}>
          <Text style={[styles.matchTitle, { color: theme.primary }]}>
            It's a Match!
          </Text>
          <Text style={[styles.matchSubtitle, { color: theme.text }]}>
            You and {matchedUser.name} liked each other
          </Text>
        </Animated.View>

        {/* Profile cards */}
        <Animated.View style={[styles.profilesContainer, profileStyle]}>
          <View style={styles.profileCard}>
            <Image
              source={{
                uri: currentUser.image || 'https://via.placeholder.com/150',
              }}
              style={styles.profileImage}
            />
          </View>
          <View style={[styles.heartBadge, { backgroundColor: theme.primary }]}>
            <Heart size={20} color="#FFF" fill="#FFF" />
          </View>
          <View style={styles.profileCard}>
            <Image
              source={{
                uri: matchedUser.image || 'https://via.placeholder.com/150',
              }}
              style={styles.profileImage}
            />
          </View>
        </Animated.View>

        {/* Action buttons */}
        <Animated.View style={[styles.actions, buttonStyle]}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.messageButton,
              { backgroundColor: theme.primary },
            ]}
            onPress={onSendMessage}
          >
            <MessageCircle size={24} color="#FFF" />
            <Text style={styles.buttonText}>Send Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.closeButton,
              { backgroundColor: theme.surface },
            ]}
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, { color: theme.text }]}>
              Keep Swiping
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
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
  confetti: {
    ...StyleSheet.absoluteFillObject,
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heartContainer: {
    marginBottom: 30,
    position: 'relative',
  },
  heartCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
  sparkle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
  matchTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  matchSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.8,
  },
  profilesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  profileCard: {
    width: 130,
    height: 170,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heartBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: -10,
    zIndex: 1,
    borderWidth: 4,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  messageButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  closeButton: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
