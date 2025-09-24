import React, { useEffect } from 'react';
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  currentDistance: number;
  onDistanceChange: (distance: number) => void;
}

const DISTANCE_OPTIONS = [10, 25, 50, 100, 200];

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  currentDistance,
  onDistanceChange,
}) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Animation values
  const overlayOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(height);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 300 });
      modalTranslateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      modalTranslateY.value = withTiming(height, { duration: 200 });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const handleDistanceSelect = (distance: number) => {
    onDistanceChange(distance);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.surface },
            modalStyle,
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MapPin size={24} color={theme.primary} />
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                מרחק חיפוש
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Distance Options */}
          <View style={styles.optionsContainer}>
            {DISTANCE_OPTIONS.map((distance) => (
              <TouchableOpacity
                key={distance}
                style={[
                  styles.optionItem,
                  {
                    backgroundColor:
                      currentDistance === distance
                        ? theme.primaryVariant
                        : theme.background,
                    borderColor:
                      currentDistance === distance
                        ? theme.primary
                        : theme.border,
                  },
                ]}
                onPress={() => handleDistanceSelect(distance)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color:
                          currentDistance === distance
                            ? theme.primary
                            : theme.text,
                        fontWeight: currentDistance === distance ? '600' : '400',
                      },
                    ]}
                  >
                    עד {distance} ק"מ
                  </Text>
                  {currentDistance === distance && (
                    <Check size={20} color={theme.primary} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Apply Button */}
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: theme.primary }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.applyButtonText}>החל</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

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
    marginBottom: 30,
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
  applyButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default FilterModal;