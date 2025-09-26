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
import { ArrowLeft, Mail, CheckCircle, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
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

            <LinearGradient
              colors={[theme.primary, theme.primaryVariant]}
              style={styles.logoContainer}
            >
              <Heart size={32} color="white" fill="white" />
            </LinearGradient>
            
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
          <View style={[styles.formSection, { backgroundColor: theme.surface }]}>
            {!emailSent ? (
              <>
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
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.resetButton, isLoading && styles.disabledButton]}
                  onPress={handleForgotPassword}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={[theme.primary, theme.primaryVariant]}
                    style={styles.buttonGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.resetButtonText}>
                        Send Reset Link
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.successContainer}>
                <View style={[styles.successIcon, { backgroundColor: theme.success + '20' }]}>
                  <CheckCircle size={60} color={theme.success} />
                </View>
                <Text style={[styles.successTitle, { color: theme.text }]}>
                  Email Sent!
                </Text>
                <Text style={[styles.successText, { color: theme.textSecondary }]}>
                  Check your inbox and follow the instructions to reset your password.
                </Text>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => setEmailSent(false)}
                >
                  <LinearGradient
                    colors={[theme.primary, theme.primaryVariant]}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.resetButtonText}>
                      Send Another Email
                    </Text>
                  </LinearGradient>
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
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
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
  inputGroup: {
    marginBottom: 32,
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
  resetButton: {
    borderRadius: 16,
    overflow: 'hidden',
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
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 16,
    textAlign: 'center',
  },
  linkText: {
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;