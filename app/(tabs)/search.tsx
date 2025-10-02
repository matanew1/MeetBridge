// app/(tabs)/search.tsx
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
} from 'react-native';
import { Heart, X, Filter, RefreshCw } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
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
import { lightTheme, darkTheme } from '../../constants/theme';
import { FirebaseDiscoveryService } from '../../services/firebase/firebaseServices';
import { services } from '../../services';
import notificationService from '../../services/notificationService';

const { width, height } = Dimensions.get('window');

interface ProfileCardProps {
  user: {
    id: string;
    name: string;
    age: number;
    distance?: number | null;
    image: string;
  };
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  onPress: (user: any) => void;
  isLiked: boolean;
  isDisliked: boolean;
  isAnimatingOut: boolean;
  theme: any;
}

const ProfileCard = ({
  user,
  onLike,
  onDislike,
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

  React.useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
    translateY.value = withTiming(0, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
    scale.value = withSpring(1, { damping: 12, stiffness: 150 });
  }, []);

  React.useEffect(() => {
    if (isAnimatingOut) {
      opacity.value = withTiming(0, {
        duration: 400,
        easing: Easing.bezier(0.4, 0, 0.6, 1),
      });
      translateY.value = withTiming(isLiked || !isDisliked ? -80 : 80, {
        duration: 400,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
      scale.value = withSequence(
        withTiming(1.05, { duration: 100, easing: Easing.out(Easing.ease) }),
        withTiming(0.7, { duration: 300, easing: Easing.in(Easing.cubic) })
      );
    }
  }, [isAnimatingOut, isLiked, isDisliked]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  // Safely get image URI
  const imageUri = user.image || '';
  const hasValidImage = imageUri && imageUri.trim().length > 0;

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.cardBackground },
          isLiked && styles.likedCard,
          isDisliked && styles.dislikedCard,
        ]}
        onPress={() => onPress(user)}
        disabled={isLiked || isDisliked || isAnimatingOut}
      >
        <View style={styles.imageContainer}>
          {hasValidImage ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.cardImage}
              resizeMode="cover"
              defaultSource={require('../../assets/images/logo.png')}
            />
          ) : (
            <View style={[styles.cardImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>
                {user.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardText, { color: theme.text }]}>
            {user.name || 'Unknown'}, {user.age || 0}
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

      {user.distance !== null && user.distance !== undefined && (
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceText}>
            {user.distance >= 1000
              ? `${(user.distance / 1000).toFixed(1)}km`
              : `${Math.round(user.distance)}m`}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

// Create discovery service instance outside component to avoid recreating
const discoveryService = new FirebaseDiscoveryService();

export default function SearchScreen() {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
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
  const [maxDistance, setMaxDistance] = useState(5000); // Changed to 5000 meters default
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [matchData, setMatchData] = useState<{
    user: any;
    matchId: string;
    conversationId?: string;
  } | null>(null);

  // Local state to track cards being animated out
  const [animatingOutCards, setAnimatingOutCards] = useState<Set<string>>(
    new Set()
  );

  // Track processed matches to prevent duplicate animations
  const processedMatchesRef = React.useRef<Set<string>>(new Set());

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
    currentUser,
  } = useUserStore();

  // Sort profiles by distance and filter out matched/liked/disliked profiles (handle null distances)
  // Also deduplicate by ID to prevent duplicate key errors
  const sortedDiscoverProfiles = [...discoverProfiles]
    .filter((profile) => !matchedProfiles.includes(profile.id)) // Exclude matched profiles
    .filter((profile) => !likedProfiles.includes(profile.id)) // Exclude liked profiles
    .filter((profile) => !dislikedProfiles.includes(profile.id)) // Exclude disliked profiles (24h block)
    .filter(
      (profile, index, self) =>
        index === self.findIndex((p) => p.id === profile.id)
    ) // Deduplicate by ID
    .sort((a, b) => {
      const distA = a.distance ?? Number.MAX_SAFE_INTEGER;
      const distB = b.distance ?? Number.MAX_SAFE_INTEGER;
      return distA - distB;
    });

  // Animation values
  const pulseAnimation = useSharedValue(0);

  const updateUserPreferences = () => {
    // Update search filters based on user preferences
    if (currentUser) {
      const maxDistanceMeters =
        (currentUser.preferences?.maxDistance || 5) * 1000;
      setMaxDistance(maxDistanceMeters);
      updateSearchFilters({
        gender: currentUser.preferences?.interestedIn || 'both',
        ageRange: currentUser.preferences?.ageRange || [18, 99],
        location: currentUser.location || '',
        maxDistance: maxDistanceMeters,
      });
    }
  };

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
        loadConversations(); // Load existing conversations
        loadDiscoverProfiles(true); // Load profiles after user is loaded

        // Small delay to ensure profiles are loaded before starting animation
        setTimeout(() => {
          setShowAnimation(true);
          triggerSearchAnimation();
        }, 500);
      };

      loadData();
    }
  }, [isAuthenticated, isAuthLoading]); // Run when authentication state changes

  // Handle when isSearching changes (from button trigger or auto-trigger)
  useEffect(() => {
    updateUserPreferences();
    if (!isSearching && showAnimation) {
      // Animation ended via trigger
      setShowAnimation(false);
    }
  }, [isSearching, currentUser]);

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

            // Send notification
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

    const unsubscribe1 = onSnapshot(matchesQuery1, (snapshot: any) => {
      snapshot
        .docChanges()
        .forEach((change: any) => handleMatchChange(change, true));
    });

    const unsubscribe2 = onSnapshot(matchesQuery2, (snapshot: any) => {
      snapshot
        .docChanges()
        .forEach((change: any) => handleMatchChange(change, false));
    });

    return () => {
      console.log('🔕 Cleaning up match listener');
      unsubscribe1();
      unsubscribe2();
    };
  }, [currentUser?.id]);

  const handleLike = (profileId: string) => {
    console.log('handleLike called for profile:', profileId);

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

            // Send notification
            notificationService.sendMatchNotification(
              result.matchedUser.name || 'Someone',
              result.matchId
            );

            console.log(
              `✅ Match animation shown for: ${result.matchedUser.name} (from like action)`
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
    }, 300); // Match animation duration
  };

  const handleDislike = (profileId: string) => {
    console.log('handleDislike called for profile:', profileId);

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
    }, 300); // Match animation duration
  };

  const handleProfilePress = (user: any) => {
    setSelectedProfile(user);
    setShowProfileDetail(true);
  };

  const handleCloseProfile = () => {
    setShowProfileDetail(false);
    setSelectedProfile(null);
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

  const handleDistanceChange = (distance: number) => {
    const distanceInMeters = distance * 1000; // Convert km to meters
    setMaxDistance(distanceInMeters);
    updateSearchFilters({ maxDistance: distanceInMeters });
    loadDiscoverProfiles(true);
  };

  const handleSearchButton = () => {
    // Trigger the search animation (which now includes refresh functionality)
    setShowAnimation(true);
    triggerSearchAnimation();
  };

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
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          {t('search.loading')}
        </Text>
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
              styles.refreshButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={handleSearchButton}
            disabled={isSearching || showAnimation}
          >
            {isSearching || showAnimation ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <RefreshCw size={20} color={theme.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={handleFilterPress}
          >
            <Filter size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {sortedDiscoverProfiles.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.text }]}>
                {t('search.noProfiles')}
              </Text>
            </View>
          ) : (
            sortedDiscoverProfiles.map((user) => (
              <View key={user.id} style={styles.gridItem}>
                <ProfileCard
                  user={user}
                  onLike={handleLike}
                  onDislike={handleDislike}
                  onPress={handleProfilePress}
                  isLiked={likedProfiles.includes(user.id)}
                  isDisliked={dislikedProfiles.includes(user.id)}
                  isAnimatingOut={animatingOutCards.has(user.id)}
                  theme={theme}
                />
              </View>
            ))
          )}
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
            <Text style={styles.confirmationTitle}>
              {t('modals.unmatchTitle')}
            </Text>
            <Text style={styles.confirmationText}>
              {t('modals.unmatchText')}
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={cancelUnmatch}
              >
                <Text style={styles.cancelButtonText}>
                  {t('actions.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.deleteButton]}
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
        currentDistance={maxDistance / 1000} // Convert back to km for display
        onDistanceChange={handleDistanceChange}
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
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
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
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  loadingText: {
    fontSize: 16,
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
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
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
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
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
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
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
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  middleCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  heartContainer: {
    position: 'absolute',
    bottom: -8,
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
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  searchingText: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
