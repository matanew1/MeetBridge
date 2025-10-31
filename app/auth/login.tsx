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
import { Mail, Lock, Eye, EyeOff, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(
    null
  );
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        router.replace('/search');
      } else {
        Alert.alert('Login Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
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
              Welcome back! Sign in to continue your journey
            </Text>
            <Text style={[styles.signUpText, { color: theme.textSecondary }]}>
              Don't have an account?{' '}
              <Link href="/auth/register" asChild>
                <Text style={[styles.linkText, { color: theme.primary }]}>
                  Sign Up
                </Text>
              </Link>
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
              Sign In
            </Text>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>
                Email Address
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedInput === 'email' && styles.inputContainerFocused,
                  {
                    backgroundColor: theme.background,
                    borderColor:
                      focusedInput === 'email' ? theme.primary : theme.border,
                  },
                ]}
              >
                <Mail
                  size={moderateScale(20)}
                  color={
                    focusedInput === 'email'
                      ? theme.primary
                      : theme.textSecondary
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  autoFocus={false}
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
                  focusedInput === 'password' && styles.inputContainerFocused,
                  {
                    backgroundColor: theme.background,
                    borderColor:
                      focusedInput === 'password'
                        ? theme.primary
                        : theme.border,
                  },
                ]}
              >
                <Lock
                  size={moderateScale(20)}
                  color={
                    focusedInput === 'password'
                      ? theme.primary
                      : theme.textSecondary
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff
                      size={moderateScale(20)}
                      color={
                        focusedInput === 'password'
                          ? theme.primary
                          : theme.textSecondary
                      }
                    />
                  ) : (
                    <Eye
                      size={moderateScale(20)}
                      color={
                        focusedInput === 'password'
                          ? theme.primary
                          : theme.textSecondary
                      }
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Link href="/auth/forgot-password" asChild>
                <Text
                  style={[styles.forgotPasswordText, { color: theme.primary }]}
                >
                  Forgot Password?
                </Text>
              </Link>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.primary, theme.primaryVariant]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.signInButtonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer Spacer */}
          <View style={styles.footer} />
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
  signUpText: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    lineHeight: moderateScale(24),
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: verticalScale(40),
    paddingVertical: verticalScale(8),
    paddingHorizontal: spacing.sm,
  },
  forgotPasswordText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  signInButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: verticalScale(32),
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
  signInButtonText: {
    color: 'white',
    fontSize: moderateScale(18),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: verticalScale(24),
  },
  linkText: {
    fontWeight: '900',
  },
});

export default LoginScreen;
