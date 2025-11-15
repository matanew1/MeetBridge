// app/(tabs)/search.tsx
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  memo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  ListRenderItemInfo,
  RefreshControl,
} from 'react-native';
import { SlidersVertical, Map, Grid3x3 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useUserStore } from '../../store';
import ProfileDetail from '../components/ProfileDetail';
import FilterModal from '../components/FilterModal';
import DiscoveryAnimation from '../components/DiscoveryAnimation';
import EnhancedMatchAnimation from '../components/EnhancedMatchAnimation';
import MapViewComponent from '../components/MapViewComponent';
import {
  EnhancedEmptyState,
  LoadingOverlay,
  ErrorRetry,
} from '../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { lightTheme, darkTheme, Theme } from '../../constants/theme';
import { services } from '../../services';
import notificationService from '../../services/notificationService';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc as firestoreDoc,
} from 'firebase/firestore';
import { safeGetDoc } from '../../services/firebase/firestoreHelpers';
import { db } from '../../services/firebase/config';

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
    const opacity = useSharedValue(1);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const userImages = useMemo(
      () =>
        user.images && user.images.length > 0
          ? [user.image, ...user.images]
          : [user.image],
      [user.image, user.images]
    );

    useEffect(() => {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    }, []);

    useEffect(() => {
      if (isAnimatingOut) {
        opacity.value = withTiming(0, { duration: 180 });
        translateY.value = withTiming(isLiked ? -120 : 120, { duration: 220 });
        scale.value = withSequence(
          withTiming(1.05, { duration: 60 }),
          withTiming(0.8, { duration: 160 })
        );
      }
    }, [isAnimatingOut, isLiked]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
    }));

    const goPrev = (e: any) => {
      e.stopPropagation();
      if (currentImageIndex > 0) setCurrentImageIndex((i) => i - 1);
    };

    const goNext = (e: any) => {
      e.stopPropagation();
      if (currentImageIndex < userImages.length - 1)
        setCurrentImageIndex((i) => i + 1);
    };

    const currentUri = userImages[currentImageIndex] || '';
    const hasImage = currentUri.trim().length > 0;

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
          disabled={isAnimatingOut}
          activeOpacity={0.8}
        >
          <View style={styles.imageContainer}>
            <Image
              source={
                hasImage
                  ? { uri: currentUri }
                  : require('../../assets/images/placeholder.png')
              }
              style={styles.cardImage}
              resizeMode="cover"
            />

            {userImages.length > 1 && (
              <>
                {currentImageIndex > 0 && (
                  <TouchableOpacity
                    style={styles.imageNavLeft}
                    onPress={goPrev}
                    activeOpacity={1}
                  />
                )}
                {currentImageIndex < userImages.length - 1 && (
                  <TouchableOpacity
                    style={styles.imageNavRight}
                    onPress={goNext}
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
        </TouchableOpacity>

        {user.distance != null && (
          <View
            style={[
              styles.distanceContainer,
              { backgroundColor: `${theme.primary}E6` },
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
  (prev, next) => {
    if (prev.isAnimatingOut !== next.isAnimatingOut) return false;
    if (prev.isLiked !== next.isLiked) return false;
    if (prev.isDisliked !== next.isDisliked) return false;
    if (prev.user.id !== next.user.id) return false;
    if (prev.user.image !== next.user.image) return false;
    if (prev.theme !== next.theme) return false;

    const a = prev.user.images || [];
    const b = next.user.images || [];
    if (a.length !== b.length) return false;
    return a.every((img, i) => img === b[i]);
  }
);

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

  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [showUnmatchConfirm, setShowUnmatchConfirm] = useState(false);
  const [unmatchId, setUnmatchId] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [maxDistance, setMaxDistance] = useState(500);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 99]);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [animatingOut, setAnimatingOut] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [matchData, setMatchData] = useState<{
    user: any;
    matchId: string;
    conversationId?: string;
  } | null>(null);

  const processedMatchesRef = useRef<Set<string>>(new Set());
  const distanceDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const ageDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isSearching,
    discoverProfiles,
    isLoadingDiscover,
    likedProfiles,
    dislikedProfiles,
    matchedProfiles,
    conversations,
    error,
    currentUser,
    loadCurrentUser,
    loadDiscoverProfiles,
    loadConversations,
    likeProfile,
    dislikeProfile,
    unmatchProfile,
    updateSearchFilters,
    clearError,
  } = useUserStore();

  const sortedDiscoverProfiles = useMemo(() => {
    const matched = new Set(matchedProfiles);
    const liked = new Set(likedProfiles);
    const disliked = new Set(dislikedProfiles);
    const seen = new Set<string>();

    const missed = new Set(
      (conversations || [])
        .filter((c: any) => c.isMissedConnection)
        .flatMap((c: any) => c.participants || [])
        .filter((id: string) => id !== currentUser?.id)
    );

    return discoverProfiles
      .filter((p) => {
        if (
          matched.has(p.id) ||
          liked.has(p.id) ||
          disliked.has(p.id) ||
          missed.has(p.id) ||
          seen.has(p.id)
        )
          return false;
        seen.add(p.id);
        const age = p.age || 0;
        return age >= ageRange[0] && age <= ageRange[1];
      })
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [
    discoverProfiles,
    matchedProfiles,
    likedProfiles,
    dislikedProfiles,
    conversations,
    currentUser?.id,
    ageRange,
  ]);

  const syncPreferences = useCallback(() => {
    if (!currentUser) return;

    const dist = Math.max(currentUser.preferences?.maxDistance ?? 500, 5);
    const range = (currentUser.preferences?.ageRange as [number, number]) ?? [
      18, 99,
    ];

    setMaxDistance(dist);
    setAgeRange(range);
    updateSearchFilters({
      maxDistance: dist,
      ageRange: range,
      gender: currentUser.preferences?.interestedIn,
    });
  }, [currentUser, updateSearchFilters]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([loadCurrentUser(), loadConversations()]).then(
        syncPreferences
      );
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (currentUser?.id) loadDiscoverProfiles(true);
    }, [currentUser?.id, loadDiscoverProfiles])
  );

  const handleLike = useCallback(
    (id: string) => {
      setShowProfileDetail(false);
      setSelectedProfile(null);
      setAnimatingOut((s) => new Set([...s, id]));

      setTimeout(() => {
        likeProfile(id)
          .then((result) => {
            if (result?.isMatch && result.matchId) {
              processedMatchesRef.current.add(result.matchId);
              setMatchData({
                user: result.matchedUser,
                matchId: result.matchId,
                conversationId: result.conversationId,
              });
              setShowMatchAnimation(true);

              notificationService.broadcastMatchNotification(
                result.matchedUser.id,
                currentUser?.name || 'Someone',
                result.matchId
              );
            }
          })
          .finally(() => {
            setAnimatingOut((s) => {
              const ns = new Set(s);
              ns.delete(id);
              return ns;
            });
          });
      }, 200);
    },
    [currentUser, likeProfile]
  );

  const handleDislike = useCallback(
    (id: string) => {
      setShowProfileDetail(false);
      setSelectedProfile(null);
      setAnimatingOut((s) => new Set([...s, id]));

      setTimeout(() => {
        dislikeProfile(id);
        setAnimatingOut((s) => {
          const ns = new Set(s);
          ns.delete(id);
          return ns;
        });
      }, 200);
    },
    [dislikeProfile]
  );

  const handleProfilePress = useCallback((user: any) => {
    setSelectedProfile(user);
    setShowProfileDetail(true);
  }, []);

  const handleUnmatch = (id: string) => {
    setUnmatchId(id);
    setShowUnmatchConfirm(true);
  };

  const confirmUnmatch = () => {
    if (unmatchId) unmatchProfile(unmatchId);
    setShowUnmatchConfirm(false);
    setUnmatchId(null);
    setShowProfileDetail(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDiscoverProfiles(true).finally(() => setRefreshing(false));
  }, [loadDiscoverProfiles]);

  const handleDistanceChange = useCallback(
    (value: number) => {
      setMaxDistance(value);
      updateSearchFilters({ maxDistance: value });

      if (distanceDebounceRef.current)
        clearTimeout(distanceDebounceRef.current);
      distanceDebounceRef.current = setTimeout(() => {
        if (currentUser && updateProfile) {
          updateProfile({ preferences: { maxDistance: value } })
            .then(() => loadCurrentUser())
            .then(() => loadDiscoverProfiles(true));
        }
      }, 600);
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
    (value: [number, number]) => {
      setAgeRange(value);
      updateSearchFilters({ ageRange: value });

      if (ageDebounceRef.current) clearTimeout(ageDebounceRef.current);
      ageDebounceRef.current = setTimeout(() => {
        if (currentUser && updateProfile) {
          updateProfile({ preferences: { ageRange: value } })
            .then(() => loadCurrentUser())
            .then(() => loadDiscoverProfiles(true));
        }
      }, 600);
    },
    [
      currentUser,
      updateProfile,
      updateSearchFilters,
      loadCurrentUser,
      loadDiscoverProfiles,
    ]
  );

  // Real-time match listener
  useEffect(() => {
    if (!currentUser?.id) return;

    const handleChange = async (change: any, isUser1: boolean) => {
      if (!change.doc?.exists()) return;
      const data = change.doc.data();
      if (!data?.user1 || !data.user2) return;

      const otherId = isUser1 ? data.user2 : data.user1;

      if (change.type === 'removed') {
        processedMatchesRef.current.delete(change.doc.id);
        return;
      }

      if (
        change.type !== 'added' ||
        processedMatchesRef.current.has(change.doc.id)
      )
        return;

      processedMatchesRef.current.add(change.doc.id);

      try {
        const snap = await safeGetDoc(
          firestoreDoc(db, 'users', otherId),
          `user_${otherId}`
        );
        if (!snap || (typeof snap.exists === 'function' && !snap.exists()))
          return;
        const userData =
          snap && (snap as any).data ? (snap as any).data() : null;
        const matchedUser = { id: snap.id, ...userData };
      } catch (e) {
        console.warn('Failed to resolve matched user for match animation', e);
        return;
      }

      if (data.animationPlayed || data.isMissedConnection) return;

      setMatchData({
        user: matchedUser,
        matchId: change.doc.id,
        conversationId: data.conversationId,
      });
      setShowMatchAnimation(true);

      notificationService.sendMatchNotification(
        matchedUser.name || 'Someone',
        change.doc.id
      );
    };

    const q1 = query(
      collection(db, 'matches'),
      where('user1', '==', currentUser.id),
      where('unmatched', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const q2 = query(
      collection(db, 'matches'),
      where('user2', '==', currentUser.id),
      where('unmatched', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const u1 = onSnapshot(q1, (s) =>
      s.docChanges().forEach((c) => handleChange(c, true))
    );
    const u2 = onSnapshot(q2, (s) =>
      s.docChanges().forEach((c) => handleChange(c, false))
    );

    return () => {
      u1();
      u2();
    };
  }, [currentUser?.id]);

  const keyExtractor = useCallback((item: any) => item.id, []);
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<any>) => (
      <View style={styles.gridItem}>
        <ProfileCard
          user={item}
          onPress={handleProfilePress}
          isLiked={likedProfiles.includes(item.id)}
          isDisliked={dislikedProfiles.includes(item.id)}
          isAnimatingOut={animatingOut.has(item.id)}
          theme={theme}
        />
      </View>
    ),
    [handleProfilePress, likedProfiles, dislikedProfiles, animatingOut, theme]
  );

  if (isSearching || isLoadingDiscover) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <DiscoveryAnimation theme={theme} />
      </View>
    );
  }

  if (isAuthLoading || !isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LoadingOverlay visible message={t('common.loading')} />
      </View>
    );
  }

  if (error && !isLoadingDiscover) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ErrorRetry
          message={error}
          onRetry={() => {
            clearError();
            loadDiscoverProfiles(true);
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t('search.title')}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[
              styles.viewToggle,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <Map size={22} color={theme.primary} />
            ) : (
              <Grid3x3 size={22} color={theme.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => setShowFilterModal(true)}
          >
            <SlidersVertical size={22} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <MapViewComponent
        profiles={sortedDiscoverProfiles}
        currentUser={currentUser}
        onProfileSelect={handleProfilePress}
        maxDistance={maxDistance}
        theme={theme}
        isVisible={viewMode === 'map'}
      />

      {viewMode === 'grid' && (
        <FlatList
          data={sortedDiscoverProfiles}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={
            sortedDiscoverProfiles.length === 0
              ? styles.emptyListContent
              : styles.listContent
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <EnhancedEmptyState
                type="discover"
                title={t('search.noProfiles')}
                message={t('search.noProfilesDetail')}
                verticalAlign="top"
                onActionPress={onRefresh}
                actionLabel={t('search.refresh')}
              />
            </View>
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={8}
          windowSize={5}
        />
      )}

      {showProfileDetail && selectedProfile && (
        <View style={styles.modalOverlay}>
          <ProfileDetail
            user={selectedProfile}
            onClose={() => setShowProfileDetail(false)}
            onLike={handleLike}
            onDislike={handleDislike}
            onUnmatch={handleUnmatch}
          />
        </View>
      )}

      {showUnmatchConfirm && (
        <View style={styles.modalOverlay}>
          <View
            style={[styles.unmatchModal, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.unmatchTitle, { color: theme.text }]}>
              {t('modals.unmatchTitle')}
            </Text>
            <Text style={[styles.unmatchText, { color: theme.textSecondary }]}>
              {t('modals.unmatchText')}
            </Text>
            <View style={styles.unmatchButtons}>
              <TouchableOpacity
                style={styles.unmatchCancel}
                onPress={() => setShowUnmatchConfirm(false)}
              >
                <Text style={{ color: theme.text }}>{t('actions.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unmatchConfirm,
                  { backgroundColor: theme.error },
                ]}
                onPress={confirmUnmatch}
              >
                <Text style={styles.unmatchConfirmText}>
                  {t('modals.confirmUnmatch')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        currentDistance={maxDistance}
        onDistanceChange={handleDistanceChange}
        currentAgeRange={ageRange}
        onAgeRangeChange={handleAgeRangeChange}
      />

      {showMatchAnimation && matchData && currentUser && (
        <EnhancedMatchAnimation
          visible={showMatchAnimation}
          matchedUser={matchData.user}
          currentUser={currentUser}
          onClose={async () => {
            if (matchData.matchId)
              await services.matching.markMatchAnimationPlayed(
                matchData.matchId
              );
            setShowMatchAnimation(false);
            setMatchData(null);
          }}
          onSendMessage={async () => {
            if (matchData.matchId)
              await services.matching.markMatchAnimationPlayed(
                matchData.matchId
              );
            setShowMatchAnimation(false);
            if (matchData.conversationId)
              router.push(`/chat/${matchData.conversationId}`);
            setMatchData(null);
          }}
          theme={theme}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerButtons: { flexDirection: 'row', gap: 12 },
  viewToggle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  emptyListContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  emptyWrapper: {
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
  },
  columnWrapper: { justifyContent: 'space-between', gap: 16 },
  gridItem: { width: (width - 48) / 2, marginBottom: 20 },
  cardContainer: { position: 'relative' },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likedCard: {
    borderWidth: 4,
    elevation: 16,
    shadowOpacity: 0.4,
  },
  dislikedCard: {
    opacity: 0.6,
    borderWidth: 3,
    transform: [{ scale: 0.95 }],
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.9)',
    position: 'relative',
  },
  cardImage: { width: '100%', height: '100%' },
  imageNavLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '30%',
    height: '100%',
    zIndex: 10,
  },
  imageNavRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '30%',
    height: '100%',
    zIndex: 10,
  },
  cardInfo: {
    alignItems: 'center',
  },
  cardText: {
    fontSize: 18,
    fontWeight: '600',
  },
  distanceContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  distanceText: { fontSize: 13, fontWeight: '700' },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
    zIndex: 1000,
  },
  unmatchModal: {
    marginHorizontal: 32,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    elevation: 20,
  },
  unmatchTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  unmatchText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  unmatchButtons: { flexDirection: 'row', gap: 16, width: '100%' },
  unmatchCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  unmatchConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  unmatchConfirmText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
