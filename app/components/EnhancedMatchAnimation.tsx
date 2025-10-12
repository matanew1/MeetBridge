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
    paddingHorizontal: 20,
  },
  heartContainer: {
    marginBottom: 30,
    position: 'relative',
  },
  heartCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
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
