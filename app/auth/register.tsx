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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

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
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              contentFit="contain"
              tintColor={theme.primary}
            />
            <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>
              Create your account in seconds - we'll set up your profile next!
            </Text>
          </View>

          {/* Form Section */}
          <View
            style={[styles.formSection, { backgroundColor: theme.surface }]}
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
              style={[styles.createButton, isLoading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[theme.primary, theme.primaryVariant]}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.createButtonText}>Create Account</Text>
                )}
              </LinearGradient>
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
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 150,
    height: 150,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formSection: {
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 50,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    gap: 12,
    minHeight: 36, // ensure a smaller minimum height
  },
  input: {
    flex: 1,
    fontSize: 16,
    minHeight: 24,
  },
  eyeButton: {
    padding: 4,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 2,
  },
  pickerContainer: {
    flex: 1,
  },
  picker: {
    flex: 1,
    fontSize: 16,
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 16,
    textAlign: 'center',
  },
  linkText: {
    fontWeight: '600',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    color: 'black',
  },
  sliderLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    color: 'black',
  },
  sliderLabel: {
    fontSize: 12,
    color: 'black',
  },
});

export default RegisterScreen;
