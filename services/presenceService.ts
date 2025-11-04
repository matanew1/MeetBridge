// services/presenceService.ts
import {
  ref,
  onValue,
  onDisconnect,
  set,
  serverTimestamp,
  Database,
  DatabaseReference,
  get,
} from 'firebase/database';
import { doc, updateDoc } from 'firebase/firestore';
import { db, realtimeDb } from './firebase/config';

class PresenceService {
  private database: Database | null = null;
  private presenceRef: DatabaseReference | null = null;
  private unsubscribeCallbacks: Map<string, () => void> = new Map();
  private currentUserId: string | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the presence service with Firebase Realtime Database
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized && this.currentUserId === userId) {
      console.log('✅ Presence service already initialized for user:', userId);
      return;
    }

    try {
      console.log('🔄 Initializing presence service for user:', userId);

      // Check if Realtime Database is initialized
      if (!realtimeDb) {
        console.warn(
          '⚠️ Realtime Database not initialized, skipping presence service'
        );
        return;
      }

      // Use the already initialized Realtime Database
      this.database = realtimeDb;
      this.currentUserId = userId;

      // Validate database before creating reference
      if (!this.database) {
        console.warn(
          '⚠️ Database is null after assignment, skipping presence setup'
        );
        return;
      }

      this.presenceRef = ref(this.database, `presence/${userId}`);

      // Validate presenceRef before proceeding
      if (!this.presenceRef) {
        console.warn(
          '⚠️ Failed to create presence reference, skipping presence setup'
        );
        return;
      }

      // Set user as online
      await this.setUserOnline();

      // Setup disconnect handler - automatically set user offline when connection is lost
      try {
        const disconnectRef = onDisconnect(this.presenceRef);
        if (disconnectRef) {
          await disconnectRef.set({
            status: 'offline',
            lastSeen: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (disconnectError) {
        console.warn('⚠️ Failed to setup disconnect handler:', disconnectError);
        // Continue initialization even if disconnect handler fails
      }

      // Listen to our own presence in RTDB and sync to Firestore
      this.syncPresenceToFirestore(userId);

      // Sync presence to Firestore every 30 seconds
      this.startHeartbeat();

      this.isInitialized = true;
      console.log('✅ Presence service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing presence service:', error);
      // Don't throw - allow app to continue even if presence fails
      console.warn('⚠️ Continuing without presence service');
    }
  }

  /**
   * Set user status to online
   */
  private async setUserOnline(): Promise<void> {
    // Validate service initialization
    if (!this.database || !this.currentUserId) {
      console.warn(
        '⚠️ Cannot set user online - service not initialized or user ID missing'
      );
      return;
    }

    // Additional validation to ensure currentUserId is a valid string
    if (
      typeof this.currentUserId !== 'string' ||
      this.currentUserId.trim() === ''
    ) {
      console.error(
        '❌ Invalid currentUserId in setUserOnline:',
        this.currentUserId
      );
      return;
    }

    try {
      const userId = this.currentUserId; // Store in local variable to avoid race conditions

      // Create a fresh reference to avoid stale references
      const presenceRef = ref(this.database, `presence/${userId}`);

      const presenceData = {
        status: 'online',
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Update Realtime Database
      try {
        await set(presenceRef, presenceData);
      } catch (rtdbError) {
        console.warn('⚠️ Error updating RTDB online status:', rtdbError);
      }

      // Update Firestore with additional null check and error handling
      if (db && userId) {
        try {
          const userDocRef = doc(db, 'users', userId);
          await updateDoc(userDocRef, {
            isOnline: true,
            lastSeen: new Date(),
          });
        } catch (firestoreError: any) {
          if (firestoreError?.code === 'permission-denied') {
            console.warn(
              '⚠️ Permission denied updating Firestore online status'
            );
          } else {
            console.warn(
              '⚠️ Error updating Firestore online status:',
              firestoreError
            );
          }
        }
      }

      console.log('✅ User set to online');
    } catch (error) {
      console.error('❌ Error setting user online:', error);
    }
  }

  /**
   * Set user status to offline
   */
  async setUserOffline(): Promise<void> {
    // Validate service initialization
    if (!this.database || !this.currentUserId) {
      console.warn(
        '⚠️ Cannot set user offline - service not initialized or user ID missing'
      );
      return;
    }

    // Additional validation to ensure currentUserId is a valid string
    if (
      typeof this.currentUserId !== 'string' ||
      this.currentUserId.trim() === ''
    ) {
      console.error('❌ Invalid currentUserId:', this.currentUserId);
      return;
    }

    try {
      const userId = this.currentUserId; // Store in local variable to avoid race conditions

      // Create a fresh reference to avoid stale references
      const presenceRef = ref(this.database, `presence/${userId}`);

      const presenceData = {
        status: 'offline',
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Update Realtime Database first
      try {
        await set(presenceRef, presenceData);
      } catch (rtdbError) {
        console.warn('⚠️ Error updating RTDB offline status:', rtdbError);
      }

      // Update Firestore with additional null check and error handling
      if (db && userId) {
        try {
          const userDocRef = doc(db, 'users', userId);
          await updateDoc(userDocRef, {
            isOnline: false,
            lastSeen: new Date(),
          });
        } catch (firestoreError: any) {
          // Ignore permission denied errors during logout
          if (firestoreError?.code === 'permission-denied') {
            console.warn(
              '⚠️ Permission denied updating Firestore offline status (expected during logout)'
            );
          } else {
            console.warn(
              '⚠️ Error updating Firestore offline status:',
              firestoreError
            );
          }
        }
      }

      console.log('✅ User set to offline');
    } catch (error) {
      console.error('❌ Error setting user offline:', error);
    }
  }

  /**
   * Sync presence from Realtime Database to Firestore in real-time
   * This ensures Firestore always reflects the RTDB presence state
   */
  private syncPresenceToFirestore(userId: string): void {
    if (!this.database) {
      console.warn('⚠️ Cannot sync presence - database not initialized');
      return;
    }

    const userPresenceRef = ref(this.database, `presence/${userId}`);

    // Listen to RTDB changes and sync to Firestore
    const unsubscribe = onValue(
      userPresenceRef,
      async (snapshot) => {
        const data = snapshot.val();

        try {
          const userDocRef = doc(db, 'users', userId);

          if (data && data.status === 'online') {
            // User is online in RTDB, update Firestore
            try {
              await updateDoc(userDocRef, {
                isOnline: true,
                lastSeen: new Date(),
              });
              console.log('✅ Synced online status to Firestore');
            } catch (updateError: any) {
              if (updateError?.code === 'permission-denied') {
                console.warn(
                  '⚠️ Permission denied syncing online status (user may be logged out)'
                );
              } else {
                throw updateError;
              }
            }
          } else if (data && data.status === 'offline') {
            // User is offline in RTDB, update Firestore
            const lastSeenDate = data.lastSeen
              ? new Date(data.lastSeen)
              : new Date();
            try {
              await updateDoc(userDocRef, {
                isOnline: false,
                lastSeen: lastSeenDate,
              });
              console.log('✅ Synced offline status to Firestore');
            } catch (updateError: any) {
              if (updateError?.code === 'permission-denied') {
                console.warn(
                  '⚠️ Permission denied syncing offline status (user may be logged out)'
                );
              } else {
                throw updateError;
              }
            }
          }
        } catch (error: any) {
          // Only log non-permission errors
          if (error?.code !== 'permission-denied') {
            console.error('❌ Error syncing presence to Firestore:', error);
          }
        }
      },
      (error) => {
        console.error('❌ Error in presence sync listener:', error);
      }
    );

    // Store the unsubscribe function
    this.unsubscribeCallbacks.set(`sync-${userId}`, unsubscribe);
  }

  /**
   * Start heartbeat to sync presence with Firestore
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      if (!this.database || !this.currentUserId) return;

      // Validate currentUserId is a valid string
      if (
        typeof this.currentUserId !== 'string' ||
        this.currentUserId.trim() === ''
      ) {
        console.error(
          '❌ Invalid currentUserId in heartbeat:',
          this.currentUserId
        );
        return;
      }

      try {
        const userId = this.currentUserId; // Store in local variable
        const presenceRef = ref(this.database, `presence/${userId}`);

        // Check if user is still connected to Realtime Database
        const snapshot = await get(presenceRef);
        const presenceData = snapshot.val();

        if (presenceData?.status === 'online' && db && userId) {
          // Update Firestore to keep it in sync
          const userDocRef = doc(db, 'users', userId);
          await updateDoc(userDocRef, {
            isOnline: true,
            lastSeen: new Date(),
          });

          // Update Realtime Database timestamp
          await set(this.presenceRef, {
            status: 'online',
            lastSeen: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          console.log('💓 Heartbeat: Presence synced');
        }
      } catch (error) {
        console.warn('⚠️ Heartbeat error:', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Listen to another user's presence status
   * Primarily uses Realtime Database with Firestore as backup
   */
  listenToUserPresence(
    userId: string,
    callback: (isOnline: boolean, lastSeen: Date | null) => void
  ): () => void {
    if (!this.database) {
      console.warn('⚠️ Cannot listen to presence - database not initialized');
      return () => {};
    }

    const userPresenceRef = ref(this.database, `presence/${userId}`);
    let hasReceivedRTDBData = false;

    // Listen to Realtime Database for instant updates
    const rtdbUnsubscribe = onValue(
      userPresenceRef,
      (snapshot) => {
        const data = snapshot.val();
        hasReceivedRTDBData = true;

        if (data) {
          const isOnline = data.status === 'online';
          const lastSeen = data.lastSeen ? new Date(data.lastSeen) : null;
          callback(isOnline, lastSeen);
        } else {
          // User presence data doesn't exist in RTDB - check Firestore
          this.getUserPresenceFromFirestore(userId).then(
            ({ isOnline, lastSeen }) => {
              callback(isOnline, lastSeen);
            }
          );
        }
      },
      (error) => {
        console.error('❌ Error listening to user presence:', error);
        // Fallback to Firestore on error
        this.getUserPresenceFromFirestore(userId).then(
          ({ isOnline, lastSeen }) => {
            callback(isOnline, lastSeen);
          }
        );
      }
    );

    // If no RTDB data received after 2 seconds, check Firestore
    const fallbackTimeout = setTimeout(() => {
      if (!hasReceivedRTDBData) {
        this.getUserPresenceFromFirestore(userId).then(
          ({ isOnline, lastSeen }) => {
            callback(isOnline, lastSeen);
          }
        );
      }
    }, 2000);

    // Combined unsubscribe function
    const combinedUnsubscribe = () => {
      clearTimeout(fallbackTimeout);
      rtdbUnsubscribe();
    };

    // Store unsubscribe function
    this.unsubscribeCallbacks.set(userId, combinedUnsubscribe);

    return combinedUnsubscribe;
  }

  /**
   * Get user presence from Firestore (fallback method)
   */
  private async getUserPresenceFromFirestore(userId: string): Promise<{
    isOnline: boolean;
    lastSeen: Date | null;
  }> {
    try {
      const { doc: firestoreDoc, getDoc } = await import('firebase/firestore');
      const userDocRef = firestoreDoc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          isOnline: data.isOnline || false,
          lastSeen: data.lastSeen?.toDate?.() || null,
        };
      }

      return { isOnline: false, lastSeen: null };
    } catch (error) {
      console.error('❌ Error getting presence from Firestore:', error);
      return { isOnline: false, lastSeen: null };
    }
  }

  /**
   * Stop listening to a user's presence
   */
  stopListeningToUser(userId: string): void {
    const unsubscribe = this.unsubscribeCallbacks.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribeCallbacks.delete(userId);
      console.log(`🛑 Stopped listening to user ${userId} presence`);
    }
  }

  /**
   * Get user's current online status (one-time check)
   */
  async getUserPresence(userId: string): Promise<{
    isOnline: boolean;
    lastSeen: Date | null;
  }> {
    if (!this.database) {
      console.warn('⚠️ Cannot get presence - database not initialized');
      return { isOnline: false, lastSeen: null };
    }

    try {
      const userPresenceRef = ref(this.database, `presence/${userId}`);
      const snapshot = await get(userPresenceRef);
      const data = snapshot.val();

      if (data) {
        return {
          isOnline: data.status === 'online',
          lastSeen: data.lastSeen ? new Date(data.lastSeen) : null,
        };
      }

      return { isOnline: false, lastSeen: null };
    } catch (error) {
      console.error('❌ Error getting user presence:', error);
      return { isOnline: false, lastSeen: null };
    }
  }

  /**
   * Check if user was recently active (within last 5 minutes)
   */
  isRecentlyActive(lastSeen: Date | null): boolean {
    if (!lastSeen) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeen > fiveMinutesAgo;
  }

  /**
   * Get formatted last seen time
   */
  getLastSeenText(lastSeen: Date | null, isOnline: boolean): string {
    if (isOnline) return 'Online';
    if (!lastSeen) return 'Offline';

    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return 'Long time ago';
  }

  /**
   * Cleanup and disconnect
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up presence service');

    try {
      // Stop heartbeat first to prevent any new updates
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      // Set user offline before unsubscribing listeners
      // This ensures the offline status is written while we still have permissions
      try {
        await this.setUserOffline();
      } catch (offlineError) {
        console.warn(
          '⚠️ Error setting user offline during cleanup:',
          offlineError
        );
      }

      // Unsubscribe from all listeners (including sync listener)
      // Do this after setting offline to prevent permission errors
      this.unsubscribeCallbacks.forEach((unsubscribe) => {
        try {
          unsubscribe();
        } catch (unsubError) {
          console.warn('⚠️ Error unsubscribing listener:', unsubError);
        }
      });
      this.unsubscribeCallbacks.clear();

      // Give a brief moment for any pending writes to complete
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Reset state
      this.database = null;
      this.presenceRef = null;
      this.currentUserId = null;
      this.isInitialized = false;

      console.log('✅ Presence service cleaned up');
    } catch (error) {
      console.error('❌ Error during presence service cleanup:', error);
      // Force reset even if cleanup fails
      this.database = null;
      this.presenceRef = null;
      this.currentUserId = null;
      this.isInitialized = false;
      this.unsubscribeCallbacks.clear();
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    }
  }
}

// Export singleton instance
export const presenceService = new PresenceService();
export default presenceService;
