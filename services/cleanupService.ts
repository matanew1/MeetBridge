// services/cleanupService.ts
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase/config';

class CleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start periodic cleanup of expired interactions
   */
  startPeriodicCleanup(intervalMinutes: number = 60): void {
    if (this.isRunning) {
      console.log('⚠️ Cleanup service already running');
      return;
    }

    this.isRunning = true;
    console.log(
      `🧹 Starting periodic cleanup service (every ${intervalMinutes} minutes)`
    );

    // Run immediately on start
    this.cleanupExpiredInteractions();

    // Then run periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredInteractions();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop periodic cleanup
   */
  stopPeriodicCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      this.isRunning = false;
      console.log('🛑 Cleanup service stopped');
    }
  }

  /**
   * Cleanup expired interactions
   */
  async cleanupExpiredInteractions(): Promise<number> {
    try {
      console.log('🧹 Running cleanup of expired interactions...');

      const now = Timestamp.now();
      const interactionsRef = collection(db, 'interactions');

      // Query for interactions with expiresAt field that have expired
      const expiredQuery = query(
        interactionsRef,
        where('expiresAt', '<=', now),
        where('type', '==', 'dislike')
      );

      const snapshot = await getDocs(expiredQuery);

      if (snapshot.empty) {
        console.log('✅ No expired interactions to clean up');
        return 0;
      }

      // Batch delete expired interactions
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(`✅ Cleaned up ${snapshot.size} expired interaction(s)`);
      return snapshot.size;
    } catch (error) {
      console.error('❌ Error cleaning up expired interactions:', error);
      return 0;
    }
  }

  /**
   * Cleanup old presence data (optional - for RTDB cleanup)
   */
  async cleanupStalePresence(): Promise<void> {
    try {
      console.log('🧹 Cleaning up stale presence data...');

      const usersRef = collection(db, 'users');
      const staleThreshold = new Date();
      staleThreshold.setHours(staleThreshold.getHours() - 24); // 24 hours

      const staleQuery = query(
        usersRef,
        where('isOnline', '==', true),
        where('lastSeen', '<', Timestamp.fromDate(staleThreshold))
      );

      const snapshot = await getDocs(staleQuery);

      if (snapshot.empty) {
        console.log('✅ No stale presence data to clean up');
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          isOnline: false,
        });
      });

      await batch.commit();

      console.log(`✅ Cleaned up ${snapshot.size} stale presence record(s)`);
    } catch (error) {
      console.error('❌ Error cleaning up stale presence:', error);
    }
  }
}

export default new CleanupService();
