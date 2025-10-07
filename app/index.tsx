import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { THEME } from '../constants/theme';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading screen while checking authentication status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  // Redirect based on authentication status and profile completion
  if (isAuthenticated) {
    // Check if user needs to complete their profile
    if (user && !user.isProfileComplete) {
      return <Redirect href="/auth/complete-profile" />;
    }
    // User is authenticated and profile is complete
    return <Redirect href="/(tabs)/search" />;
  } else {
    return <Redirect href="/auth/login" />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
  },
});
