// Diagnostic component for testing push notifications
// Add this to your app temporarily to debug notification issues

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';

export const NotificationDiagnostic = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<string>('');
  const [pushToken, setPushToken] = useState<string>('');
  const [firebaseToken, setFirebaseToken] = useState<string>('');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev]);
    console.log(message);
  };

  useEffect(() => {
    checkInitialStatus();
  }, [user]);

  const checkInitialStatus = async () => {
    addLog('=== Starting Diagnostic ===');
    addLog(`Platform: ${Platform.OS}`);
    addLog(`Is Device: ${Device.isDevice}`);
    addLog(`User ID: ${user?.id || 'Not logged in'}`);

    // Check permissions
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
    addLog(`Permission Status: ${status}`);

    // Check Firebase token
    if (user?.id) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const token = userData.pushToken || 'No token in Firebase';
          setFirebaseToken(token);
          addLog(`Firebase Token: ${token.substring(0, 30)}...`);
          addLog(`Notifications Enabled: ${userData.notificationsEnabled}`);
        }
      } catch (error) {
        addLog(`Error reading Firebase: ${error.message}`);
      }
    }
  };

  const testRequestPermissions = async () => {
    addLog('--- Testing Permission Request ---');
    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      setPermissionStatus(status);
      addLog(`✅ Permission Result: ${status}`);
    } catch (error) {
      addLog(`❌ Permission Error: ${error.message}`);
    }
  };

  const testGetToken = async () => {
    addLog('--- Testing Token Generation ---');

    if (!Device.isDevice) {
      addLog('❌ Not a physical device - tokens only work on real devices');
      return;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '43f9db97-1d52-4ad4-9ffd-028295ab91c1',
      });
      setPushToken(tokenData.data);
      addLog(`✅ Token Generated: ${tokenData.data}`);
    } catch (error) {
      addLog(`❌ Token Error: ${error.message}`);
      addLog(`Error details: ${JSON.stringify(error, null, 2)}`);
    }
  };

  const testInitializeService = async () => {
    addLog('--- Testing Notification Service Init ---');
    if (!user?.id) {
      addLog('❌ No user logged in');
      return;
    }

    try {
      const token = await notificationService.initialize(user.id);
      if (token) {
        addLog(
          `✅ Service initialized with token: ${token.substring(0, 30)}...`
        );
      } else {
        addLog('❌ Service returned null token');
      }
    } catch (error) {
      addLog(`❌ Service Error: ${error.message}`);
    }
  };

  const testLocalNotification = async () => {
    addLog('--- Testing Local Notification ---');
    try {
      await notificationService.sendLocalNotification(
        'Test Title 🧪',
        'This is a test notification. If you see this, notifications are working!',
        { type: 'test', timestamp: new Date().toISOString() }
      );
      addLog('✅ Local notification sent - check your device!');
    } catch (error) {
      addLog(`❌ Local notification error: ${error.message}`);
    }
  };

  const testExpoAPI = async () => {
    addLog('--- Testing Expo Push API ---');

    if (!firebaseToken || !firebaseToken.startsWith('ExponentPushToken')) {
      addLog('❌ No valid token to test with');
      return;
    }

    try {
      addLog('Sending test via Expo API...');
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: firebaseToken,
          title: 'Test from Diagnostic 🔬',
          body: 'This is sent via Expo Push API',
          sound: 'default',
          data: { type: 'diagnostic-test' },
        }),
      });

      const result = await response.json();
      addLog(`✅ API Response: ${JSON.stringify(result)}`);

      if (result.data && result.data[0].status === 'ok') {
        addLog('✅ Notification queued successfully! Check your device.');
      } else {
        addLog(`⚠️ API returned: ${result.data[0].status}`);
      }
    } catch (error) {
      addLog(`❌ API Error: ${error.message}`);
    }
  };

  const testForceRefresh = async () => {
    addLog('--- Testing Force Token Refresh ---');
    if (!user?.id) {
      addLog('❌ No user logged in');
      return;
    }

    try {
      const token = await notificationService.forceRefreshToken(user.id);
      if (token) {
        addLog(`✅ Token refreshed: ${token.substring(0, 30)}...`);
        setPushToken(token);
        setFirebaseToken(token);
        await checkInitialStatus(); // Re-check status
      } else {
        addLog('❌ Failed to refresh token');
      }
    } catch (error) {
      addLog(`❌ Refresh error: ${error.message}`);
    }
  };

  const testVerifyToken = async () => {
    addLog('--- Verifying Token in Firebase ---');
    if (!user?.id) {
      addLog('❌ No user logged in');
      return;
    }

    try {
      const isValid = await notificationService.verifyTokenInFirebase(user.id);
      if (isValid) {
        addLog('✅ Token is valid in Firebase');
      } else {
        addLog('❌ Token is invalid or missing in Firebase');
        addLog('💡 Try "Force Refresh Token" to fix');
      }
    } catch (error) {
      addLog(`❌ Verification error: ${error.message}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 Notification Diagnostic</Text>

      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>Platform:</Text>
        <Text style={styles.statusValue}>{Platform.OS}</Text>

        <Text style={styles.statusLabel}>Is Device:</Text>
        <Text style={styles.statusValue}>
          {Device.isDevice ? 'Yes ✅' : 'No ❌ (Use real device!)'}
        </Text>

        <Text style={styles.statusLabel}>Permission:</Text>
        <Text style={styles.statusValue}>{permissionStatus || 'Unknown'}</Text>

        <Text style={styles.statusLabel}>Current Token:</Text>
        <Text style={styles.statusValue} numberOfLines={1}>
          {pushToken ? pushToken.substring(0, 40) + '...' : 'None'}
        </Text>

        <Text style={styles.statusLabel}>Firebase Token:</Text>
        <Text style={styles.statusValue} numberOfLines={1}>
          {firebaseToken ? firebaseToken.substring(0, 40) + '...' : 'None'}
        </Text>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.button}
          onPress={testRequestPermissions}
        >
          <Text style={styles.buttonText}>1. Request Permissions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testGetToken}>
          <Text style={styles.buttonText}>2. Get Token</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testInitializeService}>
          <Text style={styles.buttonText}>3. Initialize Service</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testLocalNotification}>
          <Text style={styles.buttonText}>4. Send Local Test</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.apiButton]}
          onPress={testExpoAPI}
        >
          <Text style={styles.buttonText}>5. Test Expo API</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.verifyButton]}
          onPress={testVerifyToken}
        >
          <Text style={styles.buttonText}>🔍 Verify Token</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.forceButton]}
          onPress={testForceRefresh}
        >
          <Text style={styles.buttonText}>🔄 Force Refresh Token</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.refreshButton]}
          onPress={checkInitialStatus}
        >
          <Text style={styles.buttonText}>� Refresh Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearLogs}
        >
          <Text style={styles.buttonText}>🗑️ Clear Logs</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.logsTitle}>Console Logs:</Text>
      <ScrollView style={styles.logsContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
        {logs.length === 0 && (
          <Text style={styles.noLogs}>No logs yet. Run tests above.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  buttonGroup: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  apiButton: {
    backgroundColor: '#FF9500',
  },
  verifyButton: {
    backgroundColor: '#5856D6',
  },
  forceButton: {
    backgroundColor: '#FF2D55',
  },
  refreshButton: {
    backgroundColor: '#34C759',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logsContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 10,
  },
  logText: {
    color: '#00FF00',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  noLogs: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});
