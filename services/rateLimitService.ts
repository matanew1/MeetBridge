// services/rateLimitService.ts
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase/config';

export interface RateLimitConfig {
  likes: number;
  messages: number;
  missedConnections: number;
  reports: number;
}

export interface RateLimitStatus {
  likes: { count: number; remaining: number; resetAt: Date };
  messages: { count: number; remaining: number; resetAt: Date };
  missedConnections: { count: number; remaining: number; resetAt: Date };
  reports: { count: number; remaining: number; resetAt: Date };
}

// Daily limits
const DAILY_LIMITS: RateLimitConfig = {
  likes: 100,
  messages: 200, // Per day for all conversations
  missedConnections: 10,
  reports: 20,
};

// Rate limit types
export type RateLimitType = keyof RateLimitConfig;

class RateLimitService {
  /**
   * Check if user has exceeded rate limit for an action
   */
  async checkRateLimit(
    userId: string,
    action: RateLimitType
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    try {
      const rateLimitDoc = await this.getRateLimitDoc(userId);
      const now = new Date();
      const today = this.getTodayKey();

      // Get current action data
      const actionData = rateLimitDoc[action] || {
        count: 0,
        date: today,
      };

      // Check if we need to reset (new day)
      if (actionData.date !== today) {
        actionData.count = 0;
        actionData.date = today;
      }

      const limit = DAILY_LIMITS[action];
      const remaining = Math.max(0, limit - actionData.count);
      const allowed = actionData.count < limit;

      // Calculate reset time (midnight)
      const resetAt = new Date();
      resetAt.setHours(24, 0, 0, 0);

      return { allowed, remaining, resetAt };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      // On error, allow the action but log it
      return {
        allowed: true,
        remaining: DAILY_LIMITS[action],
        resetAt: new Date(),
      };
    }
  }

  /**
   * Increment the counter for an action
   */
  async incrementCounter(userId: string, action: RateLimitType): Promise<void> {
    try {
      const rateLimitRef = doc(db, 'rate_limits', userId);
      const rateLimitDoc = await this.getRateLimitDoc(userId);
      const today = this.getTodayKey();

      // Get current action data
      const actionData = rateLimitDoc[action] || {
        count: 0,
        date: today,
      };

      // Reset if new day
      if (actionData.date !== today) {
        actionData.count = 1;
        actionData.date = today;
      } else {
        actionData.count += 1;
      }

      // Update Firestore
      await setDoc(
        rateLimitRef,
        {
          [action]: actionData,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error incrementing rate limit counter:', error);
    }
  }

  /**
   * Get all rate limit statuses for a user
   */
  async getRateLimitStatus(userId: string): Promise<RateLimitStatus> {
    try {
      const rateLimitDoc = await this.getRateLimitDoc(userId);
      const today = this.getTodayKey();
      const resetAt = new Date();
      resetAt.setHours(24, 0, 0, 0);

      const status: RateLimitStatus = {
        likes: this.getActionStatus(
          rateLimitDoc.likes,
          'likes',
          today,
          resetAt
        ),
        messages: this.getActionStatus(
          rateLimitDoc.messages,
          'messages',
          today,
          resetAt
        ),
        missedConnections: this.getActionStatus(
          rateLimitDoc.missedConnections,
          'missedConnections',
          today,
          resetAt
        ),
        reports: this.getActionStatus(
          rateLimitDoc.reports,
          'reports',
          today,
          resetAt
        ),
      };

      return status;
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      return this.getDefaultStatus();
    }
  }

  /**
   * Reset rate limits for a user (admin function)
   */
  async resetRateLimits(userId: string): Promise<void> {
    try {
      const rateLimitRef = doc(db, 'rate_limits', userId);
      await setDoc(rateLimitRef, {
        likes: { count: 0, date: this.getTodayKey() },
        messages: { count: 0, date: this.getTodayKey() },
        missedConnections: { count: 0, date: this.getTodayKey() },
        reports: { count: 0, date: this.getTodayKey() },
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error resetting rate limits:', error);
      throw error;
    }
  }

  // Helper methods
  private async getRateLimitDoc(userId: string): Promise<any> {
    const rateLimitRef = doc(db, 'rate_limits', userId);
    const snapshot = await getDoc(rateLimitRef);

    if (snapshot.exists()) {
      return snapshot.data();
    }

    // Initialize new doc
    const today = this.getTodayKey();
    const initialData = {
      likes: { count: 0, date: today },
      messages: { count: 0, date: today },
      missedConnections: { count: 0, date: today },
      reports: { count: 0, date: today },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(rateLimitRef, initialData);
    return initialData;
  }

  private getTodayKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private getActionStatus(
    data: any,
    action: RateLimitType,
    today: string,
    resetAt: Date
  ) {
    if (!data || data.date !== today) {
      return {
        count: 0,
        remaining: DAILY_LIMITS[action],
        resetAt,
      };
    }

    return {
      count: data.count || 0,
      remaining: Math.max(0, DAILY_LIMITS[action] - (data.count || 0)),
      resetAt,
    };
  }

  private getDefaultStatus(): RateLimitStatus {
    const resetAt = new Date();
    resetAt.setHours(24, 0, 0, 0);

    return {
      likes: { count: 0, remaining: DAILY_LIMITS.likes, resetAt },
      messages: { count: 0, remaining: DAILY_LIMITS.messages, resetAt },
      missedConnections: {
        count: 0,
        remaining: DAILY_LIMITS.missedConnections,
        resetAt,
      },
      reports: { count: 0, remaining: DAILY_LIMITS.reports, resetAt },
    };
  }

  /**
   * Get the daily limit for an action
   */
  getLimit(action: RateLimitType): number {
    return DAILY_LIMITS[action];
  }
}

export const rateLimitService = new RateLimitService();
export default rateLimitService;
