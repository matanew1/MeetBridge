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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../contexts/AuthContext';
import { THEME } from '../../constants/theme';

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: new Date(2000, 0, 1), // Default to Jan 1, 2000
    gender: 'male' as 'male' | 'female' | 'other',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const updateFormData = (field: string, value: string) => {
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <LinearGradient
            colors={[THEME.colors.secondary, THEME.colors.primary]}
            style={styles.gradient}
          >
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>
                  Join MeetBridge and find your perfect match
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {/* Name */}
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={THEME.colors.textSecondary}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={THEME.colors.textSecondary}
                    value={formData.name}
                    onChangeText={(value) => updateFormData('name', value)}
                    autoCapitalize="words"
                    autoComplete="name"
                  />
                </View>

                {/* Email */}
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={THEME.colors.textSecondary}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={THEME.colors.textSecondary}
                    value={formData.email}
                    onChangeText={(value) => updateFormData('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>

                {/* DOB + Gender */}
                <View style={styles.row}>
                  <View style={[styles.inputContainer, styles.ageInput]}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={THEME.colors.textSecondary}
                    />
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text
                        style={[
                          styles.datePickerText,
                          { color: THEME.colors.text },
                        ]}
                      >
                        {formData.dateOfBirth
                          ? formatDate(formData.dateOfBirth)
                          : 'Select Date of Birth'}
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

                  <View style={[styles.inputContainer, styles.genderInput]}>
                    <Ionicons
                      name="people-outline"
                      size={20}
                      color={THEME.colors.textSecondary}
                    />
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={formData.gender}
                        onValueChange={(value) =>
                          updateFormData('gender', value)
                        }
                        style={styles.picker}
                        dropdownIconColor={THEME.colors.textSecondary}
                      >
                        <Picker.Item label="Male" value="male" />
                        <Picker.Item label="Female" value="female" />
                        <Picker.Item label="Other" value="other" />
                      </Picker>
                    </View>
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={THEME.colors.textSecondary}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={THEME.colors.textSecondary}
                    value={formData.password}
                    onChangeText={(value) => updateFormData('password', value)}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={THEME.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={THEME.colors.textSecondary}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor={THEME.colors.textSecondary}
                    value={formData.confirmPassword}
                    onChangeText={(value) =>
                      updateFormData('confirmPassword', value)
                    }
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="new-password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? 'eye-outline' : 'eye-off-outline'
                      }
                      size={20}
                      color={THEME.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Register button */}
                <TouchableOpacity
                  style={[
                    styles.registerButton,
                    isLoading && styles.disabledButton,
                  ]}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={THEME.colors.white} />
                  ) : (
                    <Text style={styles.registerButtonText}>
                      Create Account
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google */}
                <TouchableOpacity
                  style={[
                    styles.googleButton,
                    isLoading && styles.disabledButton,
                  ]}
                  onPress={handleGoogleRegister}
                  disabled={isLoading}
                >
                  <Ionicons
                    name="logo-google"
                    size={20}
                    color={THEME.colors.primary}
                  />
                  <Text style={styles.googleButtonText}>
                    Sign up with Google
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Already have an account?{' '}
                  <Link href="/auth/login" asChild>
                    <Text style={styles.linkText}>Sign In</Text>
                  </Link>
                </Text>
              </View>
            </View>
          </LinearGradient>
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
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: THEME.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: THEME.colors.white,
    marginBottom: THEME.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    marginBottom: THEME.spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical:
      Platform.OS === 'ios' ? THEME.spacing.md : THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
    shadowColor: THEME.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: THEME.colors.text,
    marginLeft: THEME.spacing.sm,
  },
  datePickerButton: {
    flex: 1,
    marginLeft: THEME.spacing.sm,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  datePickerText: {
    fontSize: 16,
    color: THEME.colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ageInput: {
    flex: 0.4,
    marginRight: THEME.spacing.sm,
  },
  genderInput: {
    flex: 0.6,
  },
  pickerContainer: {
    flex: 1,
    marginLeft: THEME.spacing.sm,
  },
  picker: {
    flex: 1,
    color: THEME.colors.text,
  },
  eyeIcon: {
    padding: THEME.spacing.xs,
  },
  registerButton: {
    backgroundColor: THEME.colors.white,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    shadowColor: THEME.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonText: {
    color: THEME.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: THEME.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.colors.white,
    opacity: 0.3,
  },
  dividerText: {
    color: THEME.colors.white,
    paddingHorizontal: THEME.spacing.md,
    opacity: 0.7,
  },
  googleButton: {
    backgroundColor: THEME.colors.white,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: THEME.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonText: {
    color: THEME.colors.text,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: THEME.spacing.sm,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: THEME.colors.white,
    fontSize: 14,
    opacity: 0.9,
  },
  linkText: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;
