// Test screen for notifications
// Add this to your app temporarily: app/(tabs)/test-notifications.tsx

import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { NotificationDiagnostic } from '../components/NotificationDiagnostic';

export default function TestNotificationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <NotificationDiagnostic />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
