// app/components/EnhancedMatchAnimation.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Heart, MessageCircle, X, Sparkles } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Theme } from '../../constants/theme';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
} from '../../utils/responsive';

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
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <BlurView intensity={80} style={StyleSheet.absoluteFill} />

      {/* Main content */}
      <View style={styles.content}>
        {/* Big heart icon */}
        <View style={styles.heartContainer}>
          <View
            style={[
              styles.heartCircle,
              {
                backgroundColor: theme.primary,
                shadowColor: theme.primary,
              },
            ]}
          >
            <Heart size={40} color="#FFF" fill="#FFF" />
          </View>
        </View>

        {/* Match text */}
        <View>
          <Text style={[styles.matchTitle, { color: theme.primary }]}>
            It's a Match!
          </Text>
          <Text style={[styles.matchSubtitle, { color: theme.text }]}>
            You and {matchedUser.name} liked each other
          </Text>
        </View>

        {/* Profile cards */}
        <View style={styles.profilesContainer}>
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
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
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
        </View>
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
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  heartContainer: {
    marginBottom: verticalScale(30),
    position: 'relative',
  },
  heartCircle: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: verticalScale(16) },
    shadowOpacity: 0.7,
    shadowRadius: moderateScale(28),
    elevation: 24,
    borderWidth: moderateScale(3),
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  matchTitle: {
    fontSize: moderateScale(42),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: verticalScale(8),
  },
  matchSubtitle: {
    fontSize: moderateScale(18),
    textAlign: 'center',
    marginBottom: verticalScale(40),
    opacity: 0.8,
  },
  profilesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(40),
  },
  profileCard: {
    width: moderateScale(140),
    height: verticalScale(180),
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(8) },
    shadowOpacity: 0.5,
    shadowRadius: moderateScale(16),
    elevation: 12,
    borderWidth: moderateScale(2),
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heartBadge: {
    width: moderateScale(55),
    height: moderateScale(55),
    borderRadius: moderateScale(27.5),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: scale(-12),
    zIndex: 1,
    borderWidth: moderateScale(4),
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(3) },
    shadowOpacity: 0.4,
    shadowRadius: moderateScale(6),
    elevation: 10,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: verticalScale(100), // Increased to position above bottom tabs
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(18),
    paddingHorizontal: scale(28),
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
  },
  messageButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(6) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(10),
    elevation: 6,
  },
  closeButton: {
    borderWidth: moderateScale(2),
    borderColor: '#E0E0E0',
  },
  buttonText: {
    color: '#FFF',
    fontSize: moderateScale(18),
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '500',
  },
});
