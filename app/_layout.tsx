import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import GlobalToast from './components/GlobalToast';
import '../i18n'; // Initialize i18n

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    // Enable RTL support
    I18nManager.allowRTL(true);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="dark" />
        <GlobalToast />
      </AuthProvider>
    </ThemeProvider>
  );
}
