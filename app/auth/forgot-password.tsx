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
import { useAuth } from '../../contexts/AuthContext';
import { THEME } from '../../constants/theme';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <LinearGradient
            colors={[THEME.colors.primary, THEME.colors.secondary]}
            style={styles.gradient}
          >
            <View style={styles.content}>
              {/* Header */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackToLogin}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={THEME.colors.white}
                />
              </TouchableOpacity>

              <View style={styles.header}>
                <Ionicons
                  name="lock-closed"
                  size={64}
                  color={THEME.colors.white}
                />
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                  {emailSent
                    ? "We've sent a password reset link to your email"
                    : "No worries! Enter your email and we'll send you a reset link"}
                </Text>
              </View>

              {!emailSent && (
                <View style={styles.form}>
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
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.resetButton,
                      isLoading && styles.disabledButton,
                    ]}
                    onPress={handleForgotPassword}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={THEME.colors.white} />
                    ) : (
                      <Text style={styles.resetButtonText}>
                        Send Reset Link
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {emailSent && (
                <View style={styles.successContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={80}
                    color={THEME.colors.white}
                  />
                  <Text style={styles.successTitle}>Email Sent!</Text>
                  <Text style={styles.successText}>
                    Check your inbox and follow the instructions to reset your
                    password.
                  </Text>
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={() => setEmailSent(false)}
                  >
                    <Text style={styles.resetButtonText}>
                      Send Another Email
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Remember your password?{' '}
                  <Link href="/auth/login" asChild>
                    <Text style={styles.linkText}>Back to Sign In</Text>
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
  backButton: {
    position: 'absolute',
    top: THEME.spacing.lg,
    left: THEME.spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.colors.white,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.colors.white,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
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
    marginBottom: THEME.spacing.lg,
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
  resetButton: {
    backgroundColor: THEME.colors.white,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    shadowColor: THEME.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resetButtonText: {
    color: THEME.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.colors.white,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
  },
  successText: {
    fontSize: 16,
    color: THEME.colors.white,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: THEME.spacing.xl,
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

export default ForgotPasswordScreen;
