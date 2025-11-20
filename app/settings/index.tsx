// <DOCUMENT filename="index.tsx">
import React, { useState, useEffect, useCallback } from 'react';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Lock,
  Bell,
  Shield,
  Ban,
  Globe,
  Moon,
  Sun,
  LogOut,
  Trash2,
  Eye,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import toastService from '../../services/toastService';

import EditProfileModal from '../components/EditProfileModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import DeleteAccountModal from '../components/DeleteAccountModal';
import PrivacySettingsModal from '../components/PrivacySettingsModal';
import LanguageSettingsModal from '../components/LanguageSettingsModal';

import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
} from '../../utils/responsive';

const SettingSection = ({ title, children, delay = 0 }: any) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500).springify()}
      style={styles.section}
    >
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {title}
      </Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
        {children}
      </View>
    </Animated.View>
  );
};

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  variant?: 'default' | 'danger';
  isLast?: boolean;
  color?: string;
  loading?: boolean;
}

const SettingItem = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  variant = 'default',
  isLast = false,
  color,
  loading = false,
}: SettingItemProps) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const baseColor =
    color || (variant === 'danger' ? theme.error : theme.primary);
  const textColor = variant === 'danger' ? theme.error : theme.text;

  return (
    <TouchableOpacity
      style={[
        styles.settingItem,
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: theme.borderLight,
        },
        loading && { opacity: 0.7 },
      ]}
      onPress={loading ? undefined : onPress}
      disabled={!onPress || loading}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor:
              variant === 'danger'
                ? 'rgba(255,59,48,0.1)'
                : theme.surfaceVariant,
          },
        ]}
      >
        {React.cloneElement(icon as React.ReactElement, {
          size: 20,
          color: baseColor,
        })}
      </View>

      <View style={styles.itemTextContainer}>
        <Text style={[styles.itemTitle, { color: textColor }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={theme.primary} />
      ) : rightElement ? (
        rightElement
      ) : onPress ? (
        <ChevronRight size={20} color={theme.textTertiary} />
      ) : null}
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user, logout, updateProfile } = useAuth();
  const router = useRouter();
  const theme = isDarkMode ? darkTheme : lightTheme;

  // === Local state with loading indicators ===
  const [notificationsEnabled, setNotificationsEnabled] =
    useState<boolean>(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState<boolean>(true);
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);
  const [isTogglingOnlineStatus, setIsTogglingOnlineStatus] = useState(false);

  // Modals
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);

  // Initialize from user object
  useEffect(() => {
    if (user?.settings) {
      setNotificationsEnabled(user.settings.notifications?.pushEnabled ?? true);
      setShowOnlineStatus(user.settings.privacy?.showOnlineStatus ?? true);
    }
  }, [user]);

  const handleLogout = () => {
    toastService.info(
      t('settings.logoutConfirmTitle'),
      t('settings.logoutConfirmMessage'),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  // === BEST-PRACTICE TOGGLE HANDLERS WITH OPTIMISTIC UI + ROLLBACK ===
  const handleToggleNotifications = async (value: boolean) => {
    if (isTogglingNotifications) return;

    setIsTogglingNotifications(true);
    const previous = notificationsEnabled;
    setNotificationsEnabled(value);

    try {
      await updateProfile({
        settings: {
          notifications: { pushEnabled: value },
        },
      });
      toastService.success(
        t('common.success'),
        t('settings.notificationsUpdated')
      );
    } catch (error) {
      setNotificationsEnabled(previous);
      toastService.error(t('common.error'), t('settings.updateFailed'));
    } finally {
      setIsTogglingNotifications(false);
    }
  };

  const handleToggleOnlineStatus = async (value: boolean) => {
    if (isTogglingOnlineStatus) return;

    setIsTogglingOnlineStatus(true);
    const previous = showOnlineStatus;
    setShowOnlineStatus(value);

    try {
      await updateProfile({
        settings: {
          privacy: { showOnlineStatus: value },
        },
      });
      toastService.success(t('common.success'), t('settings.privacyUpdated'));
    } catch (error) {
      setShowOnlineStatus(previous);
      toastService.error(t('common.error'), t('settings.updateFailed'));
    } finally {
      setIsTogglingOnlineStatus(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* === RESPONSIVE HEADER - FIXED FOR TABLET === */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.surface }}>
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={28} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t('settings.title')}
          </Text>

          {/* Invisible placeholder to perfectly center title */}
          <View style={styles.backButton}>
            <View style={{ width: 28, height: 28 }} />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Highlight */}
        <Animated.View
          entering={FadeInDown.duration(600).springify()}
          style={styles.profileHeader}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={
                user?.image
                  ? { uri: user.image }
                  : require('../../assets/images/placeholder.png')
              }
              style={styles.avatar}
            />
            <TouchableOpacity
              style={[styles.editBadge, { backgroundColor: theme.primary }]}
              onPress={() => setShowEditProfile(true)}
            >
              <User size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>
            {user?.name || 'User'}
          </Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
            {user?.email}
          </Text>
        </Animated.View>

        {/* Account Settings */}
        <SettingSection title={t('settings.account')} delay={100}>
          <SettingItem
            icon={<User />}
            title={t('settings.editProfile')}
            onPress={() => setShowEditProfile(true)}
            color="#4F46E5"
          />
          <SettingItem
            icon={<Lock />}
            title={t('settings.changePassword')}
            onPress={() => setShowChangePassword(true)}
            isLast
            color="#F59E0B"
          />
        </SettingSection>

        {/* Privacy & Security */}
        <SettingSection title={t('settings.privacySecurity')} delay={200}>
          <SettingItem
            icon={<Shield />}
            title={t('settings.privacySettings')}
            onPress={() => setShowPrivacySettings(true)}
            color="#10B981"
          />
          <SettingItem
            icon={<Eye />}
            title={t('settings.showOnlineStatus')}
            subtitle={
              showOnlineStatus ? t('settings.visible') : t('settings.hidden')
            }
            color="#06B6D4"
            loading={isTogglingOnlineStatus}
            rightElement={
              <Switch
                value={showOnlineStatus}
                onValueChange={handleToggleOnlineStatus}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#fff"
                disabled={isTogglingOnlineStatus}
              />
            }
          />
          <SettingItem
            icon={<Ban />}
            title={t('settings.blockedUsers')}
            onPress={() => setShowBlockedUsers(true)}
            isLast
            color="#EF4444"
          />
        </SettingSection>

        {/* Preferences */}
        <SettingSection title={t('settings.preferences')} delay={300}>
          <SettingItem
            icon={<Bell />}
            title={t('settings.pushNotifications')}
            color="#EC4899"
            loading={isTogglingNotifications}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#fff"
                disabled={isTogglingNotifications}
              />
            }
          />
          <SettingItem
            icon={isDarkMode ? <Moon /> : <Sun />}
            title={t('settings.darkMode')}
            color="#8B5CF6"
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#fff"
              />
            }
          />
          <SettingItem
            icon={<Globe />}
            title={t('settings.language')}
            onPress={() => setShowLanguageSettings(true)}
            isLast
            color="#3B82F6"
          />
        </SettingSection>

        {/* Danger Zone */}
        <SettingSection title="Account Actions" delay={400}>
          <SettingItem
            icon={<LogOut />}
            title={t('settings.logout')}
            onPress={handleLogout}
            variant="danger"
          />
          <SettingItem
            icon={<Trash2 />}
            title={t('settings.deleteAccount')}
            onPress={() => setShowDeleteAccount(true)}
            variant="danger"
            isLast
          />
        </SettingSection>

        <Text style={[styles.versionText, { color: theme.textTertiary }]}>
          Version 1.0.0 (Build 42)
        </Text>
      </ScrollView>

      {/* Modals */}
      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onSave={updateProfile}
      />
      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
      <DeleteAccountModal
        visible={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        onConfirm={() => {}} // Handled inside modal
      />
      <PrivacySettingsModal
        visible={showPrivacySettings}
        onClose={() => setShowPrivacySettings(false)}
        onSave={() => {}}
      />
      <LanguageSettingsModal
        visible={showLanguageSettings}
        onClose={() => setShowLanguageSettings(false)}
        onSave={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop:
      Platform.OS === 'android' ? RNStatusBar.currentHeight! + 10 : spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: '#E5E5E5',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: moderateScale(14),
    opacity: 0.6,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemTextContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: moderateScale(13),
    marginTop: 2,
  },
  versionText: {
    textAlign: 'center',
    fontSize: moderateScale(12),
    marginTop: spacing.xxl,
  },
});
