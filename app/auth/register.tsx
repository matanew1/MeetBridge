import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import { Image } from 'expo-image';

import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
  deviceInfo,
} from '../../utils/responsive';

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const { register } = useAuth();

  const validateForm = () => {
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Minimal user data - only email and password
      // All other profile fields will be filled in EditProfileModal
      const userData = {
        email: formData.email.trim(),
        password: formData.password,
        name: '', // Will be set in profile completion
        age: 18, // Default, will be calculated from dateOfBirth in profile completion
        dateOfBirth: new Date(), // Will be set in profile completion
        gender: 'other' as 'male' | 'female' | 'other', // Will be set in profile completion
        height: 170, // Default, will be set in profile completion
        bio: '',
        interests: [],
        location: '',
        createdAt: new Date(),
        isProfileComplete: false, // Mark profile as incomplete - user must complete it
        hasSeenTutorial: false, // User hasn't seen tutorial yet
        preferences: {
          ageRange: [18, 99] as [number, number],
          maxDistance: 500, // default to 500m
          interestedIn: 'female' as 'male' | 'female', // default preference
        },
      };

      const result = await register(userData);
      if (result.success) {
        Alert.alert(
          'Success',
          "Account created successfully! Let's set up your profile.",
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/auth/complete-profile'),
            },
          ]
        );
      } else {
        Alert.alert('Registration Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              contentFit="contain"
              tintColor={theme.primary}
              transition={300}
            />
            <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>
              Create your account in seconds - we'll set up your profile next!
            </Text>
          </View>

          {/* Form Section */}
          <View
            style={[
              styles.formSection,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.formTitle, { color: theme.text }]}>
              Get Started
            </Text>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Email Address
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Mail size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  blurOnSubmit={true}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Password
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Lock size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Create a password"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="next"
                  blurOnSubmit={true}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={theme.textSecondary} />
                  ) : (
                    <Eye size={20} color={theme.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Confirm Password
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Lock size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Confirm your password"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.confirmPassword}
                  onChangeText={(value) =>
                    updateFormData('confirmPassword', value)
                  }
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={theme.textSecondary} />
                  ) : (
                    <Eye size={20} color={theme.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Create Account Button */}
            <TouchableOpacity
              style={[
                styles.createButton,
                { backgroundColor: theme.primary, shadowColor: theme.primary },
                isLoading && styles.disabledButton,
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.createButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Already have an account?{' '}
              <Link href="/auth/login" asChild>
                <Text style={[styles.linkText, { color: theme.primary }]}>
                  Sign In
                </Text>
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: deviceInfo.height,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: verticalScale(48),
    paddingTop: verticalScale(40),
  },
  logo: {
    width: scale(180),
    height: scale(180),
    marginBottom: verticalScale(32),
  },
  welcomeText: {
    fontSize: moderateScale(18),
    textAlign: 'center',
    lineHeight: moderateScale(26),
    paddingHorizontal: spacing.lg,
    marginBottom: verticalScale(16),
  },
  formSection: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: verticalScale(32),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
  },
  formTitle: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: verticalScale(40),
  },
  inputGroup: {
    marginBottom: verticalScale(28),
  },
  inputLabel: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: verticalScale(10),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical:
      Platform.OS === 'ios' ? verticalScale(16) : verticalScale(12),
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainerFocused: {
    shadowOpacity: 0.15,
    elevation: 5,
  },
  input: {
    flex: 1,
    fontSize: moderateScale(16),
    minHeight: verticalScale(24),
  },
  eyeButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  createButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: verticalScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: verticalScale(56),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  disabledButton: {
    opacity: 0.6,
    shadowOpacity: 0.15,
    elevation: 5,
  },
  buttonGradient: {
    paddingVertical: verticalScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: verticalScale(56),
  },
  createButtonText: {
    color: 'white',
    fontSize: moderateScale(18),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: verticalScale(24),
  },
  footerText: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    lineHeight: moderateScale(24),
  },
  linkText: {
    fontWeight: '900',
  },
});

export default RegisterScreen;
