import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import { EditProfileModal } from '../components/EditProfileModal';
import OnboardingTutorial from '../components/OnboardingTutorial';
import { User } from '../../store/types';
import { CheckCircle, Sparkles } from 'lucide-react-native';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
} from '../../utils/responsive';

export default function CompleteProfileScreen() {
  const { user, updateProfile } = useAuth();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [showEditModal, setShowEditModal] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);

  const handleProfileSave = async (userData: Partial<User>) => {
    try {
      // Mark profile as complete
      const updatedData = {
        ...userData,
        isProfileComplete: true,
      };

      const result = await updateProfile(updatedData);

      if (result.success) {
        setIsProfileCompleted(true);
        setShowEditModal(false);
        // Show tutorial after profile completion
        setShowTutorial(true);
      } else {
        Alert.alert('Error', result.message || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleTutorialComplete = async () => {
    try {
      // Mark tutorial as seen
      await updateProfile({ hasSeenTutorial: true });
      setShowTutorial(false);
      // Navigate to main app
      router.replace('/(tabs)/search');
    } catch (error) {
      console.error('Error updating tutorial status:', error);
      // Navigate anyway
      router.replace('/(tabs)/search');
    }
  };

  const handleCloseModal = () => {
    Alert.alert(
      'Profile Required',
      'Please complete your profile to continue using MeetBridge. This helps other users get to know you better!',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={[styles.gradient, { backgroundColor: theme.primary }]}>
        <View style={styles.content}>
          <Sparkles size={scale(80)} color="#fff" style={styles.icon} />
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.description}>
            Let's set up your profile so you can start meeting amazing people!
          </Text>

          {isProfileCompleted && (
            <View style={styles.successContainer}>
              <CheckCircle size={scale(40)} color="#4ade80" />
              <Text style={styles.successText}>Profile Completed!</Text>
              <Text style={styles.successSubtext}>Get ready to explore...</Text>
            </View>
          )}
        </View>
      </View>

      {/* Profile Completion Modal - Cannot be dismissed until complete */}
      <EditProfileModal
        visible={showEditModal}
        onClose={handleCloseModal}
        onSave={handleProfileSave}
      />

      {/* Onboarding Tutorial */}
      <OnboardingTutorial
        visible={showTutorial}
        onComplete={handleTutorialComplete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    alignItems: 'center',
    maxWidth: scale(400),
  },
  icon: {
    marginBottom: verticalScale(30),
  },
  title: {
    fontSize: moderateScale(32),
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: verticalScale(16),
  },
  description: {
    fontSize: moderateScale(16),
    color: '#fff',
    textAlign: 'center',
    lineHeight: moderateScale(24),
    opacity: 0.95,
  },
  successContainer: {
    marginTop: verticalScale(40),
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
  },
  successText: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    color: '#fff',
    marginTop: verticalScale(12),
  },
  successSubtext: {
    fontSize: moderateScale(14),
    color: '#fff',
    opacity: 0.9,
    marginTop: verticalScale(4),
  },
});
