import { Tabs, useRouter } from 'expo-router';
import {
  Search,
  MessageCircleMore,
  HeartHandshake,
  Moon,
  Sun,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import ProfileModal from '../components/ProfileModal';
import notificationService from '../../services/notificationService';
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
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [showProfileModal, setShowProfileModal] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  // Redirect to profile completion if needed
  useEffect(() => {
    if (user && !user.isProfileComplete) {
      router.replace('/auth/complete-profile');
    }
  }, [user]);

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

  // Calculate responsive dimensions
  const tabBarHeight = isTablet
    ? verticalScale(70)
    : deviceInfo.isSmallDevice
    ? verticalScale(65)
    : verticalScale(80);

  const iconSize = isTablet
    ? scale(26)
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
                MeetBridge
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[
                styles.darkModeButton,
                {
                  backgroundColor: theme.primaryVariant,
                  width: isTablet ? scale(48) : scale(44),
                  height: isTablet ? scale(48) : scale(44),
                  borderRadius: isTablet ? scale(24) : scale(22),
                },
              ]}
              onPress={toggleDarkMode}
              activeOpacity={0.7}
            >
              {isDarkMode ? (
                <Sun
                  size={isTablet ? scale(24) : scale(20)}
                  color={theme.primary}
                />
              ) : (
                <Moon
                  size={isTablet ? scale(24) : scale(20)}
                  color={theme.primary}
                />
              )}
            </TouchableOpacity>
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
              ios: spacing.lg,
              android: spacing.md,
              default: spacing.md,
            }),
            paddingHorizontal: isTablet ? spacing.xl : spacing.md,
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
              ? moderateScale(13)
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
