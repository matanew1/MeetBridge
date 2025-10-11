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
  Easing,
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
  const heartBlink = useSharedValue(1);
  const textOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(50);
  const buttonsOpacity = useSharedValue(0);
  const profilesScale = useSharedValue(0);
  const profilesTranslateY = useSharedValue(50);

  useEffect(() => {
    if (visible) {
      // Reset all animations
      overlayOpacity.value = 0;
      modalScale.value = 0;
      heartScale.value = 0;
      heartBlink.value = 1;
      textOpacity.value = 0;
      buttonsTranslateY.value = 50;
      buttonsOpacity.value = 0;
      profilesScale.value = 0;
      profilesTranslateY.value = 50;

      // Overlay fade in
      overlayOpacity.value = withTiming(1, { duration: 300 });

      // Heart scale and blink animation
      heartScale.value = withDelay(
        100,
        withSpring(1, {
          damping: 8,
          stiffness: 100,
        })
      );

      // Continuous blinking effect
      heartBlink.value = withDelay(
        400,
        withSequence(
          withTiming(0.85, { duration: 400 }),
          withTiming(1, { duration: 400 }),
          withTiming(0.85, { duration: 400 }),
          withTiming(1, { duration: 400 })
        )
      );

      // Text fade in
      textOpacity.value = withDelay(
        300,
        withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
      );

      // Profiles slide up
      profilesScale.value = withDelay(
        500,
        withSpring(1, {
          damping: 10,
          stiffness: 100,
        })
      );

      profilesTranslateY.value = withDelay(
        500,
        withSpring(0, {
          damping: 10,
          stiffness: 100,
        })
      );

      // Button slide up
      buttonsTranslateY.value = withDelay(
        700,
        withSpring(0, {
          damping: 10,
          stiffness: 100,
        })
      );

      buttonsOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));
    } else {
      // Exit animation
      overlayOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value * heartBlink.value }],
    opacity: interpolate(heartBlink.value, [0.85, 1], [0.9, 1]),
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
      { translateY: profilesTranslateY.value },
    ],
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
        <View style={styles.container}>
          {/* Heart Circle with Blink Animation */}
          <Animated.View style={[styles.heartCircle, heartStyle]}>
            <Heart size={60} color="#FFF" fill="#FFF" />
          </Animated.View>

          {/* Match text */}
          <Animated.View style={[styles.textContainer, textStyle]}>
            <Text style={styles.matchTitle}>It's a Match!</Text>
            <Text style={styles.matchSubtitle}>
              You and {matchedUser.name} liked each other
            </Text>
          </Animated.View>

          {/* Profile images */}
          <Animated.View style={[styles.profilesContainer, profilesStyle]}>
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
          </Animated.View>

          {/* Send Message button (swiping button) */}
          <Animated.View style={[styles.buttonsContainer, buttonsStyle]}>
            <TouchableOpacity
              style={styles.sendMessageButton}
              onPress={onStartChatting}
              activeOpacity={0.8}
            >
              <MessageCircle size={22} color="#FFF" />
              <Text style={styles.sendMessageText}>Send Message</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  heartCircle: {
    width: 140,
    height: 140,
    borderRadius: 140,
    backgroundColor: '#C77DFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#C77DFF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  matchTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 1,
  },
  matchSubtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFF',
    textAlign: 'center',
    opacity: 0.95,
  },
  profilesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
    gap: 15,
  },
  profileImageWrapper: {
    width: 140,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
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
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    gap: 10,
    shadowColor: '#C77DFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  sendMessageText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default MatchModal;
