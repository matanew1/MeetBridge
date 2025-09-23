import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MessageCircle, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
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
  const overlayOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0);
  const heartScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(50);
  const buttonsOpacity = useSharedValue(0);
  const profilesScale = useSharedValue(0);
  const profilesRotation = useSharedValue(0);
  const sparkleScale = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset all animations
      overlayOpacity.value = 0;
      modalScale.value = 0;
      heartScale.value = 0;
      textOpacity.value = 0;
      buttonsTranslateY.value = 50;
      buttonsOpacity.value = 0;
      profilesScale.value = 0;
      profilesRotation.value = 0;
      sparkleScale.value = 0;
      sparkleOpacity.value = 0;

      // Start animation sequence
      overlayOpacity.value = withTiming(1, { duration: 300 });
      
      modalScale.value = withDelay(
        100,
        withSpring(1, {
          damping: 15,
          stiffness: 150,
        })
      );

      profilesScale.value = withDelay(
        200,
        withSpring(1, {
          damping: 12,
          stiffness: 100,
        })
      );

      profilesRotation.value = withDelay(
        300,
        withSequence(
          withTiming(10, { duration: 200 }),
          withTiming(-10, { duration: 200 }),
          withTiming(0, { duration: 200 })
        )
      );

      heartScale.value = withDelay(
        400,
        withSequence(
          withSpring(1.5, {
            damping: 8,
            stiffness: 200,
          }),
          withSpring(1, {
            damping: 10,
            stiffness: 150,
          })
        )
      );

      // Sparkle animation
      sparkleScale.value = withDelay(
        500,
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0, { duration: 300 })
        )
      );

      sparkleOpacity.value = withDelay(
        500,
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0, { duration: 300 })
        )
      );

      textOpacity.value = withDelay(
        600,
        withTiming(1, { duration: 400 })
      );

      buttonsTranslateY.value = withDelay(
        800,
        withSpring(0, {
          damping: 15,
          stiffness: 150,
        })
      );

      buttonsOpacity.value = withDelay(
        800,
        withTiming(1, { duration: 400 })
      );
    } else {
      // Exit animation
      overlayOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: buttonsTranslateY.value }],
    opacity: buttonsOpacity.value,
  }));

  const profilesStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: profilesScale.value },
      { rotate: `${profilesRotation.value}deg` },
    ],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkleScale.value }],
    opacity: sparkleOpacity.value,
  }));

  if (!matchedUser || !currentUser) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <LinearGradient
          colors={['#FF6B9D', '#C44569', '#8E44AD']}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View style={[styles.modalContainer, modalStyle]}>
            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#FFF" />
            </TouchableOpacity>

            {/* Sparkle effects */}
            <Animated.View style={[styles.sparkle, styles.sparkle1, sparkleStyle]}>
              <View style={styles.sparkleShape} />
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkle2, sparkleStyle]}>
              <View style={styles.sparkleShape} />
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkle3, sparkleStyle]}>
              <View style={styles.sparkleShape} />
            </Animated.View>

            {/* Profile images */}
            <Animated.View style={[styles.profilesContainer, profilesStyle]}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: currentUser.image }}
                  style={styles.profileImage}
                />
              </View>
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: matchedUser.image }}
                  style={styles.profileImage}
                />
              </View>
            </Animated.View>

            {/* Heart icon */}
            <Animated.View style={[styles.heartContainer, heartStyle]}>
              <LinearGradient
                colors={['#FF6B9D', '#FF8A80']}
                style={styles.heartBackground}
              >
                <Heart size={32} color="#FFF" fill="#FFF" />
              </LinearGradient>
            </Animated.View>

            {/* Match text */}
            <Animated.View style={[styles.textContainer, textStyle]}>
              <Text style={styles.matchTitle}>
                {t('modals.matchTitle')}
              </Text>
              <Text style={styles.matchSubtitle}>
                {matchedUser.name}, {matchedUser.age}
              </Text>
              <Text style={styles.matchDescription}>
                {t('modals.matchText')}
              </Text>
            </Animated.View>

            {/* Action buttons */}
            <Animated.View style={[styles.buttonsContainer, buttonsStyle]}>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={onStartChatting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4ECDC4', '#44A08D']}
                  style={styles.buttonGradient}
                >
                  <MessageCircle size={20} color="#FFF" />
                  <Text style={styles.chatButtonText}>
                    {t('modals.startChatting')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 350,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    padding: 40,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  sparkle: {
    position: 'absolute',
    width: 20,
    height: 20,
  },
  sparkle1: {
    top: 60,
    left: 40,
  },
  sparkle2: {
    top: 80,
    right: 50,
  },
  sparkle3: {
    bottom: 120,
    left: 30,
  },
  sparkleShape: {
    width: 20,
    height: 20,
    backgroundColor: '#FFD700',
    transform: [{ rotate: '45deg' }],
    borderRadius: 4,
  },
  profilesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: -20,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  heartContainer: {
    marginBottom: 25,
    shadowColor: '#FF6B9D',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  heartBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  matchTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8E44AD',
    marginBottom: 8,
    textAlign: 'center',
  },
  matchSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  matchDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  chatButton: {
    width: '100%',
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#4ECDC4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  chatButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default MatchModal;