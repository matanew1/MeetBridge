// app/components/ClaimNotificationModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Check,
  MapPin,
  Clock,
  AlertCircle,
  MessageCircle,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import {
  MissedConnectionClaim,
  MissedConnection,
  NotificationItem,
} from '../../services/firebase/missedConnectionsService';
import missedConnectionsService from '../../services/firebase/missedConnectionsService';
import toastService from '../../services/toastService';
import TempMatchModal from './TempMatchModal';
import * as Haptics from 'expo-haptics';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
  isTablet,
} from '../../utils/responsive';

interface ClaimNotificationModalProps {
  visible: boolean;
  onClose: () => void;
  claims: Array<MissedConnectionClaim & { connection?: MissedConnection }>;
  chatRequests: any[];
  notifications: NotificationItem[];
  onClaimProcessed: () => void;
  onChatRequestClick: (request: any) => void;
  onNotificationProcessed: () => void;
}

export default function ClaimNotificationModal({
  visible,
  onClose,
  claims,
  chatRequests,
  notifications,
  onClaimProcessed,
  onChatRequestClick,
  onNotificationProcessed,
}: ClaimNotificationModalProps) {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { user } = useAuth();
  const [processingClaimId, setProcessingClaimId] = useState<string | null>(
    null
  );
  const [showTempMatchModal, setShowTempMatchModal] = useState(false);
  const [currentTempMatch, setCurrentTempMatch] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [processingNotificationId, setProcessingNotificationId] = useState<
    string | null
  >(null);
  const [chatRequestUsers, setChatRequestUsers] = useState<{
    [key: string]: any;
  }>({});

  const handleAccept = async (
    claim: MissedConnectionClaim & { connection?: MissedConnection }
  ) => {
    setProcessingClaimId(claim.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await missedConnectionsService.acceptClaim(claim.id);
      if (result.success && result.chatRequestId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Show success message - chat request created
        toastService.success(
          'Chat Request Sent! 💬',
          'Waiting for them to accept...'
        );

        onClaimProcessed();
      } else {
        toastService.error('Error', result.message || 'Failed to accept claim');
      }
    } catch (error) {
      toastService.error('Error', 'An unexpected error occurred');
      console.error('Error accepting claim:', error);
    } finally {
      setProcessingClaimId(null);
    }
  };

  const handleReject = async (claimId: string) => {
    setProcessingClaimId(claimId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await missedConnectionsService.rejectClaim(claimId);
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toastService.info('Claim Rejected', 'The claim has been rejected');
        onClaimProcessed();
      } else {
        toastService.error('Error', result.message || 'Failed to reject claim');
      }
    } catch (error) {
      toastService.error('Error', 'An unexpected error occurred');
    } finally {
      setProcessingClaimId(null);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    setProcessingNotificationId(notificationId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await missedConnectionsService.markNotificationAsRead(
        notificationId
      );
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onNotificationProcessed();
      } else {
        toastService.error(
          'Error',
          result.message || 'Failed to mark notification as read'
        );
      }
    } catch (error) {
      toastService.error('Error', 'An unexpected error occurred');
    } finally {
      setProcessingNotificationId(null);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    setProcessingNotificationId(notificationId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await missedConnectionsService.deleteNotification(
        notificationId
      );
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toastService.info(
          'Notification Deleted',
          'The notification has been removed'
        );
        onNotificationProcessed();
      } else {
        toastService.error(
          'Error',
          result.message || 'Failed to delete notification'
        );
      }
    } catch (error) {
      toastService.error('Error', 'An unexpected error occurred');
    } finally {
      setProcessingNotificationId(null);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Fetch user data for chat requests
  useEffect(() => {
    const fetchChatRequestUsers = async () => {
      if (!chatRequests.length) return;

      const userPromises = chatRequests.map(async (request) => {
        const otherUserId = request.users?.find(
          (id: string) => id !== request.receiver
        );
        if (otherUserId && !chatRequestUsers[otherUserId]) {
          try {
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            if (userDoc.exists()) {
              return {
                userId: otherUserId,
                userData: { id: userDoc.id, ...userDoc.data() },
              };
            }
          } catch (error) {
            console.error('Error fetching user data for chat request:', error);
          }
        }
        return null;
      });

      const userResults = await Promise.all(userPromises);
      const newUsers: { [key: string]: any } = {};

      userResults.forEach((result) => {
        if (result) {
          newUsers[result.userId] = result.userData;
        }
      });

      if (Object.keys(newUsers).length > 0) {
        setChatRequestUsers((prev) => ({ ...prev, ...newUsers }));
      }
    };

    fetchChatRequestUsers();
  }, [chatRequests, chatRequestUsers]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.border,
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              {
                borderBottomColor: theme.border,
              },
            ]}
          >
            <View style={styles.headerLeft}>
              <AlertCircle size={scale(24)} color={theme.primary} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Notifications (
                {claims.length + chatRequests.length + notifications.length})
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <X size={scale(20)} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Chat Requests Section */}
            {chatRequests.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Chat Requests ({chatRequests.length})
                </Text>
                {chatRequests.map((request) => {
                  const otherUserId = request.users?.find(
                    (id: string) => id !== request.receiver
                  );
                  const otherUserData = chatRequestUsers[otherUserId];
                  return (
                    <TouchableOpacity
                      key={request.id}
                      style={[
                        styles.claimCard,
                        {
                          backgroundColor: theme.cardBackground,
                          borderColor: theme.primary,
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => onChatRequestClick(request)}
                    >
                      <View style={styles.chatRequestContent}>
                        <TouchableOpacity
                          onPress={() => onChatRequestClick(request)}
                          activeOpacity={0.7}
                        >
                          <Image
                            source={
                              otherUserData?.image
                                ? { uri: otherUserData.image }
                                : require('../../assets/images/placeholder.png')
                            }
                            style={[
                              styles.chatRequestAvatar,
                              { borderColor: theme.primary },
                            ]}
                          />
                        </TouchableOpacity>
                        <View style={{ flex: 1, marginLeft: spacing.md }}>
                          <Text
                            style={[styles.claimerName, { color: theme.text }]}
                          >
                            {otherUserData?.name || 'Chat Request'} 💬
                          </Text>
                          <Text
                            style={[
                              styles.claimTime,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {otherUserData
                              ? `From ${otherUserData.name}`
                              : 'Someone wants to chat with you!'}
                          </Text>
                        </View>
                        <Check size={scale(20)} color={theme.primary} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* Notifications Section */}
            {notifications.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Notifications ({notifications.length})
                </Text>
                {notifications.map((notification) => (
                  <View
                    key={notification.id}
                    style={[
                      styles.notificationCard,
                      {
                        backgroundColor: notification.read
                          ? theme.cardBackground
                          : isDarkMode
                          ? 'rgba(124, 58, 237, 0.1)'
                          : 'rgba(124, 58, 237, 0.05)',
                        borderColor: notification.read
                          ? theme.border
                          : theme.primary,
                        borderWidth: notification.read ? 1 : 2,
                      },
                    ]}
                  >
                    {/* Notification Header */}
                    <View style={styles.notificationHeader}>
                      <View style={styles.notificationTypeContainer}>
                        <Text
                          style={[
                            styles.notificationType,
                            { color: theme.primary },
                          ]}
                        >
                          {notification.type === 'match' && '🎉'}
                          {notification.type === 'chat_request' && '💬'}
                          {notification.type === 'claim_accepted' && '✅'}
                          {notification.type === 'general' && '📢'}
                        </Text>
                        <Text
                          style={[
                            styles.notificationTitle,
                            { color: theme.text },
                          ]}
                        >
                          {notification.title}
                        </Text>
                      </View>
                      {!notification.read && (
                        <View
                          style={[
                            styles.unreadDot,
                            { backgroundColor: theme.primary },
                          ]}
                        />
                      )}
                    </View>

                    {/* Notification Message */}
                    <Text
                      style={[
                        styles.notificationMessage,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {notification.message}
                    </Text>

                    {/* Notification Time */}
                    <Text
                      style={[
                        styles.notificationTime,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {formatDate(notification.createdAt)}
                    </Text>

                    {/* Action Buttons */}
                    <View style={styles.notificationActions}>
                      {!notification.read && (
                        <TouchableOpacity
                          style={[
                            styles.markReadButton,
                            { borderColor: theme.primary },
                            processingNotificationId === notification.id &&
                              styles.disabledButton,
                          ]}
                          onPress={() =>
                            handleMarkNotificationAsRead(notification.id)
                          }
                          disabled={processingNotificationId !== null}
                        >
                          {processingNotificationId === notification.id ? (
                            <ActivityIndicator
                              size="small"
                              color={theme.primary}
                            />
                          ) : (
                            <>
                              <Check size={scale(16)} color={theme.primary} />
                              <Text
                                style={[
                                  styles.markReadText,
                                  { color: theme.primary },
                                ]}
                              >
                                Mark Read
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[
                          styles.deleteButton,
                          {
                            backgroundColor: theme.error + '15',
                            borderColor: theme.error + '30',
                          },
                          processingNotificationId === notification.id &&
                            styles.disabledButton,
                        ]}
                        onPress={() =>
                          handleDeleteNotification(notification.id)
                        }
                        disabled={processingNotificationId !== null}
                      >
                        {processingNotificationId === notification.id ? (
                          <ActivityIndicator size="small" color={theme.error} />
                        ) : (
                          <>
                            <X size={scale(16)} color={theme.error} />
                            <Text
                              style={[
                                styles.deleteText,
                                { color: theme.error },
                              ]}
                            >
                              Delete
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Claims Section */}
            {claims.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Connection Claims ({claims.length})
                </Text>
              </>
            )}

            {claims.length === 0 &&
            chatRequests.length === 0 &&
            notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <AlertCircle size={scale(48)} color={theme.textSecondary} />
                <Text
                  style={[styles.emptyText, { color: theme.textSecondary }]}
                >
                  No pending notifications
                </Text>
              </View>
            ) : (
              claims.map((claim) => (
                <View
                  key={claim.id}
                  style={[
                    styles.claimCard,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {/* Claimer Info */}
                  <View style={styles.claimerSection}>
                    <Image
                      source={
                        claim.claimerImage
                          ? { uri: claim.claimerImage }
                          : require('../../assets/images/placeholder.png')
                      }
                      style={styles.claimerImage}
                    />
                    <View style={styles.claimerInfo}>
                      <Text style={[styles.claimerName, { color: theme.text }]}>
                        {claim.claimerName || 'Anonymous'}
                      </Text>
                      <Text
                        style={[
                          styles.claimTime,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Claimed {formatDate(claim.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {/* Connection Reference */}
                  {claim.connection && (
                    <View
                      style={[
                        styles.connectionReference,
                        {
                          backgroundColor: isDarkMode
                            ? 'rgba(124, 58, 237, 0.1)'
                            : 'rgba(124, 58, 237, 0.05)',
                          borderColor: theme.primary + '30',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.referenceLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Your Post:
                      </Text>
                      <View style={styles.connectionDetails}>
                        <View style={styles.locationRow}>
                          <MapPin size={scale(14)} color={theme.primary} />
                          <Text
                            style={[styles.locationText, { color: theme.text }]}
                            numberOfLines={1}
                          >
                            {claim.connection.location.landmark}
                          </Text>
                        </View>
                        <View style={styles.timeRow}>
                          <Clock size={scale(14)} color={theme.textSecondary} />
                          <Text
                            style={[
                              styles.timeText,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {claim.connection.timeOccurred.toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.description,
                          { color: theme.textSecondary },
                        ]}
                        numberOfLines={2}
                      >
                        {claim.connection.description}
                      </Text>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[
                        styles.rejectButton,
                        {
                          backgroundColor: theme.error + '15',
                          borderColor: theme.error + '30',
                        },
                        processingClaimId === claim.id && styles.disabledButton,
                      ]}
                      onPress={() => handleReject(claim.id)}
                      disabled={processingClaimId !== null}
                    >
                      {processingClaimId === claim.id ? (
                        <ActivityIndicator size="small" color={theme.error} />
                      ) : (
                        <>
                          <X size={scale(18)} color={theme.error} />
                          <Text
                            style={[styles.rejectText, { color: theme.error }]}
                          >
                            Reject
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.acceptButton,
                        { backgroundColor: theme.success },
                        processingClaimId === claim.id && styles.disabledButton,
                      ]}
                      onPress={() => handleAccept(claim)}
                      disabled={processingClaimId !== null}
                    >
                      {processingClaimId === claim.id ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <Check size={scale(18)} color="#FFF" />
                          <Text style={styles.acceptText}>Verify & Match</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      {/* Temp Match Modal */}
      <TempMatchModal
        visible={showTempMatchModal}
        onClose={() => {
          setShowTempMatchModal(false);
          setCurrentTempMatch(null);
          setOtherUser(null);
        }}
        tempMatch={currentTempMatch}
        otherUser={otherUser}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    height: '92%',
    borderTopWidth: 1,
    paddingTop: 0, // Prevent extra top margin on iOS
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
  },
  closeButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? verticalScale(40) : spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(60),
  },
  emptyText: {
    fontSize: moderateScale(16),
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chatRequestContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  claimCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  claimerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  claimerImage: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    marginRight: spacing.md,
  },
  claimerInfo: {
    flex: 1,
  },
  claimerName: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    marginBottom: spacing.xs / 2,
  },
  claimTime: {
    fontSize: moderateScale(13),
  },
  connectionReference: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  referenceLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  connectionDetails: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  locationText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeText: {
    fontSize: moderateScale(12),
  },
  description: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
    borderWidth: 1,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  rejectText: {
    fontSize: moderateScale(15),
    fontWeight: '600',
  },
  acceptText: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#FFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  notificationCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  notificationTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  notificationType: {
    fontSize: moderateScale(16),
  },
  notificationTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    flex: 1,
  },
  unreadDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
  },
  notificationMessage: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    marginBottom: spacing.sm,
  },
  notificationTime: {
    fontSize: moderateScale(12),
    marginBottom: spacing.md,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  markReadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
    borderWidth: 1,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
    borderWidth: 1,
  },
  markReadText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  deleteText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  chatRequestAvatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    borderWidth: 2,
  },
});
