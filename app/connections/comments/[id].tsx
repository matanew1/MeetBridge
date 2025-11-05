// app/connections/comments/[id].tsx - Comments page for a connection
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Send,
  MessageCircle,
  Heart,
  Eye,
  TrendingUp,
  EyeOff,
  UserCheck,
  MapPin,
  CheckCircle,
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import missedConnectionsService, {
  MissedConnection,
} from '../../../services/firebase/missedConnectionsService';
import toastService from '../../../services/toastService';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  text: string;
  createdAt: Date;
  isAnonymous?: boolean;
}

function formatRelativeTime(date: Date): string {
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
}

// Separate CommentItem component to fix hooks issue
const CommentItem: React.FC<{
  comment: Comment;
  index: number;
  theme: any;
}> = ({ comment, index, theme }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const commentFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        delay: index * 30,
        useNativeDriver: true,
      }),
      Animated.timing(commentFadeAnim, {
        toValue: 1,
        duration: 250,
        delay: index * 30,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.commentItem,
        {
          backgroundColor: theme.cardBackground,
          transform: [{ translateX: slideAnim }],
          opacity: commentFadeAnim,
        },
      ]}
    >
      <Image
        source={
          comment.userImage
            ? { uri: comment.userImage }
            : require('../../../assets/images/placeholder.png')
        }
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <View style={styles.commentUserNameRow}>
            <Text style={[styles.commentUserName, { color: theme.text }]}>
              {comment.userName}
            </Text>
            {comment.isAnonymous && (
              <View
                style={[
                  styles.anonymousBadge,
                  { backgroundColor: theme.borderLight },
                ]}
              >
                <EyeOff size={10} color={theme.textSecondary} />
                <Text
                  style={[
                    styles.anonymousBadgeText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Anonymous
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.commentTime, { color: theme.textSecondary }]}>
            {formatRelativeTime(comment.createdAt)}
          </Text>
        </View>
        <Text style={[styles.commentText, { color: theme.text }]}>
          {comment.text}
        </Text>
      </View>
    </Animated.View>
  );
};

export default function CommentsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { user, isAuthenticated } = useAuth();

  const [connection, setConnection] = useState<MissedConnection | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    loadConnectionAndComments();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Keyboard listeners - skip on web platform
    let keyboardWillShow: any;
    let keyboardWillHide: any;

    if (Platform.OS !== 'web') {
      keyboardWillShow = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        (e) => {
          setKeyboardHeight(e.endCoordinates.height);
        }
      );

      keyboardWillHide = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        () => {
          setKeyboardHeight(0);
        }
      );
    }

    // Set up real-time listener for comments
    const unsubscribe = missedConnectionsService.subscribeToComments(
      id as string,
      (updatedComments) => {
        setComments(updatedComments);
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (Platform.OS !== 'web') {
        keyboardWillShow?.remove();
        keyboardWillHide?.remove();
      }
    };
  }, [id]);

  const loadConnectionAndComments = async () => {
    setIsLoading(true);
    try {
      // Load connection details
      const connectionResult = await missedConnectionsService.getConnectionById(
        id as string
      );
      if (connectionResult.success && connectionResult.data) {
        setConnection(connectionResult.data);
      }

      // Load comments
      const commentsResult = await missedConnectionsService.getComments(
        id as string
      );
      if (commentsResult.success) {
        setComments(commentsResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!isAuthenticated) {
      toastService.error('Sign In Required', 'Please sign in to comment.');
      return;
    }

    if (!commentText.trim()) {
      return;
    }

    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await missedConnectionsService.addComment(
      id as string,
      user?.id || '',
      commentText.trim(),
      isAnonymous
    );

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCommentText('');

      // Reload connection to get updated comment count
      const connectionResult = await missedConnectionsService.getConnectionById(
        id as string
      );
      if (connectionResult.success && connectionResult.data) {
        setConnection(connectionResult.data);
      }

      // Scroll to bottom to show new comment (real-time listener will update comments)
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } else {
      toastService.error('Error', result.message);
    }

    setIsSending(false);
  };

  const handleClaimConnection = async () => {
    if (!isAuthenticated) {
      toastService.error(
        'Sign In Required',
        'Please sign in to claim this connection.'
      );
      return;
    }

    /**
     * VERIFICATION SYSTEM IDEAS:
     *
     * 1. Location History Verification (Privacy-Aware)
     *    - Check if user's location history shows they were within 100m radius
     *    - Only checks if user has location tracking enabled
     *    - Uses geohash matching for privacy
     *
     * 2. Time-Based Verification
     *    - Check if claim time matches post time ±2 hours
     *    - Cross-reference with user's app usage timestamps
     *
     * 3. Creator Confirmation
     *    - Post creator gets notification with claimer's profile
     *    - Can approve/reject the claim
     *    - Both get matched if approved
     *
     * 4. Reputation System
     *    - Track successful vs. false claims
     *    - Lower credibility = claims require more verification
     *    - Good reputation = instant matches
     *
     * 5. Photo Verification (Future)
     *    - Optional: Upload a photo from that time/location
     *    - Check EXIF data for location & timestamp
     *
     * 6. Mutual Friends/Connections
     *    - If claimer and creator have mutual matches
     *    - Higher trust score
     */

    // Show verification info and confirmation
    toastService.info(
      "That's You? 🎯",
      "By claiming this connection, you're saying you were at this location at the specified time.\n\n" +
        '💡 Verification:\n' +
        "• We'll check your location history (if enabled)\n" +
        '• Post creator will review your claim\n' +
        '• Multiple false claims may affect your credibility\n\n' +
        'Are you sure you were there?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: "Yes, That's Me!",
          onPress: async () => {
            setIsClaiming(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            const result = await missedConnectionsService.claimConnection(
              id as string
            );

            if (result.success) {
              toastService.info(
                'Claim Submitted! ✨',
                "The post creator will be notified. If they confirm, you'll both be matched!"
              );

              // Reload connection to show updated claims
              const connectionResult =
                await missedConnectionsService.getConnectionById(id as string);
              if (connectionResult.success && connectionResult.data) {
                setConnection(connectionResult.data);
              }
            } else {
              toastService.error('Error', result.message);
            }

            setIsClaiming(false);
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={[theme.background, theme.surfaceVariant]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <MessageCircle size={20} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Comments
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.commentCount, { color: theme.textSecondary }]}>
              {comments.length}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            {/* Connection Post */}
            {connection && (
              <Animated.View
                style={[styles.postContainer, { opacity: fadeAnim }]}
              >
                <View
                  style={[
                    styles.postCard,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.borderLight,
                    },
                  ]}
                >
                  {/* User Info */}
                  <View style={styles.postHeader}>
                    <Image
                      source={
                        connection.userImage
                          ? { uri: connection.userImage }
                          : require('../../../assets/images/placeholder.png')
                      }
                      style={styles.postAvatar}
                    />
                    <View style={styles.postUserInfo}>
                      <Text
                        style={[styles.postUserName, { color: theme.text }]}
                      >
                        {connection.userName || 'Anonymous'}
                      </Text>
                      <View style={styles.postLocationRow}>
                        <Text style={styles.postLocationIcon}>
                          {connection.location.icon}
                        </Text>
                        <Text
                          style={[
                            styles.postLocationText,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {connection.location.landmark}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={[styles.postDescription, { color: theme.text }]}>
                    {connection.description}
                  </Text>

                  {/* Stats */}
                  <View style={styles.postStats}>
                    <View style={styles.statItem}>
                      <Heart size={14} color={theme.primary} />
                      <Text style={[styles.statText, { color: theme.text }]}>
                        {connection.likes}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Eye size={14} color={theme.textSecondary} />
                      <Text style={[styles.statText, { color: theme.text }]}>
                        {connection.views || 0}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <MessageCircle size={14} color={theme.textSecondary} />
                      <Text style={[styles.statText, { color: theme.text }]}>
                        {connection.comments || 0}
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Comments List */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.commentsList}
              contentContainerStyle={[
                styles.commentsListContent,
                {
                  paddingBottom: Platform.OS === 'android' ? keyboardHeight : 0,
                },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={() => Keyboard.dismiss()}
            >
              {comments.length === 0 ? (
                <View style={styles.emptyState}>
                  <MessageCircle size={48} color={theme.textSecondary} />
                  <Text
                    style={[styles.emptyText, { color: theme.textSecondary }]}
                  >
                    No comments yet. Be the first to comment!
                  </Text>
                </View>
              ) : (
                comments.map((comment, index) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    index={index}
                    theme={theme}
                  />
                ))
              )}
            </ScrollView>

            {/* Comment Input */}
            <View style={styles.commentInputWrapper}>
              {/* Anonymous Toggle */}
              <View
                style={[
                  styles.anonymousToggle,
                  { backgroundColor: theme.surface },
                ]}
              >
                <TouchableOpacity
                  style={styles.anonymousToggleButton}
                  onPress={() => {
                    setIsAnonymous(!isAnonymous);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  {isAnonymous ? (
                    <EyeOff size={16} color={theme.primary} />
                  ) : (
                    <Eye size={16} color={theme.textSecondary} />
                  )}
                  <Text
                    style={[
                      styles.anonymousToggleText,
                      {
                        color: isAnonymous
                          ? theme.primary
                          : theme.textSecondary,
                      },
                    ]}
                  >
                    {isAnonymous ? 'Anonymous' : 'Public'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Input Row */}
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.surface,
                    borderTopColor: theme.border,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="Add a comment..."
                  placeholderTextColor={theme.textSecondary}
                  value={commentText}
                  onChangeText={setCommentText}
                  onFocus={() => {
                    // Scroll to bottom when input is focused
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                  }}
                  multiline
                  maxLength={500}
                  returnKeyType="send"
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    {
                      backgroundColor:
                        commentText.trim() && !isSending
                          ? theme.primary
                          : theme.borderLight,
                    },
                  ]}
                  onPress={handleSendComment}
                  disabled={!commentText.trim() || isSending}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Send size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  commentCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  postCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  postUserInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  postLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postLocationIcon: {
    fontSize: 12,
  },
  postLocationText: {
    fontSize: 13,
    fontWeight: '500',
  },
  postDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
  },
  commentsList: {
    flex: 1,
  },
  commentsListContent: {
    padding: 16,
    gap: 12,
  },
  commentItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentUserNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '700',
  },
  anonymousBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  anonymousBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  commentTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  claimContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  claimButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  claimHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  commentInputWrapper: {
    backgroundColor: 'transparent',
  },
  anonymousToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  anonymousToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  anonymousToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
