// services/notificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase/config';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  matches: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  matches: true,
};

const STORAGE_KEY = '@notification_settings';

class NotificationService {
  private notificationListener: any;
  private responseListener: any;
  private settings: NotificationSettings = DEFAULT_SETTINGS;

  /**
   * Initialize notification service
   */
  async initialize(userId?: string) {
    try {
      // Load settings from storage
      await this.loadSettings();

      if (!this.settings.enabled) {
        console.log('📴 Notifications are disabled by user');
        return null;
      }

      // Request permissions
      const token = await this.registerForPushNotifications();

      if (token && userId) {
        // Save token to Firebase user profile
        await this.saveTokenToFirebase(userId, token);
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      return token;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // On web, skip push notifications if VAPID key is not configured
      if (Platform.OS === 'web') {
        console.log(
          'Web platform detected - push notifications require VAPID key configuration in app.json'
        );
        return null;
      }

      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permissions not granted');
        return null;
      }

      // Get push token
      // projectId is automatically determined from app.json (expo.extra.eas.projectId or expo.slug)
      const tokenData = await Notifications.getExpoPushTokenAsync();

      console.log('📱 Push token obtained:', tokenData.data);

      // Android-specific channel setup
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('matches', {
          name: 'Matches',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#FF69B4',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4A90E2',
          sound: 'default',
        });
      }

      return tokenData.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Save push token to Firebase user profile
   */
  async saveTokenToFirebase(userId: string, token: string) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pushToken: token,
        notificationsEnabled: true,
        lastTokenUpdate: new Date(),
      });
      console.log('✅ Push token saved to Firebase');
    } catch (error) {
      console.error('Error saving token to Firebase:', error);
    }
  }

  /**
   * Setup notification listeners
   */
  setupNotificationListeners() {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('🔔 Notification received:', notification);
        // You can add custom handling here
      }
    );

    // Listener for notification interactions (when user taps notification)
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('👆 Notification tapped:', response);
        const data = response.notification.request.content.data;

        // Handle navigation based on notification type
        if (data.type === 'match') {
          // Navigate to matches screen
          console.log('Navigate to match:', data.matchId);
        } else if (data.type === 'message') {
          // Navigate to chat conversation
          console.log('Navigate to conversation:', data.conversationId);
          // The navigation will be handled by the app's navigation system
        }
      });
  }

  /**
   * Send local notification (for testing or immediate feedback)
   */
  async sendLocalNotification(
    title: string,
    body: string,
    data?: any,
    channelId: string = 'default'
  ) {
    try {
      if (!this.settings.enabled) {
        console.log('Notifications disabled, skipping local notification');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  /**
   * Send match notification (broadcast to current user)
   */
  async sendMatchNotification(matchedUserName: string, matchId: string) {
    if (!this.settings.enabled || !this.settings.matches) {
      console.log('Match notifications disabled, skipping notification');
      return;
    }

    await this.sendLocalNotification(
      "It's a Match! 💕",
      `You matched with ${matchedUserName}! Start chatting now.`,
      {
        type: 'match',
        matchId,
      },
      'matches'
    );

    console.log(`📢 Match notification sent for ${matchedUserName}`);
  }

  /**
   * Broadcast match notification to a specific user via push token
   * This is used to notify the other user when a match occurs
   */
  async broadcastMatchNotification(
    userId: string,
    currentUserName: string,
    matchId: string
  ) {
    try {
      // Skip notifications on web platform (CORS issues + not supported)
      if (Platform.OS === 'web') {
        console.log('⚠️ Push notifications are not supported on web platform');
        return;
      }

      // Get the user's push token from Firebase
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.log('User not found for broadcast notification');
        return;
      }

      const userData = userDoc.data();
      const pushToken = userData.pushToken;
      const notificationsEnabled = userData.notificationsEnabled;

      if (!pushToken || !notificationsEnabled) {
        console.log(
          'Push token not available or notifications disabled for user'
        );
        return;
      }

      // Send push notification via Expo Push Notification service
      const message = {
        to: pushToken,
        sound: 'default',
        title: "It's a Match! 💕",
        body: `You matched with ${currentUserName}! Start chatting now.`,
        data: {
          type: 'match',
          matchId,
        },
        priority: 'high',
        channelId: 'matches',
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log(
        `📢 Broadcast match notification sent to ${currentUserName}:`,
        result
      );
    } catch (error) {
      console.error('Error broadcasting match notification:', error);
    }
  }

  /**
   * Broadcast message notification to a specific user via push token
   * This is used to notify the other user when a message is received
   */
  async broadcastMessageNotification(
    userId: string,
    senderName: string,
    messageText: string,
    conversationId: string
  ) {
    try {
      // Skip notifications on web platform (CORS issues + not supported)
      if (Platform.OS === 'web') {
        console.log('⚠️ Push notifications are not supported on web platform');
        return;
      }

      // Get the user's push token from Firebase
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.log('User not found for broadcast notification');
        return;
      }

      const userData = userDoc.data();
      const pushToken = userData.pushToken;
      const notificationsEnabled = userData.notificationsEnabled;

      if (!pushToken || !notificationsEnabled) {
        console.log(
          'Push token not available or notifications disabled for user'
        );
        return;
      }

      // Truncate message if too long
      const displayText =
        messageText.length > 100
          ? messageText.substring(0, 100) + '...'
          : messageText;

      console.log(`📨 Preparing message notification:`, {
        to: pushToken.substring(0, 20) + '...',
        from: senderName,
        conversationId,
      });

      // Send push notification via Expo Push Notification service
      const message = {
        to: pushToken,
        sound: 'default',
        title: senderName,
        body: displayText,
        data: {
          type: 'message',
          conversationId,
        },
        priority: 'high',
        channelId: 'messages', // Use dedicated messages channel
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (result.data?.status === 'ok') {
        console.log(
          `✅ Message notification sent successfully to ${senderName}`
        );
      } else {
        console.error(
          `❌ Message notification failed:`,
          JSON.stringify(result, null, 2)
        );
      }

      console.log(`📢 Full notification result:`, result);
    } catch (error) {
      console.error('Error broadcasting message notification:', error);
    }
  }

  /**
   * Load notification settings from storage
   */
  async loadSettings(): Promise<NotificationSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEY);
      if (settingsJson) {
        this.settings = JSON.parse(settingsJson);
      } else {
        this.settings = DEFAULT_SETTINGS;
      }
      return this.settings;
    } catch (error) {
      console.error('Error loading notification settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save notification settings to storage
   */
  async saveSettings(settings: NotificationSettings) {
    try {
      this.settings = settings;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      console.log('✅ Notification settings saved:', settings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  /**
   * Get current settings
   */
  getSettings(): NotificationSettings {
    return this.settings;
  }
}

export default new NotificationService();
