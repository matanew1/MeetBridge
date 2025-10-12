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
  RefreshCw,
  Zap,
  Eye,
  TrendingUp,
  Edit2,
  Trash2,
  MoreVertical,
  Bookmark,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
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
      prevProps.theme === nextProps.theme
    );
  }
);

// Main Component
export default function ConnectionsScreen() {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [connections, setConnections] = useState<MissedConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'saved'>('all');

  // Load connections
  const loadConnections = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setIsLoading(true);
      }

      let result;
      if (activeTab === 'my') {
        result = await missedConnectionsService.getUserPosts(
          user?.id || '',
          50
        );
      } else if (activeTab === 'saved') {
        result = await missedConnectionsService.getSavedPosts(
          user?.id || '',
          50
        );
      } else {
        result = await missedConnectionsService.getConnections({
          limitCount: 50,
        });
      }

      if (result.success) {
        setConnections(result.data);
        if (isRefresh) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        Alert.alert('Error', result.message);
      }

      setIsLoading(false);
      setIsRefreshing(false);
    },
    [activeTab, user?.id]
  );

  useEffect(() => {
    loadConnections();

    // Real-time subscription for "All Posts"
    if (activeTab === 'all') {
      const unsubscribe = missedConnectionsService.subscribeToConnections(
        (updatedConnections) => {
          setConnections(updatedConnections);
        },
        { limitCount: 50 }
      );

      return () => unsubscribe();
    }
  }, [activeTab, loadConnections]);

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
        loadConnections();
      }
    },
    [isAuthenticated, user?.id, loadConnections]
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
        loadConnections();
      }
    },
    [isAuthenticated, user?.id, loadConnections]
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
          // Handle edit
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
                    loadConnections();
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
    [theme, user?.id, handleLike, handleSave, loadConnections, router]
  );

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
              onPress={() => loadConnections(true)}
              disabled={isRefreshing}
            >
              <RefreshCw size={20} color={theme.primary} />
            </TouchableOpacity>
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
                // Handle create post
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
});
