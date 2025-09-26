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
import { User, Mail, Lock, Eye, EyeOff, Calendar, Users, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: new Date(2000, 0, 1),
    gender: 'male' as 'male' | 'female' | 'other',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const { register, loginWithGoogle } = useAuth();

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
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
    const age = calculateAge(formData.dateOfBirth);
    if (age < 18) {
      Alert.alert('Error', 'You must be at least 18 years old');
      return false;
    }
    if (age > 100) {
      Alert.alert('Error', 'Please enter a valid date of birth');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const age = calculateAge(formData.dateOfBirth);
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        age,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bio: '',
        interests: [],
        location: '',
        createdAt: new Date(),
      };

      const result = await register(userData);
      if (result.success) {
        Alert.alert(
          'Success',
          'Account created successfully! Please check your email for verification.',
          [{ text: 'OK', onPress: () => router.replace('/search') }]
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

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        router.replace('/search');
      } else {
        Alert.alert('Google Sign Up Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Google sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData((prev) => ({ ...prev, dateOfBirth: selectedDate }));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
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
            <LinearGradient
              colors={[theme.primary, theme.primaryVariant]}
              style={styles.logoContainer}
            >
              <Heart size={32} color="white" fill="white" />
            </LinearGradient>
            <Text style={[styles.appTitle, { color: theme.text }]}>
              Join MeetBridge
            </Text>
            <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>
              Create your account and find your perfect match
            </Text>
          </View>

          {/* Form Section */}
          <View style={[styles.formSection, { backgroundColor: theme.surface }]}>
            <Text style={[styles.formTitle, { color: theme.text }]}>
              Create Account
            </Text>

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Full Name
              </Text>
              <View style={[styles.inputContainer, { 
                backgroundColor: theme.background,
                borderColor: theme.border 
              }]}>
                <User size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.name}
                  onChangeText={(value) => updateFormData('name', value)}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Email Address
              </Text>
              <View style={[styles.inputContainer, { 
                backgroundColor: theme.background,
                borderColor: theme.border 
              }]}>
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
                />
              </View>
            </View>

            {/* Date of Birth & Gender Row */}
            <View style={styles.rowContainer}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Date of Birth
                </Text>
                <TouchableOpacity
                  style={[styles.inputContainer, { 
                    backgroundColor: theme.background,
                    borderColor: theme.border 
                  }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar size={20} color={theme.textSecondary} />
                  <Text style={[styles.dateText, { color: theme.text }]}>
                    {formatDate(formData.dateOfBirth)}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={formData.dateOfBirth}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    minimumDate={new Date(1920, 0, 1)}
                    onChange={onDateChange}
                  />
                )}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Gender
                </Text>
                <View style={[styles.inputContainer, { 
                  backgroundColor: theme.background,
                  borderColor: theme.border 
                }]}>
                  <Users size={20} color={theme.textSecondary} />
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.gender}
                      onValueChange={(value) => updateFormData('gender', value)}
                      style={[styles.picker, { color: theme.text }]}
                      dropdownIconColor={theme.textSecondary}
                    >
                      <Picker.Item label="Male" value="male" />
                      <Picker.Item label="Female" value="female" />
                      <Picker.Item label="Other" value="other" />
                    </Picker>
                  </View>
                </View>
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Password
              </Text>
              <View style={[styles.inputContainer, { 
                backgroundColor: theme.background,
                borderColor: theme.border 
              }]}>
                <Lock size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Create a password"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
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
              <View style={[styles.inputContainer, { 
                backgroundColor: theme.background,
                borderColor: theme.border 
              }]}>
                <Lock size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Confirm your password"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
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

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>
                or continue with
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            {/* Google Sign Up */}
            <TouchableOpacity
              style={[styles.googleButton, { 
                backgroundColor: theme.background,
                borderColor: theme.border 
              }]}
              onPress={handleGoogleRegister}
              disabled={isLoading}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={[styles.googleButtonText, { color: theme.text }]}>
                Continue with Google
              </Text>
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
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
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
    marginBottom: 20,
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
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 12,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
});

export default RegisterScreen;