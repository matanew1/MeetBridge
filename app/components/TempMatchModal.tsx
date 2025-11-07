// app/components/TempMatchModal.tsx
import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { X, Check, MessageCircle, UserX, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useUserStore } from '../../store';
import missedConnectionsService from '../../services/firebase/missedConnectionsService';
import toastService from '../../services/toastService';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
  isTablet,
} from '../../utils/responsive';

interface TempMatchModalProps {
  visible: boolean;
  onClose: () => void;
  tempMatch: any;
  otherUser: any;
}

export default function TempMatchModal({
  visible,
  onClose,
  tempMatch,
  otherUser,
}: TempMatchModalProps) {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { user } = useAuth();
  const { loadConversations } = useUserStore();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiAnims = useRef(
    Array.from({ length: 20 }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;
  const [hasAccepted, setHasAccepted] = useState(false);

  // Confetti animation function
  const triggerConfetti = () => {
    setShowConfetti(true);

    confettiAnims.forEach((anim, index) => {
      // Reset animations
      anim.translateY.setValue(0);
      anim.translateX.setValue(0);
      anim.rotate.setValue(0);
      anim.opacity.setValue(1);

      // Random horizontal spread
      const randomX = (Math.random() - 0.5) * 400;
      const randomRotation = Math.random() * 720 - 360;

      Animated.parallel([
        Animated.timing(anim.translateY, {
          toValue: 600,
          duration: 2000 + Math.random() * 500,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateX, {
          toValue: randomX,
          duration: 2000 + Math.random() * 500,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: randomRotation,
          duration: 2000 + Math.random() * 500,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (index === confettiAnims.length - 1) {
          setShowConfetti(false);
        }
      });
    });
  };

  useEffect(() => {
    if (!tempMatch) return;

    // Check if user has already accepted
    const acceptedBy = tempMatch.acceptedBy || [];
    setHasAccepted(acceptedBy.includes(user?.id));
  }, [tempMatch, user?.id]);

  // Listen for when the conversation is created (for the first user who accepted)
  useEffect(() => {
    // Don't set up listener if modal is not visible or user hasn't accepted
    if (!tempMatch?.id || !hasAccepted || !user?.id || !visible) return;

    console.log('🔔 Setting up listener for chat request:', tempMatch.id);

    let unsubscribe: (() => void) | undefined;
    let hasNotified = false;

    const setupListener = async () => {
      const { doc, onSnapshot } = await import('firebase/firestore');
      const { db } = await import('../../services/firebase/config');

      const chatRequestRef = doc(db, 'chat_requests', tempMatch.id);

      unsubscribe = onSnapshot(
        chatRequestRef,
        async (snapshot) => {
          // Prevent multiple notifications
          if (hasNotified) return;

          if (!snapshot.exists()) {
            console.log('📭 Chat request deleted (match created)');
            hasNotified = true;

            // Chat request was deleted, meaning match was created
            // Trigger confetti animation
            triggerConfetti();

            // Show celebration message
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toastService.success(
              "It's a Missed Match! 🎉",
              'Conversation created! Check your Missed tab to start chatting!'
            );

            // Reload conversations to show the new match
            await loadConversations(user.id);

            // Close modal after confetti animation
            setTimeout(() => {
              onClose();
            }, 2500);
          }
        },
        (error) => {
          console.error('❌ Error listening to chat request:', error);
        }
      );
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        console.log('🔕 Cleaning up chat request listener');
        unsubscribe();
      }
    };
  }, [tempMatch?.id, hasAccepted, user?.id, visible]);

  const handleAccept = async () => {
    if (!tempMatch) return;

    setProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const result = await missedConnectionsService.acceptChatRequest(
        tempMatch.id
      );

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (result.conversationId) {
          // Both users accepted - match created!
          // Trigger confetti animation
          triggerConfetti();

          // Reload conversations to get the new conversation
          await loadConversations(user?.id || '');

          // Show celebration message
          toastService.success(
            "It's a Missed Match! 🎉",
            'Conversation created! Check your Missed tab to start chatting!'
          );

          // Close modal after confetti animation
          setTimeout(() => {
            onClose();
          }, 2500);
        } else {
          // First user to accept - waiting for other user
          toastService.success(
            'Request Sent! ✅',
            'Waiting for the other person to accept...'
          );
          setHasAccepted(true);
          // Auto-close the modal after showing success message
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } else {
        toastService.error(
          'Error',
          result.message || 'Failed to accept request'
        );
      }
    } catch (error) {
      toastService.error('Error', 'An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!tempMatch) return;

    setProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await missedConnectionsService.declineChatRequest(
        tempMatch.id
      );

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toastService.info(
          'Request Declined',
          'The chat request has been declined'
        );
        onClose();
      } else {
        toastService.error(
          'Error',
          result.message || 'Failed to decline request'
        );
      }
    } catch (error) {
      toastService.error('Error', 'An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  if (!tempMatch || !otherUser) return null;

  const acceptedBy = tempMatch.acceptedBy || [];
  const otherUserAccepted = acceptedBy.includes(otherUser.id);
  const bothAccepted = acceptedBy.length === 2;

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
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Chat Request 💬
            </Text>
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

          {/* Content - Scrollable */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.userSection}>
              <Image
                source={
                  otherUser.image
                    ? { uri: otherUser.image }
                    : require('../../assets/images/placeholder.png')
                }
                style={styles.userImage}
              />
              <Text style={[styles.userName, { color: theme.text }]}>
                {otherUser.name || 'Anonymous'}
              </Text>
              {otherUser.bio && (
                <Text
                  style={[styles.userBio, { color: theme.textSecondary }]}
                  numberOfLines={2}
                >
                  {otherUser.bio}
                </Text>
              )}
            </View>

            {/* Status */}
            <View style={styles.statusSection}>
              <View
                style={[
                  styles.statusItem,
                  {
                    backgroundColor: hasAccepted
                      ? theme.success + '15'
                      : theme.primaryVariant,
                  },
                ]}
              >
                <Text
                  style={[styles.statusLabel, { color: theme.textSecondary }]}
                >
                  You
                </Text>
                <Text
                  style={[
                    styles.statusValue,
                    { color: hasAccepted ? theme.success : theme.text },
                  ]}
                >
                  {hasAccepted ? '✓ Accepted' : '⏳ Pending'}
                </Text>
              </View>
              <View
                style={[
                  styles.statusItem,
                  {
                    backgroundColor: otherUserAccepted
                      ? theme.success + '15'
                      : theme.primaryVariant,
                  },
                ]}
              >
                <Text
                  style={[styles.statusLabel, { color: theme.textSecondary }]}
                >
                  {otherUser.name}
                </Text>
                <Text
                  style={[
                    styles.statusValue,
                    { color: otherUserAccepted ? theme.success : theme.text },
                  ]}
                >
                  {otherUserAccepted ? '✓ Accepted' : '⏳ Pending'}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor: theme.primaryVariant,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                💡 Both of you must accept to start chatting. They'll receive a
                notification about your request.
              </Text>
            </View>

            {/* Action Buttons */}
            {!hasAccepted && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.declineButton,
                    {
                      backgroundColor: theme.error + '15',
                      borderColor: theme.error + '30',
                    },
                    processing && styles.disabledButton,
                  ]}
                  onPress={handleDecline}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color={theme.error} />
                  ) : (
                    <>
                      <UserX size={scale(18)} color={theme.error} />
                      <Text
                        style={[styles.declineText, { color: theme.error }]}
                      >
                        Decline
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.acceptButton,
                    { backgroundColor: theme.success },
                    processing && styles.disabledButton,
                  ]}
                  onPress={handleAccept}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Check size={scale(18)} color="#FFF" />
                      <Text style={styles.acceptText}>Accept Request</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {hasAccepted && !bothAccepted && (
              <View
                style={[
                  styles.waitingBox,
                  { backgroundColor: theme.success + '15' },
                ]}
              >
                <ActivityIndicator size="small" color={theme.success} />
                <Text style={[styles.waitingText, { color: theme.success }]}>
                  Waiting for {otherUser.name} to accept...
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Confetti Animation */}
        {showConfetti && (
          <View style={styles.confettiContainer} pointerEvents="none">
            {confettiAnims.map((anim, index) => {
              const colors = [
                '#FF6B6B',
                '#4ECDC4',
                '#45B7D1',
                '#FFA07A',
                '#98D8C8',
                '#FFD93D',
                '#C77DFF',
                '#FF8C94',
              ];
              const color = colors[index % colors.length];
              const size = 8 + Math.random() * 8;

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.confettiPiece,
                    {
                      backgroundColor: color,
                      width: size,
                      height: size,
                      left: '50%',
                      top: '30%',
                      transform: [
                        { translateX: anim.translateX },
                        { translateY: anim.translateY },
                        {
                          rotate: anim.rotate.interpolate({
                            inputRange: [0, 360],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                      opacity: anim.opacity,
                    },
                  ]}
                />
              );
            })}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
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
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.xl,
  },
  timerText: {
    fontSize: moderateScale(42),
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  timerLabel: {
    fontSize: moderateScale(12),
    marginTop: spacing.xs / 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? verticalScale(40) : spacing.xl,
  },
  userSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userImage: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    marginBottom: spacing.sm,
  },
  userName: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    marginBottom: spacing.xs / 2,
  },
  userBio: {
    fontSize: moderateScale(13),
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  statusSection: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusItem: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: moderateScale(11),
    marginBottom: spacing.xs / 2,
  },
  statusValue: {
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  infoBox: {
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(17),
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  declineButton: {
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
  declineText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  acceptText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#FFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  waitingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  waitingText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  confettiPiece: {
    position: 'absolute',
    borderRadius: 4,
  },
});
