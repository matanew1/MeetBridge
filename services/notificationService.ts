// services/notificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc } from 'firebase/firestore';
import { safeGetDoc } from './firebase/firestoreHelpers';
import { db } from './firebase/config';

// Configure notification behavior (will be set properly after service initialization)
let notificationService: any = null;

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Don't show notifications when app is in foreground (active)
    const appState = AppState.currentState;
    if (appState === 'active') {
      console.log('🔕 Suppressing notification - app is active');
      return {
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: true, // Still update badge count
      };
    }

    // Check if the notification is for a chat that's currently open
    const data = notification.request.content.data;
    const chatId = data?.chatId || data?.matchId || data?.senderId;

    // If we have a notification service and the chat is active, don't show the notification
    if (
      notificationService &&
      chatId &&
      notificationService.isChatActive(chatId)
    ) {
      console.log(`🔕 Suppressing notification for active chat: ${chatId}`);
      return {
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }

    // Otherwise, show the notification normally (when app is in background)
    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
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
  private activeChatId: string | null = null; // Track currently open chat

  /**
   * Initialize notification service
   */
  async initialize(userId?: string, userSettings?: any) {
    try {
      // Check user settings from Firebase first, fallback to storage
      const pushEnabled =
        userSettings?.notifications?.pushEnabled ??
        (await this.loadSettingsFromStorage());

      if (!pushEnabled) {
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
          enableVibrate: true,
          showBadge: true,
        });

        await Notifications.setNotificationChannelAsync('matches', {
          name: 'Matches',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#FF69B4',
          sound: 'message.mp3', // Custom sound from assets
          enableVibrate: true,
          showBadge: true,
        });

        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4A90E2',
          sound: 'message.mp3', // Custom sound from assets
          enableVibrate: true,
          showBadge: true,
        });

        await Notifications.setNotificationChannelAsync('comments', {
          name: 'Comments',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#9B59B6',
          enableVibrate: true,
          showBadge: true,
        });

        await Notifications.setNotificationChannelAsync('likes', {
          name: 'Likes',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#E74C3C',
          enableVibrate: true,
          showBadge: true,
        });

        await Notifications.setNotificationChannelAsync('claims', {
          name: 'Claims',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#F39C12',
          enableVibrate: true,
          showBadge: true,
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
   * Cleanup notification listeners
   */
  async cleanup(): Promise<void> {
    console.log('🔕 Cleaning up notification listeners');

    // Remove notification listeners
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }

    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
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
      // Skip on web platform - notifications are not supported
      if (Platform.OS === 'web') {
        console.log('📱 Notifications not available on web platform');
        return;
      }

      if (!this.settings.enabled) {
        console.log('Notifications disabled, skipping local notification');
        return;
      }

      // Check if the notification is for an active chat
      const chatId = data?.chatId || data?.matchId || data?.senderId;
      if (chatId && this.isChatActive(chatId)) {
        console.log(`🔕 Skipping notification for active chat: ${chatId}`);
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'message.mp3', // Custom sound
          priority: Notifications.AndroidNotificationPriority.HIGH,
          ...(Platform.OS === 'android' && { channelId }), // Set channel for Android
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

      // Check if app is in foreground - if so, don't send push notification
      const appState = AppState.currentState;
      if (appState === 'active') {
        console.log(
          '🔕 Skipping push notification - app is active (match notification will be handled by toast)'
        );
        return;
      }

      // Get the user's push token from Firebase
      const userRef = doc(db, 'users', userId);
      const userDoc = await safeGetDoc(userRef, `users:${userId}`);

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

      // Check if app is in foreground - if so, don't send push notification
      const appState = AppState.currentState;
      if (appState === 'active') {
        console.log(
          '🔕 Skipping push notification - app is active (message notification will be handled by toast)'
        );
        return;
      }

      // Get the user's push token from Firebase
      const userRef = doc(db, 'users', userId);
      const userDoc = await safeGetDoc(userRef, `users:${userId}`);

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
   * Broadcast comment notification to a specific user via push token
   * This is used to notify the post author when someone comments on their post
   */
  async broadcastCommentNotification(
    userId: string,
    commenterName: string,
    connectionId: string
  ) {
    try {
      // Skip notifications on web platform (CORS issues + not supported)
      if (Platform.OS === 'web') {
        console.log('⚠️ Push notifications are not supported on web platform');
        return;
      }

      // Check if app is in foreground - if so, don't send push notification
      const appState = AppState.currentState;
      if (appState === 'active') {
        console.log(
          '🔕 Skipping push notification - app is active (comment notification will be handled by toast)'
        );
        return;
      }

      // Get the user's push token from Firebase
      const userRef = doc(db, 'users', userId);
      const userDoc = await safeGetDoc(userRef, `users:${userId}`);

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

      console.log(`💬 Preparing comment notification:`, {
        to: pushToken.substring(0, 20) + '...',
        from: commenterName,
        connectionId,
      });

      // Send push notification via Expo Push Notification service
      const message = {
        to: pushToken,
        sound: 'default',
        title: 'New Comment 💬',
        body: `${commenterName} commented on your post`,
        data: {
          type: 'comment',
          connectionId,
        },
        priority: 'high',
        channelId: 'comments',
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
      console.log(`💬 Comment notification sent to ${commenterName}:`, result);
    } catch (error) {
      console.error('Error broadcasting comment notification:', error);
    }
  }

  /**
   * Broadcast like notification to a specific user via push token
   * This is used to notify the post author when someone likes their post
   */
  async broadcastLikeNotification(
    userId: string,
    likerName: string,
    connectionId: string
  ) {
    try {
      // Skip notifications on web platform (CORS issues + not supported)
      if (Platform.OS === 'web') {
        console.log('⚠️ Push notifications are not supported on web platform');
        return;
      }

      // Check if app is in foreground - if so, don't send push notification
      const appState = AppState.currentState;
      if (appState === 'active') {
        console.log(
          '🔕 Skipping push notification - app is active (like notification will be handled by toast)'
        );
        return;
      }

      // Get the user's push token from Firebase
      const userRef = doc(db, 'users', userId);
      const userDoc = await safeGetDoc(userRef, `users:${userId}`);

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

      console.log(`❤️ Preparing like notification:`, {
        to: pushToken.substring(0, 20) + '...',
        from: likerName,
        connectionId,
      });

      // Send push notification via Expo Push Notification service
      const message = {
        to: pushToken,
        sound: 'default',
        title: 'New Like ❤️',
        body: `${likerName} liked your post`,
        data: {
          type: 'like',
          connectionId,
        },
        priority: 'high',
        channelId: 'likes',
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
      console.log(`❤️ Like notification sent to ${likerName}:`, result);
    } catch (error) {
      console.error('Error broadcasting like notification:', error);
    }
  }

  /**
   * Broadcast claim notification to a specific user via push token
   * This is used to notify the post author when someone claims their post
   */
  async broadcastClaimNotification(
    userId: string,
    claimerName: string,
    connectionId: string
  ) {
    try {
      // Skip notifications on web platform (CORS issues + not supported)
      if (Platform.OS === 'web') {
        console.log('⚠️ Push notifications are not supported on web platform');
        return;
      }

      // Check if app is in foreground - if so, don't send push notification
      const appState = AppState.currentState;
      if (appState === 'active') {
        console.log(
          '🔕 Skipping push notification - app is active (claim notification will be handled by toast)'
        );
        return;
      }

      // Get the user's push token from Firebase
      const userRef = doc(db, 'users', userId);
      const userDoc = await safeGetDoc(userRef, `users:${userId}`);

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

      console.log(`🎯 Preparing claim notification:`, {
        to: pushToken.substring(0, 20) + '...',
        from: claimerName,
        connectionId,
      });

      // Send push notification via Expo Push Notification service
      const message = {
        to: pushToken,
        sound: 'default',
        title: 'New Claim 🎯',
        body: `${claimerName} thinks they know you!`,
        data: {
          type: 'claim',
          connectionId,
        },
        priority: 'high',
        channelId: 'claims',
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
      console.log(`🎯 Claim notification sent to ${claimerName}:`, result);
    } catch (error) {
      console.error('Error broadcasting claim notification:', error);
    }
  }

  /**
   * Load notification enabled setting from storage (legacy method)
   */
  async loadSettingsFromStorage(): Promise<boolean> {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEY);
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        return settings.enabled ?? true;
      }
      return true; // Default to enabled
    } catch (error) {
      console.error('Error loading notification settings from storage:', error);
      return true;
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

  /**
   * Set the currently active chat
   * Call this when a user opens a chat screen
   */
  setActiveChat(chatId: string) {
    this.activeChatId = chatId;
    console.log(`💬 Active chat set: ${chatId}`);
  }

  /**
   * Clear the currently active chat
   * Call this when a user leaves a chat screen
   */
  clearActiveChat() {
    console.log(`💬 Active chat cleared: ${this.activeChatId}`);
    this.activeChatId = null;
  }

  /**
   * Check if a chat is currently active
   */
  isChatActive(chatId: string): boolean {
    return this.activeChatId === chatId;
  }
}

const serviceInstance = new NotificationService();
notificationService = serviceInstance; // Set the reference for the notification handler
export default serviceInstance;
