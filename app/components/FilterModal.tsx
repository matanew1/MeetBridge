import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { X, MapPin, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  currentDistance: number;
  onDistanceChange: (distance: number) => void;
}

const DISTANCE_OPTIONS = [
  { value: 50, label: '50m' },
  { value: 100, label: '100m' },
  { value: 200, label: '200m' },
  { value: 500, label: '500m' },
  { value: 1000, label: '1km' },
  { value: 2000, label: '2km' },
  { value: 5000, label: '5km' },
];

const FilterModal: React.FC<FilterModalProps> = React.memo(
  ({ visible, onClose, currentDistance, onDistanceChange }) => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const theme = isDarkMode ? darkTheme : lightTheme;

    const handleDistanceSelect = (distance: number) => {
      onDistanceChange(distance);
      onClose();
    };

    if (!visible) {
      return null;
    }

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={onClose}
          />
          <View
            style={[styles.modalContainer, { backgroundColor: theme.surface }]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <MapPin size={24} color={theme.primary} />
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                  {t('filter.title')}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Distance Options */}
            <View style={styles.optionsContainer}>
              {DISTANCE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor:
                        currentDistance === option.value
                          ? theme.primaryVariant
                          : theme.background,
                      borderColor:
                        currentDistance === option.value
                          ? theme.primary
                          : theme.border,
                    },
                  ]}
                  onPress={() => handleDistanceSelect(option.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color:
                            currentDistance === option.value
                              ? theme.primary
                              : theme.text,
                          fontWeight:
                            currentDistance === option.value ? '600' : '400',
                        },
                      ]}
                    >
                      Up to {option.label}
                    </Text>
                    {currentDistance === option.value && (
                      <Check size={20} color={theme.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: height * 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionItem: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
  },
});

export default FilterModal;
