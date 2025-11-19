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
  Image,
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
  Info,
  LogOut,
  Trash2,
  Eye,
  Mail,
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
  const [isUserInteraction, setIsUserInteraction] = useState(false);

  // Update settings when user data changes (but not during user interactions)
  useEffect(() => {
    if (user?.settings && !isUserInteraction) {
      setNotificationsEnabled(user.settings.notifications?.pushEnabled ?? true);
      setMessageNotifications(
        user.settings.notifications?.messageNotifications ?? true
      );
      setMatchNotifications(
        user.settings.notifications?.matchNotifications ?? true
      );
      setShowOnlineStatus(user.settings.privacy?.showOnlineStatus ?? true);

      // Sync theme preference from Firebase
      if (user.settings.appearance?.theme) {
        const shouldBeDark = user.settings.appearance.theme === 'dark';
        AsyncStorage.setItem('darkMode', JSON.stringify(shouldBeDark)).catch(
          console.error
        );
      }
    }
  }, [user?.settings, isUserInteraction]);

  useEffect(() => {
    if (showBlockedUsers) {
      loadBlockedUsersProfiles();
    }
  }, [showBlockedUsers]);

  const loadBlockedUsersProfiles = async () => {
    if (refreshUserProfile) {
      console.log('🔄 Refreshing user profile before loading blocked users...');
      await refreshUserProfile();
    }

    if (!user?.blockedUsers?.length) {
      console.log('❌ No blocked users found');
      setBlockedUsersProfiles([]);
      return;
    }

    setLoadingBlockedUsers(true);
    try {
      const profiles: UserType[] = [];
      for (const blockedUserId of user.blockedUsers) {
        const { getDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../../services/firebase/config');
        const userDoc = await getDoc(doc(db, 'users', blockedUserId));
        if (userDoc.exists()) {
          const profileData = userDoc.data();
          profiles.push({
            id: userDoc.id,
            name:
              profileData?.displayName || profileData?.name || 'Unknown User',
            avatar:
              profileData?.avatar ||
              profileData?.image ||
              profileData?.images?.[0],
            age: profileData?.age,
            bio: profileData?.bio,
            ...profileData,
          } as UserType);
        }
      }
      setBlockedUsersProfiles(profiles);
    } catch (error) {
      console.error('Error loading blocked users:', error);
      toastService.error(t('common.error'), 'Failed to load blocked users');
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
          'Your account has been deleted'
        );
        setTimeout(() => {
          router.replace('/auth/login');
        }, 1500);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
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
          'User Unblocked',
          `You've unblocked ${blockedUserName}`
        );
        if (refreshUserProfile) {
          await refreshUserProfile();
        }
        await loadBlockedUsersProfiles();
      } else {
        toastService.error('Error', result.message);
      }
    } catch (error) {
      toastService.error(t('common.error'), 'Failed to unblock user');
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      const currentSettings = user?.settings || {};
      const updatedSettings = {
        ...currentSettings,
        notifications: {
          ...currentSettings.notifications,
          pushEnabled: notificationsEnabled,
          messageNotifications: messageNotifications,
          matchNotifications: matchNotifications,
        },
      };

      await updateProfile({ settings: updatedSettings });

      // Refresh to ensure state is in sync
      if (refreshUserProfile) {
        await refreshUserProfile();
      }

      console.log(
        '✅ Notification settings saved:',
        updatedSettings.notifications
      );
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toastService.error(t('common.error'), 'Failed to save settings');
      // Revert on error
      setIsUserInteraction(false);
    }
  };

  const handleSavePrivacySettings = async (privacySettings: any) => {
    try {
      const currentSettings = user?.settings || {};
      const updatedSettings = {
        ...currentSettings,
        privacy: {
          ...currentSettings.privacy,
          ...privacySettings.privacy,
        },
      };

      await updateProfile({ settings: updatedSettings });

      // Refresh to ensure state is in sync
      if (refreshUserProfile) {
        await refreshUserProfile();
      }

      console.log('✅ Privacy settings saved:', updatedSettings.privacy);
      toastService.success(
        t('settings.saveSuccess'),
        'Privacy settings updated'
      );
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toastService.error(t('common.error'), 'Failed to save settings');
      setIsUserInteraction(false);
    }
  };

  const handleSaveLanguageSettings = async (appearanceSettings: any) => {
    try {
      const currentSettings = user?.settings || {};
      const updatedSettings = {
        ...currentSettings,
        appearance: {
          ...currentSettings.appearance,
          ...appearanceSettings.appearance,
        },
      };

      await updateProfile({ settings: updatedSettings });

      // Refresh to ensure state is in sync
      if (refreshUserProfile) {
        await refreshUserProfile();
      }

      console.log('✅ Language settings saved:', updatedSettings.appearance);
      toastService.success(
        t('settings.saveSuccess'),
        'Language settings updated'
      );
    } catch (error) {
      console.error('Error saving language settings:', error);
      toastService.error(t('common.error'), 'Failed to save settings');
    }
  };

  const handleSaveThemeSettings = async (isDark: boolean) => {
    try {
      const currentSettings = user?.settings || {};
      const updatedSettings = {
        ...currentSettings,
        appearance: {
          ...currentSettings.appearance,
          language: currentSettings.appearance?.language || 'en',
          theme: isDark ? 'dark' : 'light',
        },
      };

      await updateProfile({ settings: updatedSettings });

      // Refresh to ensure state is in sync
      if (refreshUserProfile) {
        await refreshUserProfile();
      }

      console.log('✅ Theme settings saved:', updatedSettings.appearance);
    } catch (error) {
      console.error('Error saving theme settings:', error);
      toastService.error(t('common.error'), 'Failed to save theme');
    }
  };

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const handleSaveProfile = async (updatedData: Partial<User>) => {
    try {
      if (updateProfile) {
        await updateProfile(updatedData);
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
            console.log('✅ Search filters synced:', filterUpdates);
          }
        }

        toastService.success(
          t('settings.updateSuccess'),
          'Profile updated successfully'
        );
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toastService.error(t('settings.updateError'), 'Failed to update profile');
    }
  };

  const handleToggleDarkMode = async () => {
    const newDarkMode = !isDarkMode;
    await handleSaveThemeSettings(newDarkMode);
    await toggleDarkMode();
  };

  const handleToggleNotifications = async (value: boolean) => {
    setIsUserInteraction(true);
    setNotificationsEnabled(value);

    // If turning off, also turn off sub-notifications
    if (!value) {
      setMessageNotifications(false);
      setMatchNotifications(false);
    }

    try {
      await handleSaveNotificationSettings();
    } finally {
      setTimeout(() => setIsUserInteraction(false), 1000);
    }
  };

  const handleToggleMessageNotifications = async (value: boolean) => {
    setIsUserInteraction(true);
    setMessageNotifications(value);
    try {
      await handleSaveNotificationSettings();
    } finally {
      setTimeout(() => setIsUserInteraction(false), 1000);
    }
  };

  const handleToggleMatchNotifications = async (value: boolean) => {
    setIsUserInteraction(true);
    setMatchNotifications(value);
    try {
      await handleSaveNotificationSettings();
    } finally {
      setTimeout(() => setIsUserInteraction(false), 1000);
    }
  };

  const handleToggleOnlineStatus = async (value: boolean) => {
    setIsUserInteraction(true);
    setShowOnlineStatus(value);
    try {
      await handleSavePrivacySettings({
        privacy: {
          showOnlineStatus: value,
          profileVisibility:
            user?.settings?.privacy?.profileVisibility || 'public',
          dataSharing: user?.settings?.privacy?.dataSharing ?? true,
        },
      });
    } finally {
      setTimeout(() => setIsUserInteraction(false), 1000);
    }
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
            icon={<Ban />}
            title={t('settings.blockedUsers')}
            subtitle={
              user?.blockedUsers?.length
                ? `${user.blockedUsers.length} ${
                    user.blockedUsers.length === 1 ? 'user' : 'users'
                  } blocked`
                : 'No blocked users'
            }
            onPress={() => setShowBlockedUsers(true)}
          />
          <SettingItem
            icon={<Eye />}
            title={t('settings.showOnlineStatus')}
            subtitle={
              showOnlineStatus ? 'Visible to others' : 'Hidden from others'
            }
            showChevron={false}
            rightElement={
              <Switch
                value={showOnlineStatus}
                onValueChange={handleToggleOnlineStatus}
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
            subtitle={notificationsEnabled ? 'Enabled' : 'Disabled'}
            showChevron={false}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.surface}
              />
            }
          />
          <SettingItem
            icon={<Mail />}
            title={t('settings.messageNotifications')}
            subtitle="Get notified of new messages"
            showChevron={false}
            rightElement={
              <Switch
                value={messageNotifications}
                onValueChange={handleToggleMessageNotifications}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.surface}
                disabled={!notificationsEnabled}
              />
            }
          />
          <SettingItem
            icon={<User />}
            title={t('settings.matchNotifications')}
            subtitle="Get notified of new matches"
            showChevron={false}
            rightElement={
              <Switch
                value={matchNotifications}
                onValueChange={handleToggleMatchNotifications}
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
            subtitle={isDarkMode ? 'Enabled' : 'Disabled'}
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
            subtitle="Version 1.0.0"
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
                { color: theme.text, ...theme.typography.h2 },
              ]}
            >
              Blocked Users
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
                Loading blocked users...
              </Text>
            </View>
          ) : blockedUsersProfiles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconContainer,
                  { backgroundColor: theme.surface },
                ]}
              >
                <Ban size={scale(48)} color={theme.textSecondary} />
              </View>
              <Text
                style={[
                  styles.emptyTitle,
                  { color: theme.text, ...theme.typography.h3 },
                ]}
              >
                No Blocked Users
              </Text>
              <Text
                style={[
                  styles.emptySubtext,
                  { color: theme.textSecondary, ...theme.typography.body },
                ]}
              >
                Users you block will appear here. You can unblock them anytime.
              </Text>
            </View>
          ) : (
            <FlatList
              data={blockedUsersProfiles}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.blockedUserCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.borderLight,
                    },
                  ]}
                >
                  <View style={styles.blockedUserContent}>
                    <View style={styles.blockedUserInfo}>
                      <Image
                        source={
                          item.avatar
                            ? { uri: item.avatar }
                            : require('../../assets/images/placeholder.png')
                        }
                        style={[
                          styles.blockedUserAvatar,
                          { borderColor: theme.borderLight },
                        ]}
                      />
                      <View style={styles.blockedUserTextInfo}>
                        <Text
                          style={[
                            styles.blockedUserName,
                            {
                              color: theme.text,
                              ...theme.typography.bodyLarge,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        {item.age && (
                          <Text
                            style={[
                              styles.blockedUserAge,
                              {
                                color: theme.textSecondary,
                                ...theme.typography.caption,
                              },
                            ]}
                          >
                            {item.age} years old
                          </Text>
                        )}
                        {item.bio && (
                          <Text
                            style={[
                              styles.blockedUserBio,
                              {
                                color: theme.textSecondary,
                                ...theme.typography.caption,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {item.bio}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.unblockButton,
                        {
                          backgroundColor: theme.primaryVariant,
                          borderColor: theme.primary,
                        },
                      ]}
                      onPress={() => handleUnblockUser(item.id, item.name)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.unblockButtonText,
                          {
                            color: theme.primary,
                            ...theme.typography.bodyMedium,
                          },
                        ]}
                      >
                        Unblock
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.blockedUsersList}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => (
                <View style={{ height: spacing.sm }} />
              )}
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
    paddingBottom: spacing.xxl,
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
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyIconContainer: {
    width: scale(100),
    height: scale(100),
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    textAlign: 'center',
    lineHeight: moderateScale(22),
  },
  blockedUsersList: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  blockedUserCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  blockedUserContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockedUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  blockedUserAvatar: {
    width: scale(56),
    height: scale(56),
    borderRadius: borderRadius.full,
    marginRight: spacing.md,
    borderWidth: 2,
  },
  blockedUserTextInfo: {
    flex: 1,
  },
  blockedUserName: {
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  blockedUserAge: {
    marginBottom: spacing.xs / 4,
  },
  blockedUserBio: {
    opacity: 0.7,
  },
  unblockButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    minWidth: scale(85),
    alignItems: 'center',
  },
  unblockButtonText: {
    fontWeight: '600',
  },
});

export default Settings;
