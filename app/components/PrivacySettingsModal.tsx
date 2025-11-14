import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
} from 'react-native';
import { ChevronLeft, Eye, Users, Lock } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import { Card, Button } from '../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../store/types';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
} from '../../utils/responsive';

interface PrivacySettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (settings: Partial<User['settings']>) => void;
}

interface PrivacyOptionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean | string;
  onValueChange: (value: boolean | string) => void;
  type: 'toggle' | 'select';
  options?: { label: string; value: string }[];
}

const PrivacyOption: React.FC<PrivacyOptionProps> = ({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  type,
  options,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <View
      style={[styles.privacyOption, { borderBottomColor: theme.borderLight }]}
    >
      <View style={styles.privacyOptionLeft}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.primaryVariant },
          ]}
        >
          {React.cloneElement(icon as React.ReactElement, {
            size: scale(20),
            color: theme.primary,
          })}
        </View>
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.optionTitle,
              { color: theme.text, ...theme.typography.bodyMedium },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.optionSubtitle,
              { color: theme.textSecondary, ...theme.typography.caption },
            ]}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      {type === 'toggle' ? (
        <TouchableOpacity
          style={[
            styles.toggle,
            { backgroundColor: value ? theme.primary : theme.border },
          ]}
          onPress={() => onValueChange(!value)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.toggleKnob,
              {
                backgroundColor: theme.surface,
                transform: [{ translateX: value ? scale(20) : 0 }],
              },
            ]}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.selectContainer}
          onPress={() => {
            // For select type, we'll show a modal or picker
            // For now, cycle through options
            if (options) {
              const currentIndex = options.findIndex(
                (opt) => opt.value === value
              );
              const nextIndex = (currentIndex + 1) % options.length;
              onValueChange(options[nextIndex].value);
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.selectValue, { color: theme.primary }]}>
            {options?.find((opt) => opt.value === value)?.label || value}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { isDarkMode } = useTheme();
  const { user, updateProfile } = useAuth();
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Initialize settings from user data
  const [settings, setSettings] = useState({
    showOnlineStatus: user?.settings?.privacy?.showOnlineStatus ?? true,
    profileVisibility: user?.settings?.privacy?.profileVisibility ?? 'public',
  });

  // Update settings when user data changes
  useEffect(() => {
    if (user?.settings?.privacy) {
      setSettings({
        showOnlineStatus: user.settings.privacy.showOnlineStatus ?? true,
        profileVisibility: user.settings.privacy.profileVisibility ?? 'public',
      });
    }
  }, [user?.settings?.privacy]);

  const handleSave = async () => {
    try {
      const updatedSettings = {
        privacy: settings,
      };

      await updateProfile({ settings: updatedSettings });
      onSave(updatedSettings);
      onClose();
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    }
  };

  const profileVisibilityOptions = [
    { label: 'Public', value: 'public' },
    { label: 'Matches Only', value: 'matches' },
    { label: 'Private', value: 'private' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.surface }]}
            onPress={onClose}
          >
            <ChevronLeft size={scale(24)} color={theme.text} />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.text, ...theme.typography.h1 },
            ]}
          >
            Privacy Settings
          </Text>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveButtonText, { color: theme.surface }]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Description */}
          <Text
            style={[
              styles.description,
              { color: theme.textSecondary, ...theme.typography.body },
            ]}
          >
            Control who can see your profile and how your data is used.
          </Text>

          {/* Privacy Options */}
          <Card variant="elevated" elevation="small" style={styles.optionsCard}>
            <PrivacyOption
              icon={<Eye />}
              title="Show Online Status"
              subtitle="Let others see when you're online"
              value={settings.showOnlineStatus}
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, showOnlineStatus: value }))
              }
              type="toggle"
            />

            <PrivacyOption
              icon={<Users />}
              title="Profile Visibility"
              subtitle="Who can see your profile"
              value={settings.profileVisibility}
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, profileVisibility: value }))
              }
              type="select"
              options={profileVisibilityOptions}
            />
          </Card>

          {/* Information Section */}
          <Card variant="outlined" style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Lock size={scale(20)} color={theme.primary} />
              <Text
                style={[
                  styles.infoTitle,
                  { color: theme.text, ...theme.typography.bodyMedium },
                ]}
              >
                Your Privacy Matters
              </Text>
            </View>
            <Text
              style={[
                styles.infoText,
                { color: theme.textSecondary, ...theme.typography.caption },
              ]}
            >
              We take your privacy seriously. Your data is encrypted and never
              shared with third parties without your consent. You can change
              these settings at any time.
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  saveButtonText: {
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  description: {
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  optionsCard: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 0.5,
  },
  privacyOptionLeft: {
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
  optionTitle: {},
  optionSubtitle: {
    marginTop: spacing.xs / 2,
  },
  toggle: {
    width: scale(44),
    height: scale(24),
    borderRadius: borderRadius.full,
    padding: scale(2),
    justifyContent: 'center',
  },
  toggleKnob: {
    width: scale(20),
    height: scale(20),
    borderRadius: borderRadius.full,
  },
  selectContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  selectValue: {
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  infoCard: {
    padding: spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoTitle: {
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  infoText: {},
});

export default PrivacySettingsModal;
