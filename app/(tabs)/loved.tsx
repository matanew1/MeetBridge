import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Animated,
  ListRenderItemInfo,
} from 'react-native';
import { Heart, MessageCircle, Users, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useUserStore } from '../../store';
import ProfileDetail from '../components/ProfileDetail';
import { EnhancedEmptyState } from '../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';

interface LikedProfileCardProps {
  user: {
    id: string;
    name: string;
    age: number;
    distance?: number;
    image: string;
    bio?: string;
  };
  onMessage?: (id: string) => void;
  onPress?: (user: any) => void;
  onUnmatch?: (id: string) => void;
  isMatch?: boolean;
  theme: any;
  index: number;
}

// Memoized card component for better performance
const LikedProfileCard = React.memo(
  ({
    user,
    onMessage,
    onPress,
    onUnmatch,
    isMatch = false,
    theme,
    index,
  }: LikedProfileCardProps) => {
    const { t } = useTranslation();
    const slideAnim = React.useRef(new Animated.Value(50)).current;
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
    const heartAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
      // Faster animation durations for better performance
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200, // Reduced from 300ms
          delay: index * 30, // Reduced from 50ms
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200, // Reduced from 300ms
          delay: index * 30,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80, // Increased from 60
          friction: 8,
          delay: index * 30,
          useNativeDriver: true,
        }),
      ]).start();

      // Heart pulse animation for matches
      if (isMatch) {
        const pulse = () => {
          Animated.sequence([
            Animated.timing(heartAnim, {
              toValue: 1.2,
              duration: 500, // Reduced from 600ms
              useNativeDriver: true,
            }),
            Animated.timing(heartAnim, {
              toValue: 1,
              duration: 500, // Reduced from 600ms
              useNativeDriver: true,
            }),
          ]).start(() => pulse());
        };
        pulse();
      }
    }, [index, isMatch]);

    const handleUnmatchPress = (e: any) => {
      e.stopPropagation();
      console.log('Unmatch button pressed for user:', user.id);
      if (onUnmatch) {
        onUnmatch(user.id);
      }
    };

    const handleMessagePress = (e: any) => {
      e.stopPropagation();
      if (onMessage) {
        onMessage(user.id);
      }
    };

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.cardBackground }]}
          onPress={() => onPress?.(user)}
          activeOpacity={0.8}
        >
          <View style={styles.imageContainer}>
            {user.image && user.image.trim() !== '' ? (
              <Image
                source={{ uri: user.image }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.cardImage,
                  {
                    backgroundColor: theme.surfaceVariant,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                <Text style={{ fontSize: 40, color: theme.textSecondary }}>
                  {user.name?.charAt(0) || '?'}
                </Text>
              </View>
            )}
            <Animated.View
              style={[
                styles.heartOverlay,
                { backgroundColor: theme.surface },
                isMatch && [
                  styles.matchOverlay,
                  { backgroundColor: theme.success + '20' },
                ],
                {
                  transform: [{ scale: heartAnim }],
                },
              ]}
            >
              {isMatch ? (
                <Users size={16} color={theme.success} />
              ) : (
                <Heart size={16} color="#FF69B4" fill="#FF69B4" />
              )}
            </Animated.View>
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.titleRow}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {user.name}, {user.age}
              </Text>
              {(user as any).isMissedConnection && (
                <View
                  style={[
                    styles.missedBadge,
                    {
                      backgroundColor: theme.primary + '20',
                      borderColor: theme.primary + '40',
                    },
                  ]}
                >
                  <Text
                    style={[styles.missedBadgeText, { color: theme.primary }]}
                  >
                    Missed Match
                  </Text>
                </View>
              )}
            </View>
            {user.distance && (
              <Text
                style={[styles.distanceText, { color: theme.textSecondary }]}
              >
                {user.distance} {t('search.distance')} {t('profile.distance')}
              </Text>
            )}
            {user.bio && (
              <Text
                style={[styles.bioText, { color: theme.textSecondary }]}
                numberOfLines={2}
              >
                {user.bio}
              </Text>
            )}
          </View>

          {/* Action buttons for matches */}
          {isMatch && (
            <View style={styles.matchActions}>
              <TouchableOpacity
                style={[
                  styles.messageButton,
                  styles.matchMessageButton,
                  { backgroundColor: theme.success + '20' },
                ]}
                onPress={handleMessagePress}
              >
                <MessageCircle size={20} color={theme.success} />
                <Text
                  style={[
                    styles.messageText,
                    styles.matchMessageText,
                    { color: theme.success },
                  ]}
                >
                  {t('loved.message')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.unmatchButton,
                  {
                    backgroundColor: theme.errorBackground,
                    borderColor: theme.error + '40',
                  },
                ]}
                onPress={handleUnmatchPress}
              >
                <Text style={[styles.unmatchText, { color: theme.error }]}>
                  {t('loved.unmatch')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for optimal re-rendering
    return (
      prevProps.user.id === nextProps.user.id &&
      prevProps.isMatch === nextProps.isMatch &&
      prevProps.theme === nextProps.theme
    );
  }
);

export default function LovedScreen() {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();
  const {
    discoverProfiles,
    likedProfiles,
    matchedProfiles,
    likedProfilesData: likedProfilesDataRaw,
    matchedProfilesData: matchedProfilesDataRaw,
    likeProfile,
    dislikeProfile,
    unmatchProfile,
    error,
    isLoadingLike,
    isLoadingUnmatch,
    loadDiscoverProfiles,
    loadCurrentUser,
    loadConversations,
    createConversation,
  } = useUserStore();
  const [activeTab, setActiveTab] = useState<'loved' | 'matches'>('loved');
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [showUnmatchConfirm, setShowUnmatchConfirm] = useState(false);
  const [unmatchProfileId, setUnmatchProfileId] = useState<string | null>(null);

  // Animation values
  const headerSlideAnim = React.useRef(new Animated.Value(-50)).current;
  const headerFadeAnim = React.useRef(new Animated.Value(0)).current;
  const tabSlideAnim = React.useRef(new Animated.Value(30)).current;
  const tabFadeAnim = React.useRef(new Animated.Value(0)).current;
  const contentSlideAnim = React.useRef(new Animated.Value(50)).current;
  const contentFadeAnim = React.useRef(new Animated.Value(0)).current;

  // Get liked and matched profiles from store with useMemo for performance
  const likedProfilesData = useMemo(() => {
    console.log(
      '📋 Raw liked profiles:',
      likedProfilesDataRaw.length,
      likedProfilesDataRaw.map((p) => p.id)
    );
    // Deduplicate profiles by ID using Set for O(1) lookup
    const seenIds = new Set<string>();
    return likedProfilesDataRaw.filter((profile) => {
      if (seenIds.has(profile.id)) return false;
      seenIds.add(profile.id);
      return true;
    });
  }, [likedProfilesDataRaw]);

  const matchedProfilesData = useMemo(() => {
    console.log(
      '💑 Raw matched profiles:',
      matchedProfilesDataRaw.length,
      matchedProfilesDataRaw.map((p) => p.id)
    );
    // Deduplicate profiles by ID using Set for O(1) lookup
    const seenIds = new Set<string>();
    return matchedProfilesDataRaw.filter((profile) => {
      if (seenIds.has(profile.id)) return false;
      seenIds.add(profile.id);
      return true;
    });
  }, [matchedProfilesDataRaw]);

  // Get only liked profiles that are not matches
  const onlyLikedProfiles = useMemo(() => {
    // Use Set for O(1) lookup instead of some() which is O(n)
    const matchedIds = new Set(matchedProfilesData.map((p) => p.id));
    return likedProfilesData.filter((profile) => !matchedIds.has(profile.id));
  }, [likedProfilesData, matchedProfilesData]);

  // Load profiles on component mount
  useEffect(() => {
    // Start header and tab animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerSlideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(headerFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(tabSlideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(tabFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(contentSlideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    loadCurrentUser(); // Ensure current user is loaded for actions
    loadConversations(); // Load existing conversations

    // Load existing matches and likes from Firestore - FRESH DATA
    console.log('🔥 Loved tab: Loading fresh matches and likes from Firebase');
    const { loadMatches, loadLikes } = useUserStore.getState();
    loadMatches();
    loadLikes();

    if (discoverProfiles.length === 0) {
      loadDiscoverProfiles(true);
    }
  }, []);

  // ⚡ ALWAYS refresh matches and likes when loved tab is focused - NO CACHE
  useFocusEffect(
    useCallback(() => {
      console.log(
        '🔄 Loved tab focused - refreshing matches and likes from Firebase'
      );
      if (currentUser) {
        const { loadMatches, loadLikes } = useUserStore.getState();
        loadMatches();
        loadLikes();
      }
    }, [currentUser])
  );

  // Prefetch images for better scrolling performance
  useEffect(() => {
    const profilesToPreload =
      activeTab === 'loved'
        ? onlyLikedProfiles.slice(0, 3)
        : matchedProfilesData.slice(0, 3);

    profilesToPreload.forEach((profile) => {
      if (profile.image) {
        Image.prefetch(profile.image).catch(() => {
          // Silently fail - not critical
        });
      }
    });
  }, [activeTab, onlyLikedProfiles, matchedProfilesData]);

  // Real-time unmatch listener - syncs unmatch across both users
  useEffect(() => {
    const currentUser = useUserStore.getState().currentUser;
    if (!currentUser) return;

    console.log('🔔 Setting up real-time unmatch listener for matches list');

    // Import Firebase functions inline
    const {
      collection,
      query,
      where,
      onSnapshot,
      doc: firestoreDoc,
    } = require('firebase/firestore');
    const { db } = require('../../services/firebase/config');

    // Listen for matches where current user is user1
    const matchesQuery1 = query(
      collection(db, 'matches'),
      where('user1', '==', currentUser.id)
    );

    // Listen for matches where current user is user2
    const matchesQuery2 = query(
      collection(db, 'matches'),
      where('user2', '==', currentUser.id)
    );

    const handleUnmatchDetection = (snapshot: any, isUser1: boolean) => {
      snapshot.docChanges().forEach((change: any) => {
        if (change.type === 'removed') {
          const matchData = change.doc.data();
          const unmatchedUserId = isUser1 ? matchData.user2 : matchData.user1;

          console.log(
            `🚫 Real-time unmatch detected! User ${unmatchedUserId} was unmatched`
          );

          // Update store to remove unmatched user from both lists
          useUserStore.setState((state) => ({
            matchedProfiles: state.matchedProfiles.filter(
              (id) => id !== unmatchedUserId
            ),
            matchedProfilesData: state.matchedProfilesData.filter(
              (profile) => profile.id !== unmatchedUserId
            ),
            likedProfiles: state.likedProfiles.filter(
              (id) => id !== unmatchedUserId
            ),
            likedProfilesData: state.likedProfilesData.filter(
              (profile) => profile.id !== unmatchedUserId
            ),
            conversations: state.conversations.filter(
              (conv) => !conv.participants.includes(unmatchedUserId)
            ),
          }));

          console.log(`✅ Removed ${unmatchedUserId} from all lists`);

          // Close profile detail if viewing unmatched user
          if (selectedProfile?.id === unmatchedUserId) {
            handleCloseProfile();
          }
        }
      });
    };

    const unsubscribe1 = onSnapshot(
      matchesQuery1,
      (snapshot) => handleUnmatchDetection(snapshot, true),
      (error: any) => {
        if (error?.code === 'permission-denied') {
          console.log(
            '⚠️ Unmatch listener permission denied (user logged out)'
          );
          return;
        }
        console.error('❌ Error in unmatch listener 1:', error);
      }
    );

    const unsubscribe2 = onSnapshot(
      matchesQuery2,
      (snapshot) => handleUnmatchDetection(snapshot, false),
      (error: any) => {
        if (error?.code === 'permission-denied') {
          console.log(
            '⚠️ Unmatch listener permission denied (user logged out)'
          );
          return;
        }
        console.error('❌ Error in unmatch listener 2:', error);
      }
    );

    return () => {
      console.log('🔕 Cleaning up unmatch listeners');
      unsubscribe1();
      unsubscribe2();
    };
  }, [selectedProfile]);

  // Real-time listener for new matches (including missed connections)
  useEffect(() => {
    const currentUser = useUserStore.getState().currentUser;
    if (!currentUser) return;

    console.log('🔔 Setting up real-time listener for new matches');

    const {
      collection,
      query,
      where,
      onSnapshot,
      getDoc,
      doc,
    } = require('firebase/firestore');
    const { db } = require('../../services/firebase/config');

    // Track if this is the initial load
    let isInitialLoad1 = true;
    let isInitialLoad2 = true;

    // Listen for matches where current user is user1 or user2
    const matchesQuery1 = query(
      collection(db, 'matches'),
      where('user1', '==', currentUser.id),
      where('unmatched', '==', false)
    );

    const matchesQuery2 = query(
      collection(db, 'matches'),
      where('user2', '==', currentUser.id),
      where('unmatched', '==', false)
    );

    const handleNewMatch = async (
      snapshot: any,
      isUser1: boolean,
      isInitialLoadRef: { current: boolean }
    ) => {
      // Skip initial batch of documents
      if (isInitialLoadRef.current) {
        console.log('⏭️ Skipping initial load for match listener');
        isInitialLoadRef.current = false;
        return;
      }

      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const matchData = change.doc.data();
          const otherUserId = isUser1 ? matchData.user2 : matchData.user1;

          console.log(
            `✨ New match detected! User ${otherUserId}, isMissedConnection: ${matchData.isMissedConnection}`
          );

          // Fetch the user's profile
          try {
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const newMatchedUser = {
                id: userDoc.id,
                ...userData,
                lastSeen: userData.lastSeen?.toDate?.() || userData.lastSeen,
                createdAt: userData.createdAt?.toDate?.() || userData.createdAt,
                updatedAt: userData.updatedAt?.toDate?.() || userData.updatedAt,
                dateOfBirth:
                  userData.dateOfBirth?.toDate?.() || userData.dateOfBirth,
                isMissedConnection: matchData.isMissedConnection || false,
              };

              // Update store to add the new matched user
              useUserStore.setState((state) => {
                // Check if user is already in matchedProfilesData
                const exists = state.matchedProfilesData.some(
                  (p) => p.id === otherUserId
                );
                if (!exists) {
                  console.log(
                    '✅ Adding new match to matchedProfilesData:',
                    otherUserId
                  );
                  return {
                    matchedProfiles: [...state.matchedProfiles, otherUserId],
                    matchedProfilesData: [
                      ...state.matchedProfilesData,
                      newMatchedUser,
                    ],
                  };
                }
                return state;
              });
            }
          } catch (error) {
            console.error('❌ Error fetching matched user profile:', error);
          }
        }
      }
    };

    const initialLoadRef1 = { current: isInitialLoad1 };
    const initialLoadRef2 = { current: isInitialLoad2 };

    const unsubscribe1 = onSnapshot(
      matchesQuery1,
      (snapshot) => handleNewMatch(snapshot, true, initialLoadRef1),
      (error: any) => {
        if (error?.code === 'permission-denied') {
          console.log('⚠️ Match listener permission denied (user logged out)');
          return;
        }
        console.error('❌ Error in match listener 1:', error);
      }
    );

    const unsubscribe2 = onSnapshot(
      matchesQuery2,
      (snapshot) => handleNewMatch(snapshot, false, initialLoadRef2),
      (error: any) => {
        if (error?.code === 'permission-denied') {
          console.log('⚠️ Match listener permission denied (user logged out)');
          return;
        }
        console.error('❌ Error in match listener 2:', error);
      }
    );

    return () => {
      console.log('🔕 Cleaning up match listeners');
      unsubscribe1();
      unsubscribe2();
    };
  }, []);

  // Memoized handlers for better performance
  const handleMessage = useCallback(
    async (profileId: string) => {
      console.log('Creating/finding conversation for:', profileId);

      // Create conversation if it doesn't exist
      await createConversation(profileId);

      // Navigate to chat tab when message button is clicked
      router.push('/chat');
    },
    [createConversation, router]
  );

  const handleUnmatch = useCallback((profileId: string) => {
    console.log('handleUnmatch called with profileId:', profileId);

    // Use custom modal instead of Alert.alert
    setUnmatchProfileId(profileId);
    setShowUnmatchConfirm(true);
  }, []);

  const confirmUnmatch = useCallback(() => {
    if (unmatchProfileId) {
      console.log('Confirming unmatch for:', unmatchProfileId);
      unmatchProfile(unmatchProfileId);
      handleCloseProfile();
    }
    setShowUnmatchConfirm(false);
    setUnmatchProfileId(null);
  }, [unmatchProfileId, unmatchProfile]);

  const cancelUnmatch = useCallback(() => {
    setShowUnmatchConfirm(false);
    setUnmatchProfileId(null);
  }, []);

  const handleProfilePress = useCallback((user: any) => {
    setSelectedProfile(user);
    setShowProfileDetail(true);
  }, []);

  const handleCloseProfile = useCallback(() => {
    setShowProfileDetail(false);
    setSelectedProfile(null);
  }, []);

  const handleLike = useCallback(
    (profileId: string) => {
      likeProfile(profileId);
      handleCloseProfile();
    },
    [likeProfile]
  );

  const handleDislike = useCallback(
    (profileId: string) => {
      dislikeProfile(profileId);
      handleCloseProfile();
    },
    [dislikeProfile]
  );

  // Memoized empty state component
  const renderEmptyState = useCallback(
    (type: 'loved' | 'matches') => (
      <EnhancedEmptyState
        type={type === 'loved' ? 'loved' : 'matches'}
        onAction={() => router.push('/(tabs)/search')}
        actionLabel={t('common.startSwiping')}
      />
    ),
    [theme, t, router]
  );

  // FlatList render item with useCallback for optimal performance
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<any>) => {
      const isMatch = activeTab === 'matches';
      return (
        <View style={styles.gridItem}>
          <LikedProfileCard
            user={item}
            onMessage={handleMessage}
            onPress={handleProfilePress}
            onUnmatch={handleUnmatch}
            isMatch={isMatch}
            theme={theme}
            index={index}
          />
        </View>
      );
    },
    [activeTab, handleMessage, handleProfilePress, handleUnmatch, theme]
  );

  // Key extractor for FlatList
  const keyExtractor = useCallback((item: any) => item.id, []);

  // Get item layout for better scroll performance
  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: 190, // Approximate height of card + margin
      offset: 190 * index,
      index,
    }),
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View
        style={[
          styles.header,
          {
            transform: [{ translateY: headerSlideAnim }],
            opacity: headerFadeAnim,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t('loved.title')}
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          {activeTab === 'loved'
            ? `${onlyLikedProfiles.length} ${
                onlyLikedProfiles.length === 1
                  ? t('loved.personLiked')
                  : t('loved.peopleLiked')
              }`
            : `${matchedProfilesData.length} ${
                matchedProfilesData.length === 1
                  ? t('loved.oneMatch')
                  : t('loved.multipleMatches')
              }`}
        </Text>
      </Animated.View>

      {/* Tab Navigation */}
      <Animated.View
        style={[
          styles.tabContainer,
          {
            transform: [{ translateY: tabSlideAnim }],
            opacity: tabFadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === 'loved' && styles.activeTab]}
          onPress={() => setActiveTab('loved')}
        >
          <Heart
            size={20}
            color={activeTab === 'loved' ? theme.primary : theme.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'loved' ? theme.primary : theme.textSecondary,
              },
              activeTab === 'loved' && styles.activeTabText,
            ]}
          >
            {t('loved.liked')} ({onlyLikedProfiles.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'matches' && styles.activeTab]}
          onPress={() => setActiveTab('matches')}
        >
          <Users
            size={20}
            color={
              activeTab === 'matches' ? theme.primary : theme.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'matches' ? theme.primary : theme.textSecondary,
              },
              activeTab === 'matches' && styles.activeTabText,
            ]}
          >
            {t('loved.matches')} ({matchedProfilesData.length})
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Tab Content with FlatList */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            transform: [{ translateY: contentSlideAnim }],
            opacity: contentFadeAnim,
          },
        ]}
      >
        {activeTab === 'loved' ? (
          onlyLikedProfiles.length === 0 ? (
            renderEmptyState('loved')
          ) : (
            <FlatList
              data={onlyLikedProfiles}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              extraData={theme}
              getItemLayout={getItemLayout}
              contentContainerStyle={styles.flatListContent}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={4}
              updateCellsBatchingPeriod={50}
              windowSize={3}
              initialNumToRender={6}
              scrollEventThrottle={16}
            />
          )
        ) : matchedProfilesData.length === 0 ? (
          renderEmptyState('matches')
        ) : (
          <FlatList
            data={matchedProfilesData}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            extraData={theme}
            getItemLayout={getItemLayout}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={4}
            updateCellsBatchingPeriod={50}
            windowSize={3}
            initialNumToRender={6}
            scrollEventThrottle={16}
          />
        )}
      </Animated.View>

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
              matchedProfilesData.some(
                (match) => match.id === selectedProfile.id
              )
                ? handleMessage
                : undefined
            }
            onUnmatch={
              // Only allow unmatching if it's a match
              matchedProfilesData.some(
                (match) => match.id === selectedProfile.id
              )
                ? handleUnmatch
                : undefined
            }
            isLiked={likedProfiles.includes(selectedProfile.id)}
            isDisliked={false}
          />
        </View>
      )}

      {/* Custom Unmatch Confirmation Modal */}
      {showUnmatchConfirm && (
        <View style={styles.centeredModalOverlay}>
          <View
            style={[
              styles.confirmationModal,
              { backgroundColor: theme.surface },
            ]}
          >
            <View
              style={[
                styles.confirmationIcon,
                { backgroundColor: theme.errorBackground || '#FFEBEE' },
              ]}
            >
              <X size={32} color="#FF6B6B" />
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
                    backgroundColor: theme.cardBackground,
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 5,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contentContainer: {
    flex: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#7C3AED',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  activeTabText: {
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
  flatListContent: {
    paddingHorizontal: 16,
    paddingBottom: 120, // Increased to prevent content from being hidden by bottom tabs
  },
  gridItem: {
    marginBottom: 16,
  },
  cardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  card: {
    padding: 16,
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 12,
    position: 'relative',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  heartOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  matchOverlay: {
    // Additional styling for match badge
  },
  cardInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  missedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  missedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  distanceText: {
    fontSize: 14,
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  matchActions: {
    width: '100%',
  },
  matchMessageButton: {
    // Additional styling for match message button
  },
  messageText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  matchMessageText: {
    // Additional styling for match message text
  },
  unmatchButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  unmatchText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
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
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
});
