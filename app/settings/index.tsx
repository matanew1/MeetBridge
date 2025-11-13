import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import toastService from '../../services/toastService';
import {
  ChevronRight,
  ChevronLeft,
  User,
  Lock,
  Bell,
  Shield,
  Ban,
  Globe,
  Moon,
  Sun,
  HelpCircle,
  Info,
  LogOut,
  Trash2,
  MapPin,
  Eye,
  Mail,
  Smartphone,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import { Card, Button } from '../components/ui';
import EditProfileModal from '../components/EditProfileModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import DeleteAccountModal from '../components/DeleteAccountModal';
import PrivacySettingsModal from '../components/PrivacySettingsModal';
import LanguageSettingsModal from '../components/LanguageSettingsModal';
import { useUserStore } from '../../store/userStore';
import { useTranslation } from 'react-i18next';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
} from '../../utils/responsive';
import toastSerivce from '../../services/toastService';
import { User as UserType } from '../../store/types';
import blockReportService from '../../services/blockReportService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  variant?: 'default' | 'danger';
}

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, children }) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          { color: theme.textSecondary, ...theme.typography.captionMedium },
        ]}
      >
        {title}
      </Text>
      <Card
        variant="elevated"
        elevation="small"
        padding="none"
        style={styles.sectionCard}
      >
        {children}
      </Card>
    </View>
  );
};

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
  rightElement,
  variant = 'default',
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const iconColor = variant === 'danger' ? theme.error : theme.primary;
  const titleColor = variant === 'danger' ? theme.error : theme.text;

  return (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: theme.borderLight }]}
      onPress={onPress}
      disabled={!onPress && !rightElement}
      activeOpacity={0.7}
    >
      <View style={styles.settingItemLeft}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.primaryVariant },
          ]}
        >
          {React.cloneElement(icon as React.ReactElement, {
            size: scale(20),
            color: iconColor,
          })}
        </View>
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.settingTitle,
              { color: titleColor, ...theme.typography.bodyMedium },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.settingSubtitle,
                { color: theme.textSecondary, ...theme.typography.caption },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightElement ||
        (showChevron && onPress && (
          <ChevronRight size={scale(20)} color={theme.textTertiary} />
        ))}
    </TouchableOpacity>
  );
};

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user, logout, updateProfile, refreshUserProfile, deleteAccount } =
    useAuth();
  const router = useRouter();
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Settings state - initialize from user data
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.settings?.notifications?.pushEnabled ?? true
  );
  const [messageNotifications, setMessageNotifications] = useState(
    user?.settings?.notifications?.messageNotifications ?? true
  );
  const [matchNotifications, setMatchNotifications] = useState(
    user?.settings?.notifications?.matchNotifications ?? true
  );
  const [locationEnabled, setLocationEnabled] = useState(
    user?.settings?.privacy?.locationSharing ?? true
  );
  const [showOnlineStatus, setShowOnlineStatus] = useState(
    user?.settings?.privacy?.showOnlineStatus ?? true
  );
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const [blockedUsersProfiles, setBlockedUsersProfiles] = useState<UserType[]>(
    []
  );
  const [loadingBlockedUsers, setLoadingBlockedUsers] = useState(false);

  // Update settings when user data changes
  useEffect(() => {
    if (user?.settings) {
      setNotificationsEnabled(user.settings.notifications?.pushEnabled ?? true);
      setMessageNotifications(
        user.settings.notifications?.messageNotifications ?? true
      );
      setMatchNotifications(
        user.settings.notifications?.matchNotifications ?? true
      );
      setLocationEnabled(user.settings.privacy?.locationSharing ?? true);
      setShowOnlineStatus(user.settings.privacy?.showOnlineStatus ?? true);

      // Sync theme preference from Firebase
      if (user.settings.appearance?.theme) {
        const shouldBeDark = user.settings.appearance.theme === 'dark';
        // Update AsyncStorage to sync with Firebase
        AsyncStorage.setItem('darkMode', JSON.stringify(shouldBeDark)).catch(
          console.error
        );
      }
    }
  }, [user?.settings, isDarkMode]);

  useEffect(() => {
    if (showBlockedUsers) {
      loadBlockedUsersProfiles();
    }
  }, [showBlockedUsers]);

  const loadBlockedUsersProfiles = async () => {
    // First refresh the user profile to get the latest blockedUsers
    if (refreshUserProfile) {
      console.log('🔄 Refreshing user profile before loading blocked users...');
      await refreshUserProfile();
    }

    console.log('🚫 Current user blockedUsers:', user?.blockedUsers);

    if (!user?.blockedUsers?.length) {
      console.log('❌ No blocked users found in user profile');
      setBlockedUsersProfiles([]);
      return;
    }

    console.log(
      `📋 Loading profiles for ${user.blockedUsers.length} blocked users:`,
      user.blockedUsers
    );

    setLoadingBlockedUsers(true);
    try {
      const profiles: UserType[] = [];
      for (const blockedUserId of user.blockedUsers) {
        console.log(`🔍 Fetching profile for blocked user: ${blockedUserId}`);
        // Fetch each blocked user's profile
        const { getDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../../services/firebase/config');
        const userDoc = await getDoc(doc(db, 'users', blockedUserId));
        if (userDoc.exists()) {
          const profileData = userDoc.data();
          console.log(
            `✅ Found profile for ${blockedUserId}: ${
              profileData?.displayName || profileData?.name || 'Unknown'
            }`
          );
          profiles.push({
            id: userDoc.id,
            ...profileData,
          } as UserType);
        } else {
          console.log(
            `❌ Profile not found for blocked user: ${blockedUserId}`
          );
        }
      }
      console.log(`📊 Loaded ${profiles.length} blocked user profiles`);
      setBlockedUsersProfiles(profiles);
    } catch (error) {
      console.error('Error loading blocked users:', error);
      toastService.error(t('common.error'), t('settings.saveError'));
    } finally {
      setLoadingBlockedUsers(false);
    }
  };

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

  const handleDeleteAccount = () => {
    setShowDeleteAccount(true);
  };

  const handleConfirmDelete = async (password: string) => {
    try {
      const result = await deleteAccount(password);

      if (result?.success) {
        setShowDeleteAccount(false);
        toastService.success(
          t('settings.deleteSuccess'),
          t('settings.deleteSuccess')
        );
        // Navigate to login after a short delay
        setTimeout(() => {
          router.replace('/auth/login');
        }, 1500);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const handleBackPress = () => {
    // Check if there's a screen to go back to
    if (router.canGoBack()) {
      router.back();
    } else {
      // If no screen to go back to, navigate to the main tabs
      router.replace('/(tabs)/search');
    }
  };

  const handleUnblockUser = async (
    blockedUserId: string,
    blockedUserName: string
  ) => {
    try {
      const result = await blockReportService.unblockUser(blockedUserId);
      if (result.success) {
        toastService.success(
          t('settings.unblockSuccess'),
          t('settings.unblockSuccess', { name: blockedUserName })
        );
        // Refresh user profile to update blockedUsers array
        if (refreshUserProfile) {
          await refreshUserProfile();
        }
        // Reload blocked users profiles
        await loadBlockedUsersProfiles();
      } else {
        toastService.error('Error', result.message);
      }
    } catch (error) {
      toastService.error(t('common.error'), t('settings.unblockError'));
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      const currentSettings = user?.settings || {};
      const updatedSettings = {
        ...currentSettings,
        notifications: {
          pushEnabled: notificationsEnabled,
          messageNotifications: messageNotifications,
          matchNotifications: matchNotifications,
        },
      };

      await updateProfile({ settings: updatedSettings });
      toastService.success(
        t('settings.saveSuccess'),
        t('settings.saveSuccess')
      );
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toastService.error(t('common.error'), t('settings.saveError'));
    }
  };

  const handleSavePrivacySettings = async (privacySettings: any) => {
    try {
      const currentSettings = user?.settings || {};
      const updatedSettings = {
        ...currentSettings,
        privacy: privacySettings.privacy,
      };

      await updateProfile({ settings: updatedSettings });
      toastService.success(
        t('settings.saveSuccess'),
        t('settings.updateSuccess')
      );
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toastService.error(t('common.error'), t('settings.saveError'));
    }
  };

  const handleSaveLanguageSettings = async (appearanceSettings: any) => {
    try {
      const currentSettings = user?.settings || {};
      const updatedSettings = {
        ...currentSettings,
        appearance: appearanceSettings.appearance,
      };

      await updateProfile({ settings: updatedSettings });
      toastService.success(
        t('settings.saveSuccess'),
        t('settings.updateSuccess')
      );
    } catch (error) {
      console.error('Error saving language settings:', error);
      toastService.error(t('common.error'), t('settings.saveError'));
    }
  };

  const handleSaveThemeSettings = async (isDark: boolean) => {
    try {
      const currentSettings = user?.settings || {};
      const updatedSettings = {
        ...currentSettings,
        appearance: {
          language: user?.settings?.appearance?.language || 'en',
          theme: isDark ? 'dark' : 'light',
        },
      };

      await updateProfile({ settings: updatedSettings });
      // Note: Local theme state is managed by ThemeContext
    } catch (error) {
      console.error('Error saving theme settings:', error);
      toastService.error(t('common.error'), t('settings.saveError'));
    }
  };

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const handleSaveProfile = async (updatedData: Partial<User>) => {
    try {
      // If updateProfile exists in AuthContext, use it
      if (updateProfile) {
        await updateProfile(updatedData);
        // Refresh the user profile from Firebase to ensure we have the latest data
        if (refreshUserProfile) {
          await refreshUserProfile();
        }

        // Sync search filters with user preferences
        if (updatedData.preferences) {
          const { updateSearchFilters } = useUserStore.getState();
          const filterUpdates: any = {};

          if (updatedData.preferences.interestedIn !== undefined) {
            filterUpdates.gender = updatedData.preferences.interestedIn;
          }
          if (updatedData.preferences.ageRange !== undefined) {
            filterUpdates.ageRange = updatedData.preferences.ageRange;
          }
          if (updatedData.preferences.maxDistance !== undefined) {
            filterUpdates.maxDistance = updatedData.preferences.maxDistance;
          }

          if (Object.keys(filterUpdates).length > 0) {
            updateSearchFilters(filterUpdates);
            console.log(
              '✅ Search filters synced with preferences:',
              filterUpdates
            );
          }
        }

        console.log('✅ Profile updated and refreshed from Firebase');
        toastService.success(
          t('settings.updateSuccess'),
          t('settings.updateSuccess')
        );
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toastService.error(t('settings.updateError'), t('settings.updateError'));
    }
  };

  const handleToggleDarkMode = async () => {
    const newDarkMode = !isDarkMode;

    // Save to Firebase first
    await handleSaveThemeSettings(newDarkMode);

    // Then toggle the theme locally
    await toggleDarkMode();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.surface }]}
            onPress={handleBackPress}
          >
            <ChevronLeft size={scale(24)} color={theme.text} />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.text, ...theme.typography.h1 },
            ]}
          >
            {t('settings.title')}
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.textSecondary, ...theme.typography.body },
            ]}
          >
            {t('settings.subtitle')}
          </Text>
        </View>

        {/* Account Section */}
        <SettingSection title={t('settings.account')}>
          <SettingItem
            icon={<User />}
            title={t('settings.editProfile')}
            subtitle={t('settings.editProfileSubtitle')}
            onPress={handleEditProfile}
          />
          <SettingItem
            icon={<Lock />}
            title={t('settings.changePassword')}
            subtitle={t('settings.changePasswordSubtitle')}
            onPress={() => setShowChangePassword(true)}
          />
        </SettingSection>

        {/* Privacy & Security */}
        <SettingSection title={t('settings.privacySecurity')}>
          <SettingItem
            icon={<Shield />}
            title={t('settings.privacySettings')}
            subtitle={t('settings.privacySettingsSubtitle')}
            onPress={() => setShowPrivacySettings(true)}
          />
          <SettingItem
            icon={<MapPin />}
            title={t('settings.locationServices')}
            subtitle={
              locationEnabled ? t('settings.enabled') : t('settings.disabled')
            }
            showChevron={false}
            rightElement={
              <Switch
                value={locationEnabled}
                onValueChange={(value) => {
                  setLocationEnabled(value);
                  setTimeout(() => {
                    handleSavePrivacySettings({
                      privacy: {
                        showOnlineStatus: showOnlineStatus,
                        locationSharing: value,
                        profileVisibility:
                          user?.settings?.privacy?.profileVisibility ||
                          'public',
                        dataSharing:
                          user?.settings?.privacy?.dataSharing ?? true,
                      },
                    });
                  }, 500);
                }}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.surface}
              />
            }
          />
          <SettingItem
            icon={<Ban />}
            title={t('settings.blockedUsers')}
            subtitle={t('settings.blockedUsersCount', {
              count: user?.blockedUsers?.length || 0,
            })}
            onPress={() => setShowBlockedUsers(true)}
          />
          <SettingItem
            icon={<Eye />}
            title={t('settings.showOnlineStatus')}
            subtitle={
              showOnlineStatus
                ? t('settings.showOnlineStatusVisible')
                : t('settings.showOnlineStatusHidden')
            }
            showChevron={false}
            rightElement={
              <Switch
                value={showOnlineStatus}
                onValueChange={(value) => {
                  setShowOnlineStatus(value);
                  // Save privacy settings
                  setTimeout(() => {
                    handleSavePrivacySettings({
                      privacy: {
                        showOnlineStatus: value,
                        locationSharing: locationEnabled,
                        profileVisibility:
                          user?.settings?.privacy?.profileVisibility ||
                          'public',
                        dataSharing:
                          user?.settings?.privacy?.dataSharing ?? true,
                      },
                    });
                  }, 500);
                }}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.surface}
              />
            }
          />
        </SettingSection>

        {/* Notifications */}
        <SettingSection title={t('settings.notifications')}>
          <SettingItem
            icon={<Bell />}
            title={t('settings.pushNotifications')}
            subtitle={
              notificationsEnabled
                ? t('settings.enabled')
                : t('settings.disabled')
            }
            showChevron={false}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={(value) => {
                  setNotificationsEnabled(value);
                  // Auto-save after a short delay to avoid too many saves
                  setTimeout(() => handleSaveNotificationSettings(), 500);
                }}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.surface}
              />
            }
          />
          <SettingItem
            icon={<Mail />}
            title={t('settings.messageNotifications')}
            subtitle={t('settings.messageNotificationsSubtitle')}
            showChevron={false}
            rightElement={
              <Switch
                value={messageNotifications}
                onValueChange={(value) => {
                  setMessageNotifications(value);
                  setTimeout(() => handleSaveNotificationSettings(), 500);
                }}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.surface}
                disabled={!notificationsEnabled}
              />
            }
          />
          <SettingItem
            icon={<User />}
            title={t('settings.matchNotifications')}
            subtitle={t('settings.matchNotificationsSubtitle')}
            showChevron={false}
            rightElement={
              <Switch
                value={matchNotifications}
                onValueChange={(value) => {
                  setMatchNotifications(value);
                  setTimeout(() => handleSaveNotificationSettings(), 500);
                }}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.surface}
                disabled={!notificationsEnabled}
              />
            }
          />
        </SettingSection>

        {/* Appearance */}
        <SettingSection title={t('settings.appearance')}>
          <SettingItem
            icon={isDarkMode ? <Moon /> : <Sun />}
            title={t('settings.darkMode')}
            subtitle={
              isDarkMode ? t('settings.enabled') : t('settings.disabled')
            }
            showChevron={false}
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={handleToggleDarkMode}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.surface}
              />
            }
          />
          <SettingItem
            icon={<Globe />}
            title={t('settings.language')}
            subtitle={t('settings.languageSubtitle')}
            onPress={() => setShowLanguageSettings(true)}
          />
        </SettingSection>

        {/* Support */}
        <SettingSection title={t('settings.support')}>
          <SettingItem
            icon={<Info />}
            title={t('settings.about')}
            subtitle={t('settings.version', { version: '1.0.0' })}
            onPress={() =>
              toastService.info(
                'MeetBridge',
                'Version 1.0.0\n\nConnect meaningfully with people nearby.'
              )
            }
          />
        </SettingSection>

        {/* Danger Zone */}
        <SettingSection title={t('settings.dangerZone')}>
          <SettingItem
            icon={<LogOut />}
            title={t('settings.logout')}
            onPress={handleLogout}
            showChevron={false}
            variant="danger"
          />
          <SettingItem
            icon={<Trash2 />}
            title={t('settings.deleteAccount')}
            subtitle={t('settings.deleteAccountSubtitle')}
            onPress={handleDeleteAccount}
            showChevron={false}
            variant="danger"
          />
        </SettingSection>

        {/* Footer */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              { color: theme.textTertiary, ...theme.typography.caption },
            ]}
          >
            {t('settings.footerText')}
          </Text>
          <Text
            style={[
              styles.footerText,
              { color: theme.textTertiary, ...theme.typography.tiny },
            ]}
          >
            {t('settings.copyright')}
          </Text>
        </View>
      </ScrollView>

      {/* Blocked Users Modal */}
      <Modal
        visible={showBlockedUsers}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBlockedUsers(false)}
      >
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: theme.borderLight },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.modalBackButton,
                { backgroundColor: theme.surface },
              ]}
              onPress={() => setShowBlockedUsers(false)}
            >
              <ChevronLeft size={scale(24)} color={theme.text} />
            </TouchableOpacity>
            <Text
              style={[
                styles.modalTitle,
                { color: theme.text, ...theme.typography.h1 },
              ]}
            >
              {t('settings.blockedUsersTitle')}
            </Text>
            <View style={{ width: scale(44) }} />
          </View>

          {loadingBlockedUsers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text
                style={[
                  styles.loadingText,
                  { color: theme.textSecondary, ...theme.typography.body },
                ]}
              >
                {t('settings.loadingBlockedUsers')}
              </Text>
            </View>
          ) : blockedUsersProfiles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ban size={scale(48)} color={theme.textTertiary} />
              <Text
                style={[
                  styles.emptyText,
                  { color: theme.textSecondary, ...theme.typography.body },
                ]}
              >
                No blocked users
              </Text>
              <Text
                style={[
                  styles.emptySubtext,
                  { color: theme.textTertiary, ...theme.typography.caption },
                ]}
              >
                Users you block will appear here
              </Text>
            </View>
          ) : (
            <FlatList
              data={blockedUsersProfiles}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Card
                  variant="elevated"
                  elevation="small"
                  padding="md"
                  style={styles.blockedUserCard}
                >
                  <View style={styles.blockedUserContent}>
                    <View style={styles.blockedUserInfo}>
                      <Text
                        style={[
                          styles.blockedUserName,
                          { color: theme.text, ...theme.typography.body },
                        ]}
                      >
                        {item.name || 'Unknown User'}
                      </Text>
                      <Text
                        style={[
                          styles.blockedUserId,
                          {
                            color: theme.textSecondary,
                            ...theme.typography.caption,
                          },
                        ]}
                      >
                        @{item.id}
                      </Text>
                    </View>
                    <Button
                      title="Unblock"
                      onPress={() =>
                        handleUnblockUser(item.id, item.name || 'User')
                      }
                      variant="outline"
                      size="small"
                      style={styles.unblockButton}
                    />
                  </View>
                </Card>
              )}
              contentContainerStyle={styles.blockedUsersList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onSave={handleSaveProfile}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        visible={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* Privacy Settings Modal */}
      <PrivacySettingsModal
        visible={showPrivacySettings}
        onClose={() => setShowPrivacySettings(false)}
        onSave={handleSavePrivacySettings}
      />

      {/* Language Settings Modal */}
      <LanguageSettingsModal
        visible={showLanguageSettings}
        onClose={() => setShowLanguageSettings(false)}
        onSave={handleSaveLanguageSettings}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  header: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  backButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    marginBottom: spacing.xs,
  },
  headerSubtitle: {},
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    textTransform: 'uppercase',
  },
  sectionCard: {
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 0.5,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {},
  settingSubtitle: {
    marginTop: spacing.xs / 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
  },
  footerText: {
    marginBottom: spacing.xs,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalBackButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginTop: spacing.md,
  },
  emptySubtext: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  blockedUsersList: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  blockedUserCard: {
    marginBottom: spacing.md,
  },
  blockedUserContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockedUserInfo: {
    flex: 1,
  },
  blockedUserName: {
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  blockedUserId: {
    opacity: 0.7,
  },
  unblockButton: {
    minWidth: scale(80),
  },
});

export default Settings;
