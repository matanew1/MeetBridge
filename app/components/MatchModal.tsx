import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Heart, MessageCircle, X, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

interface MatchModalProps {
  visible: boolean;
  onClose: () => void;
  onStartChatting: () => void;
  matchedUser: {
    id: string;
    name: string;
    age: number;
    image: string;
  } | null;
  currentUser: {
    id: string;
    name: string;
    age: number;
    image: string;
  } | null;
}

const MatchModal: React.FC<MatchModalProps> = ({
  visible,
  onClose,
  onStartChatting,
  matchedUser,
  currentUser,
}) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Animation values
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const sparkleOpacity = useSharedValue(0);
  const heartScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Reset animations
      rotation.value = 0;
      scale.value = 1;
      sparkleOpacity.value = 0;
      heartScale.value = 1;

      // Start animations
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 3000,
          easing: Easing.bezier(0.65, 0, 0.35, 1),
        }),
        -1, // Infinite
        false
      );

      scale.value = withRepeat(
        withSequence(
          withSpring(1.15, { damping: 3, stiffness: 120 }),
          withSpring(1, { damping: 3, stiffness: 120 })
        ),
        -1, // Infinite
        true
      );

      sparkleOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.ease }),
          withTiming(0.2, { duration: 800, easing: Easing.ease })
        ),
        -1, // Infinite
        true
      );

      heartScale.value = withRepeat(
        withSequence(
          withSpring(1.3, { damping: 2, stiffness: 180 }),
          withSpring(1, { damping: 2, stiffness: 180 })
        ),
        -1, // Infinite
        true
      );
    }
  }, [visible]);

  // Animated styles
  const rotatingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const centerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  if (!matchedUser || !currentUser) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <X size={24} color="#FFF" />
          </TouchableOpacity>

          {/* Animated Heart Circle with Sparkles and Ring */}
          <View style={styles.animationContainer}>
            {/* Floating sparkles background */}
            <Animated.View
              style={[styles.sparkle, styles.sparkle1, sparkleStyle]}
            >
              <Sparkles size={24} color="#C77DFF" opacity={0.6} />
            </Animated.View>
            <Animated.View
              style={[styles.sparkle, styles.sparkle2, sparkleStyle]}
            >
              <Sparkles size={20} color="#FF6B9D" opacity={0.6} />
            </Animated.View>
            <Animated.View
              style={[styles.sparkle, styles.sparkle3, sparkleStyle]}
            >
              <Sparkles size={22} color="#C77DFF" opacity={0.6} />
            </Animated.View>
            <Animated.View
              style={[styles.sparkle, styles.sparkle4, sparkleStyle]}
            >
              <Sparkles size={18} color="#FF6B9D" opacity={0.6} />
            </Animated.View>

            {/* Rotating outer ring */}
            <Animated.View style={[styles.outerRing, rotatingStyle]}>
              <View
                style={[
                  styles.ringGradient,
                  {
                    borderColor: '#C77DFF',
                    backgroundColor: 'rgba(199, 125, 255, 0.1)',
                  },
                ]}
              />
            </Animated.View>

            {/* Center pulsing heart */}
            <Animated.View style={[styles.centerIcon, centerStyle]}>
              <View style={styles.heartCircle}>
                <Animated.View style={heartStyle}>
                  <Heart size={60} color="#FFF" fill="#FFF" />
                </Animated.View>
              </View>
            </Animated.View>
          </View>

          {/* Match text */}
          <View style={styles.textContainer}>
            <Text style={styles.matchTitle}>It's a Match!</Text>
            <Text style={styles.matchSubtitle}>
              You and {matchedUser.name} liked each other
            </Text>
          </View>

          {/* Profile images */}
          <View style={styles.profilesContainer}>
            <View style={styles.profileImageWrapper}>
              <Image
                source={{ uri: currentUser.image }}
                style={styles.profileImage}
              />
            </View>
            <View style={styles.heartBetween}>
              <Heart size={24} color="#C77DFF" fill="#C77DFF" />
            </View>
            <View style={styles.profileImageWrapper}>
              <Image
                source={{ uri: matchedUser.image }}
                style={styles.profileImage}
              />
            </View>
          </View>

          {/* Send Message button */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.sendMessageButton}
              onPress={onStartChatting}
              activeOpacity={0.8}
            >
              <MessageCircle size={22} color="#FFF" />
              <Text style={styles.sendMessageText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    backdropFilter: 'blur(8px)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 30,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  animationContainer: {
    width: width * 0.6,
    height: width * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 40,
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
    borderRadius: width * 0.3,
    borderWidth: 3,
  },
  centerIcon: {
    position: 'absolute',
    zIndex: 10,
  },
  heartCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#C77DFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C77DFF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
  textContainer: {
    alignItems: 'center',
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  matchTitle: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  matchSubtitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 28,
  },
  profilesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
    gap: 15,
  },
  profileImageWrapper: {
    width: 150,
    height: 150,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  heartBetween: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C77DFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  sendMessageButton: {
    backgroundColor: '#C77DFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 36,
    borderRadius: 32,
    gap: 12,
    shadowColor: '#C77DFF',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sendMessageText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.3,
  },
});

export default MatchModal;
