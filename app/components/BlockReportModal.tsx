// app/components/BlockReportModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { X, AlertCircle, Ban, Flag } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import blockReportService, {
  REPORT_REASONS,
  ReportReason,
} from '../../services/blockReportService';
import toastService from '../../services/toastService';
import { useTranslation } from 'react-i18next';

export interface BlockReportModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onBlockSuccess?: () => void;
  onReportSuccess?: () => void;
}

type ModalMode = 'main' | 'block' | 'report';

export const BlockReportModal: React.FC<BlockReportModalProps> = ({
  visible,
  onClose,
  userId,
  userName,
  onBlockSuccess,
  onReportSuccess,
}) => {
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [mode, setMode] = useState<ModalMode>('main');
  const [blockReason, setBlockReason] = useState('');
  const [selectedReportReason, setSelectedReportReason] =
    useState<ReportReason | null>(null);
  const [reportDescription, setReportDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setMode('main');
    setBlockReason('');
    setSelectedReportReason(null);
    setReportDescription('');
    onClose();
  };

  const handleBlock = async () => {
    setIsLoading(true);
    try {
      const result = await blockReportService.blockUser(userId, blockReason);

      if (result.success) {
        toastService.success(
          t('toasts.userBlockedTitle'),
          t('toasts.userBlockedBody', { name: userName })
        );
        onBlockSuccess?.();
        handleClose();
      } else {
        toastService.error('Error', result.message);
      }
    } catch (error) {
      toastService.error('Error', 'Failed to block user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReport = async () => {
    if (!selectedReportReason) {
      toastService.warning(
        'Select a Reason',
        'Please select a reason for reporting'
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await blockReportService.reportContent(
        userId,
        'user',
        selectedReportReason,
        reportDescription
      );

      if (result.success) {
        toastService.success(
          t('toasts.reportSubmittedTitle'),
          result.message || t('toasts.reportSubmittedBody')
        );
        onReportSuccess?.();
        handleClose();
      } else {
        toastService.error('Error', result.message);
      }
    } catch (error) {
      toastService.error('Error', 'Failed to submit report');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              {mode === 'main'
                ? 'User Actions'
                : mode === 'block'
                ? 'Block User'
                : 'Report User'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {mode === 'main' && (
              <>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Take action against {userName}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.error + '15' },
                  ]}
                  onPress={() => setMode('block')}
                >
                  <Ban size={24} color={theme.error} />
                  <View style={styles.actionContent}>
                    <Text style={[styles.actionTitle, { color: theme.error }]}>
                      Block User
                    </Text>
                    <Text
                      style={[
                        styles.actionDescription,
                        { color: theme.textSecondary },
                      ]}
                    >
                      They won't be able to see your profile or contact you
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.warning + '15' },
                  ]}
                  onPress={() => setMode('report')}
                >
                  <Flag size={24} color={theme.warning} />
                  <View style={styles.actionContent}>
                    <Text
                      style={[styles.actionTitle, { color: theme.warning }]}
                    >
                      Report User
                    </Text>
                    <Text
                      style={[
                        styles.actionDescription,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Report inappropriate behavior or content
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {mode === 'block' && (
              <>
                <View
                  style={[
                    styles.warningBox,
                    { backgroundColor: theme.error + '15' },
                  ]}
                >
                  <AlertCircle size={20} color={theme.error} />
                  <Text style={[styles.warningText, { color: theme.error }]}>
                    Blocking {userName} will:
                  </Text>
                </View>
                <View style={styles.bulletList}>
                  <Text
                    style={[styles.bulletItem, { color: theme.textSecondary }]}
                  >
                    • Remove them from your matches
                  </Text>
                  <Text
                    style={[styles.bulletItem, { color: theme.textSecondary }]}
                  >
                    • Delete all conversations with them
                  </Text>
                  <Text
                    style={[styles.bulletItem, { color: theme.textSecondary }]}
                  >
                    • Prevent them from seeing your profile
                  </Text>
                  <Text
                    style={[styles.bulletItem, { color: theme.textSecondary }]}
                  >
                    • Prevent them from contacting you
                  </Text>
                </View>

                <Text style={[styles.label, { color: theme.text }]}>
                  Reason (optional)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="Why are you blocking this user?"
                  placeholderTextColor={theme.textSecondary}
                  value={blockReason}
                  onChangeText={setBlockReason}
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: theme.border }]}
                    onPress={() => setMode('main')}
                    disabled={isLoading}
                  >
                    <Text
                      style={[styles.cancelButtonText, { color: theme.text }]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      { backgroundColor: theme.error },
                    ]}
                    onPress={handleBlock}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.confirmButtonText}>Block User</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {mode === 'report' && (
              <>
                <Text style={[styles.label, { color: theme.text }]}>
                  Select a reason *
                </Text>
                {REPORT_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.value}
                    style={[
                      styles.reasonButton,
                      {
                        backgroundColor:
                          selectedReportReason === reason.value
                            ? theme.primary + '20'
                            : theme.background,
                        borderColor:
                          selectedReportReason === reason.value
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                    onPress={() => setSelectedReportReason(reason.value)}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        {
                          borderColor:
                            selectedReportReason === reason.value
                              ? theme.primary
                              : theme.border,
                        },
                      ]}
                    >
                      {selectedReportReason === reason.value && (
                        <View
                          style={[
                            styles.radioInner,
                            { backgroundColor: theme.primary },
                          ]}
                        />
                      )}
                    </View>
                    <Text style={[styles.reasonText, { color: theme.text }]}>
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}

                <Text
                  style={[styles.label, { color: theme.text, marginTop: 16 }]}
                >
                  Additional details (optional)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="Provide more information about the issue..."
                  placeholderTextColor={theme.textSecondary}
                  value={reportDescription}
                  onChangeText={setReportDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
                <Text
                  style={[styles.charCount, { color: theme.textSecondary }]}
                >
                  {reportDescription.length}/500
                </Text>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: theme.border }]}
                    onPress={() => setMode('main')}
                    disabled={isLoading}
                  >
                    <Text
                      style={[styles.cancelButtonText, { color: theme.text }]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      { backgroundColor: theme.warning },
                      !selectedReportReason && styles.disabledButton,
                    ]}
                    onPress={handleReport}
                    disabled={isLoading || !selectedReportReason}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.confirmButtonText}>
                        Submit Report
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  bulletList: {
    marginBottom: 20,
  },
  bulletItem: {
    fontSize: 14,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reasonText: {
    fontSize: 14,
    flex: 1,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default BlockReportModal;
