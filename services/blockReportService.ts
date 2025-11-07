// services/blockReportService.ts
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  addDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from './firebase/config';
import toastService from './toastService';

export interface BlockedUser {
  userId: string;
  blockedUserId: string;
  reason?: string;
  createdAt: Date;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  description?: string;
  type: 'user' | 'message' | 'post';
  targetId: string; // User ID, message ID, or post ID
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  resolution?: string;
}

export type ReportReason =
  | 'inappropriate_content'
  | 'harassment'
  | 'spam'
  | 'fake_profile'
  | 'underage'
  | 'violence'
  | 'hate_speech'
  | 'scam'
  | 'other';

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'harassment', label: 'Harassment or Bullying' },
  { value: 'spam', label: 'Spam or Advertising' },
  { value: 'fake_profile', label: 'Fake Profile or Catfish' },
  { value: 'underage', label: 'Underage User' },
  { value: 'violence', label: 'Threats or Violence' },
  { value: 'hate_speech', label: 'Hate Speech' },
  { value: 'scam', label: 'Scam or Fraud' },
  { value: 'other', label: 'Other' },
];

class BlockReportService {
  /**
   * Block a user
   */
  async blockUser(
    blockedUserId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, message: 'Not authenticated' };
      }

      if (!blockedUserId) {
        console.error('blockUser called without blockedUserId');
        return { success: false, message: 'Invalid target user' };
      }

      if (currentUser.uid === blockedUserId) {
        return { success: false, message: 'Cannot block yourself' };
      }

      // Create block document
      const blockId = `${currentUser.uid}_${blockedUserId}`;
      const blockRef = doc(db, 'blocks', blockId);

      await setDoc(blockRef, {
        userId: currentUser.uid,
        blockedUserId,
        reason: reason || null,
        createdAt: serverTimestamp(),
      });

      // Update user's blockedUsers array
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        blockedUsers: arrayUnion(blockedUserId),
        updatedAt: serverTimestamp(),
      });

      // Unmatch if matched
      await this.unmatchIfMatched(currentUser.uid, blockedUserId);

      // Delete any conversations
      await this.deleteConversations(currentUser.uid, blockedUserId);

      // Ensure both users are excluded from discovery via interactions
      await this.syncBlockedInteractions(currentUser.uid, blockedUserId);

      console.log('✅ User blocked successfully');
      return { success: true, message: 'User blocked successfully' };
    } catch (error) {
      console.error('Error blocking user:', error);
      return {
        success: false,
        message: 'Failed to block user. Please try again.',
      };
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(
    blockedUserId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, message: 'Not authenticated' };
      }

      // Delete block document
      const blockId = `${currentUser.uid}_${blockedUserId}`;
      const blockRef = doc(db, 'blocks', blockId);
      await deleteDoc(blockRef);

      // Update user's blockedUsers array
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        blockedUsers: arrayRemove(blockedUserId),
        updatedAt: serverTimestamp(),
      });

      // Clean up blocked interactions so users can reappear if needed
      await this.removeBlockedInteractions(currentUser.uid, blockedUserId);
      await this.removeBlockedInteractions(blockedUserId, currentUser.uid);

      console.log('✅ User unblocked successfully');
      return { success: true, message: 'User unblocked successfully' };
    } catch (error) {
      console.error('Error unblocking user:', error);
      return {
        success: false,
        message: 'Failed to unblock user. Please try again.',
      };
    }
  }

  /**
   * Check if a user is blocked
   */
  async isUserBlocked(userId: string): Promise<boolean> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;

      const blockId = `${currentUser.uid}_${userId}`;
      const blockRef = doc(db, 'blocks', blockId);
      const blockSnap = await getDoc(blockRef);

      return blockSnap.exists();
    } catch (error) {
      console.error('Error checking if user is blocked:', error);
      return false;
    }
  }

  /**
   * Check if current user is blocked by another user
   */
  async isBlockedBy(userId: string): Promise<boolean> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;

      const blockId = `${userId}_${currentUser.uid}`;
      const blockRef = doc(db, 'blocks', blockId);
      const blockSnap = await getDoc(blockRef);

      return blockSnap.exists();
    } catch (error) {
      console.error('Error checking if blocked by user:', error);
      return false;
    }
  }

  /**
   * Get list of blocked users
   */
  async getBlockedUsers(): Promise<string[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];

      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return userSnap.data().blockedUsers || [];
      }

      return [];
    } catch (error) {
      console.error('Error getting blocked users:', error);
      return [];
    }
  }

  /**
   * Report a user, message, or post
   */
  async reportContent(
    targetId: string,
    targetType: 'user' | 'message' | 'post',
    reason: ReportReason,
    description?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, message: 'Not authenticated' };
      }

      // Validate report target and create report
      if (targetType === 'user' && !targetId) {
        console.error('reportContent called for user but targetId is missing');
        return { success: false, message: 'Invalid report target' };
      }

      const reportRef = doc(collection(db, 'reports'));
      await setDoc(reportRef, {
        reporterId: currentUser.uid,
        reportedUserId: targetType === 'user' ? targetId : null,
        targetId,
        type: targetType,
        reason,
        description: description || null,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      console.log('✅ Content reported successfully');
      return {
        success: true,
        message: 'Thank you for your report. We will review it shortly.',
      };
    } catch (error) {
      console.error('Error reporting content:', error);
      return {
        success: false,
        message: 'Failed to submit report. Please try again.',
      };
    }
  }

  // Helper methods
  private async unmatchIfMatched(
    userId: string,
    targetUserId: string
  ): Promise<void> {
    try {
      // Find and delete match
      const matchId1 = `${userId}_${targetUserId}`;
      const matchId2 = `${targetUserId}_${userId}`;

      const batch = writeBatch(db);

      const match1Ref = doc(db, 'matches', matchId1);
      const match2Ref = doc(db, 'matches', matchId2);

      batch.delete(match1Ref);
      batch.delete(match2Ref);

      await batch.commit();
    } catch (error) {
      console.error('Error unmatching users:', error);
    }
  }

  private async deleteConversations(
    userId: string,
    targetUserId: string
  ): Promise<void> {
    try {
      const convId1 = `conv_${userId}_${targetUserId}`;
      const convId2 = `conv_${targetUserId}_${userId}`;

      const batch = writeBatch(db);

      const conv1Ref = doc(db, 'conversations', convId1);
      const conv2Ref = doc(db, 'conversations', convId2);

      batch.delete(conv1Ref);
      batch.delete(conv2Ref);

      await batch.commit();
    } catch (error) {
      console.error('Error deleting conversations:', error);
    }
  }

  private async syncBlockedInteractions(
    userId: string,
    targetUserId: string
  ): Promise<void> {
    try {
      await Promise.allSettled([
        this.upsertBlockedInteraction(userId, targetUserId),
        this.upsertBlockedInteraction(targetUserId, userId),
      ]);
    } catch (error) {
      console.error('Error syncing blocked interactions:', error);
    }
  }

  private async upsertBlockedInteraction(
    userId: string,
    targetUserId: string
  ): Promise<void> {
    try {
      const interactionQuery = query(
        collection(db, 'interactions'),
        where('userId', '==', userId),
        where('targetUserId', '==', targetUserId)
      );

      const snapshot = await getDocs(interactionQuery);

      if (snapshot.empty) {
        await addDoc(collection(db, 'interactions'), {
          userId,
          targetUserId,
          type: 'blocked',
          createdAt: serverTimestamp(),
        });
      } else {
        const interactionRef = doc(db, 'interactions', snapshot.docs[0].id);
        await updateDoc(interactionRef, {
          type: 'blocked',
          createdAt: serverTimestamp(),
          expiresAt: null,
        });
      }
    } catch (error) {
      console.error('Error upserting blocked interaction:', error);
    }
  }

  private async removeBlockedInteractions(
    userId: string,
    targetUserId: string
  ): Promise<void> {
    try {
      const interactionQuery = query(
        collection(db, 'interactions'),
        where('userId', '==', userId),
        where('targetUserId', '==', targetUserId),
        where('type', '==', 'blocked')
      );

      const snapshot = await getDocs(interactionQuery);
      if (snapshot.empty) {
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.delete(doc(db, 'interactions', docSnap.id));
      });

      await batch.commit();
    } catch (error) {
      console.error('Error removing blocked interactions:', error);
    }
  }
}

export const blockReportService = new BlockReportService();
export default blockReportService;
