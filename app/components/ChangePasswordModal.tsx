import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import toastService from '../../services/toastService';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
} from '../../utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
}) => {
  const { isDarkMode } = useTheme();
  const { changePassword } = useAuth();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toastService.error('Missing Fields', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      toastService.error(
        'Weak Password',
        'New password must be at least 6 characters long'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toastService.error('Mismatch', 'New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      toastService.error(
        'Same Password',
        'New password must be different from current password'
      );
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐 Starting password change process...');
      const result = await changePassword(currentPassword, newPassword);
      console.log('🔐 Password change result:', result);

      if (result?.success) {
        toastService.success(
          'Success!',
          'Your password has been changed successfully'
        );
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        toastService.error(
          'Password Change Failed',
          result?.message || 'Failed to change password'
        );
      }
    } catch (error) {
      console.error('❌ Unexpected error in handleChangePassword:', error);
      toastService.error(
        'Unexpected Error',
        'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.background },
            ]}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <View style={styles.headerLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.primaryVariant },
                  ]}
                >
                  <Lock size={scale(24)} color={theme.primary} />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>
                  Change Password
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme.surface }]}
                onPress={handleClose}
              >
                <X size={scale(20)} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <Text
                style={[
                  styles.description,
                  { color: theme.textSecondary, ...theme.typography.body },
                ]}
              >
                Enter your current password and choose a new secure password
              </Text>

              {/* Current Password */}
              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.label,
                    { color: theme.text, ...theme.typography.bodyMedium },
                  ]}
                >
                  Current Password
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Lock size={scale(20)} color={theme.textSecondary} />
                  <TextInput
                    style={[
                      styles.input,
                      { color: theme.text, ...theme.typography.body },
                    ]}
                    placeholder="Enter current password"
                    placeholderTextColor={theme.textTertiary}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={scale(20)} color={theme.textSecondary} />
                    ) : (
                      <Eye size={scale(20)} color={theme.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.label,
                    { color: theme.text, ...theme.typography.bodyMedium },
                  ]}
                >
                  New Password
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Lock size={scale(20)} color={theme.textSecondary} />
                  <TextInput
                    style={[
                      styles.input,
                      { color: theme.text, ...theme.typography.body },
                    ]}
                    placeholder="Enter new password"
                    placeholderTextColor={theme.textTertiary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff size={scale(20)} color={theme.textSecondary} />
                    ) : (
                      <Eye size={scale(20)} color={theme.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
                <Text
                  style={[
                    styles.hint,
                    { color: theme.textTertiary, ...theme.typography.caption },
                  ]}
                >
                  Must be at least 6 characters long
                </Text>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.label,
                    { color: theme.text, ...theme.typography.bodyMedium },
                  ]}
                >
                  Confirm New Password
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Lock size={scale(20)} color={theme.textSecondary} />
                  <TextInput
                    style={[
                      styles.input,
                      { color: theme.text, ...theme.typography.body },
                    ]}
                    placeholder="Confirm new password"
                    placeholderTextColor={theme.textTertiary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={scale(20)} color={theme.textSecondary} />
                    ) : (
                      <Eye size={scale(20)} color={theme.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Security Tips */}
              <View
                style={[
                  styles.tipsContainer,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text
                  style={[
                    styles.tipsTitle,
                    { color: theme.text, ...theme.typography.bodyMedium },
                  ]}
                >
                  Password Security Tips:
                </Text>
                <Text
                  style={[
                    styles.tipText,
                    { color: theme.textSecondary, ...theme.typography.caption },
                  ]}
                >
                  • Use at least 8 characters{'\n'}• Mix uppercase and lowercase
                  letters{'\n'}• Include numbers and special characters{'\n'}•
                  Avoid common words or personal information
                </Text>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: theme.border }]}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { backgroundColor: theme.surface },
                ]}
                onPress={handleClose}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: theme.text, ...theme.typography.bodyMedium },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButtonWrapper}
                onPress={handleChangePassword}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[theme.primary, theme.primaryVariant]}
                  style={[
                    styles.saveButton,
                    isLoading && styles.disabledButton,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <CheckCircle size={scale(20)} color="#fff" />
                      <Text style={styles.saveButtonText}>Change Password</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: scale(48),
    height: scale(48),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: '700',
  },
  closeButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  description: {
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: verticalScale(52),
    gap: spacing.sm,
  },
  input: {
    flex: 1,
  },
  hint: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  tipsContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  tipsTitle: {
    marginBottom: spacing.sm,
  },
  tipText: {
    lineHeight: moderateScale(20),
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    height: verticalScale(50),
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  saveButtonWrapper: {
    flex: 1,
  },
  saveButton: {
    height: verticalScale(50),
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default ChangePasswordModal;
