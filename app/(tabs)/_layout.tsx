import { Tabs, useRouter } from 'expo-router';
import {
  Search,
  MessageCircleMore,
  HeartHandshake,
  Bell,
  BellOff,
  Binoculars,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import ProfileModal from '../components/ProfileModal';
import ClaimNotificationModal from '../components/ClaimNotificationModal';
import TempMatchModal from '../components/TempMatchModal';
import notificationService from '../../services/notificationService';
import toastService from '../../services/toastService';
import missedConnectionsService, {
  MissedConnectionClaim,
  MissedConnection,
  NotificationItem,
} from '../../services/firebase/missedConnectionsService';
import { doc, getDoc } from 'firebase/firestore';
import { safeGetDoc } from '../../services/firebase/firestoreHelpers';
import { useChatData } from '../../hooks/useChatData';
import { db } from '../../services/firebase/config';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
  deviceInfo,
  isTablet,
  SCREEN_WIDTH,
} from '../../utils/responsive';

export default function TabLayout() {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showClaimsModal, setShowClaimsModal] = useState(false);
  const [showTempMatchModal, setShowTempMatchModal] = useState(false);
  const [pendingClaims, setPendingClaims] = useState<
    Array<MissedConnectionClaim & { connection?: MissedConnection }>
  >([]);
  const [pendingChatRequests, setPendingChatRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentTempMatch, setCurrentTempMatch] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bellScaleAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  // Ensure chat data is loaded as early as possible
  useChatData();

  // Redirect to profile completion if needed
  useEffect(() => {
    if (user && !user.isProfileComplete) {
      router.replace('/auth/complete-profile');
    }
  }, [user]);

  // Subscribe to pending claims
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = missedConnectionsService.subscribeToClaimsForUser(
      user.id,
      (claims) => {
        const previousCount = pendingClaims.length;
        setPendingClaims(claims);

        // Animate bell icon when new claims arrive
        if (claims.length > previousCount) {
          Animated.sequence([
            Animated.timing(bellScaleAnim, {
              toValue: 1.2,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(bellScaleAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  // Subscribe to chat requests
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = missedConnectionsService.subscribeToChatRequests(
      user.id,
      async (requests) => {
        const previousCount = pendingChatRequests.length;
        setPendingChatRequests(requests);

        // Show toast notification for new requests containing sender name
        if (requests.length > previousCount) {
          const newRequests = requests.slice(
            0,
            requests.length - previousCount
          );
          const firstNew = newRequests[0];
          let senderName = 'Someone';
          try {
            if (firstNew?.sender) {
              const snap = await safeGetDoc(
                doc(db, 'users', firstNew.sender),
                `user_${firstNew.sender}`
              );
              const u =
                snap && typeof snap.exists === 'function' && snap.exists()
                  ? snap.data()
                  : null;
              senderName =
                (u && ((u as any).name || (u as any).displayName)) ||
                firstNew.sender ||
                senderName;
            }
          } catch (e) {
            console.warn(
              'Failed to resolve sender name for chat request toast',
              e
            );
          }

          toastService.info(
            t('toasts.chatRequestTitle'),
            t('toasts.chatRequestBody', { name: senderName })
          );

          // Animate bell icon
          Animated.sequence([
            Animated.timing(bellScaleAnim, {
              toValue: 1.2,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(bellScaleAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }
    );

    return () => unsubscribe();
  }, [user?.id, pendingChatRequests.length]);

  // Subscribe to notifications with real-time updates
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 Setting up real-time notification listener');

    const unsubscribe = missedConnectionsService.subscribeToNotifications(
      user.id,
      (updatedNotifications) => {
        console.log(
          '🔔 Real-time notifications update:',
          updatedNotifications.length
        );
        const previousCount = notifications.length;
        setNotifications(updatedNotifications);

        // Animate bell icon when new notifications arrive
        if (updatedNotifications.length > previousCount) {
          Animated.sequence([
            Animated.timing(bellScaleAnim, {
              toValue: 1.2,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(bellScaleAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();

          // Show toast for new match notifications
          const newNotifications = updatedNotifications.filter(
            (n) => !notifications.some((existing) => existing.id === n.id)
          );

          const matchNotifications = newNotifications.filter(
            (n) => n.type === 'match'
          );
          if (matchNotifications.length > 0) {
            toastService.success(
              t('toasts.matchToastTitle'),
              t('toasts.matchToastBody', {
                name: matchNotifications[0]?.displayName || '',
              })
            );
          }
        }
      }
    );

    return () => {
      console.log('🔕 Cleaning up notification listener');
      unsubscribe();
    };
  }, [user?.id]);

  // Clear recent toasts when tab becomes focused
  useFocusEffect(() => {
    toastService.clearRecentToasts();
  });

  const handleProfilePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
  };

  const handleClaimsPress = () => {
    setShowClaimsModal(true);
  };

  const handleClaimsClose = () => {
    setShowClaimsModal(false);
  };

  const handleClaimProcessed = () => {
    // Refresh claims list
    if (user?.id) {
      missedConnectionsService
        .getPendingClaimsForUser(user.id)
        .then((result) => {
          if (result.success) {
            setPendingClaims(result.data);
          }
        });
    }
  };

  const handleNotificationProcessed = () => {
    // Refresh notifications list
    if (user?.id) {
      missedConnectionsService.getUserNotifications(user.id).then((result) => {
        if (result.success) {
          setNotifications(result.data);
        }
      });
    }
  };

  // Calculate responsive dimensions
  const tabBarHeight = isTablet
    ? verticalScale(50)
    : deviceInfo.isSmallDevice
    ? verticalScale(65)
    : verticalScale(80);

  const iconSize = isTablet
    ? scale(22)
    : deviceInfo.isSmallDevice
    ? scale(22)
    : scale(24);

  const headerHeight = Platform.select({
    ios: isTablet ? verticalScale(100) : verticalScale(90),
    android: verticalScale(70),
    default: verticalScale(70),
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.headerBackground,
            paddingTop: insets.top + spacing.sm,
            ...Platform.select({
              ios: {
                shadowColor: theme.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDarkMode ? 0.3 : 0.08,
                shadowRadius: 8,
              },
              android: {
                elevation: 4,
              },
            }),
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Text
                style={[
                  styles.logoText,
                  {
                    color: theme.primary,
                    fontSize: isTablet ? moderateScale(26) : moderateScale(22),
                  },
                ]}
              >
                {t('app.title')}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {/* Claims Notification Bell */}
            <Animated.View style={{ transform: [{ scale: bellScaleAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.bellButton,
                  {
                    backgroundColor:
                      pendingClaims.length +
                        pendingChatRequests.length +
                        notifications.length >
                      0
                        ? theme.primary + '20'
                        : theme.primaryVariant,
                    width: isTablet ? scale(48) : scale(44),
                    height: isTablet ? scale(48) : scale(44),
                    borderRadius: isTablet ? scale(24) : scale(22),
                  },
                ]}
                onPress={handleClaimsPress}
                activeOpacity={0.7}
              >
                <Bell
                  size={isTablet ? scale(20) : scale(18)}
                  color={
                    pendingClaims.length +
                      pendingChatRequests.length +
                      notifications.length >
                    0
                      ? theme.primary
                      : theme.textSecondary
                  }
                  fill={
                    pendingClaims.length +
                      pendingChatRequests.length +
                      notifications.length >
                    0
                      ? theme.primary
                      : 'none'
                  }
                  strokeWidth={
                    pendingClaims.length +
                      pendingChatRequests.length +
                      notifications.length >
                    0
                      ? 2.5
                      : 2
                  }
                />
                {pendingClaims.length +
                  pendingChatRequests.length +
                  notifications.length >
                  0 && (
                  <View
                    style={[styles.badge, { backgroundColor: theme.error }]}
                  >
                    <Text style={styles.badgeText}>
                      {pendingClaims.length +
                        pendingChatRequests.length +
                        notifications.length >
                      9
                        ? '9+'
                        : pendingClaims.length +
                          pendingChatRequests.length +
                          notifications.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.profileButton,
                  {
                    width: isTablet ? scale(48) : scale(44),
                    height: isTablet ? scale(48) : scale(44),
                    borderRadius: isTablet ? scale(24) : scale(22),
                    borderWidth: 2,
                    borderColor: theme.primary,
                    ...Platform.select({
                      ios: {
                        shadowColor: theme.primary,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                      },
                      android: {
                        elevation: 3,
                      },
                    }),
                  },
                ]}
                onPress={handleProfilePress}
                activeOpacity={0.8}
              >
                <Image
                  source={
                    user?.image
                      ? { uri: user.image }
                      : require('../../assets/images/placeholder.png')
                  }
                  style={[
                    styles.headerProfile,
                    {
                      width: isTablet ? scale(48) : scale(44),
                      height: isTablet ? scale(48) : scale(44),
                    },
                  ]}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </View>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.tabBarBackground,
            borderTopWidth: 0,
            borderWidth: isDarkMode ? 0 : 1,
            borderColor: isDarkMode ? 'transparent' : theme.borderLight,
            ...Platform.select({
              ios: {
                shadowColor: theme.shadow,
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: isDarkMode ? 0.5 : 0.15,
                shadowRadius: 16,
              },
              android: {
                elevation: 16,
              },
            }),
            paddingTop: spacing.sm,
            paddingBottom: Platform.select({
              ios: isTablet ? spacing.md : spacing.lg,
              android: isTablet ? spacing.sm : spacing.md,
              default: spacing.md,
            }),
            paddingHorizontal: isTablet ? spacing.lg : spacing.md,
            marginBottom: Platform.select({
              ios: spacing.md,
              android: spacing.sm,
              default: spacing.sm,
            }),
            marginHorizontal: spacing.md,
            height: tabBarHeight,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            borderRadius: borderRadius.xxl,
            overflow: 'hidden',
          },
          tabBarActiveTintColor: theme.tabBarActive,
          tabBarInactiveTintColor: theme.tabBarInactive,
          tabBarLabelStyle: {
            fontSize: isTablet
              ? moderateScale(11)
              : deviceInfo.isSmallDevice
              ? moderateScale(9.5)
              : moderateScale(10.5),
            fontWeight: '600',
            marginTop: spacing.xs / 2,
            letterSpacing: 0.2,
            textAlign: 'center',
          },
          tabBarIconStyle: {
            marginTop: spacing.xs / 2,
          },
          tabBarItemStyle: {
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.lg,
            marginHorizontal: spacing.xs / 4,
            flex: 1,
          },
        }}
      >
        <Tabs.Screen
          name="loved"
          options={{
            title: t('tabs.discover'),
            tabBarIcon: ({ focused, color }) => (
              <View
                style={[
                  styles.iconContainer,
                  focused && [
                    styles.activeIconContainer,
                    {
                      backgroundColor: theme.primaryVariant,
                    },
                  ],
                ]}
              >
                <HeartHandshake
                  size={iconSize}
                  color={color}
                  strokeWidth={focused ? 2.5 : 2}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: t('tabs.search'),
            tabBarIcon: ({ focused, color }) => (
              <View
                style={[
                  styles.iconContainer,
                  focused && [
                    styles.activeIconContainer,
                    {
                      backgroundColor: theme.primaryVariant,
                    },
                  ],
                ]}
              >
                <Search
                  size={iconSize}
                  color={color}
                  strokeWidth={focused ? 2.5 : 2}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: t('tabs.chat'),
            tabBarIcon: ({ focused, color }) => (
              <View
                style={[
                  styles.iconContainer,
                  focused && [
                    styles.activeIconContainer,
                    {
                      backgroundColor: theme.primaryVariant,
                    },
                  ],
                ]}
              >
                <MessageCircleMore
                  size={iconSize}
                  color={color}
                  strokeWidth={focused ? 2.5 : 2}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="connections"
          options={{
            title: 'Board',
            tabBarIcon: ({ focused, color }) => (
              <View
                style={[
                  styles.iconContainer,
                  focused && [
                    styles.activeIconContainer,
                    {
                      backgroundColor: theme.primaryVariant,
                    },
                  ],
                ]}
              >
                <Binoculars
                  size={iconSize}
                  color={color}
                  strokeWidth={focused ? 2.5 : 2}
                />
              </View>
            ),
          }}
        />
      </Tabs>

      {/* Profile Modal */}
      {user && (
        <ProfileModal
          visible={showProfileModal}
          onClose={handleCloseProfileModal}
          user={user}
        />
      )}

      {/* Claims Notification Modal */}
      <ClaimNotificationModal
        visible={showClaimsModal}
        onClose={handleClaimsClose}
        claims={pendingClaims}
        chatRequests={pendingChatRequests}
        notifications={notifications}
        onClaimProcessed={handleClaimProcessed}
        onChatRequestClick={async (request) => {
          // Get other user's data
          const otherUserId = request.users.find(
            (id: string) => id !== user?.id
          );
          if (otherUserId) {
            try {
              const userDoc = await safeGetDoc(
                doc(db, 'users', otherUserId),
                `user_${otherUserId}`
              );
              if (
                userDoc &&
                typeof userDoc.exists === 'function' &&
                userDoc.exists()
              ) {
                setCurrentTempMatch(request);
                setOtherUser({
                  id: otherUserId,
                  ...(userDoc.data() as any),
                });
                handleClaimsClose();
                setShowTempMatchModal(true);
              }
            } catch (e) {
              console.warn('Failed to fetch other user for claim modal', e);
            }
          }
        }}
        onNotificationProcessed={handleNotificationProcessed}
      />

      {/* Temporary Match Modal */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: isTablet ? spacing.xl : spacing.lg,
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoText: {
    fontWeight: '800',
    fontFamily: Platform.select({
      ios: 'Satoshi',
      android: 'sans-serif-medium',
      default: 'Satoshi',
    }),
    letterSpacing: -0.5,
  },
  profileButton: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerProfile: {
    resizeMode: 'cover',
  },
  darkModeButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellButton: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs / 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  badgeText: {
    color: '#FFF',
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: scale(40),
    minHeight: scale(40),
    borderRadius: borderRadius.xl,
    transition: 'all 0.3s ease',
  },
  activeIconContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});
