import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { Heart, MessageCircle, Users, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../store';
import ProfileDetail from '../components/ProfileDetail';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import '../../i18n';

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

const LikedProfileCard = ({
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
    // Staggered entrance animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Heart pulse animation for matches
    if (isMatch) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(heartAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(heartAnim, {
            toValue: 1,
            duration: 800,
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
          <Image
            source={{ uri: user.image }}
            style={styles.cardImage}
            resizeMode="cover"
          />
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
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            {user.name}, {user.age}
          </Text>
          {user.distance && (
            <Text style={[styles.distanceText, { color: theme.textSecondary }]}>
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
};

export default function LovedScreen() {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();
  const {
    discoverProfiles,
    likedProfiles,
    matchedProfiles,
    getLikedProfiles,
    getMatchedProfiles,
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
    if (discoverProfiles.length === 0) {
      loadDiscoverProfiles(true);
    }
  }, []);

  // Get liked and matched profiles from store
  const likedProfilesData = getLikedProfiles();
  const matchedProfilesData = getMatchedProfiles();

  // Get only liked profiles that are not matches
  const onlyLikedProfiles = likedProfilesData.filter(
    (profile) => !matchedProfilesData.some((match) => match.id === profile.id)
  );

  const handleMessage = async (profileId: string) => {
    console.log('Creating/finding conversation for:', profileId);

    // Create conversation if it doesn't exist
    await createConversation(profileId);

    // Navigate to chat tab when message button is clicked
    router.push('/chat');
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

  const handleProfilePress = (user: any) => {
    setSelectedProfile(user);
    setShowProfileDetail(true);
  };

  const handleCloseProfile = () => {
    setShowProfileDetail(false);
    setSelectedProfile(null);
  };

  const handleLike = (profileId: string) => {
    likeProfile(profileId);
    handleCloseProfile();
  };

  const handleDislike = (profileId: string) => {
    dislikeProfile(profileId);
    handleCloseProfile();
  };

  const renderEmptyState = (type: 'loved' | 'matches') => (
    <View style={styles.emptyState}>
      {type === 'loved' ? (
        <Heart size={60} color={theme.textSecondary} />
      ) : (
        <Users size={60} color={theme.textSecondary} />
      )}
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {type === 'loved' ? t('loved.noLiked') : t('loved.noMatches')}
      </Text>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        {type === 'loved' ? t('loved.keepSwiping') : t('loved.startSwiping')}
      </Text>
    </View>
  );

  const renderProfileGrid = (profiles: any[], isMatch: boolean = false) => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.grid}>
        {profiles.map((user, index) => (
          <View key={user.id} style={styles.gridItem}>
            <LikedProfileCard
              user={user}
              onMessage={handleMessage}
              onPress={handleProfilePress}
              onUnmatch={handleUnmatch}
              isMatch={isMatch}
              theme={theme}
              index={index}
            />
          </View>
        ))}
      </View>
    </ScrollView>
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

      {/* Tab Content */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            transform: [{ translateY: contentSlideAnim }],
            opacity: contentFadeAnim,
          },
        ]}
      >
        {activeTab === 'loved'
          ? onlyLikedProfiles.length === 0
            ? renderEmptyState('loved')
            : renderProfileGrid(onlyLikedProfiles, false)
          : matchedProfilesData.length === 0
          ? renderEmptyState('matches')
          : renderProfileGrid(matchedProfilesData, true)}
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  contentContainer: {
    flex: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#8E44AD',
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
  scrollView: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  gridItem: {
    marginBottom: 16,
  },
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  card: {
    padding: 16,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 12,
    position: 'relative',
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
  matchOverlay: {},
  cardInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
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
  matchMessageButton: {},
  messageText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  matchMessageText: {},
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
    justifyContent: 'center',

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
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    elevation: 2,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
});
