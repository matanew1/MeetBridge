import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { X, Plus } from 'lucide-react-native';
import {
  PREDEFINED_INTERESTS,
  MAX_INTERESTS,
  MAX_CUSTOM_INTERESTS,
} from '../../constants/interests';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';

interface InterestTagPickerProps {
  selectedInterests: string[];
  onInterestsChange: (interests: string[]) => void;
  maxInterests?: number;
}

export default function InterestTagPicker({
  selectedInterests,
  onInterestsChange,
  maxInterests = MAX_INTERESTS,
}: InterestTagPickerProps) {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInterest, setCustomInterest] = useState('');

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      // Remove interest
      onInterestsChange(selectedInterests.filter((i) => i !== interest));
    } else {
      // Add interest if under limit
      if (selectedInterests.length >= maxInterests) {
        Alert.alert(
          'Maximum Reached',
          `You can select up to ${maxInterests} interests.`
        );
        return;
      }
      onInterestsChange([...selectedInterests, interest]);
    }
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (!trimmed) {
      Alert.alert('Invalid Input', 'Please enter an interest.');
      return;
    }

    if (selectedInterests.includes(trimmed)) {
      Alert.alert('Duplicate', 'This interest is already added.');
      return;
    }

    if (selectedInterests.length >= maxInterests) {
      Alert.alert(
        'Maximum Reached',
        `You can select up to ${maxInterests} interests.`
      );
      return;
    }

    // Count custom interests (those not in predefined list)
    const customCount = selectedInterests.filter(
      (interest) =>
        !PREDEFINED_INTERESTS.some(
          (predefined) => predefined.label === interest
        )
    ).length;

    if (customCount >= MAX_CUSTOM_INTERESTS) {
      Alert.alert(
        'Custom Limit Reached',
        `You can add up to ${MAX_CUSTOM_INTERESTS} custom interests.`
      );
      return;
    }

    onInterestsChange([...selectedInterests, trimmed]);
    setCustomInterest('');
    setShowCustomInput(false);
  };

  const removeInterest = (interest: string) => {
    onInterestsChange(selectedInterests.filter((i) => i !== interest));
  };

  const isPredefined = (interest: string) => {
    return PREDEFINED_INTERESTS.some(
      (predefined) => predefined.label === interest
    );
  };

  return (
    <View style={styles.container}>
      {/* Selected Interests */}
      {selectedInterests.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Selected ({selectedInterests.length}/{maxInterests})
          </Text>
          <View style={styles.tagsContainer}>
            {selectedInterests.map((interest) => {
              const predefined = PREDEFINED_INTERESTS.find(
                (p) => p.label === interest
              );
              return (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.selectedTag,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() => removeInterest(interest)}
                >
                  {predefined && (
                    <Text style={styles.tagEmoji}>{predefined.emoji}</Text>
                  )}
                  <Text style={styles.selectedTagText}>{interest}</Text>
                  <X size={14} color="#fff" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Predefined Interests */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Choose Interests
      </Text>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.tagsContainer}
        showsVerticalScrollIndicator={false}
      >
        {PREDEFINED_INTERESTS.map((interest) => {
          const isSelected = selectedInterests.includes(interest.label);
          return (
            <TouchableOpacity
              key={interest.id}
              style={[
                styles.tag,
                {
                  backgroundColor: isSelected
                    ? theme.primary
                    : theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => toggleInterest(interest.label)}
            >
              <Text style={styles.tagEmoji}>{interest.emoji}</Text>
              <Text
                style={[
                  styles.tagText,
                  {
                    color: isSelected ? '#fff' : theme.text,
                  },
                ]}
              >
                {interest.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Add Custom Interest Button */}
        <TouchableOpacity
          style={[
            styles.tag,
            styles.addCustomTag,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
          onPress={() => setShowCustomInput(true)}
        >
          <Plus size={16} color={theme.primary} />
          <Text style={[styles.tagText, { color: theme.primary }]}>
            Add Custom
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Interest Input Modal */}
      <Modal
        visible={showCustomInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Add Custom Interest
            </Text>
            <TextInput
              style={[
                styles.customInput,
                {
                  backgroundColor: theme.inputBackground,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Enter custom interest..."
              placeholderTextColor={theme.textSecondary}
              value={customInterest}
              onChangeText={setCustomInterest}
              maxLength={20}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { borderColor: theme.border },
                ]}
                onPress={() => {
                  setCustomInterest('');
                  setShowCustomInput(false);
                }}
              >
                <Text
                  style={[styles.buttonText, { color: theme.textSecondary }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.addButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={addCustomInterest}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectedContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  scrollView: {
    maxHeight: 300,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addCustomTag: {
    borderStyle: 'dashed',
  },
  tagEmoji: {
    fontSize: 16,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  addButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
