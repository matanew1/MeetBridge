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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { ArrowLeft, Mail, CheckCircle, Heart } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
  deviceInfo,
} from '../../utils/responsive';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const { forgotPassword } = useAuth();

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const result = await forgotPassword(email.trim());
      if (result.success) {
        setEmailSent(true);
        Alert.alert('Success', result.message, [{ text: 'OK' }]);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
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
          {/* Header */}
          <View style={styles.headerSection}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.surface }]}
              onPress={handleBackToLogin}
            >
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>

            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              contentFit="contain"
              tintColor={theme.primary}
              transition={300}
            />

            <Text style={[styles.title, { color: theme.text }]}>
              Forgot Password?
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {emailSent
                ? "We've sent a password reset link to your email"
                : "No worries! Enter your email and we'll send you a reset link"}
            </Text>
          </View>

          {/* Form Section */}
          <View
            style={[styles.formSection, { backgroundColor: theme.surface }]}
          >
            {!emailSent ? (
              <>
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
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.resetButton,
                    {
                      backgroundColor: theme.primary,
                      shadowColor: theme.primary,
                    },
                    isLoading && styles.disabledButton,
                  ]}
                  onPress={handleForgotPassword}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.resetButtonText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.successContainer}>
                <View
                  style={[
                    styles.successIcon,
                    { backgroundColor: theme.success + '20' },
                  ]}
                >
                  <CheckCircle size={60} color={theme.success} />
                </View>
                <Text style={[styles.successTitle, { color: theme.text }]}>
                  Email Sent!
                </Text>
                <Text
                  style={[styles.successText, { color: theme.textSecondary }]}
                >
                  Check your inbox and follow the instructions to reset your
                  password.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.resetButton,
                    {
                      backgroundColor: theme.primary,
                      shadowColor: theme.primary,
                    },
                  ]}
                  onPress={() => setEmailSent(false)}
                >
                  <Text style={styles.resetButtonText}>Send Another Email</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Remember your password?{' '}
              <Link href="/auth/login" asChild>
                <Text style={[styles.linkText, { color: theme.primary }]}>
                  Back to Sign In
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
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  logo: {
    width: scale(180),
    height: scale(180),
    marginBottom: verticalScale(32),
    marginTop: verticalScale(40),
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    marginBottom: verticalScale(12),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    lineHeight: moderateScale(24),
    paddingHorizontal: spacing.lg,
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
  resetButton: {
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
  resetButtonText: {
    color: 'white',
    fontSize: moderateScale(18),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  successTitle: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    marginBottom: verticalScale(12),
    textAlign: 'center',
  },
  successText: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    lineHeight: moderateScale(24),
    marginBottom: verticalScale(32),
    paddingHorizontal: spacing.lg,
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

export default ForgotPasswordScreen;
