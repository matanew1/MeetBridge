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

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, loginWithGoogle } = useAuth();

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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        router.replace('/search');
      } else {
        Alert.alert('Google Login Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Google login failed');
    } finally {
      setIsLoading(false);
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
            colors={[THEME.colors.primary, THEME.colors.secondary]}
            style={styles.gradient}
          >
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>
                  Sign in to continue your journey
                </Text>
              </View>

              {/* Login Form */}
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
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
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

                <TouchableOpacity style={styles.forgotPassword}>
                  <Link href="/auth/forgot-password" asChild>
                    <Text style={styles.forgotPasswordText}>
                      Forgot Password?
                    </Text>
                  </Link>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    isLoading && styles.disabledButton,
                  ]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={THEME.colors.white} />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={[
                    styles.googleButton,
                    isLoading && styles.disabledButton,
                  ]}
                  onPress={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <Ionicons
                    name="logo-google"
                    size={20}
                    color={THEME.colors.primary}
                  />
                  <Text style={styles.googleButtonText}>
                    Continue with Google
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Don't have an account?{' '}
                  <Link href="/auth/register" asChild>
                    <Text style={styles.linkText}>Sign Up</Text>
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
  eyeIcon: {
    padding: THEME.spacing.xs,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: THEME.spacing.lg,
  },
  forgotPasswordText: {
    color: THEME.colors.white,
    fontSize: 14,
    opacity: 0.9,
  },
  loginButton: {
    backgroundColor: THEME.colors.white,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
    shadowColor: THEME.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
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

export default LoginScreen;
