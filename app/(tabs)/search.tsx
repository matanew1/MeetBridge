// app/(tabs)/search.tsx
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import {
  Heart,
  X,
  SlidersVertical,
  RefreshCw,
  ChevronDown,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useUserStore } from '../../store';
import ProfileDetail from '../components/ProfileDetail';
import MatchModal from '../components/MatchModal';
import FilterModal from '../components/FilterModal';
import DiscoveryAnimation from '../components/DiscoveryAnimation';
import EnhancedMatchAnimation from '../components/EnhancedMatchAnimation';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { lightTheme, darkTheme, Theme } from '../../constants/theme';
import { FirebaseDiscoveryService } from '../../services/firebase/firebaseServices';
import { services } from '../../services';
import notificationService from '../../services/notificationService';

import {
  scale,
  verticalScale,
  moderateScale,
  getNumColumns,
  spacing,
  borderRadius,
  deviceInfo,
} from '../../utils/responsive';

const { width } = Dimensions.get('window');

interface ProfileCardProps {
  user: {
    id: string;
    name: string;
    age: number;
    distance?: number | null;
    image: string;
    images?: string[];
  };
  onPress: (user: any) => void;
  isLiked: boolean;
  isDisliked: boolean;
  isAnimatingOut: boolean;
  theme: Theme;
}

const ProfileCard = memo(
  ({
    user,
    onPress,
    isLiked,
    isDisliked,
    isAnimatingOut,
    theme,
  }: ProfileCardProps) => {
    const { t } = useTranslation();
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);
    const scale = useSharedValue(0.9);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Get user images always user.image and if images > 0 then use images array (which already includes user.image as first item)
    const userImages = useMemo(
      () =>
        user.images && user.images.length > 0
          ? [user.image, ...user.images]
          : [user.image],
      [user.images, user.image]
    );

    React.useEffect(() => {
      // Faster entrance animation
      opacity.value = withTiming(1, {
        duration: 150,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withTiming(0, {
        duration: 150,
        easing: Easing.out(Easing.cubic),
      });
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    }, []);

    React.useEffect(() => {
      if (isAnimatingOut) {
        // Faster exit animation
        opacity.value = withTiming(0, {
          duration: 120,
          easing: Easing.in(Easing.cubic),
        });
        translateY.value = withTiming(isLiked || !isDisliked ? -80 : 80, {
          duration: 150,
          easing: Easing.in(Easing.cubic),
        });
        scale.value = withSequence(
          withTiming(1.02, { duration: 40, easing: Easing.out(Easing.cubic) }),
          withTiming(0.85, { duration: 110, easing: Easing.in(Easing.cubic) })
        );
      }
    }, [isAnimatingOut, isLiked, isDisliked]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
    }));

    // Navigate to previous image
    const handlePreviousImage = (e: any) => {
      e.stopPropagation(); // Prevent opening profile
      if (currentImageIndex > 0) {
        setCurrentImageIndex(currentImageIndex - 1);
      }
    };

    // Navigate to next image
    const handleNextImage = (e: any) => {
      e.stopPropagation(); // Prevent opening profile
      if (currentImageIndex < userImages.length - 1) {
        setCurrentImageIndex(currentImageIndex + 1);
      }
    };

    // Safely get image URI
    const currentImageUri = userImages[currentImageIndex] || '';
    const hasValidImage = currentImageUri && currentImageUri.trim().length > 0;

    return (
      <Animated.View style={[styles.cardContainer, animatedStyle]}>
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBackground,
              shadowColor: theme.shadow,
            },
            isLiked && [
              styles.likedCard,
              { borderColor: theme.primary, shadowColor: theme.primary },
            ],
            isDisliked && [
              styles.dislikedCard,
              { borderColor: theme.error, shadowColor: theme.error },
            ],
          ]}
          onPress={() => onPress(user)}
          disabled={isLiked || isDisliked || isAnimatingOut}
          activeOpacity={0.7}
        >
          <View style={styles.imageContainer}>
            <Image
              source={
                hasValidImage
                  ? { uri: currentImageUri }
                  : require('../../assets/images/placeholder.png')
              }
              style={styles.cardImage}
              resizeMode="cover"
            />

            {/* Image navigation zones - only show if multiple images */}
            {userImages.length > 1 && (
              <>
                {/* Left tap zone - previous image */}
                {currentImageIndex > 0 && (
                  <TouchableOpacity
                    style={styles.imageNavLeft}
                    onPress={handlePreviousImage}
                    activeOpacity={1}
                  />
                )}

                {/* Right tap zone - next image */}
                {currentImageIndex < userImages.length - 1 && (
                  <TouchableOpacity
                    style={styles.imageNavRight}
                    onPress={handleNextImage}
                    activeOpacity={1}
                  />
                )}
              </>
            )}
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardText, { color: theme.text }]}>
              {user.name || 'Unknown'}, {user.age || 0}
            </Text>
          </View>

          {/* Action buttons removed - now available in profile detail */}
        </TouchableOpacity>

        {user.distance !== null && user.distance !== undefined && (
          <View
            style={[
              styles.distanceContainer,
              {
                backgroundColor: `${theme.primary}E6`,
                shadowColor: theme.shadow,
              },
            ]}
          >
            <Text style={[styles.distanceText, { color: theme.textOnPrimary }]}>
              {user.distance >= 1000
                ? `${(user.distance / 1000).toFixed(1)}km`
                : `${Math.round(user.distance)}m`}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for memo - only re-render if these props change
    // Most common changes first for early exit
    if (prevProps.isAnimatingOut !== nextProps.isAnimatingOut) return false;
    if (prevProps.isLiked !== nextProps.isLiked) return false;
    if (prevProps.isDisliked !== nextProps.isDisliked) return false;
    if (prevProps.user.id !== nextProps.user.id) return false;

    // Image comparisons (less frequent changes)
    if (prevProps.user.image !== nextProps.user.image) return false;

    // Avoid JSON.stringify - compare array lengths and elements
    const prevImages = prevProps.user.images || [];
    const nextImages = nextProps.user.images || [];
    if (prevImages.length !== nextImages.length) return false;
    if (!prevImages.every((img, idx) => img === nextImages[idx])) return false;

    // IMPORTANT: Check if theme has changed (for dark/light mode switching)
    if (prevProps.theme !== nextProps.theme) return false;

    // Distance changes shouldn't trigger re-render (display only)
    return true;
  }
);

// Create discovery service instance outside component to avoid recreating
const discoveryService = new FirebaseDiscoveryService();

export default function SearchScreen() {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    updateProfile,
  } = useAuth();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();
  const [showAnimation, setShowAnimation] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [showUnmatchConfirm, setShowUnmatchConfirm] = useState(false);
  const [unmatchProfileId, setUnmatchProfileId] = useState<string | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [maxDistance, setMaxDistance] = useState(500); // Default to 500m max range (precision 9)
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 99]); // Default age range 18-99
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [showUnmatchAnimation, setShowUnmatchAnimation] = useState(false);
  const [matchData, setMatchData] = useState<{
    user: any;
    matchId: string;
    conversationId?: string;
  } | null>(null);

  // Local state to track cards being animated out
  const [animatingOutCards, setAnimatingOutCards] = useState<Set<string>>(
    new Set()
  );
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const processedMatchesRef = useRef<Set<string>>(new Set());

  // Animation values
  const pulseAnimation = useSharedValue(0);

  const {
    searchFilters,
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
    loadConversations,
    createConversation,
    currentUser,
  } = useUserStore();

  // Sort profiles by distance and filter out matched/liked/disliked profiles (handle null distances)
  // Also deduplicate by ID to prevent duplicate key errors
  // Memoized for performance - only recalculate when dependencies change
  const sortedDiscoverProfiles = useMemo(() => {
    // Convert arrays to Sets for O(1) lookup instead of O(n)
    const matchedSet = new Set(matchedProfiles);
    const likedSet = new Set(likedProfiles);
    const dislikedSet = new Set(dislikedProfiles);
    const seenIds = new Set<string>();

    return discoverProfiles
      .filter((profile) => {
        // Quick rejection checks first (most common filters)
        if (matchedSet.has(profile.id)) return false;
        if (likedSet.has(profile.id)) return false;
        if (dislikedSet.has(profile.id)) return false;

        // Deduplicate by ID (check if we've seen this ID before)
        if (seenIds.has(profile.id)) return false;
        seenIds.add(profile.id);

        // Age range filter (client-side safety check)
        const profileAge = profile.age || 0;
        if (profileAge < ageRange[0] || profileAge > ageRange[1]) return false;

        return true;
      })
      .sort((a, b) => {
        // Sort by distance (nullish distances go to end)
        const distA = a.distance ?? Number.MAX_SAFE_INTEGER;
        const distB = b.distance ?? Number.MAX_SAFE_INTEGER;
        return distA - distB;
      });
  }, [
    discoverProfiles,
    matchedProfiles,
    likedProfiles,
    dislikedProfiles,
    ageRange,
  ]);

  const updateUserPreferences = useCallback(() => {
    // Update search filters based on user preferences
    if (currentUser) {
      let maxDistanceMeters = currentUser.preferences?.maxDistance || 500; // Default to 500m max range

      // Safety check: If maxDistance is less than 5m (minimum), set to 500m default
      if (maxDistanceMeters < 5) {
        console.warn(
          `⚠️ maxDistance too small (${maxDistanceMeters}m), using 500m default`
        );
        maxDistanceMeters = 500;
      }

      const userAgeRange = currentUser.preferences?.ageRange || [18, 99];
      console.log('📍 Updating preferences from user data:', {
        maxDistance: maxDistanceMeters,
        ageRange: userAgeRange,
        rawPreferences: currentUser.preferences,
      });
      setMaxDistance(maxDistanceMeters);
      setAgeRange(userAgeRange as [number, number]);
      updateSearchFilters({
        gender: currentUser.preferences?.interestedIn,
        ageRange: userAgeRange,
        maxDistance: maxDistanceMeters,
      });
    }
  }, [currentUser, updateSearchFilters]);

  // Handle authentication redirect
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isAuthLoading]);

  useEffect(() => {
    // Only load profiles if user is authenticated
    if (isAuthenticated && !isAuthLoading) {
      // Load data sequentially to ensure user is loaded before profiles
      const loadData = async () => {
        await loadCurrentUser(); // Ensure we have a current user first
        // Wait a bit for currentUser state to be set
        await new Promise((resolve) => setTimeout(resolve, 100));
        loadConversations(); // Load existing conversations
        // Don't load profiles here - let the currentUser useEffect handle it
      };

      loadData();
    }
  }, [isAuthenticated, isAuthLoading]); // Run when authentication state changes

  // Handle when currentUser changes - update preferences and load profiles
  // Prefetch images for better scrolling performance
  useEffect(() => {
    if (sortedDiscoverProfiles.length > 0) {
      // Prefetch first 3 profile images
      sortedDiscoverProfiles.slice(0, 3).forEach((profile) => {
        const images =
          profile.images && profile.images.length > 0
            ? profile.images
            : [profile.image];

        // Prefetch main image for each profile
        if (images[0]) {
          Image.prefetch(images[0]).catch(() => {
            // Silently fail - not critical
          });
        }
      });
    }
  }, [sortedDiscoverProfiles]);

  // ⚡ ALWAYS refresh profiles when search tab is focused - NO CACHE
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Search tab focused - refreshing profiles from Firebase');
      if (currentUser && isAuthenticated) {
        // Always fetch fresh data when tab is focused
        loadDiscoverProfiles(true);
      }
    }, [currentUser, isAuthenticated, loadDiscoverProfiles])
  );

  // Track if we've already loaded profiles to avoid redundant calls
  const profilesLoadedRef = useRef(false);

  useEffect(() => {
    if (currentUser && isAuthenticated && !profilesLoadedRef.current) {
      updateUserPreferences();

      // Load profiles after preferences are updated
      const loadTimer = setTimeout(() => {
        loadDiscoverProfiles(true);
        profilesLoadedRef.current = true;

        // Start animation after profiles load
        const animTimer = setTimeout(() => {
          setShowAnimation(true);
          triggerSearchAnimation();
        }, 500);

        // Cleanup animation timer
        return () => clearTimeout(animTimer);
      }, 200); // Small delay to ensure preferences are updated in store

      // Cleanup load timer
      return () => clearTimeout(loadTimer);
    }
  }, [currentUser?.id]); // Run only when currentUser ID changes, not on every coordinate update

  // Handle when isSearching changes (from button trigger or auto-trigger)
  useEffect(() => {
    if (!isSearching && showAnimation) {
      // Animation ended via trigger
      setShowAnimation(false);
    }
  }, [isSearching]);

  useEffect(() => {
    pulseAnimation.value = withRepeat(
      withTiming(1, {
        duration: 1800,
        easing: Easing.bezier(0.45, 0.05, 0.55, 0.95),
      }),
      -1,
      true
    );
  }, []);

  // Subscribe to new matches in real-time
  useEffect(() => {
    if (!currentUser) return;

    console.log('🔔 Setting up real-time match listener');

    // Import Firebase functions inline
    const {
      collection,
      query,
      where,
      orderBy,
      limit,
      onSnapshot,
      doc: firestoreDoc,
      getDoc,
    } = require('firebase/firestore');
    const { db } = require('../../services/firebase/config');

    // Inline timestamp converter
    const convertTimestamp = (timestamp: any): Date | undefined => {
      if (timestamp?.toDate) return timestamp.toDate();
      if (timestamp?.seconds) return new Date(timestamp.seconds * 1000);
      return timestamp;
    };

    // Listen for matches where current user is user1
    const matchesQuery1 = query(
      collection(db, 'matches'),
      where('user1', '==', currentUser.id),
      where('unmatched', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    // Listen for matches where current user is user2
    const matchesQuery2 = query(
      collection(db, 'matches'),
      where('user2', '==', currentUser.id),
      where('unmatched', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const handleMatchChange = async (change: any, isUser1: boolean) => {
      const matchData = change.doc.data();
      const otherUserId = isUser1 ? matchData.user2 : matchData.user1;

      // Handle match removal (unmatch)
      if (change.type === 'removed') {
        console.log(
          `🚫 Real-time unmatch detected in search! User ${otherUserId} was unmatched`
        );

        // Remove match from processed matches
        processedMatchesRef.current.delete(change.doc.id);

        // Update store to remove unmatched user
        useUserStore.setState((state) => ({
          matchedProfiles: state.matchedProfiles.filter(
            (id) => id !== otherUserId
          ),
          matchedProfilesData: state.matchedProfilesData.filter(
            (profile) => profile.id !== otherUserId
          ),
          likedProfiles: state.likedProfiles.filter((id) => id !== otherUserId),
          likedProfilesData: state.likedProfilesData.filter(
            (profile) => profile.id !== otherUserId
          ),
          conversations: state.conversations.filter(
            (conv) => !conv.participants.includes(otherUserId)
          ),
        }));

        console.log(
          `✅ Removed ${otherUserId} from all lists in search screen`
        );
        return;
      }

      // Only process 'added' events and avoid duplicates
      if (
        change.type === 'added' &&
        !processedMatchesRef.current.has(change.doc.id)
      ) {
        processedMatchesRef.current.add(change.doc.id);

        const matchedUserId = otherUserId;

        console.log(
          `🎉 Real-time match notification received! Matched with: ${matchedUserId}, Match ID: ${change.doc.id}`
        );

        // Fetch matched user data
        const userDoc = await getDoc(firestoreDoc(db, 'users', matchedUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const matchedUser = {
            id: userDoc.id,
            ...userData,
            lastSeen: convertTimestamp(userData.lastSeen),
          };

          // Check if animation has already been played for this match
          const matchData = change.doc.data();
          const animationAlreadyPlayed = matchData.animationPlayed === true;

          // Check if this match is already being shown (avoid duplicate from likeProfile response)
          const currentMatchData = matchData;
          const isAlreadyShowing =
            showMatchAnimation &&
            matchData &&
            matchData.matchId === change.doc.id;

          // Update store with matched profile
          useUserStore.setState((state) => {
            // Check if already in matched profiles
            if (state.matchedProfiles.includes(matchedUserId)) {
              return state; // No update needed
            }
            return {
              matchedProfiles: [...state.matchedProfiles, matchedUserId],
              matchedProfilesData: [...state.matchedProfilesData, matchedUser],
              // Remove from discover profiles
              discoverProfiles: state.discoverProfiles.filter(
                (profile) => profile.id !== matchedUserId
              ),
            };
          });

          // Show match animation only if not already played and not currently showing
          if (!animationAlreadyPlayed && !isAlreadyShowing) {
            setMatchData({
              user: matchedUser,
              matchId: change.doc.id,
              conversationId: matchData.conversationId,
            });
            setShowMatchAnimation(true);

            // Send local notification to current user (this is for the user who receives the match via real-time listener)
            await notificationService.sendMatchNotification(
              matchedUser.name || 'Someone',
              change.doc.id
            );

            console.log(
              `✅ Match animation triggered for: ${matchedUser.name}`
            );
            console.log(`🗑️ Removed ${matchedUser.name} from discover queue`);
          } else {
            if (animationAlreadyPlayed) {
              console.log(
                `⏭️ Skipping match animation (already played) for: ${matchedUser.name}`
              );
            } else {
              console.log(
                `⏭️ Skipping duplicate match animation for: ${matchedUser.name}`
              );
            }
          }

          // Invalidate cache and reload conversations to get the new one
          if (currentUser) {
            const cacheService = require('../../services/cacheService').default;
            cacheService.invalidateByPrefix(`conversations_${currentUser.id}`);
          }
          loadConversations();
        }
      }
    };

    const unsubscribe1 = onSnapshot(
      matchesQuery1,
      (snapshot: any) => {
        snapshot
          .docChanges()
          .forEach((change: any) => handleMatchChange(change, true));
      },
      (error: any) => {
        // Handle permission-denied errors gracefully (expected during logout)
        if (error?.code === 'permission-denied') {
          console.log('⚠️ Match listener permission denied (user logged out)');
          return;
        }
        console.error('❌ Error in match listener 1:', error);
      }
    );

    const unsubscribe2 = onSnapshot(
      matchesQuery2,
      (snapshot: any) => {
        snapshot
          .docChanges()
          .forEach((change: any) => handleMatchChange(change, false));
      },
      (error: any) => {
        // Handle permission-denied errors gracefully (expected during logout)
        if (error?.code === 'permission-denied') {
          console.log('⚠️ Match listener permission denied (user logged out)');
          return;
        }
        console.error('❌ Error in match listener 2:', error);
      }
    );

    return () => {
      console.log('🔕 Cleaning up match listener');
      unsubscribe1();
      unsubscribe2();
    };
  }, [currentUser?.id]);

  const handleLike = useCallback(
    (profileId: string) => {
      console.log('handleLike called for profile:', profileId);

      // Close profile modal
      setShowProfileDetail(false);
      setSelectedProfile(null);

      // Find the user data before we remove it from the store
      const userToLike = discoverProfiles.find((p) => p.id === profileId);

      // Add to animating cards immediately for UI feedback
      setAnimatingOutCards((prev) => new Set([...prev, profileId]));

      // Delay the actual like action to allow animation to play
      setTimeout(() => {
        likeProfile(profileId)
          .then((result) => {
            // Remove from animating cards
            setAnimatingOutCards((prev) => {
              const newSet = new Set(prev);
              newSet.delete(profileId);
              return newSet;
            });

            // Check if it's a match using the new result structure
            if (result.isMatch && result.matchedUser && result.matchId) {
              // Mark this match as processed to prevent duplicate animation from real-time listener
              processedMatchesRef.current.add(result.matchId);

              // Use the new enhanced match animation
              setMatchData({
                user: result.matchedUser,
                matchId: result.matchId,
                conversationId: result.conversationId,
              });
              setShowMatchAnimation(true);

              // Only broadcast notification to the OTHER user (not to ourselves)
              // The current user will get their notification from the real-time listener
              if (currentUser) {
                notificationService.broadcastMatchNotification(
                  result.matchedUser.id,
                  currentUser.name || 'Someone',
                  result.matchId
                );
              }

              console.log(
                `✅ Match animation shown for: ${result.matchedUser.name} (from like action)`
              );
              console.log(
                `📢 Broadcast notification sent to: ${result.matchedUser.name}`
              );
            }
          })
          .catch((error) => {
            console.error('Error in handleLike:', error);
            // Remove from animating cards even on error
            setAnimatingOutCards((prev) => {
              const newSet = new Set(prev);
              newSet.delete(profileId);
              return newSet;
            });
          });
      }, 200); // Reduced from 300ms to 200ms for faster animation
    },
    [discoverProfiles, likeProfile, currentUser]
  );

  const handleDislike = useCallback(
    (profileId: string) => {
      console.log('handleDislike called for profile:', profileId);

      // Close the profile detail modal when disliking
      setShowProfileDetail(false);
      setSelectedProfile(null);

      // Add to animating cards immediately for UI feedback
      setAnimatingOutCards((prev) => new Set([...prev, profileId]));

      // Delay the actual dislike action to allow animation to play
      setTimeout(() => {
        dislikeProfile(profileId);
        // Remove from animating cards
        setAnimatingOutCards((prev) => {
          const newSet = new Set(prev);
          newSet.delete(profileId);
          return newSet;
        });
      }, 200); // Reduced from 300ms to 200ms for faster animation
    },
    [dislikeProfile]
  );

  const handleProfilePress = useCallback((user: any) => {
    setSelectedProfile(user);
    setShowProfileDetail(true);
  }, []);

  const handleCloseProfile = useCallback(() => {
    setShowProfileDetail(false);
    setSelectedProfile(null);
  }, []);

  // FlatList optimization callbacks (defined after handlers to avoid hoisting issues)
  const keyExtractor = useCallback((item: any) => item.id, []);

  const getItemLayout = useCallback((_data: any, index: number) => {
    const itemWidth = (width - spacing.xl) / getNumColumns(120); // Responsive columns with padding
    const row = Math.floor(index / 2);
    return {
      length: itemWidth + 20, // item height + margin
      offset: (itemWidth + 20) * row,
      index,
    };
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<any>) => (
      <View style={styles.gridItem}>
        <ProfileCard
          user={item}
          onPress={handleProfilePress}
          isLiked={likedProfiles.includes(item.id)}
          isDisliked={dislikedProfiles.includes(item.id)}
          isAnimatingOut={animatingOutCards.has(item.id)}
          theme={theme}
        />
      </View>
    ),
    [
      handleProfilePress,
      likedProfiles,
      dislikedProfiles,
      animatingOutCards,
      theme,
    ]
  );

  const ListEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyState}>
        <Heart size={60} color={theme.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          {t('search.noProfiles')}
        </Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          {t('search.checkBackLater')}
        </Text>
      </View>
    ),
    [theme, t]
  );

  const handleUnmatch = (profileId: string) => {
    console.log('handleUnmatch called with profileId:', profileId);

    // Use custom modal instead of Alert.alert
    setUnmatchProfileId(profileId);
    setShowUnmatchConfirm(true);
  };

  const confirmUnmatch = () => {
    if (unmatchProfileId) {
      console.log('Confirming unmatch for:', unmatchProfileId);

      // Show unmatch animation
      setShowUnmatchAnimation(true);

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

  const handleStartChatting = () => {
    setShowMatchModal(false);
    if (matchedUser && currentUser) {
      createConversation(matchedUser.id);
      // Generate the conversation ID that matches the backend format
      const conversationId = `conv_${currentUser.id}_${matchedUser.id}`;
      // Navigate to the specific chat
      router.push(`/chat/${conversationId}`);
    }
  };

  const handleCloseMatchModal = () => {
    setShowMatchModal(false);
    setMatchedUser(null);
  };

  const handleFilterPress = () => {
    setShowFilterModal(true);
  };

  const onRefresh = useCallback(async () => {
    console.log('🔄 Pull-to-refresh triggered');
    setRefreshing(true);
    try {
      // Clear the discover profiles cache to force fresh data from Firebase
      const cacheKey = `discoverProfiles_${JSON.stringify(searchFilters)}`;
      console.log('🗑️ Clearing cache:', cacheKey);

      // Call the cache service to remove old cache
      // We do this by calling loadDiscoverProfiles with refresh=true
      // which will clear the cached profiles
      await loadDiscoverProfiles(true);
      console.log('✅ Profiles refreshed successfully from Firebase');
    } catch (error) {
      console.error('❌ Error refreshing profiles:', error);
    } finally {
      setRefreshing(false);
      setPullDistance(0);
      setIsPulling(false);
    }
  }, [loadDiscoverProfiles, searchFilters]);

  // Custom pull-to-refresh handlers
  const handleScrollBeginDrag = useCallback(() => {
    setIsPulling(true);
  }, []);

  const handleScrollEndDrag = useCallback(
    (event: any) => {
      const { contentOffset } = event.nativeEvent;
      if (contentOffset.y < -80 && !refreshing) {
        // Trigger refresh only when finger is released and pull distance is sufficient
        onRefresh();
      } else {
        // Reset pull state if not refreshing
        setPullDistance(0);
        setIsPulling(false);
      }
    },
    [refreshing, onRefresh]
  );

  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset } = event.nativeEvent;
      if (isPulling && contentOffset.y < 0) {
        setPullDistance(Math.abs(contentOffset.y));
      }
    },
    [isPulling]
  );

  const handleMomentumScrollEnd = useCallback(() => {
    if (!refreshing) {
      setPullDistance(0);
      setIsPulling(false);
    }
  }, [refreshing]);

  // Debounce timer for filter changes
  const filterDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleDistanceChange = useCallback(
    async (distance: number) => {
      // Distance is already in meters from FilterModal
      console.log('🎯 handleDistanceChange called with:', distance);
      setMaxDistance(distance);
      updateSearchFilters({ maxDistance: distance });

      // Clear existing timer
      if (filterDebounceTimer.current) {
        clearTimeout(filterDebounceTimer.current);
      }

      // Debounce the Firebase update and reload (wait 500ms after user stops adjusting)
      filterDebounceTimer.current = setTimeout(async () => {
        // Update ONLY maxDistance field using dot notation (handled by firebaseServices)
        if (currentUser && updateProfile) {
          try {
            await updateProfile({
              preferences: {
                maxDistance: distance, // Only send the field we're updating
              },
            });
            console.log(`✅ maxDistance updated to ${distance}m in Firebase`);

            // Reload current user to get fresh data
            await loadCurrentUser();

            // Ensure search filters are updated (in case Firebase update failed)
            updateSearchFilters({ maxDistance: distance });

            // Reload profiles with new filter
            loadDiscoverProfiles(true);
          } catch (error) {
            console.error('❌ Error updating maxDistance:', error);
          }
        }
      }, 500);
    },
    [
      currentUser,
      updateProfile,
      updateSearchFilters,
      loadCurrentUser,
      loadDiscoverProfiles,
    ]
  );

  const handleAgeRangeChange = useCallback(
    async (newAgeRange: [number, number]) => {
      // Update local state and search filters (immediate UI feedback)
      setAgeRange(newAgeRange);
      updateSearchFilters({ ageRange: newAgeRange });

      // Clear existing timer
      if (filterDebounceTimer.current) {
        clearTimeout(filterDebounceTimer.current);
      }

      // Debounce the Firebase update and reload (wait 500ms after user stops adjusting)
      filterDebounceTimer.current = setTimeout(async () => {
        // Update ONLY ageRange field using dot notation (handled by firebaseServices)
        if (currentUser && updateProfile) {
          try {
            await updateProfile({
              preferences: {
                ageRange: newAgeRange, // Only send the field we're updating
              },
            });
            console.log(
              `✅ ageRange updated to [${newAgeRange[0]}, ${newAgeRange[1]}] in Firebase`
            );

            // Reload current user to get fresh data
            await loadCurrentUser();

            // Ensure search filters are updated (in case Firebase update failed)
            updateSearchFilters({ ageRange: newAgeRange });

            // Reload profiles with new filter
            loadDiscoverProfiles(true);
          } catch (error) {
            console.error('❌ Error updating ageRange:', error);
          }
        }
      }, 500);
    },
    [
      currentUser,
      updateProfile,
      updateSearchFilters,
      loadCurrentUser,
      loadDiscoverProfiles,
    ]
  );

  const handleMessage = (userId: string) => {
    // Find conversation with this user
    const conversation = useUserStore
      .getState()
      .conversations.find((conv) => conv.participants.includes(userId));

    if (conversation) {
      router.push(`/chat/${conversation.id}`);
    }
  };

  const handleMatchAnimationClose = async () => {
    // Mark animation as played before closing
    if (matchData?.matchId) {
      try {
        await services.matching.markMatchAnimationPlayed(matchData.matchId);
        console.log(
          `✅ Match animation marked as played for: ${matchData.matchId}`
        );
      } catch (error) {
        console.error('Failed to mark animation as played:', error);
      }
    }
    setShowMatchAnimation(false);
    setMatchData(null);
  };

  const handleSendMessage = async () => {
    if (matchData) {
      // Mark animation as played
      if (matchData.matchId) {
        try {
          await services.matching.markMatchAnimationPlayed(matchData.matchId);
          console.log(
            `✅ Match animation marked as played for: ${matchData.matchId}`
          );
        } catch (error) {
          console.error('Failed to mark animation as played:', error);
        }
      }
      setShowMatchAnimation(false);

      // Use the conversationId from match data (already created by backend)
      if (matchData.conversationId) {
        console.log(`🚀 Navigating to chat: ${matchData.conversationId}`);
        router.push(`/chat/${matchData.conversationId}`);
      } else {
        // Fallback: Find conversation in store
        const conversation = useUserStore
          .getState()
          .conversations.find((conv) =>
            conv.participants.includes(matchData.user.id)
          );

        if (conversation) {
          console.log(`🚀 Found conversation in store: ${conversation.id}`);
          router.push(`/chat/${conversation.id}`);
        } else {
          console.error('❌ No conversation ID available');
        }
      }
      setMatchData(null);
    }
  };

  // Animated styles
  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnimation.value, [0, 1], [1, 1.12]);

    const opacity = interpolate(pulseAnimation.value, [0, 1], [0.65, 1]);

    const rotate = interpolate(pulseAnimation.value, [0, 1], [0, 5]);

    return {
      transform: [{ scale }, { rotate: `${rotate}deg` }],
      opacity,
    };
  });

  // Show animation when searching or triggered by button
  if (showAnimation || isSearching) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <DiscoveryAnimation
          theme={theme}
          message={t('search.searchingPerfectMatch')}
        />
      </View>
    );
  }

  // Show discover content after animation
  if (isLoadingDiscover) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <DiscoveryAnimation theme={theme} />
      </View>
    );
  }

  // Show loading while checking authentication or redirecting
  if (isAuthLoading || !isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            {t('common.loading')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t('search.title')}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={handleFilterPress}
          >
            <SlidersVertical size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Professional Floating Pull-to-Refresh Indicator */}
      {pullDistance > 0 && (
        <Animated.View
          style={[
            styles.refreshIndicatorContainer,
            {
              opacity: Math.min(pullDistance / 60, 1),
              transform: [
                { translateY: Math.min(pullDistance / 1.5, 60) },
                { scale: Math.min(0.8 + pullDistance / 200, 1.1) },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.refreshIndicator,
              { backgroundColor: theme.surface, shadowColor: theme.shadow },
            ]}
          >
            <Animated.View
              style={[
                styles.refreshIconContainer,
                {
                  transform: [
                    {
                      rotate:
                        pullDistance > 80
                          ? '180deg'
                          : `${pullDistance * 2.25}deg`,
                    },
                  ],
                },
              ]}
            >
              {pullDistance > 80 ? (
                <RefreshCw size={24} color={theme.primary} />
              ) : (
                <ChevronDown size={24} color={theme.primary} />
              )}
            </Animated.View>
            <Text style={[styles.refreshText, { color: theme.text }]}>
              {pullDistance > 80 ? 'Release to refresh' : 'Pull to refresh'}
            </Text>
            {pullDistance > 80 && (
              <ActivityIndicator
                size="small"
                color={theme.primary}
                style={styles.refreshSpinner}
              />
            )}
          </View>
        </Animated.View>
      )}

      <FlatList
        ref={flatListRef}
        data={sortedDiscoverProfiles}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        extraData={theme}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          sortedDiscoverProfiles.length === 0
            ? { flex: 1 }
            : styles.flatListContent
        }
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={ListEmptyComponent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={4}
        updateCellsBatchingPeriod={100}
        initialNumToRender={4}
        windowSize={3}
        getItemLayout={getItemLayout}
        scrollEventThrottle={16}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      />

      {/* Refreshing Overlay */}
      {refreshing && (
        <View style={styles.refreshOverlay}>
          <DiscoveryAnimation theme={theme} message="Refreshing matches..." />
        </View>
      )}

      {/* Profile Detail Modal */}
      {showProfileDetail && selectedProfile && (
        <View style={styles.modalOverlay}>
          <ProfileDetail
            user={selectedProfile}
            onClose={handleCloseProfile}
            onLike={handleLike}
            onDislike={handleDislike}
            onMessage={handleMessage}
            onUnmatch={handleUnmatch}
            isLiked={likedProfiles.includes(selectedProfile.id)}
            isDisliked={dislikedProfiles.includes(selectedProfile.id)}
          />
        </View>
      )}

      {/* Custom Unmatch Confirmation Modal */}
      {showUnmatchConfirm && (
        <View style={styles.centeredModalOverlay}>
          <View
            style={[
              styles.confirmationModal,
              {
                backgroundColor: theme.surface,
                shadowColor: theme.shadow,
              },
            ]}
          >
            <View
              style={[
                styles.confirmationIcon,
                { backgroundColor: theme.errorBackground },
              ]}
            >
              <X size={32} color={theme.error} />
            </View>
            <Text style={[styles.confirmationTitle, { color: theme.text }]}>
              {t('modals.unmatchTitle')}
            </Text>
            <Text
              style={[styles.confirmationText, { color: theme.textSecondary }]}
            >
              {t('modals.unmatchText')}
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  styles.cancelButton,
                  {
                    backgroundColor: theme.surfaceVariant,
                    borderColor: theme.border,
                  },
                ]}
                onPress={cancelUnmatch}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                  {t('actions.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  styles.deleteButton,
                  {
                    backgroundColor: theme.error,
                    shadowColor: theme.error,
                  },
                ]}
                onPress={confirmUnmatch}
              >
                <Text style={styles.deleteButtonText}>
                  {t('modals.confirmUnmatch')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Match Modal */}
      <MatchModal
        visible={showMatchModal}
        onClose={handleCloseMatchModal}
        onStartChatting={handleStartChatting}
        matchedUser={matchedUser}
        currentUser={currentUser}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        currentDistance={maxDistance} // Already in meters
        onDistanceChange={handleDistanceChange}
        currentAgeRange={ageRange}
        onAgeRangeChange={handleAgeRangeChange}
      />

      {/* Enhanced Match Animation */}
      {showMatchAnimation && matchData && currentUser && (
        <EnhancedMatchAnimation
          visible={showMatchAnimation}
          matchedUser={matchData.user}
          currentUser={currentUser}
          onClose={handleMatchAnimationClose}
          onSendMessage={handleSendMessage}
          theme={theme}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 8,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 16, // Add 16px gap between columns
  },
  gridItem: {
    width: (width - 48) / 2, // 2 columns with 16px padding on each side and 16px gap
    marginBottom: 20,
  },
  cardContainer: {
    position: 'relative',
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  likedCard: {
    borderWidth: 3,
    shadowOpacity: 0.3,
    elevation: 12,
  },
  dislikedCard: {
    opacity: 0.7,
    borderWidth: 2,
    transform: [{ scale: 0.95 }],
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.9)',
    position: 'relative',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageNavLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '30%',
    zIndex: 10,
  },
  imageNavRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '30%',
    zIndex: 10,
  },
  distanceContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    zIndex: 10,
    minWidth: 55,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardInfo: {
    alignItems: 'center',
  },
  cardText: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  // Animation styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  refreshOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 500,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    elevation: 8,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 16,
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
    borderWidth: 1.5,
  },
  deleteButton: {
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  refreshIndicatorContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    paddingVertical: 20,
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  refreshIconContainer: {
    marginRight: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  refreshSpinner: {
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
