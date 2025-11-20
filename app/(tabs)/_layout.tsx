import { Tabs, useRouter } from 'expo-router';
import {
  Search,
  MessageCircleMore,
  HeartHandshake,
  Bell,
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import ProfileModal from '../components/ProfileModal';
import ClaimNotificationModal from '../components/ClaimNotificationModal';
import TempMatchModal from '../components/TempMatchModal';
import missedConnectionsService, {
  NotificationItem,
} from '../../services/firebase/missedConnectionsService';
import { useChatData } from '../../hooks/useChatData';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
  isTablet,
} from '../../utils/responsive';

// --- Animated Icon Component ---
const TabIcon = ({ Icon, focused, color, size }: any) => {
  const scaleVal = useSharedValue(1);

  useEffect(() => {
    scaleVal.value = focused
      ? withSequence(withTiming(1.2, { duration: 100 }), withSpring(1))
      : withTiming(1);
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleVal.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, styles.iconContainer]}>
      <Icon
        size={size}
        color={color}
        strokeWidth={focused ? 2.5 : 2}
        fill={focused ? color : 'none'}
      />
    </Animated.View>
  );
};

export default function TabLayout() {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();

  // --- State ---
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showClaimsModal, setShowClaimsModal] = useState(false);
  const [showTempMatchModal, setShowTempMatchModal] = useState(false);
  const [pendingClaims, setPendingClaims] = useState<any[]>([]);
  const [pendingChatRequests, setPendingChatRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentTempMatch, setCurrentTempMatch] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);

  const bellScale = useSharedValue(1);

  // --- Data Loading ---
  useChatData();

  useEffect(() => {
    if (user && !user.isProfileComplete) {
      router.replace('/settings');
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const unsubClaims = missedConnectionsService.subscribeToClaimsForUser(
      user.id,
      (claims) => {
        if (claims.length > pendingClaims.length) {
          bellScale.value = withSequence(withTiming(1.2), withTiming(1));
        }
        setPendingClaims(claims);
      }
    );
    return () => unsubClaims();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const unsubNotifs = missedConnectionsService.subscribeToNotifications(
      user.id,
      (updated) => {
        if (updated.length > notifications.length) {
          bellScale.value = withSequence(withTiming(1.2), withTiming(1));
        }
        setNotifications(updated);
      }
    );
    return () => unsubNotifs();
  }, [user?.id]);

  const totalNotifications =
    pendingClaims.length + pendingChatRequests.length + notifications.length;

  const bellAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bellScale.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* --- Global Header --- */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            backgroundColor: theme.background,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.logoText, { color: theme.primary }]}>
            {t('app.title')}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* Notifications */}
          <Animated.View style={bellAnimatedStyle}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor:
                    totalNotifications > 0
                      ? theme.primary + '15'
                      : theme.surface,
                },
              ]}
              onPress={() => setShowClaimsModal(true)}
            >
              <Bell
                size={moderateScale(22)}
                color={totalNotifications > 0 ? theme.primary : theme.text}
                fill={totalNotifications > 0 ? theme.primary : 'none'}
              />
              {totalNotifications > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.error }]}>
                  <Text style={styles.badgeText}>
                    {totalNotifications > 9 ? '9+' : totalNotifications}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Profile */}
          <TouchableOpacity
            onPress={() => setShowProfileModal(true)}
            activeOpacity={0.8}
            style={[
              styles.profileContainer,
              { borderColor: theme.borderLight },
            ]}
          >
            <Image
              source={
                user?.image
                  ? { uri: user.image }
                  : require('../../assets/images/placeholder.png')
              }
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- Floating Tab Navigator --- */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
            left: spacing.lg,
            right: spacing.lg,
            height: isTablet ? verticalScale(60) : verticalScale(65),
            borderRadius: borderRadius.xxl,
            backgroundColor: isDarkMode
              ? 'rgba(30,30,30,0.95)'
              : 'rgba(255,255,255,0.95)',
            borderTopWidth: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 10,
            justifyContent: 'space-around',
            alignItems: 'center',
          },
        }}
      >
        <Tabs.Screen
          name="loved"
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabBase}>
                <View
                  style={[
                    styles.iconWrapper,
                    focused && { backgroundColor: theme.primary + '15' },
                  ]}
                >
                  <TabIcon
                    Icon={HeartHandshake}
                    focused={focused}
                    color={focused ? theme.primary : theme.textSecondary}
                    size={isTablet ? 22 : 26}
                  />
                </View>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabBase}>
                <View
                  style={[
                    styles.iconWrapper,
                    focused && { backgroundColor: theme.primary + '15' },
                  ]}
                >
                  <TabIcon
                    Icon={Search}
                    focused={focused}
                    color={focused ? theme.primary : theme.textSecondary}
                    size={isTablet ? 22 : 26}
                  />
                </View>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="connections"
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabBase}>
                <View
                  style={[
                    styles.iconWrapper,
                    focused && { backgroundColor: theme.primary + '15' },
                  ]}
                >
                  <TabIcon
                    Icon={Binoculars}
                    focused={focused}
                    color={focused ? theme.primary : theme.textSecondary}
                    size={isTablet ? 22 : 26}
                  />
                </View>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabBase}>
                <View
                  style={[
                    styles.iconWrapper,
                    focused && { backgroundColor: theme.primary + '15' },
                  ]}
                >
                  <TabIcon
                    Icon={MessageCircleMore}
                    focused={focused}
                    color={focused ? theme.primary : theme.textSecondary}
                    size={isTablet ? 22 : 26}
                  />
                </View>
              </View>
            ),
          }}
        />
      </Tabs>

      {/* --- Modals --- */}
      {user && (
        <ProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
        />
      )}
      <ClaimNotificationModal
        visible={showClaimsModal}
        onClose={() => setShowClaimsModal(false)}
        claims={pendingClaims}
        chatRequests={pendingChatRequests}
        notifications={notifications}
        onClaimProcessed={() => {}}
        onChatRequestClick={async () => {}}
        onNotificationProcessed={() => {}}
      />
      <TempMatchModal
        visible={showTempMatchModal}
        onClose={() => setShowTempMatchModal(false)}
        tempMatch={currentTempMatch}
        otherUser={otherUser}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  // Synced Title Style (H2/Display equivalent)
  logoText: {
    fontSize: moderateScale(28),
    fontWeight: '800',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
  },
  iconButton: {
    width: scale(42),
    height: scale(42),
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContainer: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    padding: 2,
  },
  profileImage: {
    width: scale(38),
    height: scale(38),
    borderRadius: borderRadius.full,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: moderateScale(10),
    fontWeight: 'bold',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBase: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    flex: 1,
  },
  iconWrapper: {
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
