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
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
} from '../../../utils/responsive';
import missedConnectionsService, {
  MissedConnection,
} from '../../../services/firebase/missedConnectionsService';
import ProfileDetail from '../../components/ProfileDetail';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';
import toastService from '../../../services/toastService';
import { useTranslation } from 'react-i18next';
import { isRTL } from '../../../i18n';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  text: string;
  createdAt: Date;
  isAnonymous?: boolean;
}

function formatRelativeTime(date: Date, t: any): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return t('comments.justNow');
  if (minutes < 60) return t('comments.minutesAgo', { count: minutes });
  if (hours < 24) return t('comments.hoursAgo', { count: hours });
  if (days === 1) return t('chat.yesterday');
  if (days < 7) return t('comments.daysAgo', { count: days });
  return date.toLocaleDateString();
}

// Separate CommentItem component to fix hooks issue
const CommentItem: React.FC<{
  comment: Comment;
  index: number;
  theme: any;
  onAvatarPress: (userId: string) => void;
  t: any;
}> = ({ comment, index, theme, onAvatarPress, t }) => {
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
      <TouchableOpacity
        onPress={() => onAvatarPress(comment.userId)}
        activeOpacity={0.7}
      >
        <Image
          source={
            comment.userImage
              ? { uri: comment.userImage }
              : require('../../../assets/images/placeholder.png')
          }
          style={styles.commentAvatar}
        />
      </TouchableOpacity>
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
                  {t('comments.anonymous')}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.commentTime, { color: theme.textSecondary }]}>
            {formatRelativeTime(comment.createdAt, t)}
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
  const { t } = useTranslation();

  const [connection, setConnection] = useState<MissedConnection | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);

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
      if (connectionResult?.success && connectionResult?.data) {
        setConnection(connectionResult.data);
      }

      // Load comments
      const commentsResult = await missedConnectionsService.getComments(
        id as string
      );
      if (commentsResult?.success) {
        setComments(commentsResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarPress = async (userId: string) => {
    try {
      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSelectedUserProfile({
          id: userDoc.id,
          name: userData.name || 'Unknown User',
          age: userData.age || 0,
          zodiacSign: userData.zodiacSign,
          image: userData.image || '',
          images: userData.images || [],
          bio: userData.bio || '',
          interests: userData.interests || [],
          location: userData.location || '',
          height: userData.height,
        });
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toastService.error(t('common.error'), t('errors.unexpectedError'));
    }
  };

  const handleSendComment = async () => {
    if (!isAuthenticated) {
      toastService.error(
        t('comments.signInRequired'),
        t('comments.signInToComment')
      );
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

    if (result?.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCommentText('');

      // Reload connection to get updated comment count
      const connectionResult = await missedConnectionsService.getConnectionById(
        id as string
      );
      if (connectionResult?.success && connectionResult?.data) {
        setConnection(connectionResult.data);
      }

      // Scroll to bottom to show new comment (real-time listener will update comments)
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } else {
      toastService.error(
        t('common.error'),
        result?.message || t('comments.commentError')
      );
    }

    setIsSending(false);
  };

  const handleClaimConnection = async () => {
    if (!isAuthenticated) {
      toastService.error(
        t('comments.signInRequired'),
        t('comments.signInToClaim')
      );
      return;
    }

    // Show verification info and confirmation
    toastService.info(
      t('comments.claimConfirmTitle'),
      t('comments.claimConfirmMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('comments.claimConnection'),
          onPress: async () => {
            setIsClaiming(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            const result = await missedConnectionsService.claimConnection(
              id as string
            );

            if (result?.success) {
              toastService.info(
                t('comments.claimSuccess'),
                t('comments.claimSuccess')
              );

              // Reload connection to show updated claims
              const connectionResult =
                await missedConnectionsService.getConnectionById(id as string);
              if (connectionResult?.success && connectionResult?.data) {
                setConnection(connectionResult.data);
              }
            } else {
              toastService.error(
                t('common.error'),
                result?.message || t('comments.claimFailed')
              );
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
              {t('comments.commentsTitle')}
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
                    <TouchableOpacity
                      onPress={() => handleAvatarPress(connection.userId)}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={
                          connection.userImage
                            ? { uri: connection.userImage }
                            : require('../../../assets/images/placeholder.png')
                        }
                        style={styles.postAvatar}
                      />
                    </TouchableOpacity>
                    <View style={styles.postUserInfo}>
                      <Text
                        style={[styles.postUserName, { color: theme.text }]}
                      >
                        {connection.userName || t('comments.anonymous')}
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

                  {/* Stats Bubbles */}
                  <View style={styles.postStats}>
                    {/* Likes Bubble */}
                    <View
                      style={[
                        styles.statBubble,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.borderLight,
                        },
                      ]}
                    >
                      <Heart
                        size={16}
                        color={theme.primary}
                        fill={theme.primary}
                      />
                      <Text
                        style={[styles.statText, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {connection.likes}
                      </Text>
                    </View>

                    {/* Views Bubble */}
                    <View
                      style={[
                        styles.statBubble,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.borderLight,
                        },
                      ]}
                    >
                      <Eye size={16} color={theme.textSecondary} />
                      <Text
                        style={[styles.statText, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {connection.views || 0}
                      </Text>
                    </View>

                    {/* Comments Bubble */}
                    <View
                      style={[
                        styles.statBubble,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.borderLight,
                        },
                      ]}
                    >
                      <MessageCircle size={16} color={theme.textSecondary} />
                      <Text
                        style={[styles.statText, { color: theme.text }]}
                        numberOfLines={1}
                      >
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
                    {t('comments.noComments')}
                  </Text>
                </View>
              ) : (
                comments.map((comment, index) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    index={index}
                    theme={theme}
                    onAvatarPress={handleAvatarPress}
                    t={t}
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
                    {isAnonymous
                      ? t('comments.anonymous')
                      : t('comments.public')}
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
                  placeholder={t('comments.commentPlaceholder')}
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
                  textAlign={isRTL() ? 'right' : 'left'}
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

      {/* Profile Detail Modal */}
      {selectedUserProfile && (
        <ProfileDetail
          user={selectedUserProfile}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedUserProfile(null);
          }}
          onLike={() => {}}
          onDislike={() => {}}
          isMissedConnection={true}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: verticalScale(20),
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: moderateScale(34),
    textAlign: 'center',
  },
  headerRight: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  commentCount: {
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  // Updated Stats Styles
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap', // Allows wrapping on small screens
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 60, // Ensures bubble doesn't collapse too small
  },
  statText: {
    fontSize: 14,
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
