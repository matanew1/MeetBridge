import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import {
  ArrowRight,
  Heart,
  X,
  MessageCircle,
  MapPin,
  Instagram,
  Music,
  Facebook,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

interface ProfileDetailProps {
  user: {
    id: string;
    name: string;
    age: number;
    distance?: number;
    image: string;
    bio?: string;
    interests?: string[];
    location?: string;
  };
  onClose: () => void;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  onMessage?: (id: string) => void;
  onUnmatch?: (id: string) => void;
  isLiked?: boolean;
  isDisliked?: boolean;
}

const ProfileDetail = ({
  user,
  onClose,
  onLike,
  onDislike,
  onMessage,
  onUnmatch,
  isLiked = false,
  isDisliked = false,
}: ProfileDetailProps) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const socialIcons = [
    { icon: Instagram, color: '#E4405F' },
    { icon: Music, color: '#1DB954' },
    { icon: Facebook, color: '#FF6B6B' },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <ArrowRight size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t('profile.title')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Image */}
        <View style={styles.imageSection}>
          <Image
            source={{ uri: user.image }}
            style={styles.profileImage}
            resizeMode="cover"
          />

          {/* Age badge */}
          <View style={[styles.ageBadge, { backgroundColor: theme.surface }]}>
            <Text style={[styles.ageText, { color: theme.text }]}>
              {user.age} y/o
            </Text>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          {/* Name and distance */}
          <View style={styles.nameSection}>
            <Text style={[styles.nameText, { color: theme.text }]}>
              {user.name}
            </Text>
            {user.location && (
              <View style={styles.distanceRow}>
                <MapPin size={16} color={theme.textSecondary} />
                <Text
                  style={[styles.distanceText, { color: theme.textSecondary }]}
                >
                  {user.location}
                </Text>
              </View>
            )}
          </View>

          {/* Bio */}
          {user.bio && (
            <View
              style={[styles.bioSection, { backgroundColor: theme.surface }]}
            >
              <Text style={[styles.bioText, { color: theme.text }]}>
                {user.bio}
              </Text>
            </View>
          )}

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <View style={styles.interestsSection}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {t('profile.interests')}
              </Text>
              <View style={styles.interestsGrid}>
                {user.interests.map((interest, index) => (
                  <View key={index} style={styles.interestChip}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Social Media */}
        <View style={styles.socialSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t('profile.about')}
          </Text>
          <View style={styles.socialRow}>
            {socialIcons.map((social, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.socialButton,
                  { backgroundColor: theme.surface },
                ]}
              >
                <social.icon size={24} color={social.color} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Unmatch option for matches */}
      {onMessage && onUnmatch && (
        <View
          style={[
            styles.unmatchSection,
            { backgroundColor: theme.surface, borderTopColor: theme.border },
          ]}
        >
          <TouchableOpacity
            style={styles.unmatchButtonDetail}
            onPress={() => onUnmatch(user.id)}
          >
            <Text style={styles.unmatchButtonText}>{t('profile.unmatch')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 34,
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    position: 'relative',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  profileImage: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: 20,
    maxHeight: 300,
  },
  ageBadge: {
    position: 'absolute',
    top: 30,
    right: width * 0.15,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ageText: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
    paddingBottom: 20,
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  nameText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 16,
    marginLeft: 4,
  },
  bioSection: {
    marginBottom: 25,
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  interestsSection: {
    marginBottom: 2,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  interestChip: {
    backgroundColor: '#E8D5F3',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 14,
    color: '#8E44AD',
    fontWeight: '500',
  },
  socialSection: {
    marginBottom: 100,
    paddingHorizontal: 20,
    width: '100%',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  socialButton: {
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    margin: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dislikeButton: {
    backgroundColor: '#FFE5E5',
  },
  messageButton: {
    backgroundColor: '#E8D5F3',
  },
  likeButton: {
    backgroundColor: '#FFE5F1',
  },
  unmatchSection: {
    paddingHorizontal: 40,
    paddingTop: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  unmatchButtonDetail: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  unmatchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
  },
});

export default ProfileDetail;
