import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import { Card, Button } from './ui';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
} from '../../utils/responsive';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError('Please enter your password to confirm');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await onConfirm(password);
      // Modal will be closed by parent after successful deletion
      setPassword('');
    } catch (err) {
      setError('Failed to delete account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setPassword('');
      setError('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? 20 : 50}
        tint={isDarkMode ? 'dark' : 'light'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <Card
            variant="elevated"
            elevation="large"
            padding="none"
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface, maxWidth: scale(400) },
            ]}
          >
            {/* Header */}
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: theme.borderLight },
              ]}
            >
              <View style={styles.headerLeft}>
                <View
                  style={[
                    styles.warningIconContainer,
                    { backgroundColor: theme.error + '20' },
                  ]}
                >
                  <AlertTriangle size={scale(24)} color={theme.error} />
                </View>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.text, ...theme.typography.h2 },
                  ]}
                >
                  Delete Account
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                disabled={isLoading}
              >
                <X size={scale(24)} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.modalBody}>
              {/* Warning Message */}
              <View
                style={[
                  styles.warningBox,
                  {
                    backgroundColor: theme.error + '10',
                    borderColor: theme.error + '30',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.warningTitle,
                    { color: theme.error, ...theme.typography.bodyMedium },
                  ]}
                >
                  ⚠️ This action cannot be undone
                </Text>
                <Text
                  style={[
                    styles.warningText,
                    { color: theme.text, ...theme.typography.body },
                  ]}
                >
                  Deleting your account will permanently remove:
                </Text>
                <View style={styles.warningList}>
                  <Text
                    style={[
                      styles.warningListItem,
                      { color: theme.textSecondary, ...theme.typography.body },
                    ]}
                  >
                    • Your profile and all personal information
                  </Text>
                  <Text
                    style={[
                      styles.warningListItem,
                      { color: theme.textSecondary, ...theme.typography.body },
                    ]}
                  >
                    • All your matches and connections
                  </Text>
                  <Text
                    style={[
                      styles.warningListItem,
                      { color: theme.textSecondary, ...theme.typography.body },
                    ]}
                  >
                    • All your messages and conversations
                  </Text>
                  <Text
                    style={[
                      styles.warningListItem,
                      { color: theme.textSecondary, ...theme.typography.body },
                    ]}
                  >
                    • All your photos and media
                  </Text>
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: theme.text, ...theme.typography.bodyMedium },
                  ]}
                >
                  Enter your password to confirm
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.background,
                      borderColor: error ? theme.error : theme.border,
                      color: theme.text,
                      ...theme.typography.body,
                    },
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.textTertiary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError('');
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                {error ? (
                  <Text
                    style={[
                      styles.errorText,
                      { color: theme.error, ...theme.typography.caption },
                    ]}
                  >
                    {error}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Footer */}
            <View
              style={[
                styles.modalFooter,
                { borderTopColor: theme.borderLight },
              ]}
            >
              <Button
                variant="secondary"
                size="large"
                onPress={handleClose}
                disabled={isLoading}
                style={{ flex: 1, marginRight: spacing.sm }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="large"
                onPress={handleConfirm}
                disabled={isLoading || !password.trim()}
                style={[{ flex: 1, backgroundColor: theme.error }]}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.surface} />
                ) : (
                  'Delete Account'
                )}
              </Button>
            </View>
          </Card>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: scale(500),
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  warningIconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  modalTitle: {
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalBody: {
    padding: spacing.lg,
  },
  warningBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  warningTitle: {
    marginBottom: spacing.sm,
  },
  warningText: {
    marginBottom: spacing.sm,
  },
  warningList: {
    marginLeft: spacing.sm,
  },
  warningListItem: {
    marginBottom: spacing.xs,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    marginBottom: spacing.sm,
  },
  input: {
    height: scale(48),
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  errorText: {
    marginTop: spacing.xs,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
  },
});

export default DeleteAccountModal;
