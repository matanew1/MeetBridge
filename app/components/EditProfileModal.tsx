import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import {
  X,
  Save,
  User as UserIcon,
  MapPin,
  FileText,
  Heart,
  Users,
  Target,
  Camera,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import { User } from '../../store/types';
import { LinearGradient } from 'expo-linear-gradient';
import LocationSelector from './LocationSelector';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (userData: Partial<User>) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    coordinates: user?.coordinates || undefined,
    age: user?.age?.toString() || '',
    gender: user?.gender || 'other',
    interests: user?.interests ? [...user.interests] : [],
    preferences: user?.preferences || {
      ageRange: [18, 35] as [number, number],
      maxDistance: 50,
      interestedIn: 'both' as 'male' | 'female' | 'both',
    },
  });

  const [newInterest, setNewInterest] = useState('');

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!formData.age || isNaN(Number(formData.age))) {
      Alert.alert('Error', 'Please enter a valid age');
      return;
    }

    const updatedData: Partial<User> = {
      name: formData.name.trim(),
      bio: formData.bio.trim(),
      location: formData.location.trim(),
      coordinates: formData.coordinates,
      age: Number(formData.age),
      gender: formData.gender as 'male' | 'female' | 'other',
      interests: formData.interests,
      preferences: formData.preferences,
    };

    onSave(updatedData);
    onClose();
  };

  const addInterest = () => {
    if (
      newInterest.trim() &&
      !formData.interests.includes(newInterest.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()],
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interest),
    }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <LinearGradient
          colors={[theme.primary, theme.primaryVariant]}
          style={styles.header}
        >
          <TouchableOpacity
            style={[
              styles.closeButton,
              { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
            ]}
            onPress={onClose}
          >
            <X size={24} color="white" />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: 'white' }]}>
            Edit Profile
          </Text>

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
            ]}
            onPress={handleSave}
          >
            <Save size={20} color="white" />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Picture Section */}
          <View style={styles.profileSection}>
            <TouchableOpacity style={styles.profileImageContainer}>
              <Image
                source={{
                  uri:
                    user?.image ||
                    'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=300',
                }}
                style={styles.profileImage}
              />
              <View
                style={[styles.cameraIcon, { backgroundColor: theme.primary }]}
              >
                <Camera size={16} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={[styles.changePhotoText, { color: theme.primary }]}>
              Change Photo
            </Text>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Basic Information
            </Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <UserIcon size={18} color={theme.primary} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Name
                </Text>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, name: text }))
                }
                placeholder="Enter your name"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Users size={18} color={theme.primary} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Age
                </Text>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={formData.age}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, age: text }))
                }
                placeholder="Enter your age"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Users size={18} color={theme.primary} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Gender
                </Text>
              </View>
              <View style={styles.genderContainer}>
                {(['male', 'female', 'other'] as const).map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderOption,
                      {
                        backgroundColor:
                          formData.gender === gender
                            ? theme.primary
                            : theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => setFormData((prev) => ({ ...prev, gender }))}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        {
                          color:
                            formData.gender === gender ? 'white' : theme.text,
                        },
                      ]}
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* About Me */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              About Me
            </Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <FileText size={18} color={theme.primary} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Bio
                </Text>
              </View>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={formData.bio}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, bio: text }))
                }
                placeholder="Tell others about yourself..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <MapPin size={18} color={theme.primary} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Location
                </Text>
              </View>

              {/* Location Selector Component */}
              <LocationSelector
                onLocationUpdate={(location, coordinates) => {
                  setFormData((prev) => ({
                    ...prev,
                    location,
                    coordinates: {
                      latitude: coordinates.latitude,
                      longitude: coordinates.longitude,
                      lastUpdated: new Date(),
                    },
                  }));
                }}
                showCurrentLocation={false}
                style={styles.locationSelector}
              />

              {/* Manual Location Input */}
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={formData.location}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, location: text }))
                }
                placeholder="Or enter your location manually"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          {/* Interests */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Interests
            </Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Heart size={18} color={theme.primary} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Add Interest
                </Text>
              </View>
              <View style={styles.addInterestContainer}>
                <TextInput
                  style={[
                    styles.addInterestInput,
                    {
                      backgroundColor: theme.surface,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  value={newInterest}
                  onChangeText={setNewInterest}
                  placeholder="Type an interest..."
                  placeholderTextColor={theme.textSecondary}
                  onSubmitEditing={addInterest}
                />
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: theme.primary }]}
                  onPress={addInterest}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {formData.interests.length > 0 && (
              <View style={styles.interestsContainer}>
                {formData.interests.map((interest, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.interestTag,
                      { backgroundColor: theme.primaryVariant },
                    ]}
                    onPress={() => removeInterest(interest)}
                  >
                    <Text
                      style={[styles.interestText, { color: theme.primary }]}
                    >
                      {interest} ✕
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Dating Preferences */}
          <View style={[styles.section, { paddingBottom: 40 }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Dating Preferences
            </Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Target size={18} color={theme.primary} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Looking For
                </Text>
              </View>
              <View style={styles.genderContainer}>
                {(['male', 'female', 'both'] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.genderOption,
                      {
                        backgroundColor:
                          formData.preferences.interestedIn === option
                            ? theme.primary
                            : theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          interestedIn: option,
                        },
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.genderText,
                        {
                          color:
                            formData.preferences.interestedIn === option
                              ? 'white'
                              : theme.text,
                        },
                      ]}
                    >
                      {option === 'both'
                        ? 'Everyone'
                        : option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  changePhotoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 100,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addInterestContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  addInterestInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  addButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  interestTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
  },
  locationSelector: {
    marginVertical: 8,
  },
});

export default EditProfileModal;
