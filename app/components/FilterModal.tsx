import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { X, MapPin, User } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';

const { height } = Dimensions.get('window');

type TabType = 'distance' | 'age';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  currentDistance: number;
  onDistanceChange: (distance: number) => void;
  currentAgeRange: [number, number];
  onAgeRangeChange: (ageRange: [number, number]) => void;
}

const FilterModal: React.FC<FilterModalProps> = React.memo(
  ({
    visible,
    onClose,
    currentDistance,
    onDistanceChange,
    currentAgeRange,
    onAgeRangeChange,
  }) => {
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();
    const theme = isDarkMode ? darkTheme : lightTheme;

    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>('distance');

    // Local state for temporary values (before apply)
    const [tempDistance, setTempDistance] = useState(currentDistance);
    const [tempMinAge, setTempMinAge] = useState(currentAgeRange[0]);
    const [tempMaxAge, setTempMaxAge] = useState(currentAgeRange[1]);

    // Update local state when props change or modal opens
    React.useEffect(() => {
      if (visible) {
        setTempDistance(currentDistance);
        setTempMinAge(currentAgeRange[0]);
        setTempMaxAge(currentAgeRange[1]);
      }
    }, [visible, currentDistance, currentAgeRange]);

    const handleApply = async () => {
      // Apply changes sequentially to avoid race condition
      // Only call if value actually changed
      const distanceChanged = tempDistance !== currentDistance;
      const ageChanged =
        tempMinAge !== currentAgeRange[0] || tempMaxAge !== currentAgeRange[1];

      if (distanceChanged) {
        await onDistanceChange(tempDistance);
      }

      if (ageChanged) {
        await onAgeRangeChange([tempMinAge, tempMaxAge]);
      }

      onClose();
    };

    const handleMinAgeChange = (value: number) => {
      const newMinAge = Math.round(value);
      // Ensure min is not greater than max
      if (newMinAge <= tempMaxAge) {
        setTempMinAge(newMinAge);
      }
    };

    const handleMaxAgeChange = (value: number) => {
      const newMaxAge = Math.round(value);
      // Ensure max is not less than min
      if (newMaxAge >= tempMinAge) {
        setTempMaxAge(newMaxAge);
      }
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
        presentationStyle="overFullScreen"
        onRequestClose={onClose}
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
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {t('filter.title')}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'distance' && {
                    borderBottomColor: theme.primary,
                  },
                ]}
                onPress={() => setActiveTab('distance')}
              >
                <MapPin
                  size={20}
                  color={
                    activeTab === 'distance'
                      ? theme.primary
                      : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        activeTab === 'distance'
                          ? theme.primary
                          : theme.textSecondary,
                    },
                  ]}
                >
                  Distance
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'age' && {
                    borderBottomColor: theme.primary,
                  },
                ]}
                onPress={() => setActiveTab('age')}
              >
                <User
                  size={20}
                  color={
                    activeTab === 'age' ? theme.primary : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        activeTab === 'age'
                          ? theme.primary
                          : theme.textSecondary,
                    },
                  ]}
                >
                  Age Range
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <ScrollView
              style={styles.scrollViewStyle}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {activeTab === 'distance' ? (
                // Distance Slider
                <View style={styles.tabContent}>
                  <View style={styles.sliderSection}>
                    <View style={styles.valueDisplay}>
                      <Text
                        style={[
                          styles.valueLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Maximum Distance
                      </Text>
                      <Text
                        style={[styles.valueText, { color: theme.primary }]}
                      >
                        {tempDistance >= 1000
                          ? `${(tempDistance / 1000).toFixed(1)} km`
                          : `${tempDistance} m`}
                      </Text>
                    </View>
                    <Slider
                      style={styles.slider}
                      minimumValue={5}
                      maximumValue={5000}
                      step={5}
                      value={tempDistance}
                      onValueChange={setTempDistance}
                      minimumTrackTintColor={theme.primary}
                      maximumTrackTintColor={theme.border}
                      thumbTintColor={theme.primary}
                    />
                    <View style={styles.rangeLabels}>
                      <Text
                        style={[
                          styles.rangeLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        5m
                      </Text>
                      <Text
                        style={[
                          styles.rangeLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        5km
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                // Age Range Sliders
                <View style={styles.tabContent}>
                  <View style={styles.sliderSection}>
                    <View style={styles.valueDisplay}>
                      <Text
                        style={[
                          styles.valueLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Minimum Age
                      </Text>
                      <Text
                        style={[styles.valueText, { color: theme.primary }]}
                      >
                        {tempMinAge}
                      </Text>
                    </View>
                    <Slider
                      style={styles.slider}
                      minimumValue={18}
                      maximumValue={99}
                      step={1}
                      value={tempMinAge}
                      onValueChange={handleMinAgeChange}
                      minimumTrackTintColor={theme.primary}
                      maximumTrackTintColor={theme.border}
                      thumbTintColor={theme.primary}
                    />
                    <View style={styles.rangeLabels}>
                      <Text
                        style={[
                          styles.rangeLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        18
                      </Text>
                      <Text
                        style={[
                          styles.rangeLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        99
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.sliderSection, { marginTop: 24 }]}>
                    <View style={styles.valueDisplay}>
                      <Text
                        style={[
                          styles.valueLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Maximum Age
                      </Text>
                      <Text
                        style={[styles.valueText, { color: theme.primary }]}
                      >
                        {tempMaxAge}
                      </Text>
                    </View>
                    <Slider
                      style={styles.slider}
                      minimumValue={18}
                      maximumValue={99}
                      step={1}
                      value={tempMaxAge}
                      onValueChange={handleMaxAgeChange}
                      minimumTrackTintColor={theme.primary}
                      maximumTrackTintColor={theme.border}
                      thumbTintColor={theme.primary}
                    />
                    <View style={styles.rangeLabels}>
                      <Text
                        style={[
                          styles.rangeLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        18
                      </Text>
                      <Text
                        style={[
                          styles.rangeLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        99
                      </Text>
                    </View>
                  </View>

                  <View style={styles.ageRangeSummary}>
                    <Text style={[styles.summaryText, { color: theme.text }]}>
                      Showing profiles aged {tempMinAge} - {tempMaxAge}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Apply Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: theme.primary }]}
                onPress={handleApply}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
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
    zIndex: 9999,
    elevation: 10,
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 20,
    minHeight: 550,
    maxHeight: height * 0.85,
    zIndex: 10000,
    elevation: 11,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  scrollViewStyle: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  tabContent: {
    paddingVertical: 8,
    paddingBottom: 20,
    minHeight: 250,
  },
  sliderSection: {
    marginBottom: 20,
    paddingVertical: 8,
  },
  valueDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  valueLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  valueText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rangeLabel: {
    fontSize: 12,
  },
  ageRangeSummary: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 105, 180, 0.1)',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FilterModal;
