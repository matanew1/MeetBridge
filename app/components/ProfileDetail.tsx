import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import {
  ArrowRight,
  Heart,
  X,
  MessageCircle,
  MapPin,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
  deviceInfo,
} from '../../utils/responsive';
import { PREDEFINED_INTERESTS } from '../../constants/interests';
import ZodiacBadge from './ZodiacBadge';
import { auth, db } from '../../services/firebase/config';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

interface ProfileDetailProps {
  user: {
    id: string;
    name: string;
    age: number;
    zodiacSign?: string;
    distance?: number;
    image: string;
    images?: string[];
    bio?: string;
    interests?: string[];
    location?: string;
    height?: number;
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageScrollRef = useRef<FlatList>(null);
  const [isMatched, setIsMatched] = useState(false);
  const [checkingMatch, setCheckingMatch] = useState(true);

  // Check if users are already matched
  useEffect(() => {
    const checkIfMatched = async () => {
      try {
        const currentUserId = auth.currentUser?.uid;
        if (!currentUserId || !user.id) {
          setCheckingMatch(false);
          return;
        }

        // Check if there's an active match between current user and profile user
        const [user1, user2] = [currentUserId, user.id].sort();

        const matchQuery = query(
          collection(db, 'matches'),
          where('user1', '==', user1),
          where('user2', '==', user2),
          where('unmatched', '==', false)
        );

        const matchSnapshot = await getDocs(matchQuery);
        const hasMatch = !matchSnapshot.empty;

        setIsMatched(hasMatch);
      } catch (error) {
        console.error('Error checking match status:', error);
        setIsMatched(false);
      } finally {
        setCheckingMatch(false);
      }
    };

    checkIfMatched();
  }, [user.id]);

  const userImages =
    user.images && user.images.length > 0
      ? [user.image, ...user.images]
      : [user.image];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (width * 0.75));
    setCurrentImageIndex(index);
  };

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
        {/* Profile Image Slider */}
        <View style={styles.imageSection}>
          <FlatList
            ref={imageScrollRef}
            data={userImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={width * 0.75}
            snapToAlignment="center"
            contentContainerStyle={styles.imageSliderContent}
            renderItem={({ item }) => (
              <View style={styles.imageSlide}>
                <Image
                  source={{ uri: item }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              </View>
            )}
            keyExtractor={(item, index) => `image-${index}`}
          />

          {/* White Dots Indicator */}
          {userImages.length > 1 && (
            <View style={styles.dotsContainer}>
              {userImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        index === currentImageIndex
                          ? '#FFF'
                          : 'rgba(255, 255, 255, 0.5)',
                      width: index === currentImageIndex ? 8 : 6,
                      height: index === currentImageIndex ? 8 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Age and Zodiac badges */}
          <View style={styles.badgesContainer}>
            <View style={[styles.ageBadge, { backgroundColor: theme.surface }]}>
              <Text style={[styles.ageText, { color: theme.text }]}>
                {user.age} y/o
              </Text>
            </View>
            {user.zodiacSign && (
              <View style={styles.zodiacBadgeWrapper}>
                <ZodiacBadge zodiacSign={user.zodiacSign} size="medium" />
              </View>
            )}
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          {/* Name and distance */}
          <View style={styles.nameSection}>
            <Text style={[styles.nameText, { color: theme.text }]}>
              {user.name}
              {user.height && (
                <Text
                  style={[styles.heightText, { color: theme.textSecondary }]}
                >
                  {' '}
                  • {user.height}cm
                </Text>
              )}
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
                {user.interests.map((interest, index) => {
                  const predefined = PREDEFINED_INTERESTS.find(
                    (p) => p.label === interest
                  );
                  return (
                    <View key={index} style={styles.interestChip}>
                      <Text style={styles.interestText}>
                        {predefined ? `${predefined.emoji} ` : ''}
                        {interest}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
        {/* Action Buttons */}
        <View
          style={[
            styles.actionButtons,
            {
              backgroundColor: theme.surface,
              borderTopColor: theme.border,
            },
          ]}
        >
          {checkingMatch ? (
            // Show loading state while checking match status
            <>
              <View style={styles.actionButton}>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  Loading...
                </Text>
              </View>
              <View style={styles.actionButton} />
              <View style={styles.actionButton} />
            </>
          ) : isMatched ? (
            // Already matched - show only unmatch and message
            <>
              {onUnmatch && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.dislikeButton]}
                  onPress={() => onUnmatch(user.id)}
                >
                  <X size={24} color={theme.error} />
                </TouchableOpacity>
              )}

              {onMessage && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.messageButton]}
                  onPress={() => onMessage(user.id)}
                >
                  <MessageCircle size={24} color={theme.primary} />
                </TouchableOpacity>
              )}
            </>
          ) : (
            // Not matched yet - show all options
            <>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.dislikeButton,
                  isDisliked && { opacity: 0.5 },
                ]}
                onPress={() => onDislike(user.id)}
                disabled={isDisliked}
              >
                <X
                  size={24}
                  color={isDisliked ? theme.textSecondary : theme.error}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.likeButton,
                  isLiked && { opacity: 0.5 },
                ]}
                onPress={() => onLike(user.id)}
                disabled={isLiked}
              >
                <Heart
                  size={24}
                  color={isLiked ? theme.textSecondary : theme.primary}
                  fill={isLiked ? theme.primary : 'transparent'}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
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
    width: '100%',
  },
  imageSliderContent: {
    alignItems: 'center',
    paddingHorizontal: (width - width * 0.75) / 2,
  },
  imageSlide: {
    width: width * 0.75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: 20,
    maxHeight: 300,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dot: {
    borderRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  badgesContainer: {
    position: 'absolute',
    top: 30,
    right: width * 0.15,
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-end',
  },
  ageBadge: {
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
  zodiacBadgeWrapper: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  heightText: {
    fontSize: 20,
    fontWeight: 'normal',
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
    marginBottom: 50,
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
    borderTopColor: '#E0E0E0',
    marginBottom: 90,
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
    borderTopColor: '#E0E0E0',
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
