import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager, View } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import GlobalToast from './components/GlobalToast';
import '../i18n'; // Initialize i18n
import toastService from '../services/toastService';
import i18n, { isRTL } from '../i18n';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    // Enable RTL support
    I18nManager.allowRTL(true);

    // Force RTL for Hebrew, LTR for English
    I18nManager.forceRTL(isRTL());
  }, []);

  // Listen to language changes and update RTL
  useEffect(() => {
    const handleLanguageChange = () => {
      I18nManager.forceRTL(isRTL());
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  return (
    <View style={{ flex: 1, direction: isRTL() ? 'rtl' : 'ltr' }}>
      <ThemeProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="+not-found" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="light" />
          <GlobalToast />
        </AuthProvider>
      </ThemeProvider>
    </View>
  );
}
