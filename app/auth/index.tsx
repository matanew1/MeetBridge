import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { THEME } from '../../constants/theme';

// This component handles OAuth redirects for web
export default function AuthRedirectHandler() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // This page handles OAuth redirects
    // The actual OAuth flow is handled by expo-auth-session
    // We just need this route to exist for the redirect URI

    // Check if we have OAuth response parameters
    if (params.id_token || params.code || params.error) {
      // Let expo-auth-session handle the OAuth response
      // This will automatically resolve the pending auth request
      console.log('OAuth redirect received:', params);
    }

    // After a short delay, redirect to login page
    const timeout = setTimeout(() => {
      router.replace('/auth/login');
    }, 2000);

    return () => clearTimeout(timeout);
  }, [params, router]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ActivityIndicator size="large" color={THEME.colors.primary} />
      <Text style={styles.text}>Processing authentication...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
  },
  text: {
    marginTop: THEME.spacing.lg,
    fontSize: 16,
    color: THEME.colors.text,
    textAlign: 'center',
  },
});
