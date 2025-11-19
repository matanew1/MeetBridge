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
  AlertCircle,
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
import BlockReportModal from './BlockReportModal';
import { auth, db } from '../../services/firebase/config';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { useUserStore } from '../../store';

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
  isMissedConnection?: boolean; // Hide heart button for missed connections
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
  isMissedConnection = false,
}: ProfileDetailProps) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageScrollRef = useRef<FlatList>(null);
  const [isMatched, setIsMatched] = useState(false);
  const [checkingMatch, setCheckingMatch] = useState(true);
  const [showBlockReportModal, setShowBlockReportModal] = useState(false);
  const removeProfileFromLists = useUserStore(
    (state) => state.removeProfileFromLists
  );

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
          {user.name}
        </Text>
        <TouchableOpacity
          onPress={() => setShowBlockReportModal(true)}
          style={styles.closeButton}
        >
          <AlertCircle size={24} color={theme.textSecondary} />
        </TouchableOpacity>
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

          {/* Action Buttons - Centered and Prominent */}
          <View style={styles.contentActionButtons}>
            {checkingMatch ? (
              <View style={styles.contentActionButton}>
                <Text style={{ color: theme.textSecondary, fontSize: 16 }}>
                  Loading...
                </Text>
              </View>
            ) : isMatched ? (
              // Already matched - show unmatch and message
              <>
                {onMessage && (
                  <TouchableOpacity
                    style={[styles.contentActionButton, styles.messageButton]}
                    onPress={() => onMessage(user.id)}
                  >
                    <MessageCircle size={28} color={theme.primary} />
                  </TouchableOpacity>
                )}
                {onUnmatch && (
                  <TouchableOpacity
                    style={[styles.contentActionButton, styles.dislikeButton]}
                    onPress={() => onUnmatch(user.id)}
                  >
                    <X size={28} color={theme.error} />
                  </TouchableOpacity>
                )}
              </>
            ) : isMissedConnection ? (
              // Missed connection - show only unmatch
              <>
                {onUnmatch && (
                  <TouchableOpacity
                    style={[styles.contentActionButton, styles.dislikeButton]}
                    onPress={() => onUnmatch(user.id)}
                  >
                    <X size={28} color={theme.error} />
                  </TouchableOpacity>
                )}
              </>
            ) : (
              // Not matched yet - show like and dislike
              <>
                <TouchableOpacity
                  style={[
                    styles.contentActionButton,
                    styles.likeButton,
                    isLiked && { opacity: 0.5 },
                  ]}
                  onPress={() => onLike(user.id)}
                  disabled={isLiked}
                >
                  <Heart
                    size={28}
                    color={isLiked ? theme.textSecondary : theme.primary}
                    fill={isLiked ? theme.primary : 'transparent'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.contentActionButton,
                    styles.dislikeButton,
                    isDisliked && { opacity: 0.5 },
                  ]}
                  onPress={() => onDislike(user.id)}
                  disabled={isDisliked}
                >
                  <X
                    size={28}
                    color={isDisliked ? theme.textSecondary : theme.error}
                  />
                </TouchableOpacity>
              </>
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
      </ScrollView>
      {/* Block/Report Modal */}
      <BlockReportModal
        visible={showBlockReportModal}
        onClose={() => setShowBlockReportModal(false)}
        userId={user.id}
        userName={user.name}
        onBlockSuccess={() => {
          removeProfileFromLists(user.id);
          onClose();
        }}
      />
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
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: scale(5),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
  },
  placeholder: {
    width: scale(34),
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    position: 'relative',
    alignItems: 'center',
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(20),
    width: '100%',
  },
  imageSliderContent: {
    alignItems: 'center',
    paddingHorizontal: Math.max(
      (width - Math.min(width * 0.75, scale(320))) / 2,
      scale(10)
    ), // Responsive padding with minimum
  },
  imageSlide: {
    width: Math.min(width * 0.75, scale(320)), // Cap slide width for tablets
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: Math.min(width * 0.8, scale(300)), // Cap at reasonable size for tablets
    height: Math.min(width * 0.8, scale(300)), // Cap at reasonable size for tablets
    borderRadius: borderRadius.lg,
    maxHeight: verticalScale(320),
    shadowOffset: { width: 0, height: scale(8) },
    shadowOpacity: 0.3,
    shadowRadius: scale(16),
    elevation: 8,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: verticalScale(35),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(16),
    borderRadius: scale(25),
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dot: {
    borderRadius: scale(4),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 0.3,
    shadowRadius: scale(2),
  },
  badgesContainer: {
    position: 'absolute',
    top: verticalScale(30),
    right: width * 0.15,
    flexDirection: 'column',
    gap: scale(8),
    alignItems: 'flex-end',
  },
  ageBadge: {
    borderRadius: scale(20),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.2,
    shadowRadius: scale(6),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ageText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  zodiacBadgeWrapper: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
  },
  profileInfo: {
    flex: 1,
    paddingBottom: verticalScale(20),
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
    paddingHorizontal: scale(20),
  },
  nameText: {
    fontSize: moderateScale(28),
    fontWeight: 'bold',
    marginBottom: verticalScale(8),
  },
  heightText: {
    fontSize: moderateScale(20),
    fontWeight: 'normal',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: moderateScale(16),
    marginLeft: scale(4),
  },
  bioSection: {
    marginBottom: verticalScale(30),
    marginHorizontal: scale(24),
    borderRadius: borderRadius.xl,
    padding: scale(24),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.15,
    shadowRadius: scale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bioText: {
    fontSize: moderateScale(16),
    lineHeight: verticalScale(26),
    textAlign: 'center',
    fontWeight: '400',
  },
  interestsSection: {
    marginBottom: verticalScale(2),
    paddingHorizontal: scale(20),
  },
  sectionTitle: {
    fontSize: moderateScale(20),
    fontWeight: '600',
    marginBottom: verticalScale(15),
    textAlign: 'center',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: scale(10),
    marginBottom: verticalScale(50),
  },
  interestChip: {
    backgroundColor: 'rgba(142, 68, 173, 0.1)',
    borderRadius: scale(25),
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(10),
    marginBottom: verticalScale(10),
    borderWidth: 1,
    borderColor: 'rgba(142, 68, 173, 0.2)',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 2,
  },
  interestText: {
    fontSize: moderateScale(14),
    color: '#8E44AD',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  socialSection: {
    marginBottom: verticalScale(100),
    paddingHorizontal: scale(20),
    width: '100%',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: scale(10),
  },
  socialButton: {
    borderRadius: scale(25),
    width: scale(50),
    height: scale(50),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    margin: scale(5),
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: scale(40),
    paddingVertical: verticalScale(24),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: verticalScale(100),
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
  },
  actionButton: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.2,
    shadowRadius: scale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dislikeButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  messageButton: {
    backgroundColor: 'rgba(142, 68, 173, 0.1)',
  },
  likeButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  headerActionButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  contentActionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(24),
    paddingVertical: verticalScale(30),
    paddingHorizontal: scale(40),
  },
  contentActionButton: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(36),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.25,
    shadowRadius: scale(12),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  unmatchSection: {
    paddingHorizontal: scale(40),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(20),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  unmatchButtonDetail: {
    backgroundColor: '#FFEBEE',
    paddingVertical: verticalScale(15),
    paddingHorizontal: scale(24),
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 0.1,
    shadowRadius: scale(3),
  },
  unmatchButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#D32F2F',
  },
});

export default ProfileDetail;
