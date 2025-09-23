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

  const socialIcons = [
    { icon: Instagram, color: '#E4405F' },
    { icon: Music, color: '#1DB954' },
    { icon: Facebook, color: '#FF6B6B' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <ArrowRight size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>פרופיל</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
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
          <View style={styles.ageBadge}>
            <Text style={styles.ageText}>{user.age}</Text>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          {/* Name and distance */}
          <View style={styles.nameSection}>
            <Text style={styles.nameText}>{user.name}</Text>
            {user.distance && (
              <View style={styles.distanceRow}>
                <MapPin size={16} color="#666" />
                <Text style={styles.distanceText}>{user.distance} ק"מ ממך</Text>
              </View>
            )}
          </View>

          {/* Bio */}
          {user.bio && (
            <View style={styles.bioSection}>
              <Text style={styles.bioText}>{user.bio}</Text>
            </View>
          )}

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <View style={styles.interestsSection}>
              <Text style={styles.sectionTitle}>תחומי עניין</Text>
              <View style={styles.interestsGrid}>
                {user.interests.map((interest, index) => (
                  <View key={index} style={styles.interestChip}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Social Media */}
          <View style={styles.socialSection}>
            <Text style={styles.sectionTitle}>רשתות חברתיות</Text>
            <View style={styles.socialRow}>
              {socialIcons.map((social, index) => (
                <TouchableOpacity key={index} style={styles.socialButton}>
                  <social.icon size={24} color={social.color} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Unmatch option for matches */}
      {onMessage && onUnmatch && (
        <View style={styles.unmatchSection}>
          <TouchableOpacity
            style={styles.unmatchButtonDetail}
            onPress={() => onUnmatch(user.id)}
          >
            <Text style={styles.unmatchButtonText}>בטל התאמה</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf1fcff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
    backgroundColor: '#FFF',
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
    color: '#333',
  },
  profileInfo: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  bioSection: {
    marginBottom: 25,
    backgroundColor: '#FFF',
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
    color: '#333',
    lineHeight: 24,
    textAlign: 'center',
  },
  interestsSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
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
    marginBottom: 25,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    backgroundColor: '#FFF',
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
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
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
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
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
