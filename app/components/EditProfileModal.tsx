import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  Ruler,
  Plus,
  Trash2,
  Image as ImageIcon,
  Calendar,
  Star,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import { User } from '../../store/types';
import { LinearGradient } from 'expo-linear-gradient';
import AvatarUpload from './AvatarUpload';
import InterestTagPicker from './InterestTagPicker';
import ZodiacBadge from './ZodiacBadge';
import { calculateAge, calculateZodiacSign } from '../../utils/dateUtils';

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
  const { user, refreshUserProfile } = useAuth();
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Initialize date of birth from user data or default to 18 years ago
  const getInitialDate = () => {
    if (user?.dateOfBirth) {
      const date = new Date(user.dateOfBirth);
      // Validate the date is valid
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    // Default to 18 years ago
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date;
  };

  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    coordinates: user?.coordinates || undefined,
    dateOfBirth: getInitialDate(),
    height: user?.height !== undefined && user?.height > 0 ? user.height : 170, // Preserve existing height if valid, default to 170cm
    gender: user?.gender || 'other',
    image: user?.image || '',
    images: user?.images ? [...user.images] : [],
    interests: user?.interests ? [...user.interests] : [],
    preferences: user?.preferences || {
      ageRange: [18, 99] as [number, number],
      maxDistance: 500, // meters (500 = 0.5km)
      interestedIn: 'female' as 'male' | 'female', // Removed 'both' option
    },
  });

  const [newInterest, setNewInterest] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load fresh data from Firebase whenever modal opens
  useEffect(() => {
    const loadUserData = async () => {
      if (visible) {
        setIsLoading(true);
        try {
          // Refresh user data from Firebase
          await refreshUserProfile();
        } catch (error) {
          console.error('Error loading user profile:', error);
          Alert.alert(
            'Error',
            'Failed to load profile data. Please try again.'
          );
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadUserData();
  }, [visible]);

  // Update form data whenever user data changes
  useEffect(() => {
    if (user) {
      const getInitialDate = () => {
        if (user?.dateOfBirth) {
          const date = new Date(user.dateOfBirth);
          // Validate the date is valid
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
        // Default to 18 years ago
        const date = new Date();
        date.setFullYear(date.getFullYear() - 18);
        return date;
      };
      console.log('USER: ', user);

      setFormData({
        name: user?.name || '',
        bio: user?.bio || '',
        location: user?.location || '',
        coordinates: user?.coordinates || undefined,
        dateOfBirth: getInitialDate(),
        height:
          user?.height !== undefined && user?.height > 0 ? user.height : 170, // Preserve existing height if valid
        gender: user?.gender || 'other',
        image: user?.image || '',
        images: user?.images ? [...user.images] : [],
        interests: user?.interests ? [...user.interests] : [],
        preferences: {
          ageRange: (user?.preferences?.ageRange || [18, 99]) as [
            number,
            number
          ],
          maxDistance: user?.preferences?.maxDistance || 500,
          interestedIn: (user?.preferences?.interestedIn || 'female') as
            | 'male'
            | 'female', // Removed 'both' option
        },
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      if (!formData.name.trim()) {
        Alert.alert('Error', 'Name is required');
        return;
      }

      if (!formData.dateOfBirth) {
        Alert.alert('Error', 'Date of birth is required');
        return;
      }

      // Ensure dateOfBirth is a valid Date object
      const dobDate =
        formData.dateOfBirth instanceof Date
          ? formData.dateOfBirth
          : new Date(formData.dateOfBirth);

      // Validate the date is valid
      if (isNaN(dobDate.getTime())) {
        Alert.alert(
          'Error',
          'Invalid date of birth. Please select a valid date.'
        );
        return;
      }

      // Check if user is at least 18 years old
      const age = calculateAge(dobDate);
      if (age === null || age < 18) {
        Alert.alert('Error', 'You must be at least 18 years old');
        return;
      }

      // Calculate zodiac sign
      const zodiacSign = calculateZodiacSign(dobDate);

      const updatedData: Partial<User> = {
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        location: formData.location.trim(),
        coordinates: formData.coordinates,
        dateOfBirth: dobDate.toISOString(),
        age: age,
        zodiacSign: zodiacSign || undefined,
        height: formData.height,
        gender: formData.gender as 'male' | 'female' | 'other',
        image: formData.image,
        images: formData.images,
        interests: formData.interests,
        preferences: formData.preferences,
      };

      await onSave(updatedData);
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setFormData((prev) => ({ ...prev, dateOfBirth: selectedDate }));
    }
  };

  const formatDate = (date: Date): string => {
    if (!date || isNaN(date.getTime())) {
      return 'Select date';
    }
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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

  const handleImageSelected = (imageUri: string) => {
    setFormData((prev) => ({ ...prev, image: imageUri }));
  };

  const pickAdditionalImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to upload photos.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, imageUri],
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
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
          {user?.isProfileComplete && (
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              ]}
              onPress={onClose}
            >
              <X size={24} color="white" />
            </TouchableOpacity>
          )}
          <Text style={[styles.headerTitle, { color: 'white' }]}>
            Edit Profile
          </Text>

          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                opacity: isSaving ? 0.5 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Save size={20} color="white" />
            )}
          </TouchableOpacity>
        </LinearGradient>

        {/* Loading Indicator */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading profile data...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Picture Section */}
            <View style={styles.profileSection}>
              <AvatarUpload
                currentImage={formData.image}
                onImageSelected={handleImageSelected}
                size={120}
                showUploadButton={true}
              />
            </View>

            {/* Additional Photos Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ImageIcon size={20} color={theme.primary} />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.text, marginBottom: 0, marginLeft: 8 },
                  ]}
                >
                  Additional Photos
                </Text>
              </View>
              <Text
                style={[styles.sectionSubtitle, { color: theme.textSecondary }]}
              >
                Add up to 5 more photos to your profile
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.photosScrollView}
                contentContainerStyle={styles.photosContainer}
              >
                {formData.images.map((imageUri, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.photoImage}
                    />
                    <TouchableOpacity
                      style={[
                        styles.removePhotoButton,
                        { backgroundColor: theme.error || '#FF3B30' },
                      ]}
                      onPress={() => removeImage(index)}
                    >
                      <Trash2 size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}

                {formData.images.length < 5 && (
                  <TouchableOpacity
                    style={[
                      styles.addPhotoButton,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={pickAdditionalImage}
                  >
                    <Plus size={32} color={theme.primary} />
                    <Text
                      style={[
                        styles.addPhotoText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Add Photo
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
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
                  <Calendar size={18} color={theme.primary} />
                  <Text style={[styles.inputLabel, { color: theme.text }]}>
                    Date of Birth
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.dateText, { color: theme.text }]}>
                    {formatDate(formData.dateOfBirth)}
                  </Text>
                  <Calendar size={20} color={theme.primary} />
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={formData.dateOfBirth}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()} // Can't select future dates
                    minimumDate={new Date(1924, 0, 1)} // Min date: 100 years ago
                    textColor={theme.text}
                    themeVariant={isDarkMode ? 'dark' : 'light'}
                  />
                )}

                {Platform.OS === 'ios' && showDatePicker && (
                  <TouchableOpacity
                    style={[
                      styles.datePickerDoneButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}

                {formData.dateOfBirth &&
                  calculateAge(formData.dateOfBirth) !== null && (
                    <Text
                      style={[
                        styles.helperText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Age: {calculateAge(formData.dateOfBirth)} years old
                    </Text>
                  )}
              </View>

              {formData.dateOfBirth &&
                calculateZodiacSign(formData.dateOfBirth) && (
                  <View style={styles.inputContainer}>
                    <View style={styles.inputHeader}>
                      <Star size={18} color={theme.primary} />
                      <Text style={[styles.inputLabel, { color: theme.text }]}>
                        Zodiac Sign
                      </Text>
                    </View>
                    <View style={styles.zodiacContainer}>
                      <ZodiacBadge
                        zodiacSign={calculateZodiacSign(formData.dateOfBirth)}
                        size="large"
                        showLabel={true}
                      />
                    </View>
                  </View>
                )}

              <View style={styles.inputContainer}>
                <View style={styles.inputHeader}>
                  <Ruler size={18} color={theme.primary} />
                  <Text style={[styles.inputLabel, { color: theme.text }]}>
                    Height: {formData.height} cm
                  </Text>
                </View>
                <View style={styles.sliderContainer}>
                  <Text
                    style={[styles.sliderLabel, { color: theme.textSecondary }]}
                  >
                    140 cm
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={140}
                    maximumValue={220}
                    step={1}
                    value={formData.height}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, height: value }))
                    }
                    minimumTrackTintColor={theme.primary}
                    maximumTrackTintColor={theme.border}
                    thumbTintColor={theme.primary}
                  />
                  <Text
                    style={[styles.sliderLabel, { color: theme.textSecondary }]}
                  >
                    220 cm
                  </Text>
                </View>
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
                      onPress={() =>
                        setFormData((prev) => ({ ...prev, gender }))
                      }
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

                {/* Location is automatically tracked in the background */}
                <View
                  style={[
                    styles.locationInfo,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.locationInfoText, { color: theme.text }]}
                  >
                    {user?.location || 'Location updating automatically...'}
                  </Text>
                  <Text
                    style={[
                      styles.locationInfoSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Your location is automatically updated in the background to
                    show you the best nearby matches.
                  </Text>
                </View>
              </View>
            </View>

            {/* Interests */}
            <View style={styles.section}>
              <InterestTagPicker
                selectedInterests={formData.interests}
                onInterestsChange={(interests) =>
                  setFormData((prev) => ({ ...prev, interests }))
                }
              />
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
                  {(['male', 'female'] as const).map((option) => (
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
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
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
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '500',
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
  locationInfo: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  locationInfoText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  locationInfoSubtext: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  photosScrollView: {
    marginTop: 8,
  },
  photosContainer: {
    gap: 12,
    paddingRight: 20,
  },
  photoItem: {
    position: 'relative',
    width: 120,
    height: 150,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    width: 120,
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  helperText: {
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  zodiacContainer: {
    marginTop: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  datePickerDoneButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  datePickerDoneText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileModal;
