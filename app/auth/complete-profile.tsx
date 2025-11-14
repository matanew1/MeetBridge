import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import { EditProfileModal } from '../components/EditProfileModal';
import OnboardingTutorial from '../components/OnboardingTutorial';
import { User } from '../../store/types';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, Sparkles } from 'lucide-react-native';
import toastService from '../../services/toastService';
import { useTranslation } from 'react-i18next';

export default function CompleteProfileScreen() {
  const { user, updateProfile } = useAuth();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { t } = useTranslation();
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

      // Handle undefined result
      if (!result) {
        toastService.error('Error', t('auth.profileSaveError'));
        return;
      }

      if (result.success) {
        setIsProfileCompleted(true);
        setShowEditModal(false);
        // Show tutorial after profile completion
        setShowTutorial(true);
      } else {
        toastService.error(
          'Error',
          result.message || t('auth.profileSaveError')
        );
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toastService.error('Error', t('auth.unexpectedError'));
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
    toastService.warning(
      'Profile Required',
      t('auth.profileCompletionRequired')
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Sparkles size={80} color="#fff" style={styles.icon} />
          <Text style={styles.title}>{t('auth.completeProfile')}</Text>
          <Text style={styles.description}>
            {t('auth.profileSetupDescription')}
          </Text>

          {isProfileCompleted && (
            <View style={styles.successContainer}>
              <CheckCircle size={40} color="#4ade80" />
              <Text style={styles.successText}>
                {t('auth.profileCompleted')}
              </Text>
              <Text style={styles.successSubtext}>
                {t('auth.profileCompletedSubtext')}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

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
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  icon: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.95,
  },
  successContainer: {
    marginTop: 40,
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  successSubtext: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
});
