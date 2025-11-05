import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
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
import { useUserStore } from '../../store/userStore';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
} from '../../utils/responsive';
import toastSerivce from '../../services/toastService';
import { User as UserType } from '../../types/models/user';

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
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user, logout, updateProfile, refreshUserProfile, deleteAccount } =
    useAuth();
  const router = useRouter();
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const handleLogout = () => {
    toastService.info('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccount(true);
  };

  const handleConfirmDelete = async (password: string) => {
    try {
      const result = await deleteAccount(password);

      if (result.success) {
        setShowDeleteAccount(false);
        toastService.success(
          'Account Deleted',
          'Your account has been permanently deleted'
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
          'Profile Updated',
          'Your profile has been updated successfully'
        );
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toastService.error(
        'Update Failed',
        'Failed to update your profile. Please try again.'
      );
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
            onPress={() => router.back()}
          >
            <ChevronLeft size={scale(24)} color={theme.text} />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.text, ...theme.typography.h1 },
            ]}
          >
            Settings
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.textSecondary, ...theme.typography.body },
            ]}
          >
            Manage your account and preferences
          </Text>
        </View>

        {/* Account Section */}
        <SettingSection title="ACCOUNT">
          <SettingItem
            icon={<User />}
            title="Edit Profile"
            subtitle="Update your profile information"
            onPress={handleEditProfile}
          />
          <SettingItem
            icon={<Lock />}
            title="Change Password"
            subtitle="Update your account password"
            onPress={() => setShowChangePassword(true)}
          />
        </SettingSection>

        {/* Privacy & Security */}
        <SettingSection title="PRIVACY & SECURITY">
          <SettingItem
            icon={<Shield />}
            title="Privacy Settings"
            subtitle="Control who can see your profile"
            onPress={() =>
              toastService.info(
                'Privacy',
                'Advanced privacy settings coming soon'
              )
            }
          />
          <SettingItem
            icon={<Eye />}
            title="Show Online Status"
            subtitle={showOnlineStatus ? 'Visible to matches' : 'Hidden'}
            showChevron={false}
            rightElement={
              <Switch
                value={showOnlineStatus}
                onValueChange={setShowOnlineStatus}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.surface}
              />
            }
          />
        </SettingSection>

        {/* Notifications */}
        <SettingSection title="NOTIFICATIONS">
          <SettingItem
            icon={<Bell />}
            title="Push Notifications"
            subtitle={notificationsEnabled ? 'Enabled' : 'Disabled'}
            showChevron={false}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.surface}
              />
            }
          />
          <SettingItem
            icon={<Mail />}
            title="Message Notifications"
            subtitle="Get notified for new messages"
            showChevron={false}
            rightElement={
              <Switch
                value={messageNotifications}
                onValueChange={setMessageNotifications}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.surface}
                disabled={!notificationsEnabled}
              />
            }
          />
          <SettingItem
            icon={<User />}
            title="Match Notifications"
            subtitle="Get notified for new matches"
            showChevron={false}
            rightElement={
              <Switch
                value={matchNotifications}
                onValueChange={setMatchNotifications}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.surface}
                disabled={!notificationsEnabled}
              />
            }
          />
        </SettingSection>

        {/* Appearance */}
        <SettingSection title="APPEARANCE">
          <SettingItem
            icon={isDarkMode ? <Moon /> : <Sun />}
            title="Dark Mode"
            subtitle={isDarkMode ? 'Enabled' : 'Disabled'}
            showChevron={false}
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.surface}
              />
            }
          />
          <SettingItem
            icon={<Globe />}
            title="Language"
            subtitle="English (US)"
            onPress={() =>
              toastService.info(
                'Language',
                'Multi-language support coming soon'
              )
            }
          />
        </SettingSection>

        {/* Support */}
        <SettingSection title="SUPPORT">
          <SettingItem
            icon={<Info />}
            title="About"
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
        <SettingSection title="DANGER ZONE">
          <SettingItem
            icon={<LogOut />}
            title="Logout"
            onPress={handleLogout}
            showChevron={false}
            variant="danger"
          />
          <SettingItem
            icon={<Trash2 />}
            title="Delete Account"
            subtitle="Permanently delete your account"
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
            Made with ❤️ by MeetBridge Team
          </Text>
          <Text
            style={[
              styles.footerText,
              { color: theme.textTertiary, ...theme.typography.tiny },
            ]}
          >
            © 2025 MeetBridge. All rights reserved.
          </Text>
        </View>
      </ScrollView>

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
});

export default Settings;
