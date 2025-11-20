// Simplified connections screen with better performance

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Animated,
  TextInput,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import {
  Sparkles,
  Plus,
  Clock,
  Heart,
  MessageCircle,
  Navigation,
  X,
  Zap,
  Eye,
  TrendingUp,
  Edit2,
  Trash2,
  MoreVertical,
  Bookmark,
  Send,
  ChevronDown,
  Search,
} from 'lucide-react-native';
import { MapPin, Users } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { smartLocationManager } from '../../services/location';
import missedConnectionsService, {
  MissedConnection,
} from '../../services/firebase/missedConnectionsService';
import toastService from '../../services/toastService';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import { userStore, useUserStore } from '../../store/userStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import ProfileDetail from '../components/ProfileDetail';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
  width,
} from '../../utils/responsive';
import { isRTL } from '../../i18n';

// Helper function
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

// Connection Item Component
interface ConnectionItemProps {
  connection: MissedConnection;
  theme: any;
  index: number;
  onPress: () => void;
  onLike: () => void;
  onClaim: () => void;
  onComment: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onViewProfile: () => void;
  onViewImages: (images: string[], startIndex: number) => void;
  isLiked: boolean;
  isSaved: boolean;
  currentUserId: string | undefined;
  hasExistingConversation?: boolean;
}

const ConnectionItem: React.FC<ConnectionItemProps> = React.memo(
  ({
    connection,
    theme,
    index,
    onPress,
    onLike,
    onClaim,
    onComment,
    onEdit,
    onDelete,
    onSave,
    onViewProfile,
    onViewImages,
    isLiked,
    isSaved,
    currentUserId,
    hasExistingConversation,
  }) => {
    const [showOptions, setShowOptions] = useState(false);
    const isOwner = connection.userId === currentUserId;

    return (
      <TouchableOpacity
        style={[
          styles.connectionItem,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.borderLight,
          },
        ]}
        activeOpacity={0.9}
        onPress={onPress}
      >
        {/* Accent Bar - Removed for cleaner look matching Search/Loved, optional to keep */}
        {/* <View style={[styles.accentBar, { backgroundColor: theme.primary }]} /> */}

        {/* Content */}
        <View style={styles.connectionContent}>
          {/* User Profile */}
          <View style={styles.userSection}>
            {!isOwner ? (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onViewProfile();
                }}
                activeOpacity={0.7}
              >
                <Image
                  source={
                    connection.userImage
                      ? { uri: connection.userImage }
                      : require('../../assets/images/placeholder.png')
                  }
                  style={styles.userAvatar}
                />
              </TouchableOpacity>
            ) : (
              <Image
                source={
                  connection.userImage
                    ? { uri: connection.userImage }
                    : require('../../assets/images/placeholder.png')
                }
                style={styles.userAvatar}
              />
            )}
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.text }]}>
                {connection.userName || 'Anonymous'}
              </Text>
              <Text
                style={[styles.locationText, { color: theme.textSecondary }]}
              >
                {connection.location.landmark}
              </Text>
            </View>
            <View style={styles.rightColumn}>
              <View style={styles.timeContainer}>
                <Clock size={12} color={theme.textSecondary} />
                <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                  {formatRelativeTime(connection.createdAt)}
                </Text>
              </View>
              {connection.likes > 5 && (
                <View
                  style={[styles.hotBadge, { backgroundColor: theme.error }]}
                >
                  <Zap size={10} color="#FFF" />
                  <Text style={styles.hotBadgeText}>Hot</Text>
                </View>
              )}
            </View>
          </View>

          {/* Tags */}
          {Array.isArray(connection.tags) && connection.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {connection.tags
                .slice(0, 3)
                .map((tag: string, tagIndex: number) => (
                  <View
                    key={`${tag}-${tagIndex}`}
                    style={[
                      styles.tag,
                      { backgroundColor: `${theme.primary}15` },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: theme.primary }]}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              {connection.tags.length > 3 && (
                <Text
                  style={[styles.moreTagsText, { color: theme.textSecondary }]}
                >
                  +{connection.tags.length - 3}
                </Text>
              )}
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Eye size={14} color={theme.textSecondary} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                {connection.views || 0}
              </Text>
            </View>
            <View style={styles.statItem}>
              <TrendingUp size={14} color={theme.textSecondary} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                {connection.likes + (connection.comments || 0)}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text
            style={[styles.descriptionText, { color: theme.text }]}
            numberOfLines={3}
          >
            {connection.description}
          </Text>

          {/* Images */}
          {(() => {
            return connection.images && connection.images.length > 0;
          })() && (
            <View style={styles.postImagesContainer}>
              {connection.images.slice(0, 3).map((imageUri, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => onViewImages(connection.images || [], index)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: imageUri }} style={styles.postImage} />
                </TouchableOpacity>
              ))}
              {connection.images.length > 3 && (
                <TouchableOpacity
                  style={[styles.postImage, styles.moreImagesOverlay]}
                  onPress={() => onViewImages(connection.images || [], 0)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.moreImagesText}>
                    +{connection.images.length - 3}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isLiked
                    ? `${theme.primary}20`
                    : `${theme.primary}10`,
                },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onLike();
              }}
            >
              <Heart
                size={18}
                color={theme.primary}
                fill={isLiked ? theme.primary : 'none'}
              />
              <Text style={[styles.actionText, { color: theme.text }]}>
                {connection.likes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: `${theme.textSecondary}10` },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onComment();
              }}
            >
              <MessageCircle size={18} color={theme.textSecondary} />
              <Text style={[styles.actionText, { color: theme.text }]}>
                {connection.comments || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isSaved
                    ? `${theme.primary}20`
                    : `${theme.textSecondary}10`,
                },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onSave();
              }}
            >
              <Bookmark
                size={18}
                color={isSaved ? theme.primary : theme.textSecondary}
                fill={isSaved ? theme.primary : 'none'}
              />
            </TouchableOpacity>

            {/* Owner Options */}
            {isOwner && (
              <View style={styles.optionsMenu}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: `${theme.textSecondary}10` },
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    setShowOptions(!showOptions);
                  }}
                >
                  <MoreVertical size={18} color={theme.textSecondary} />
                </TouchableOpacity>

                {showOptions && (
                  <View
                    style={[
                      styles.optionsDropdown,
                      {
                        backgroundColor: theme.cardBackground,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.optionItem}
                      onPress={(e) => {
                        e.stopPropagation();
                        setShowOptions(false);
                        onEdit();
                      }}
                    >
                      <Edit2 size={16} color={theme.primary} />
                      <Text style={[styles.optionText, { color: theme.text }]}>
                        Edit
                      </Text>
                    </TouchableOpacity>
                    <View
                      style={[
                        styles.optionDivider,
                        { backgroundColor: theme.border },
                      ]}
                    />
                    <TouchableOpacity
                      style={styles.optionItem}
                      onPress={(e) => {
                        e.stopPropagation();
                        setShowOptions(false);
                        onDelete();
                      }}
                    >
                      <Trash2 size={16} color={theme.error} />
                      <Text style={[styles.optionText, { color: theme.error }]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {!isOwner && !hasExistingConversation && (
              <TouchableOpacity
                style={[styles.claimButton, { backgroundColor: theme.success }]}
                onPress={(e) => {
                  e.stopPropagation();
                  onClaim();
                }}
              >
                <Sparkles size={16} color="#FFF" />
                <Text style={styles.claimButtonText}>That's Me!</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.connection.id === nextProps.connection.id &&
      prevProps.isLiked === nextProps.isLiked &&
      prevProps.isSaved === nextProps.isSaved &&
      prevProps.connection.likes === nextProps.connection.likes &&
      prevProps.connection.comments === nextProps.connection.comments &&
      prevProps.connection.description === nextProps.connection.description &&
      prevProps.connection.timeOccurred.getTime() ===
        nextProps.connection.timeOccurred.getTime() &&
      prevProps.connection.isAnonymous === nextProps.connection.isAnonymous &&
      prevProps.connection.location.category ===
        nextProps.connection.location.category &&
      prevProps.connection.isEdited === nextProps.connection.isEdited &&
      prevProps.hasExistingConversation === nextProps.hasExistingConversation &&
      prevProps.theme === nextProps.theme
    );
  }
);

// --- Components ---

const SegmentedControl = ({ activeTab, onTabChange, theme, counts }: any) => {
  return (
    <View style={[styles.segmentContainer, { backgroundColor: theme.surface }]}>
      {['all', 'my', 'saved'].map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={[
              styles.segmentButton,
              isActive && {
                backgroundColor: theme.cardBackground,
                shadowColor: theme.shadow,
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
            onPress={() => onTabChange(tab)}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color: isActive ? theme.primary : theme.textSecondary,
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {tab === 'all'
                ? 'All Posts'
                : tab === 'my'
                ? 'My Posts'
                : 'Saved'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Main Component
export default function ConnectionsScreen() {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { conversations } = useUserStore();

  const [connections, setConnections] = useState<MissedConnection[]>([]);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'saved'>('all');
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [editingConnection, setEditingConnection] =
    useState<MissedConnection | null>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    category: 'restaurant',
    timeOccurred: new Date(),
    isAnonymous: false,
    tags: [] as string[],
    images: [] as string[],
    currentTag: '',
  });
  const [createForm, setCreateForm] = useState({
    description: '',
    category: 'restaurant',
    timeOccurred: new Date(),
    isAnonymous: false,
    tags: [] as string[],
    images: [] as string[],
    currentTag: '',
  });
  const [currentLocation, setCurrentLocation] = useState<{
    coordinates: { latitude: number; longitude: number };
    address: string | null;
  } | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);
  const [fullScreenImages, setFullScreenImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  // Helper function to get location with address
  const getCurrentLocationWithAddress = async () => {
    // ... (Existing implementation preserved)
    setIsLocationLoading(true);
    try {
      const location = await smartLocationManager.getCurrentLocation(true);
      if (!location) {
        return null;
      }
      let address: string | null = null;
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: location.latitude,
          longitude: location.longitude,
        });

        if (geocode && geocode.length > 0) {
          const result = geocode[0];
          const parts = [
            result.street,
            result.name,
            result.city,
            result.region,
          ].filter(Boolean);
          address = parts.length > 0 ? parts.join(', ') : null;
        }
      } catch (geocodeError) {
        console.warn('Could not get address:', geocodeError);
      }

      return {
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        address,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    } finally {
      setIsLocationLoading(false);
    }
  };

  // Detect location when modal opens
  useEffect(() => {
    if (showCreateModal && !currentLocation && !isLocationLoading) {
      const detectLocation = async () => {
        try {
          const locationData = await getCurrentLocationWithAddress();
          if (locationData) {
            setCurrentLocation(locationData);
          } else {
            toastService.error(
              'Location Error',
              'Unable to detect your current location. Please try again.'
            );
          }
        } catch (error) {
          console.error('Error detecting location:', error);
          toastService.error(
            'Location Error',
            'Unable to detect your current location. Please try again.'
          );
        }
      };
      detectLocation();
    }
  }, [showCreateModal, currentLocation, isLocationLoading]);

  // Reset location when modal closes
  useEffect(() => {
    if (!showCreateModal) {
      setCurrentLocation(null);
    }
  }, [showCreateModal]);

  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Connections tab focused - refreshing data from Firebase');
      if (user?.id && activeTab === 'my') {
        setIsLoading(true);
      } else if (user?.id && activeTab === 'saved') {
        setIsLoading(true);
      }
      return () => {};
    }, [user?.id, activeTab])
  );

  useEffect(() => {
    if (unsubscribe) {
      unsubscribe();
    }

    setIsLoading(true);

    let newUnsubscribe: () => void;

    if (activeTab === 'my' && user?.id) {
      newUnsubscribe = missedConnectionsService.subscribeToUserPosts(
        user.id,
        (updatedConnections) => {
          setConnections(updatedConnections);
          setIsLoading(false);
        },
        1000
      );
    } else if (activeTab === 'saved' && user?.id) {
      newUnsubscribe = missedConnectionsService.subscribeToSavedPosts(
        user.id,
        (updatedConnections) => {
          setConnections(updatedConnections);
          setIsLoading(false);
        },
        1000
      );
    } else {
      newUnsubscribe = missedConnectionsService.subscribeToConnections(
        (updatedConnections) => {
          setConnections(updatedConnections);
          setIsLoading(false);
        },
        { limitCount: 1000 }
      );
    }

    setUnsubscribe(() => newUnsubscribe);
    setIsLoading(false);

    return () => newUnsubscribe();
  }, [activeTab, user?.id]);

  // Debounce search query
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce delay

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]);

  // --- Handlers (All Logic Preserved) ---
  const handleLike = useCallback(
    async (connectionId: string) => {
      if (!isAuthenticated) {
        toastService.error(
          'Sign In Required',
          'Please sign in to like a post.'
        );
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConnections((prev) =>
        prev.map((conn) => {
          if (conn.id === connectionId) {
            const isLiked = conn.likedBy?.includes(user?.id || '');
            return {
              ...conn,
              likes: isLiked ? Math.max(0, conn.likes - 1) : conn.likes + 1,
              likedBy: isLiked
                ? (conn.likedBy || []).filter((id) => id !== user?.id)
                : [...(conn.likedBy || []), user?.id || ''],
            };
          }
          return conn;
        })
      );
      const result = await missedConnectionsService.toggleLike(
        connectionId,
        user?.id || ''
      );
      if (!result.success) {
        toastService.error(
          t('common.error'),
          result.message || t('common.failedToLike')
        );
      }
    },
    [isAuthenticated, user?.id]
  );

  const handleSave = useCallback(
    async (connectionId: string) => {
      if (!isAuthenticated) {
        toastService.error('Sign In Required', 'Please sign in to save posts.');
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setConnections((prev) =>
        prev.map((conn) => {
          if (conn.id === connectionId) {
            const isSaved = conn.savedBy?.includes(user?.id || '');
            return {
              ...conn,
              savedBy: isSaved
                ? (conn.savedBy || []).filter((id) => id !== user?.id)
                : [...(conn.savedBy || []), user?.id || ''],
            };
          }
          return conn;
        })
      );
      const result = await missedConnectionsService.toggleSave(
        connectionId,
        user?.id || ''
      );
      if (!result.success) {
        toastService.error(
          t('common.error'),
          result.message || t('common.failedToSave')
        );
      }
    },
    [isAuthenticated, user?.id]
  );

  const handleCreatePost = useCallback(async () => {
    if (!createForm.description.trim() || !currentLocation) {
      toastService.error(
        'Error',
        t('connections.fillRequiredFieldsAndLocation')
      );
      return;
    }
    setIsCreating(true);
    try {
      const result = await missedConnectionsService.createConnection({
        location: {
          lat: currentLocation.coordinates.latitude,
          lng: currentLocation.coordinates.longitude,
          landmark: currentLocation.address || 'Current Location',
          category: createForm.category,
          icon: '📍',
        },
        description: createForm.description,
        timeOccurred: createForm.timeOccurred,
        isAnonymous: createForm.isAnonymous,
        tags: createForm.tags,
        images: createForm.images,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toastService.success(
          t('common.success'),
          t('connections.missedConnectionPosted')
        );
        setShowCreateModal(false);
        setCreateForm({
          description: '',
          category: 'restaurant',
          timeOccurred: new Date(),
          isAnonymous: false,
          tags: [],
          images: [],
          currentTag: '',
        });
      } else {
        toastService.error(
          t('common.error'),
          result.message || t('common.failedToCreate')
        );
      }
    } catch (error) {
      toastService.error(t('common.error'), t('common.failedToCreate'));
    } finally {
      setIsCreating(false);
    }
  }, [createForm, currentLocation]);

  const handleEditPost = useCallback(async () => {
    if (!editingConnection || !editForm.description.trim()) {
      toastService.error('Error', t('connections.fillRequiredFields'));
      return;
    }
    setIsCreating(true);
    try {
      const result = await missedConnectionsService.updateConnection(
        editingConnection.id,
        {
          description: editForm.description,
          timeOccurred: editForm.timeOccurred,
          isAnonymous: editForm.isAnonymous,
          category: editForm.category,
          tags: editForm.tags,
          images: editForm.images,
        }
      );

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const updatedConnection =
          await missedConnectionsService.getConnectionById(
            editingConnection.id
          );

        if (updatedConnection.success && updatedConnection.data) {
          setConnections((prev) =>
            prev.map((conn) =>
              conn.id === editingConnection.id ? updatedConnection.data! : conn
            )
          );
        }
        toastService.success(t('common.success'), t('connections.postUpdated'));
        setShowCreateModal(false);
        setEditingConnection(null);
        setEditForm({
          description: '',
          category: 'restaurant',
          timeOccurred: new Date(),
          isAnonymous: false,
        });
      } else {
        toastService.error(
          t('common.error'),
          result.message || t('common.failedToUpdate')
        );
      }
    } catch (error) {
      console.error('Error updating post:', error);
      toastService.error(t('common.error'), t('common.failedToUpdate'));
    } finally {
      setIsCreating(false);
    }
  }, [editingConnection, editForm]);

  const getLatestConnection = useCallback(
    (connectionId: string) => {
      return connections.find((conn) => conn.id === connectionId);
    },
    [connections]
  );

  const checkExistingConversation = useCallback(
    (postOwnerId: string) => {
      if (!user?.id || !conversations) return false;
      return conversations.some((conv) => {
        const participants = conv.participants || [];
        return (
          participants.includes(user.id!) && participants.includes(postOwnerId)
        );
      });
    },
    [user?.id, conversations]
  );

  const handleViewProfile = useCallback(async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const profileUser = {
          id: userDoc.id,
          name: userData.name || 'Unknown',
          age: userData.age || 0,
          zodiacSign: userData.zodiacSign,
          distance: userData.distance,
          image: userData.image || userData.images?.[0] || '',
          images: userData.images,
          bio: userData.bio,
          interests: userData.interests,
          location: userData.location,
          height: userData.height,
        };
        setSelectedUser(profileUser);
        setShowProfileModal(true);
      } else {
        toastService.error('Error', 'User profile not found');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toastService.error(t('common.error'), t('common.failedToLoadProfile'));
    }
  }, []);

  const handleViewImages = useCallback(
    (images: string[], startIndex: number = 0) => {
      setFullScreenImages(images);
      setCurrentImageIndex(startIndex);
      setShowFullScreenImage(true);
    },
    []
  );

  const handleCloseFullScreenImage = useCallback(() => {
    setShowFullScreenImage(false);
    setFullScreenImages([]);
    setCurrentImageIndex(0);
  }, []);

  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev > 0 ? prev - 1 : fullScreenImages.length - 1
    );
  }, [fullScreenImages.length]);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev < fullScreenImages.length - 1 ? prev + 1 : 0
    );
  }, [fullScreenImages.length]);

  const renderItem = useCallback(
    ({
      item: connection,
      index,
    }: {
      item: MissedConnection;
      index: number;
    }) => {
      const hasExistingConversation = checkExistingConversation(
        connection.userId
      );

      return (
        <ConnectionItem
          connection={connection}
          theme={theme}
          index={index}
          onPress={() =>
            missedConnectionsService.viewConnection(
              connection.id,
              user?.id || ''
            )
          }
          onLike={() => handleLike(connection.id)}
          onClaim={async () => {
            const result = await missedConnectionsService.claimConnection(
              connection.id
            );
            if (result.success) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              toastService.success(
                'Success!',
                'Your claim has been submitted!'
              );
            } else {
              toastService.error(
                'Error',
                result.message || t('common.failedToSubmitClaim')
              );
            }
          }}
          onComment={() =>
            router.push(`/connections/comments/${connection.id}`)
          }
          onEdit={() => {
            const latestConnection = getLatestConnection(connection.id);
            if (latestConnection) {
              setEditingConnection(latestConnection);
              setEditForm({
                description: latestConnection.description,
                category: latestConnection.location.category || 'restaurant',
                timeOccurred: latestConnection.timeOccurred,
                isAnonymous: latestConnection.isAnonymous || false,
                tags: latestConnection.tags || [],
                images: latestConnection.images || [],
                currentTag: '',
              });
              setShowCreateModal(true);
            }
          }}
          onDelete={async () => {
            const result = await missedConnectionsService.deleteConnection(
              connection.id
            );
            if (result.success) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              toastService.success(
                t('common.success'),
                t('connections.postDeleted')
              );
            } else {
              toastService.error(
                'Error',
                result.message || t('common.failedToDelete')
              );
            }
          }}
          onSave={() => handleSave(connection.id)}
          isLiked={connection.likedBy?.includes(user?.id || '') || false}
          isSaved={connection.savedBy?.includes(user?.id || '') || false}
          currentUserId={user?.id}
          hasExistingConversation={hasExistingConversation}
          onViewProfile={() => handleViewProfile(connection.userId)}
          onViewImages={(images, startIndex) =>
            handleViewImages(images, startIndex)
          }
        />
      );
    },
    [
      theme,
      user?.id,
      handleLike,
      handleSave,
      router,
      getLatestConnection,
      checkExistingConversation,
    ]
  );

  useEffect(() => {
    if (editingConnection && showCreateModal) {
      const latestConnection = connections.find(
        (conn) => conn.id === editingConnection.id
      );
      if (
        latestConnection &&
        (latestConnection.description !== editingConnection.description ||
          latestConnection.timeOccurred.getTime() !==
            editingConnection.timeOccurred.getTime() ||
          latestConnection.isAnonymous !== editingConnection.isAnonymous)
      ) {
        setEditingConnection(latestConnection);
        setEditForm({
          description: latestConnection.description,
          category: latestConnection.location.category || 'restaurant',
          timeOccurred: latestConnection.timeOccurred,
          isAnonymous: latestConnection.isAnonymous || false,
        });
      }
    }
  }, [connections, editingConnection, showCreateModal]);

  const renderEmptyState = useCallback(() => {
    const emptyMessages = {
      all: {
        title: t('connections.noMissedConnections'),
        subtitle: t('connections.shareFirstConnection'),
      },
      my: {
        title: t('connections.noPosts'),
        subtitle: t('connections.createPost'),
      },
      saved: {
        title: t('connections.noSavedPosts'),
        subtitle: t('connections.savePostsHere'),
      },
    };

    const message = emptyMessages[activeTab];

    return (
      <View style={styles.emptyState}>
        <Sparkles size={60} color={theme.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          {message.title}
          {filteredConnections.length > 0
            ? ` (${filteredConnections.length})`
            : ''}
        </Text>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          {message.subtitle}
        </Text>
      </View>
    );
  }, [activeTab, theme, filteredConnections]);

  const tabCounts = useMemo(() => {
    return {
      all: connections.length,
      my: connections.filter((c) => c.userId === user?.id).length,
      saved: connections.filter((c) => c.savedBy?.includes(user?.id || ''))
        .length,
    };
  }, [connections, user?.id]);

  const filteredConnections = useMemo(() => {
    let filtered = connections;
    if (activeTab === 'my') {
      filtered = filtered.filter((c) => c.userId === user?.id);
    } else if (activeTab === 'saved') {
      filtered = filtered.filter((c) => c.savedBy?.includes(user?.id || ''));
    }
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          (c.description?.toLowerCase() || '').includes(query) ||
          (c.category?.toLowerCase() || '').includes(query) ||
          (c.userName?.toLowerCase() || '').includes(query) ||
          c.tags?.some((tag) => tag?.toLowerCase().includes(query)) ||
          (c.location?.landmark?.toLowerCase() || '').includes(query)
      );
    }
    return filtered;
  }, [connections, activeTab, debouncedSearchQuery, user?.id]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header (Synced with Search/Chat) */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t('connections.title')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {activeTab === 'all'
              ? `${filteredConnections.length} ${
                  filteredConnections.length === 1
                    ? t('connections.post')
                    : t('connections.posts')
                }`
              : activeTab === 'my'
              ? `${filteredConnections.length} ${t('connections.myPosts')}`
              : `${filteredConnections.length} ${t('connections.savedPosts')}`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                backgroundColor: theme.surface,
                borderColor: theme.borderLight,
              },
            ]}
            onPress={() => {
              if (!isAuthenticated) {
                toastService.error(
                  'Sign In Required',
                  'Please sign in to create a post.'
                );
                return;
              }
              setShowCreateModal(true);
            }}
          >
            <Plus size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <SegmentedControl
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        counts={tabCounts}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInputContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Search
            size={18}
            color={theme.textSecondary}
            style={{ marginRight: scale(10) }}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={
              t('connections.searchPlaceholder') || 'Search posts...'
            }
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchButton}
            >
              <X size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <FlatList
        data={filteredConnections}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        style={styles.list}
        contentContainerStyle={
          filteredConnections.length === 0 ? { flex: 1 } : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={5}
      />

      {/* Create Post Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.background },
            ]}
          >
            {/* Header */}
            <View
              style={[styles.modalHeader, { backgroundColor: theme.surface }]}
            >
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setEditingConnection(null);
                }}
                style={styles.modalCloseButton}
              >
                <X size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingConnection
                  ? 'Edit Missed Connection'
                  : 'Create Missed Connection'}
              </Text>
              <View style={styles.modalHeaderSpacer} />
            </View>

            {/* Content */}
            <ScrollView
              style={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContainer}
            >
              <View style={styles.formContainer}>
                {/* Location Section */}
                <View style={styles.formSection}>
                  <View style={styles.sectionHeader}>
                    <MapPin size={20} color={theme.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Your Current Location
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.locationDisplay,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    {isLocationLoading ? (
                      <View style={styles.locationLoading}>
                        <ActivityIndicator size="small" color={theme.primary} />
                        <Text
                          style={[
                            styles.locationText,
                            { color: theme.textSecondary },
                          ]}
                        >
                          Detecting your location...
                        </Text>
                      </View>
                    ) : currentLocation ? (
                      <View style={styles.locationContent}>
                        <MapPin size={16} color={theme.primary} />
                        <Text
                          style={[styles.locationText, { color: theme.text }]}
                        >
                          {currentLocation.address ||
                            `${currentLocation.coordinates.latitude.toFixed(
                              4
                            )}, ${currentLocation.coordinates.longitude.toFixed(
                              4
                            )}`}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.locationError}>
                        <Text
                          style={[styles.locationText, { color: theme.error }]}
                        >
                          Unable to detect location. Please check permissions.
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Description Section */}
                <View style={styles.formSection}>
                  <View style={styles.sectionHeader}>
                    <MessageCircle size={20} color={theme.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      What happened?
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: theme.surface,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="Describe the person and what you remember..."
                    placeholderTextColor={theme.textSecondary}
                    value={
                      editingConnection
                        ? editForm.description
                        : createForm.description
                    }
                    onChangeText={(text) =>
                      editingConnection
                        ? setEditForm((prev) => ({
                            ...prev,
                            description: text,
                          }))
                        : setCreateForm((prev) => ({
                            ...prev,
                            description: text,
                          }))
                    }
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    textAlign={isRTL() ? 'right' : 'left'}
                  />
                </View>

                {/* Tags Section (Code preserved) */}
                <View style={styles.formSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Tags (optional)
                    </Text>
                  </View>
                  {/* Current Tags Display */}
                  {(editingConnection ? editForm.tags : createForm.tags)
                    .length > 0 && (
                    <View style={styles.tagsContainer}>
                      {(editingConnection
                        ? editForm.tags
                        : createForm.tags
                      ).map((tag, index) => (
                        <View
                          key={index}
                          style={[
                            styles.tagChip,
                            { backgroundColor: `${theme.primary}20` },
                          ]}
                        >
                          <Text
                            style={[
                              styles.tagChipText,
                              { color: theme.primary },
                            ]}
                          >
                            #{tag}
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              const currentTags = editingConnection
                                ? editForm.tags
                                : createForm.tags;
                              const newTags = currentTags.filter(
                                (_, i) => i !== index
                              );
                              editingConnection
                                ? setEditForm((prev) => ({
                                    ...prev,
                                    tags: newTags,
                                  }))
                                : setCreateForm((prev) => ({
                                    ...prev,
                                    tags: newTags,
                                  }));
                            }}
                            style={styles.tagRemoveButton}
                          >
                            <X size={14} color={theme.primary} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                  {/* Tag Input (Code preserved) */}
                  {(editingConnection ? editForm.tags : createForm.tags)
                    .length < 5 && (
                    <View style={styles.tagInputContainer}>
                      <TextInput
                        style={[
                          styles.tagInput,
                          {
                            backgroundColor: theme.surface,
                            color: theme.text,
                            borderColor: theme.border,
                          },
                        ]}
                        placeholder="Type a tag and press Add"
                        placeholderTextColor={theme.textSecondary}
                        value={
                          editingConnection
                            ? editForm.currentTag || ''
                            : createForm.currentTag || ''
                        }
                        onChangeText={(text) => {
                          editingConnection
                            ? setEditForm((prev) => ({
                                ...prev,
                                currentTag: text,
                              }))
                            : setCreateForm((prev) => ({
                                ...prev,
                                currentTag: text,
                              }));
                        }}
                        onSubmitEditing={() => {
                          const currentTag = editingConnection
                            ? editForm.currentTag
                            : createForm.currentTag;
                          if (currentTag && currentTag.trim()) {
                            const trimmedTag = currentTag.trim().toLowerCase();
                            const currentTags = editingConnection
                              ? editForm.tags
                              : createForm.tags;

                            if (!currentTags.includes(trimmedTag)) {
                              const newTags = [...currentTags, trimmedTag];
                              editingConnection
                                ? setEditForm((prev) => ({
                                    ...prev,
                                    tags: newTags,
                                    currentTag: '',
                                  }))
                                : setCreateForm((prev) => ({
                                    ...prev,
                                    tags: newTags,
                                    currentTag: '',
                                  }));
                            } else {
                              editingConnection
                                ? setEditForm((prev) => ({
                                    ...prev,
                                    currentTag: '',
                                  }))
                                : setCreateForm((prev) => ({
                                    ...prev,
                                    currentTag: '',
                                  }));
                            }
                          }
                        }}
                        returnKeyType="done"
                        maxLength={20}
                        textAlign={isRTL() ? 'right' : 'left'}
                      />
                      <TouchableOpacity
                        style={[
                          styles.addTagButton,
                          { backgroundColor: theme.primary },
                        ]}
                        onPress={() => {
                          const currentTag = editingConnection
                            ? editForm.currentTag
                            : createForm.currentTag;
                          if (currentTag && currentTag.trim()) {
                            const trimmedTag = currentTag.trim().toLowerCase();
                            const currentTags = editingConnection
                              ? editForm.tags
                              : createForm.tags;

                            if (!currentTags.includes(trimmedTag)) {
                              const newTags = [...currentTags, trimmedTag];
                              editingConnection
                                ? setEditForm((prev) => ({
                                    ...prev,
                                    tags: newTags,
                                    currentTag: '',
                                  }))
                                : setCreateForm((prev) => ({
                                    ...prev,
                                    tags: newTags,
                                    currentTag: '',
                                  }));
                            } else {
                              editingConnection
                                ? setEditForm((prev) => ({
                                    ...prev,
                                    currentTag: '',
                                  }))
                                : setCreateForm((prev) => ({
                                    ...prev,
                                    currentTag: '',
                                  }));
                            }
                          }
                        }}
                      >
                        <Text style={styles.addTagButtonText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Images Section */}
                <View style={styles.formSection}>
                  <View style={styles.sectionHeader}>
                    <ImageIcon size={20} color={theme.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Photos (optional)
                    </Text>
                  </View>
                  <View style={styles.imagesContainer}>
                    {(editingConnection
                      ? editForm.images
                      : createForm.images
                    ).map((imageUri, index) => (
                      <View key={index} style={styles.imageWrapper}>
                        <Image
                          source={{ uri: imageUri }}
                          style={styles.imagePreview}
                        />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => {
                            const currentImages = editingConnection
                              ? editForm.images
                              : createForm.images;
                            const newImages = currentImages.filter(
                              (_, i) => i !== index
                            );
                            editingConnection
                              ? setEditForm((prev) => ({
                                  ...prev,
                                  images: newImages,
                                }))
                              : setCreateForm((prev) => ({
                                  ...prev,
                                  images: newImages,
                                }));
                          }}
                        >
                          <X size={16} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {(editingConnection ? editForm.images : createForm.images)
                      .length < 3 && (
                      <TouchableOpacity
                        style={[
                          styles.addImageButton,
                          { borderColor: theme.border },
                        ]}
                        onPress={async () => {
                          const permissionResult =
                            await ImagePicker.requestMediaLibraryPermissionsAsync();
                          if (permissionResult.granted === false) {
                            toastService.error(
                              'Permission required',
                              'Camera roll permissions are required to add photos'
                            );
                            return;
                          }

                          const result =
                            await ImagePicker.launchImageLibraryAsync({
                              mediaTypes: ImagePicker.MediaTypeOptions.Images,
                              allowsEditing: true,
                              aspect: [4, 3],
                              quality: 0.8,
                            });

                          if (!result.canceled) {
                            const currentImages = editingConnection
                              ? editForm.images
                              : createForm.images;
                            const newImages = [
                              ...currentImages,
                              result.assets[0].uri,
                            ];
                            editingConnection
                              ? setEditForm((prev) => ({
                                  ...prev,
                                  images: newImages,
                                }))
                              : setCreateForm((prev) => ({
                                  ...prev,
                                  images: newImages,
                                }));
                          }
                        }}
                      >
                        <Camera size={24} color={theme.primary} />
                        <Text
                          style={[
                            styles.addImageText,
                            { color: theme.primary },
                          ]}
                        >
                          Add Photo
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Time Section */}
                <View style={styles.formSection}>
                  <View style={styles.sectionHeader}>
                    <Clock size={20} color={theme.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      When did this happen?
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.timeSelector,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => {
                      toastService.info(
                        'Time Picker',
                        'Time picker coming soon'
                      );
                    }}
                  >
                    <Clock size={20} color={theme.primary} />
                    <Text
                      style={[styles.timeSelectorText, { color: theme.text }]}
                    >
                      {(editingConnection
                        ? editForm.timeOccurred
                        : createForm.timeOccurred
                      ).toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Anonymous Option */}
                <View style={styles.formSection}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() =>
                      editingConnection
                        ? setEditForm((prev) => ({
                            ...prev,
                            isAnonymous: !prev.isAnonymous,
                          }))
                        : setCreateForm((prev) => ({
                            ...prev,
                            isAnonymous: !prev.isAnonymous,
                          }))
                    }
                  >
                    <View
                      style={[
                        styles.checkbox,
                        { borderColor: theme.border },
                        (editingConnection
                          ? editForm.isAnonymous
                          : createForm.isAnonymous) && {
                          backgroundColor: theme.primary,
                        },
                      ]}
                    >
                      {(editingConnection
                        ? editForm.isAnonymous
                        : createForm.isAnonymous) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <View style={styles.checkboxContent}>
                      <Text
                        style={[styles.checkboxLabel, { color: theme.text }]}
                      >
                        Post anonymously
                      </Text>
                      <Text
                        style={[
                          styles.checkboxSubtext,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Your identity will be hidden from others
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View
              style={[
                styles.modalBottomBar,
                { backgroundColor: theme.surface },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setEditingConnection(null);
                }}
                style={[styles.cancelButton, { borderColor: theme.border }]}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={editingConnection ? handleEditPost : handleCreatePost}
                disabled={isCreating}
                style={[
                  styles.postButton,
                  {
                    backgroundColor: isCreating ? theme.border : theme.primary,
                  },
                ]}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Sparkles size={18} color="#FFF" />
                    <Text style={styles.postButtonText}>
                      {editingConnection ? 'Update Post' : 'Create Post'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Profile Detail Modal */}
      {selectedUser && (
        <Modal
          visible={showProfileModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowProfileModal(false)}
        >
          <ProfileDetail
            user={selectedUser}
            onClose={() => setShowProfileModal(false)}
            onLike={() => {}}
            onDislike={() => {}}
            isMissedConnection={true}
          />
        </Modal>
      )}

      {/* Full Screen Image Modal */}
      <Modal
        visible={showFullScreenImage}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseFullScreenImage}
      >
        <View style={styles.fullScreenContainer}>
          {/* Header */}
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity
              style={styles.fullScreenCloseButton}
              onPress={handleCloseFullScreenImage}
            >
              <X size={24} color="white" />
            </TouchableOpacity>
            {fullScreenImages.length > 1 && (
              <Text style={styles.imageCounter}>
                {currentImageIndex + 1} / {fullScreenImages.length}
              </Text>
            )}
            <View style={{ width: 40 }} />
          </View>

          {/* Image */}
          <View style={styles.fullScreenImageContainer}>
            <Image
              source={{ uri: fullScreenImages[currentImageIndex] }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          </View>

          {/* Navigation Controls */}
          {fullScreenImages.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton]}
                onPress={handlePrevImage}
              >
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={handleNextImage}
              >
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header - Matches Search/Chat/Loved
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: verticalScale(20),
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginLeft: scale(42), // Offset for the right action button to center title
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: moderateScale(34),
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    opacity: 0.7,
    textAlign: 'center',
  },
  iconButton: {
    width: scale(42),
    height: scale(42),
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Tabs
  segmentContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: verticalScale(8),
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  segmentText: { fontSize: moderateScale(14) },

  // Search
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: verticalScale(10),
    height: verticalScale(46),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(15),
    height: '100%',
  },
  clearSearchButton: {
    padding: 4,
  },

  // List
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: verticalScale(120),
  },

  // Connection Item (Card)
  connectionItem: {
    borderRadius: borderRadius.xl, // Match Search/Loved cards (24)
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  connectionContent: {
    flex: 1,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  userAvatar: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    marginRight: spacing.sm,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginBottom: 2,
  },
  locationText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeText: {
    fontSize: moderateScale(11),
    fontWeight: '500',
    marginLeft: 4,
  },
  hotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  hotBadgeText: {
    color: '#FFF',
    fontSize: moderateScale(10),
    fontWeight: '700',
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  moreTagsText: {
    fontSize: moderateScale(11),
    fontWeight: '500',
    alignSelf: 'center',
    marginLeft: 4,
  },

  // Description & Stats
  descriptionText: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(22),
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
  },

  // Images
  postImagesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  postImage: {
    width: scale(70),
    height: scale(70),
    borderRadius: borderRadius.md,
    backgroundColor: '#f0f0f0',
  },
  moreImagesOverlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  moreImagesText: {
    color: '#fff',
    fontWeight: '700',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 5,
  },
  actionText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  claimButtonText: {
    color: '#fff',
    fontSize: moderateScale(12),
    fontWeight: '700',
  },

  // Options
  optionsMenu: {
    position: 'relative',
  },
  optionsDropdown: {
    position: 'absolute',
    bottom: 40,
    right: 0,
    minWidth: 120,
    borderWidth: 1,
    borderRadius: 12,
    zIndex: 999,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  optionText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  optionDivider: {
    height: 1,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: verticalScale(60),
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    lineHeight: 20,
  },

  // Modal (Form)
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  modalCloseButton: { padding: 4 },
  modalHeaderSpacer: { width: 32 },
  modalScrollContent: { flex: 1 },
  modalScrollContainer: { paddingBottom: 100 },
  formContainer: { padding: spacing.lg },
  formSection: { marginBottom: spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 8,
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: moderateScale(15),
    height: 120,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  checkboxContent: { flex: 1 },
  checkboxLabel: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    marginBottom: 2,
  },
  checkboxSubtext: { fontSize: moderateScale(13) },
  modalBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 12,
  },
  cancelButtonText: { fontSize: moderateScale(15), fontWeight: '600' },
  postButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.xl,
    gap: 8,
  },
  postButtonText: {
    color: '#FFF',
    fontSize: moderateScale(15),
    fontWeight: '600',
  },

  // Location Helper
  locationDisplay: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    justifyContent: 'center',
    minHeight: 50,
  },
  locationLoading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationError: { alignItems: 'center' },
  locationText: { fontSize: moderateScale(14), flex: 1 },

  // Tags Helper
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagChipText: { fontSize: moderateScale(13), fontWeight: '600' },
  tagRemoveButton: { padding: 2 },
  tagInputContainer: { flexDirection: 'row', gap: 8 },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: moderateScale(14),
  },
  addTagButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addTagButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: moderateScale(13),
  },

  // Images Helper
  imagesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  imageWrapper: { position: 'relative' },
  imagePreview: { width: 80, height: 80, borderRadius: 8 },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addImageText: { fontSize: moderateScale(11), fontWeight: '500' },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  timeSelectorText: { fontSize: moderateScale(15), flex: 1 },

  // FullScreen Image
  fullScreenContainer: { flex: 1, backgroundColor: '#000' },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  fullScreenCloseButton: { padding: 8 },
  imageCounter: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  fullScreenImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: { width: '100%', height: '100%' },
  navButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevButton: { left: 20 },
  nextButton: { right: 20 },
  navButtonText: { color: '#FFF', fontSize: 24 },
});
