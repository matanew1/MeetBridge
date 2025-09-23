import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Heart, Check, ShoppingCart, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useUserStore } from '../../store';
import ProfileDetail from '../components/ProfileDetail';

const { width, height } = Dimensions.get('window');

interface ProfileCardProps {
  user: {
    id: string;
    name: string;
    age: number;
    distance?: number;
    image: string;
  };
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  onPress: (user: any) => void;
  isLiked: boolean;
  isDisliked: boolean;
}

const ProfileCard = ({
  user,
  onLike,
  onDislike,
  onPress,
  isLiked,
  isDisliked,
}: ProfileCardProps) => (
  <View style={styles.cardContainer}>
    <TouchableOpacity
      style={[
        styles.card,
        isLiked && styles.likedCard,
        isDisliked && styles.dislikedCard,
      ]}
      onPress={() => onPress(user)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: user.image }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardText}>
          {user.age}, {user.name}
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.dislikeBtn]}
          onPress={(e) => {
            e.stopPropagation();
            onDislike(user.id);
          }}
          disabled={isDisliked || isLiked}
        >
          <X size={16} color="#FF6B6B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.likeBtn]}
          onPress={(e) => {
            e.stopPropagation();
            onLike(user.id);
          }}
          disabled={isLiked || isDisliked}
        >
          <Heart
            size={16}
            color="#FF69B4"
            fill={isLiked ? '#FF69B4' : 'transparent'}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>

    {user.distance && (
      <View style={styles.distanceContainer}>
        <Text style={styles.distanceText}>{user.distance}ק"מ</Text>
      </View>
    )}
  </View>
);

export default function SearchScreen() {
  const { t } = useTranslation();
  const [showAnimation, setShowAnimation] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [showUnmatchConfirm, setShowUnmatchConfirm] = useState(false);
  const [unmatchProfileId, setUnmatchProfileId] = useState<string | null>(null);

  // Zustand store
  const {
    searchFilters,
    matchProfiles,
    centerProfile,
    isSearching,
    discoverProfiles,
    isLoadingDiscover,
    likedProfiles,
    dislikedProfiles,
    matchedProfiles,
    updateSearchFilters,
    startSearch,
    clearSearch,
    loadDiscoverProfiles,
    loadCurrentUser,
    likeProfile,
    dislikeProfile,
    unmatchProfile,
    getMatchedProfiles,
    triggerSearchAnimation,
    error,
    isLoadingLike,
    isLoadingUnmatch,
    loadConversations,
    createConversation,
  } = useUserStore();

  // Animation values
  const pulseAnimation = useSharedValue(0);

  useEffect(() => {
    // Load current user and discover profiles on component mount
    loadCurrentUser(); // Ensure we have a current user for like/dislike functionality
    loadConversations(); // Load existing conversations
    loadDiscoverProfiles(true);

    // Small delay to ensure profiles are loaded before starting animation
    setTimeout(() => {
      setShowAnimation(true);
      triggerSearchAnimation();
    }, 500); // Increased delay to allow for async loading
  }, []); // Empty dependency array means this runs only once on mount

  // Handle when isSearching changes (from button trigger or auto-trigger)
  useEffect(() => {
    if (!isSearching && showAnimation) {
      // Animation ended via trigger
      setShowAnimation(false);
    }
  }, [isSearching]);

  useEffect(() => {
    // Strong, noticeable infinite pulse animation
    pulseAnimation.value = withRepeat(
      withTiming(1, {
        duration: 2000, // Faster for more noticeable effect
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // Infinite loop
      true // reverse=true creates seamless back-and-forth motion
    );
  }, []);

  // Handle gender selection
  const handleGenderChange = (gender: 'male' | 'female') => {
    updateSearchFilters({ gender });
    startSearch(); // Start new search with updated filters
  };

  const handleLike = (profileId: string) => {
    console.log('handleLike called for profile:', profileId);
    likeProfile(profileId);
  };

  const handleDislike = (profileId: string) => {
    console.log('handleDislike called for profile:', profileId);
    dislikeProfile(profileId);
  };

  const handleProfilePress = (user: any) => {
    setSelectedProfile(user);
    setShowProfileDetail(true);
  };

  const handleCloseProfile = () => {
    setShowProfileDetail(false);
    setSelectedProfile(null);
  };

  const handleMessage = (profileId: string) => {
    // TODO: Navigate to chat with this profile
    console.log('Message profile:', profileId);
    handleCloseProfile();
  };

  const handleUnmatch = (profileId: string) => {
    console.log('handleUnmatch called with profileId:', profileId);

    // Use custom modal instead of Alert.alert
    setUnmatchProfileId(profileId);
    setShowUnmatchConfirm(true);
  };

  const confirmUnmatch = () => {
    if (unmatchProfileId) {
      console.log('Confirming unmatch for:', unmatchProfileId);
      unmatchProfile(unmatchProfileId);
      handleCloseProfile();
    }
    setShowUnmatchConfirm(false);
    setUnmatchProfileId(null);
  };

  const cancelUnmatch = () => {
    setShowUnmatchConfirm(false);
    setUnmatchProfileId(null);
  };

  const handleSearchButton = () => {
    // Trigger the search animation (which now includes refresh functionality)
    setShowAnimation(true);
    triggerSearchAnimation();
  };

  // Animated styles
  const pulseStyle = useAnimatedStyle(() => {
    // Create a strong, noticeable breathing effect
    const scale = interpolate(
      pulseAnimation.value,
      [0, 1],
      [1, 1.08] // Much more noticeable scale change
    );

    const opacity = interpolate(
      pulseAnimation.value,
      [0, 1],
      [0.7, 1] // More dramatic opacity change
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Show animation when searching or triggered by button
  if (showAnimation || isSearching) {
    return (
      <View style={styles.container}>
        {/* Circular Search Interface */}
        <View style={styles.searchInterface}>
          <Text style={styles.searchTitle}>מחפש את ההתאמה המושלמת...</Text>
          {/* Single Animated Structure */}
          <Animated.View style={[styles.circularStructure, pulseStyle]}>
            {/* Outer Circle */}
            <View style={styles.outerCircle}>
              {/* Middle Circle */}
              <View style={styles.middleCircle}>
                {/* Inner Circle */}
                <View style={styles.innerCircle}>
                  {/* Center Profile */}
                  <View style={styles.centerProfileContainer}>
                    {centerProfile ? (
                      <Image
                        source={{ uri: centerProfile.image }}
                        style={styles.centerProfile}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.placeholderProfile}>
                        <Text style={styles.placeholderText}>?</Text>
                      </View>
                    )}
                    {/* Heart Icon positioned over center profile */}
                    <View style={styles.heartContainer}>
                      <Heart size={22} color="#AB47BC" fill="#AB47BC" />
                    </View>
                  </View>
                </View>
              </View>

              {/* Fixed Position Profiles */}
              {matchProfiles.map((profile, index) => {
                const angle = index * 72 - 90; // 360/5 = 72 degrees apart, start from top
                const x = Math.cos((angle * Math.PI) / 180) * profile.radius;
                const y = Math.sin((angle * Math.PI) / 180) * profile.radius;

                return (
                  <View
                    key={profile.id}
                    style={[
                      styles.surroundingProfile,
                      {
                        width: profile.size,
                        height: profile.size,
                        borderRadius: profile.size / 2,
                        transform: [{ translateX: x }, { translateY: y }],
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: profile.image }}
                      style={styles.profileImage}
                      resizeMode="cover"
                    />
                  </View>
                );
              })}
            </View>
          </Animated.View>

          {/* Searching indicator */}
          <View style={styles.searchingIndicator}>
            <Text style={styles.searchingText}>מחפש...</Text>
          </View>
        </View>
      </View>
    );
  }

  // Show discover content after animation
  if (isLoadingDiscover) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#8E44AD" />
        <Text style={styles.loadingText}>{t('loading', 'טוען...')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>גלה אנשים</Text>
        <TouchableOpacity
          style={[styles.refreshButton, styles.searchButton]}
          onPress={handleSearchButton}
          disabled={isSearching || showAnimation}
        >
          <Text style={styles.refreshText}>
            {isSearching || showAnimation ? 'מחפש...' : 'חיפוש חדש'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {discoverProfiles.map((user) => (
            <View key={user.id} style={styles.gridItem}>
              <ProfileCard
                user={user}
                onLike={handleLike}
                onDislike={handleDislike}
                onPress={handleProfilePress}
                isLiked={likedProfiles.includes(user.id)}
                isDisliked={dislikedProfiles.includes(user.id)}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Profile Detail Modal */}
      {showProfileDetail && selectedProfile && (
        <View style={styles.modalOverlay}>
          <ProfileDetail
            user={selectedProfile}
            onClose={handleCloseProfile}
            onLike={handleLike}
            onDislike={handleDislike}
            onMessage={
              // Only allow messaging if it's a match
              getMatchedProfiles().some(
                (match) => match.id === selectedProfile.id
              )
                ? handleMessage
                : undefined
            }
            onUnmatch={
              // Only allow unmatching if it's a match
              getMatchedProfiles().some(
                (match) => match.id === selectedProfile.id
              )
                ? handleUnmatch
                : undefined
            }
            isLiked={likedProfiles.includes(selectedProfile.id)}
            isDisliked={dislikedProfiles.includes(selectedProfile.id)}
          />
        </View>
      )}

      {/* Custom Unmatch Confirmation Modal */}
      {showUnmatchConfirm && (
        <View style={styles.centeredModalOverlay}>
          <View style={styles.confirmationModal}>
            <View style={styles.confirmationIcon}>
              <X size={32} color="#FF6B6B" />
            </View>
            <Text style={styles.confirmationTitle}>בטל התאמה</Text>
            <Text style={styles.confirmationText}>
              האם אתה בטוח שברצונך לבטל את ההתאמה? פעולה זו תמחק גם את השיחה
              ביניכם ולא תוכל לשחזר אותה.
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={cancelUnmatch}
              >
                <Text style={styles.cancelButtonText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.deleteButton]}
                onPress={confirmUnmatch}
              >
                <Text style={styles.deleteButtonText}>בטל התאמה</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf1fcff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#8E44AD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  searchButton: {
    backgroundColor: '#AB47BC',
  },
  refreshText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E44AD',
    marginTop: 10,
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  cardContainer: {
    position: 'relative',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    aspectRatio: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likedCard: {
    borderColor: '#FF69B4',
    borderWidth: 2,
  },
  dislikedCard: {
    opacity: 0.5,
    borderColor: '#FF6B6B',
    borderWidth: 2,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 5,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dislikeBtn: {
    backgroundColor: '#FFE5E5',
  },
  likeBtn: {
    backgroundColor: '#FFE5F4',
  },
  distanceContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#c9b7e9ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    zIndex: 2,
    minWidth: 40,
    alignItems: 'center',
  },
  distanceText: {
    color: '#461237ff',
    fontSize: 11,
    fontWeight: '600',
  },
  cardInfo: {
    alignItems: 'center',
  },
  cardText: {
    fontSize: 17,
    color: '#333',
    textAlign: 'center',
  },
  // Animation styles
  searchInterface: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 40,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8E44AD',
    marginBottom: 40,
    textAlign: 'center',
  },
  circularStructure: {
    width: 340,
    height: 340,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  outerCircle: {
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(225, 200, 235, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#AB47BC',
    borderStyle: 'dashed',
  },
  middleCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(245, 225, 250, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  centerProfileContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#4FC3F7',
    borderStyle: 'dashed',
    backgroundColor: '#4FC3F7',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerProfile: {
    width: '100%',
    height: '100%',
  },
  placeholderProfile: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E1C8EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    color: '#AB47BC',
    fontWeight: 'bold',
  },
  heartContainer: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#FFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  surroundingProfile: {
    position: 'absolute',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  searchingIndicator: {
    position: 'absolute',
    bottom: -120,
    backgroundColor: 'rgba(142, 68, 173, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  searchingText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  centeredModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationModal: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    maxWidth: 340,
    width: '90%',
  },
  confirmationIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    elevation: 2,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
