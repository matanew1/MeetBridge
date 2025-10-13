// Simplified connections screen with better performance

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
} from 'lucide-react-native';
import { MapPin, Users } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import LocationService from '../../services/locationService';
import missedConnectionsService, {
  MissedConnection,
} from '../../services/firebase/missedConnectionsService';

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
  isLiked: boolean;
  isSaved: boolean;
  currentUserId: string | undefined;
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
    isLiked,
    isSaved,
    currentUserId,
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
        activeOpacity={0.7}
        onPress={onPress}
      >
        {/* Accent Bar */}
        <View style={[styles.accentBar, { backgroundColor: theme.primary }]} />

        {/* Content */}
        <View style={styles.connectionContent}>
          {/* User Profile */}
          <View style={styles.userSection}>
            <Image
              source={
                connection.userImage
                  ? { uri: connection.userImage }
                  : require('../../assets/images/placeholder.png')
              }
              style={styles.userAvatar}
            />
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
                <Clock size={11} color={theme.textSecondary} />
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
          {connection.tags && connection.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {connection.tags.slice(0, 3).map((tag: string) => (
                <View
                  key={tag}
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
              <Eye size={12} color={theme.textSecondary} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                {connection.views || 0}
              </Text>
            </View>
            <View style={styles.statItem}>
              <TrendingUp size={12} color={theme.textSecondary} />
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
                size={16}
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
              <MessageCircle size={16} color={theme.textSecondary} />
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
                size={16}
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
                  <MoreVertical size={16} color={theme.textSecondary} />
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

            <TouchableOpacity
              style={[styles.claimButton, { backgroundColor: theme.success }]}
              onPress={(e) => {
                e.stopPropagation();
                onClaim();
              }}
            >
              <Sparkles size={14} color="#FFF" />
              <Text style={styles.claimButtonText}>That's Me!</Text>
            </TouchableOpacity>
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
      prevProps.theme === nextProps.theme
    );
  }
);

// Main Component
export default function ConnectionsScreen() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [connections, setConnections] = useState<MissedConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'saved'>('all');
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingConnection, setEditingConnection] =
    useState<MissedConnection | null>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    category: 'restaurant',
    timeOccurred: new Date(),
    isAnonymous: false,
  });
  const [createForm, setCreateForm] = useState({
    description: '',
    category: 'restaurant',
    timeOccurred: new Date(),
    isAnonymous: false,
  });
  const [currentLocation, setCurrentLocation] = useState<{
    coordinates: { latitude: number; longitude: number };
    address: string | null;
  } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Detect location when modal opens
  useEffect(() => {
    if (showCreateModal && !currentLocation && !isDetectingLocation) {
      const detectLocation = async () => {
        setIsDetectingLocation(true);
        try {
          const locationData =
            await LocationService.getCurrentLocationWithAddress();
          if (locationData) {
            setCurrentLocation(locationData);
          } else {
            Alert.alert(
              'Location Error',
              'Unable to detect your current location. Please try again.'
            );
          }
        } catch (error) {
          console.error('Error detecting location:', error);
          Alert.alert(
            'Location Error',
            'Unable to detect your current location. Please try again.'
          );
        } finally {
          setIsDetectingLocation(false);
        }
      };
      detectLocation();
    }
  }, [showCreateModal, currentLocation, isDetectingLocation]);

  // Reset location when modal closes
  useEffect(() => {
    if (!showCreateModal) {
      setCurrentLocation(null);
      setIsDetectingLocation(false);
    }
  }, [showCreateModal]);

  // Refresh connections when screen comes into focus (e.g., returning from comments)
  useFocusEffect(
    useCallback(() => {
      // Real-time listeners handle updates automatically
      return () => {};
    }, [])
  );

  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Clean up previous subscription
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
    setIsLoading(false); // Set loading to false after setting up the listener

    return () => newUnsubscribe();
  }, [activeTab, user?.id]);

  // Handlers
  const handleLike = useCallback(
    async (connectionId: string) => {
      if (!isAuthenticated) {
        Alert.alert('Sign In Required', 'Please sign in to like a post.');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Optimistic update
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
        Alert.alert('Error', result.message);
        // Real-time listeners will handle state updates
      }
    },
    [isAuthenticated, user?.id]
  );

  const handleSave = useCallback(
    async (connectionId: string) => {
      if (!isAuthenticated) {
        Alert.alert('Sign In Required', 'Please sign in to save posts.');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Optimistic update
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
        Alert.alert('Error', result.message);
        // Real-time listeners will handle state updates
      }
    },
    [isAuthenticated, user?.id]
  );

  const handleCreatePost = useCallback(async () => {
    if (!createForm.description.trim() || !currentLocation) {
      Alert.alert(
        'Error',
        'Please fill in all required fields and ensure location is detected.'
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
          icon: '📍', // Default icon
        },
        description: createForm.description,
        timeOccurred: createForm.timeOccurred,
        isAnonymous: createForm.isAnonymous,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success!', 'Your missed connection has been posted!');
        setShowCreateModal(false);
        setCreateForm({
          description: '',
          category: 'restaurant',
          timeOccurred: new Date(),
          isAnonymous: false,
        });
        // Real-time listeners will update the list automatically
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, [createForm, currentLocation]);

  const handleEditPost = useCallback(async () => {
    if (!editingConnection || !editForm.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
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
        }
      );

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Fetch the updated connection immediately
        const updatedConnection =
          await missedConnectionsService.getConnectionById(
            editingConnection.id
          );

        if (updatedConnection.success && updatedConnection.data) {
          // Update local state immediately with the fresh data
          setConnections((prev) =>
            prev.map((conn) =>
              conn.id === editingConnection.id ? updatedConnection.data! : conn
            )
          );
        }

        Alert.alert('Success!', 'Your post has been updated!');

        // Close modal and reset form
        setShowCreateModal(false);
        setEditingConnection(null);
        setEditForm({
          description: '',
          category: 'restaurant',
          timeOccurred: new Date(),
          isAnonymous: false,
        });
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error updating post:', error);
      Alert.alert('Error', 'Failed to update post. Please try again.');
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

  const renderItem = useCallback(
    ({
      item: connection,
      index,
    }: {
      item: MissedConnection;
      index: number;
    }) => (
      <ConnectionItem
        connection={connection}
        theme={theme}
        index={index}
        onPress={() =>
          missedConnectionsService.viewConnection(connection.id, user?.id || '')
        }
        onLike={() => handleLike(connection.id)}
        onClaim={() => {
          Alert.alert("That's You?", 'Were you at this location?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Yes, verify',
              onPress: async () => {
                const result = await missedConnectionsService.claimConnection(
                  connection.id
                );
                if (result.success) {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                  );
                  Alert.alert('Success!', 'Your claim has been submitted!');
                }
              },
            },
          ]);
        }}
        onComment={() => router.push(`/connections/comments/${connection.id}`)}
        onEdit={() => {
          // Always get the latest connection data from state
          const latestConnection = getLatestConnection(connection.id);
          if (latestConnection) {
            setEditingConnection(latestConnection);
            setEditForm({
              description: latestConnection.description,
              category: latestConnection.location.category || 'restaurant',
              timeOccurred: latestConnection.timeOccurred,
              isAnonymous: latestConnection.isAnonymous || false,
            });
            setShowCreateModal(true);
          }
        }}
        onDelete={async () => {
          Alert.alert(
            'Delete Post',
            'Are you sure you want to delete this post?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  const result =
                    await missedConnectionsService.deleteConnection(
                      connection.id
                    );
                  if (result.success) {
                    // Real-time listeners will remove the post automatically
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success
                    );
                  }
                },
              },
            ]
          );
        }}
        onSave={() => handleSave(connection.id)}
        isLiked={connection.likedBy?.includes(user?.id || '') || false}
        isSaved={connection.savedBy?.includes(user?.id || '') || false}
        currentUserId={user?.id}
      />
    ),
    [theme, user?.id, handleLike, handleSave, router, getLatestConnection]
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
        // Update with latest data
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

  return (
    <LinearGradient
      colors={[theme.background, theme.surfaceVariant]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Board ({connections.length})
          </Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: theme.surface }]}
              onPress={() => {
                if (!isAuthenticated) {
                  Alert.alert(
                    'Sign In Required',
                    'Please sign in to create a post.'
                  );
                  return;
                }
                setShowCreateModal(true);
              }}
            >
              <Plus size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'all' && [
                styles.activeTab,
                { borderBottomColor: theme.primary },
              ],
            ]}
            onPress={() => setActiveTab('all')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'all' ? theme.primary : theme.textSecondary,
                },
              ]}
            >
              All Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'my' && [
                styles.activeTab,
                { borderBottomColor: theme.primary },
              ],
            ]}
            onPress={() => setActiveTab('my')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'my' ? theme.primary : theme.textSecondary,
                },
              ]}
            >
              My Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'saved' && [
                styles.activeTab,
                { borderBottomColor: theme.primary },
              ],
            ]}
            onPress={() => setActiveTab('saved')}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'saved' ? theme.primary : theme.textSecondary,
                },
              ]}
            >
              Saved
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <FlatList
          data={connections}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={5}
        />
      </SafeAreaView>

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
                    {isDetectingLocation ? (
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
                  />
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
                      // Could implement time picker here
                      Alert.alert('Time Selector', 'Time picker would go here');
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingTop: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  headerIcons: { flexDirection: 'row', gap: 10 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20 },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomWidth: 2 },
  tabText: { fontSize: 15, fontWeight: '600' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  connectionItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 12,
    paddingLeft: 0,
    borderWidth: 1,
    borderRadius: 16,
    marginVertical: 6,
  },
  accentBar: { width: 4, borderRadius: 2, marginRight: 8 },
  connectionContent: { flex: 1, paddingRight: 4 },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  userAvatar: { width: 40, height: 40, borderRadius: 20 },
  userInfo: { flex: 1, gap: 3 },
  userName: { fontSize: 15, fontWeight: '700' },
  locationText: { fontSize: 12, fontWeight: '500' },
  rightColumn: { alignItems: 'flex-end', gap: 4 },
  timeContainer: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timeText: { fontSize: 10, fontWeight: '500' },
  hotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  hotBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  tagText: { fontSize: 11, fontWeight: '600' },
  moreTagsText: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontWeight: '600' },
  descriptionText: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  actionText: { fontSize: 13, fontWeight: '600' },
  optionsMenu: { position: 'relative' },
  optionsDropdown: {
    position: 'absolute',
    bottom: 45,
    right: 0,
    minWidth: 140,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 1000,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionText: { fontSize: 14, fontWeight: '600' },
  optionDivider: { height: 1 },
  claimButton: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  claimButtonText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  // Modal styles
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalCloseButton: { padding: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalHeaderSpacer: { width: 40 },
  modalScrollContent: { flex: 1 },
  modalScrollContainer: { paddingBottom: 100 },
  formContainer: { padding: 20 },
  formSection: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 120,
    textAlignVertical: 'top',
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  timeSelectorText: { fontSize: 16, flex: 1 },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkmark: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  checkboxContent: { flex: 1 },
  checkboxLabel: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  checkboxSubtext: { fontSize: 14, fontWeight: '400' },
  locationDisplay: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 50,
    justifyContent: 'center',
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationError: {
    alignItems: 'center',
  },
  locationText: { fontSize: 16, flex: 1 },
  modalBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 12,
  },
  cancelButtonText: { fontSize: 16, fontWeight: '600' },
  postButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  postButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  locationDisplay: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 50,
    justifyContent: 'center',
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationError: {
    alignItems: 'center',
  },
  locationText: { fontSize: 16, flex: 1 },
});
