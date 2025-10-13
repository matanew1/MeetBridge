import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import {
  X,
  User as UserIcon,
  Mail,
  MapPin,
  Heart,
  Settings,
  LogOut,
  Edit3,
  Users,
  Target,
  Clock,
  CheckCircle,
  Activity,
  Star,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import { User } from '../../store/types';
import { LinearGradient } from 'expo-linear-gradient';
import EditProfileModal from './EditProfileModal';
import { PREDEFINED_INTERESTS } from '../../constants/interests';
import ZodiacBadge from './ZodiacBadge';
import { calculateAge } from '../../utils/dateUtils';
import { useUserStore } from '../../store/userStore';
import OnboardingTutorial from './OnboardingTutorial';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  onClose,
}) => {
  const { isDarkMode } = useTheme();
  const { user, logout, updateProfile, refreshUserProfile } = useAuth();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
      onClose();
      // Navigate immediately to login screen
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Could add a toast notification here instead of Alert
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const handleSaveProfile = async (updatedData: Partial<User>) => {
    try {
      // If updateProfile exists in AuthContext, use it
      if (updateProfile) {
        await updateProfile(updatedData);
        // Refresh the user profile from Firebase to ensure we have the latest data
        if (refreshUserProfile) {
          await refreshUserProfile();
        }

        // Sync search filters with user preferences
        if (updatedData.preferences) {
          const { updateSearchFilters } = useUserStore.getState();
          const filterUpdates: any = {};

          if (updatedData.preferences.interestedIn !== undefined) {
            filterUpdates.gender = updatedData.preferences.interestedIn;
          }
          if (updatedData.preferences.ageRange !== undefined) {
            filterUpdates.ageRange = updatedData.preferences.ageRange;
          }
          if (updatedData.preferences.maxDistance !== undefined) {
            filterUpdates.maxDistance = updatedData.preferences.maxDistance;
          }

          if (Object.keys(filterUpdates).length > 0) {
            updateSearchFilters(filterUpdates);
            console.log(
              '✅ Search filters synced with preferences:',
              filterUpdates
            );
          }
        }

        console.log('✅ Profile updated and refreshed from Firebase');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleSettings = () => {
    // TODO: Navigate to settings screen
    console.log('Settings functionality coming soon!');
  };

  if (!user) return null;

  const getAgeDisplay = (birthDate?: Date | string) => {
    const age = calculateAge(birthDate);
    if (age === null) return 'Age not set';
    return `${age} years old`;
  };

  const getPreferencesDisplay = (preferences?: User['preferences']) => {
    if (!preferences) {
      return {
        ageRange: 'Not set',
        distance: 'Not set',
        interestedIn: 'Not set',
      };
    }

    const { ageRange, maxDistance, interestedIn } = preferences;

    // Format distance (stored in meters)
    let distanceDisplay: string;
    if (maxDistance >= 1000) {
      distanceDisplay = `${(maxDistance / 1000).toFixed(1)} km`;
    } else {
      distanceDisplay = `${maxDistance} m`;
    }

    return {
      ageRange: `${ageRange[0]}-${ageRange[1]} years`,
      distance: distanceDisplay,
      interestedIn: getGenderDisplay(interestedIn),
    };
  };

  const getLastSeenDisplay = (lastSeen?: Date | string, isOnline?: boolean) => {
    if (isOnline) return 'Active now';
    if (!lastSeen) return 'Last seen recently';

    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - lastSeenDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 60) {
      return `Active ${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `Active ${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `Active ${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const getGenderDisplay = (gender?: string) => {
    if (!gender) return 'Not specified';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  const calculateProfileCompletion = (user: User) => {
    let completionScore = 0;
    const totalFields = 8;

    // Basic required fields
    if (user.name) completionScore++;
    if (user.age) completionScore++;
    if (user.image) completionScore++;
    if (user.gender) completionScore++;

    // Optional but important fields
    if (user.bio) completionScore++;
    if (user.location) completionScore++;
    if (user.interests && user.interests.length > 0) completionScore++;
    if (user.preferences) completionScore++;

    return Math.round((completionScore / totalFields) * 100);
  };

  // Guard clause for null user
  if (!user) {
    return null;
  }

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
          colors={['#8B5CF6', '#A855F7', '#C084FC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
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
            My Profile
          </Text>

          <TouchableOpacity
            style={[
              styles.editButton,
              { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
            ]}
            onPress={handleEditProfile}
          >
            <Edit3 size={20} color="white" />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView
          style={[styles.content, { backgroundColor: theme.background }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Picture Section */}
          <View
            style={[
              styles.profileSection,
              { backgroundColor: theme.background },
            ]}
          >
            <Image
              source={
                user.image
                  ? { uri: user.image }
                  : require('../../assets/images/placeholder.png')
              }
              style={styles.profileImage}
            />

            <Text style={[styles.userName, { color: theme.text }]}>
              {user.name || 'Unknown User'}
            </Text>

            <View style={styles.statusContainer}>
              <View style={styles.statusItem}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: user.isOnline
                        ? '#4CAF50'
                        : theme.textSecondary,
                    },
                  ]}
                />
                <Text
                  style={[styles.statusText, { color: theme.textSecondary }]}
                >
                  {getLastSeenDisplay(user.lastSeen, user.isOnline)}
                </Text>
              </View>
            </View>

            <Text style={[styles.userAge, { color: theme.textSecondary }]}>
              {typeof user.age === 'number'
                ? `${user.age} years old`
                : getAgeDisplay(user.createdAt)}
            </Text>

            {user.zodiacSign && (
              <View style={styles.zodiacContainer}>
                <ZodiacBadge
                  zodiacSign={user.zodiacSign}
                  size="medium"
                  showLabel={true}
                />
              </View>
            )}
          </View>

          {/* User Info Cards */}
          <View style={styles.infoSection}>
            {/* Bio Card */}
            {user.bio && (
              <View
                style={[styles.infoCard, { backgroundColor: theme.surface }]}
              >
                <View style={styles.cardHeader}>
                  <UserIcon size={20} color={theme.primary} />
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    Bio
                  </Text>
                </View>
                <Text
                  style={[styles.cardContent, { color: theme.textSecondary }]}
                >
                  {user.bio}
                </Text>
              </View>
            )}

            {/* Location Card */}
            {user.coordinates && (
              <View
                style={[styles.infoCard, { backgroundColor: theme.surface }]}
              >
                <View style={styles.cardHeader}>
                  <MapPin size={20} color={theme.primary} />
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    Location
                  </Text>
                </View>
                {user.coordinates && (
                  <Text
                    style={[
                      styles.coordinatesText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    📍 {user.coordinates.latitude.toFixed(6)},{' '}
                    {user.coordinates.longitude.toFixed(6)}
                  </Text>
                )}
              </View>
            )}

            {/* Interests Card */}
            {user.interests && user.interests.length > 0 && (
              <View
                style={[styles.infoCard, { backgroundColor: theme.surface }]}
              >
                <View style={styles.cardHeader}>
                  <Heart size={20} color={theme.primary} />
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    Interests
                  </Text>
                </View>
                <View style={styles.interestsContainer}>
                  {user.interests.map((interest, index) => {
                    const predefined = PREDEFINED_INTERESTS.find(
                      (p) => p.label === interest
                    );
                    return (
                      <View
                        key={index}
                        style={[
                          styles.interestTag,
                          { backgroundColor: theme.primaryVariant },
                        ]}
                      >
                        <Text
                          style={[
                            styles.interestText,
                            { color: theme.primary },
                          ]}
                        >
                          {predefined ? `${predefined.emoji} ` : ''}
                          {interest}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Gender Card */}
            <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
              <View style={styles.cardHeader}>
                <Users size={20} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Gender
                </Text>
              </View>
              <Text
                style={[styles.cardContent, { color: theme.textSecondary }]}
              >
                {getGenderDisplay(user.gender)}
              </Text>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
              <View style={styles.cardHeader}>
                <Users size={20} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Height
                </Text>
              </View>
              <Text
                style={[styles.cardContent, { color: theme.textSecondary }]}
              >
                {user.height ? `${user.height} cm` : 'Not set'}
              </Text>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
              <View style={styles.cardHeader}>
                <Users size={20} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Date of Birth
                </Text>
              </View>
              <Text
                style={[styles.cardContent, { color: theme.textSecondary }]}
              >
                {user.dateOfBirth
                  ? new Date(user.dateOfBirth).toLocaleDateString('en-GB')
                  : 'Not set'}
              </Text>
            </View>

            {/* Zodiac Sign Card */}
            {user.zodiacSign && (
              <View
                style={[styles.infoCard, { backgroundColor: theme.surface }]}
              >
                <View style={styles.cardHeader}>
                  <Star size={20} color={theme.primary} />
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    Zodiac Sign
                  </Text>
                </View>
                <View style={styles.zodiacCardContent}>
                  <ZodiacBadge
                    zodiacSign={user.zodiacSign}
                    size="large"
                    showLabel={true}
                  />
                </View>
              </View>
            )}

            {/* Dating Preferences Card */}
            {user.preferences && (
              <View
                style={[styles.infoCard, { backgroundColor: theme.surface }]}
              >
                <View style={styles.cardHeader}>
                  <Target size={20} color={theme.primary} />
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    Dating Preferences
                  </Text>
                </View>
                <View style={styles.preferencesContainer}>
                  <View style={styles.preferenceItem}>
                    <Text
                      style={[
                        styles.preferenceLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Age Range:
                    </Text>
                    <Text
                      style={[styles.preferenceValue, { color: theme.text }]}
                    >
                      {getPreferencesDisplay(user.preferences).ageRange}
                    </Text>
                  </View>
                  <View style={styles.preferenceItem}>
                    <Text
                      style={[
                        styles.preferenceLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Max Distance:
                    </Text>
                    <Text
                      style={[styles.preferenceValue, { color: theme.text }]}
                    >
                      {getPreferencesDisplay(user.preferences).distance}
                    </Text>
                  </View>
                  <View style={styles.preferenceItem}>
                    <Text
                      style={[
                        styles.preferenceLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Looking for:
                    </Text>
                    <Text
                      style={[styles.preferenceValue, { color: theme.text }]}
                    >
                      {getPreferencesDisplay(user.preferences).interestedIn}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Profile Completion Card */}
            <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
              <View style={styles.cardHeader}>
                <CheckCircle size={20} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Profile Completion
                </Text>
              </View>
              <View style={styles.completionContainer}>
                <View style={styles.completionBar}>
                  <View
                    style={[
                      styles.completionFill,
                      {
                        backgroundColor: theme.primary,
                        width: `${calculateProfileCompletion(user)}%`,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.completionText,
                    { color: theme.textSecondary },
                  ]}
                >
                  {calculateProfileCompletion(user)}% Complete
                </Text>
              </View>
              <Text
                style={[styles.completionHint, { color: theme.textSecondary }]}
              >
                Complete your profile to get better matches!
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.surface }]}
              onPress={() => setShowTutorial(true)}
            >
              <Sparkles size={20} color={theme.primary} />
              <Text style={[styles.actionText, { color: theme.text }]}>
                View Tutorial
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.surface }]}
              onPress={handleSettings}
            >
              <Settings size={20} color={theme.primary} />
              <Text style={[styles.actionText, { color: theme.text }]}>
                Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.logoutButton,
                { backgroundColor: '#FF6B6B' },
              ]}
              onPress={handleLogout}
            >
              <LogOut size={20} color="white" />
              <Text style={[styles.actionText, { color: 'white' }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Custom Logout Confirmation Popup */}
      <Modal
        visible={showLogoutConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <View style={styles.popupOverlay}>
          <View
            style={[styles.popupContainer, { backgroundColor: theme.surface }]}
          >
            <View style={styles.popupHeader}>
              <LogOut size={24} color={theme.error || '#FF6B6B'} />
              <Text style={[styles.popupTitle, { color: theme.text }]}>
                Logout
              </Text>
            </View>

            <Text style={[styles.popupMessage, { color: theme.textSecondary }]}>
              Are you sure you want to logout? You'll need to sign in again to
              access your account.
            </Text>

            <View style={styles.popupButtons}>
              <TouchableOpacity
                style={[
                  styles.popupButton,
                  styles.cancelButton,
                  { backgroundColor: theme.background },
                ]}
                onPress={cancelLogout}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.popupButton, styles.confirmButton]}
                onPress={confirmLogout}
              >
                <Text style={styles.confirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onSave={handleSaveProfile}
      />

      {/* Onboarding Tutorial */}
      <OnboardingTutorial
        visible={showTutorial}
        onComplete={async () => {
          setShowTutorial(false);
          // Update tutorial status if needed
          if (user && !user.hasSeenTutorial) {
            await updateProfile({ hasSeenTutorial: true });
          }
        }}
      />
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
  editButton: {
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
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusContainer: {
    marginBottom: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  userAge: {
    fontSize: 16,
  },
  zodiacContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  zodiacCardContent: {
    alignItems: 'flex-start',
  },
  infoSection: {
    marginBottom: 30,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  cardContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  coordinatesText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 4,
    opacity: 0.8,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  preferencesContainer: {
    gap: 8,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preferenceLabel: {
    fontSize: 15,
  },
  preferenceValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  completionContainer: {
    gap: 8,
  },
  completionBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    borderRadius: 4,
  },
  completionText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  completionHint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  actionsSection: {
    gap: 12,
    paddingBottom: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 8,
  },
  // Popup styles
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  popupMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  popupButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  popupButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Profile Overview Card styles
  profileOverviewCard: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileSummary: {
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userBasicInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  completionBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completionBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  bioPreview: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  quickStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '500',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  secondaryActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileModal;
