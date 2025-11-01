import React from 'react';
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

          {/* Heart Circle */}
          <View style={styles.heartCircle}>
            <Heart size={60} color="#FFF" fill="#FFF" />
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
  heartCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'linear-gradient(135deg, #C77DFF 0%, #FF6B9D 100%)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
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
    backgroundColor: 'linear-gradient(135deg, #C77DFF 0%, #FF6B9D 100%)',
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
