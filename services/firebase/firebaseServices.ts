// services/firebase/firebaseServices.ts
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
  orderBy,
  limit,
  serverTimestamp,
  addDoc,
  writeBatch,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  deleteUser,
  User as FirebaseUser,
} from 'firebase/auth';
import { db, auth } from './config';
import {
  IUserProfileService,
  IDiscoveryService,
  IMatchingService,
  IChatService,
  IAuthService,
  ApiResponse,
} from '../interfaces';
import {
  User,
  SearchFilters,
  Conversation,
  ChatMessage,
} from '../../store/types';
import storageService from '../storageService';
import LocationService from '../locationService';

// ============================================
// Utility Functions
// ============================================

/**
 * Convert Firestore timestamps to JavaScript Date objects
 */
const convertTimestamp = (timestamp: any): Date | undefined => {
  if (timestamp?.toDate) return timestamp.toDate();
  if (timestamp?.seconds) return new Date(timestamp.seconds * 1000);
  return timestamp;
};

// ============================================
// Firebase User Profile Service
// ============================================
export class FirebaseUserProfileService implements IUserProfileService {
  /**
   * Get the current authenticated user's profile
   */
  async getCurrentUser(): Promise<ApiResponse<User | null>> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { data: null, success: true, message: 'No user logged in' };
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        return { data: null, success: true, message: 'User profile not found' };
      }

      const userData = userDoc.data();
      return {
        data: {
          id: userDoc.id,
          ...userData,
          lastSeen: convertTimestamp(userData.lastSeen),
        } as User,
        success: true,
        message: 'User profile retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return {
        data: null,
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get user profile',
      };
    }
  }

  /**
   * Update user profile with automatic image upload to Cloudinary
   */
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const dataToUpdate: Record<string, any> = { ...userData };

      // Handle image upload if it's a local file or base64
      if (
        typeof dataToUpdate.image === 'string' &&
        (dataToUpdate.image.startsWith('file://') ||
          dataToUpdate.image.startsWith('content://') ||
          dataToUpdate.image.startsWith('data:') ||
          dataToUpdate.image.startsWith('/'))
      ) {
        console.log('📤 Uploading image to Cloudinary...');
        const uploadResult = await storageService.uploadImage(
          dataToUpdate.image
        );

        if (uploadResult.success && uploadResult.secureUrl) {
          dataToUpdate.image = uploadResult.secureUrl;
          console.log('✅ Image uploaded:', dataToUpdate.image);
        } else {
          throw new Error(uploadResult.message || 'Image upload failed');
        }
      }

      // Handle geohash update if coordinates changed
      if (dataToUpdate.coordinates) {
        const { latitude, longitude } = dataToUpdate.coordinates;
        dataToUpdate.geohash = LocationService.generateGeohash(
          latitude,
          longitude
        );
        console.log('📍 Generated geohash:', dataToUpdate.geohash);
      }

      // Remove undefined fields
      Object.keys(dataToUpdate).forEach((key) => {
        if (dataToUpdate[key] === undefined) {
          delete dataToUpdate[key];
        }
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp(),
      });

      // Get updated document
      const updatedDoc = await getDoc(userRef);
      const updatedUserData = updatedDoc.data();

      return {
        data: {
          id: updatedDoc.id,
          ...updatedUserData,
          lastSeen: convertTimestamp(updatedUserData?.lastSeen),
          updatedAt: convertTimestamp(updatedUserData?.updatedAt),
        } as User,
        success: true,
        message: 'Profile updated successfully',
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        data: {} as User,
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update profile',
      };
    }
  }

  /**
   * Upload profile image to Cloudinary
   */
  async uploadProfileImage(
    imageBlob: Blob | string
  ): Promise<ApiResponse<string>> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const uploadResult = await storageService.uploadImage(
        typeof imageBlob === 'string'
          ? imageBlob
          : URL.createObjectURL(imageBlob)
      );

      if (!uploadResult.success || !uploadResult.secureUrl) {
        throw new Error(uploadResult.message || 'Image upload failed');
      }

      // Update user's profile with new image URL
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        image: uploadResult.secureUrl,
        updatedAt: serverTimestamp(),
      });

      return {
        data: uploadResult.secureUrl,
        success: true,
        message: 'Image uploaded successfully',
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        data: '',
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to upload image',
      };
    }
  }

  /**
   * Delete user profile
   */
  async deleteProfile(userId: string): Promise<ApiResponse<boolean>> {
    try {
      const user = auth.currentUser;
      if (!user || user.uid !== userId) {
        throw new Error('Unauthorized to delete this profile');
      }

      await deleteDoc(doc(db, 'users', userId));

      return {
        data: true,
        success: true,
        message: 'Profile deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting profile:', error);
      return {
        data: false,
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete profile',
      };
    }
  }
}

// ============================================
// Firebase Discovery Service
// ============================================
export class FirebaseDiscoveryService implements IDiscoveryService {
  /**
   * Populate discovery queue for a user
   * This should be called periodically or when queue is empty
   */
  private async populateDiscoveryQueue(
    userId: string,
    filters: SearchFilters,
    count: number = 50
  ): Promise<void> {
    try {
      // Get current user's data
      const currentUserDoc = await getDoc(doc(db, 'users', userId));
      if (!currentUserDoc.exists()) return;

      const currentUserData = currentUserDoc.data();
      const userLocation = currentUserData?.coordinates;

      if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
        console.warn(
          'User location not set, cannot populate queue',
          userLocation
        );
        return;
      }

      // Get existing profiles in queue using HashMap for O(1) lookup
      const existingQueueQuery = query(
        collection(db, 'discovery_queue'),
        where('userId', '==', userId),
        where('shown', '==', false)
      );
      const existingQueueSnapshot = await getDocs(existingQueueQuery);

      // Use Map for faster lookups and storing metadata
      const existingProfilesMap = new Map<
        string,
        {
          docId: string;
          addedAt: any;
          score: number;
        }
      >();

      existingQueueSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        existingProfilesMap.set(data.profileId, {
          docId: doc.id,
          addedAt: data.addedAt,
          score: data.score || 0,
        });
      });

      console.log(
        `📋 Found ${existingProfilesMap.size} existing profiles in queue (using HashMap)`
      );

      // Get existing interactions to exclude (likes and non-expired dislikes)
      const interactionsQuery = query(
        collection(db, 'interactions'),
        where('userId', '==', userId)
      );
      const interactionsSnapshot = await getDocs(interactionsQuery);

      const now = new Date();
      const interactedUserIds = new Set<string>();
      const expiredDislikeIds: string[] = [];

      interactionsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const targetUserId = data.targetUserId;

        // Check if it's a dislike with expiration
        if (data.type === 'dislike' && data.expiresAt) {
          const expiresAt = data.expiresAt.toDate
            ? data.expiresAt.toDate()
            : new Date(data.expiresAt);

          // If expired, mark for deletion and don't exclude
          if (expiresAt <= now) {
            console.log(
              `⏰ Dislike for ${targetUserId} has expired, will be deleted`
            );
            expiredDislikeIds.push(doc.id);
            return; // Don't add to exclusion set
          }
        }

        // Add to exclusion set (likes and non-expired dislikes)
        interactedUserIds.add(targetUserId);
      });

      // Delete expired dislikes in the background
      if (expiredDislikeIds.length > 0) {
        console.log(`🗑️ Deleting ${expiredDislikeIds.length} expired dislikes`);
        const deletePromises = expiredDislikeIds.map((docId) =>
          deleteDoc(doc(db, 'interactions', docId))
        );
        Promise.all(deletePromises).catch((error) =>
          console.error('Error deleting expired dislikes:', error)
        );
      }

      // Get existing matches to exclude
      const matchesQuery1 = query(
        collection(db, 'matches'),
        where('user1', '==', userId),
        where('unmatched', '==', false)
      );
      const matchesQuery2 = query(
        collection(db, 'matches'),
        where('user2', '==', userId),
        where('unmatched', '==', false)
      );
      const [matches1, matches2] = await Promise.all([
        getDocs(matchesQuery1),
        getDocs(matchesQuery2),
      ]);

      const matchedUserIds = new Set<string>();
      matches1.docs.forEach((doc) => matchedUserIds.add(doc.data().user2));
      matches2.docs.forEach((doc) => matchedUserIds.add(doc.data().user1));

      // Get geohash query bounds
      const bounds = LocationService.getQueryBounds(
        userLocation,
        filters.maxDistance
      );

      const potentialProfiles: Array<{
        profile: User;
        distance: number;
        score: number;
      }> = [];

      // Query each geohash range
      for (const bound of bounds) {
        const [startHash, endHash] = bound;

        const q = query(
          collection(db, 'users'),
          where('geohash', '>=', startHash),
          where('geohash', '<=', endHash),
          limit(100)
        );

        const snapshot = await getDocs(q);

        snapshot.forEach((docSnapshot) => {
          // Skip current user, already interacted, matched users, and already queued users
          // Using Map.has() for O(1) lookup instead of array iteration
          if (
            docSnapshot.id === userId ||
            interactedUserIds.has(docSnapshot.id) ||
            matchedUserIds.has(docSnapshot.id) ||
            existingProfilesMap.has(docSnapshot.id)
          ) {
            return;
          }

          const data = docSnapshot.data();

          // Validate and filter
          if (!data || typeof data.age !== 'number' || !data.gender) return;

          const matchesGender =
            filters.gender === 'both' || data.gender === filters.gender;
          const matchesAge =
            data.age >= filters.ageRange[0] && data.age <= filters.ageRange[1];

          if (!matchesGender || !matchesAge) return;

          // Calculate distance and score
          if (data.coordinates?.latitude && data.coordinates?.longitude) {
            try {
              const distance = LocationService.calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                data.coordinates.latitude,
                data.coordinates.longitude
              );

              if (distance > filters.maxDistance) return;

              // Calculate compatibility score (0-100)
              const score = this.calculateCompatibilityScore(
                currentUserData,
                data,
                distance
              );

              potentialProfiles.push({
                profile: {
                  id: docSnapshot.id,
                  ...data,
                  distance,
                  lastSeen: convertTimestamp(data.lastSeen),
                } as User,
                distance,
                score,
              });
            } catch (error) {
              console.warn(
                `Error processing profile ${docSnapshot.id}:`,
                error
              );
            }
          }
        });
      }

      // Sort by score and take top profiles
      const topProfiles = potentialProfiles
        .sort((a, b) => b.score - a.score)
        .slice(0, count);

      // Add to discovery queue
      const batch = writeBatch(db);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days

      topProfiles.forEach(({ profile, distance, score }) => {
        const queueRef = doc(collection(db, 'discovery_queue'));
        batch.set(queueRef, {
          userId,
          profileId: profile.id,
          distance,
          score,
          addedAt: serverTimestamp(),
          expiresAt,
          shown: false,
        });
      });

      await batch.commit();
      console.log(`Added ${topProfiles.length} profiles to discovery queue`);
    } catch (error) {
      console.error('Error populating discovery queue:', error);
    }
  }

  /**
   * Calculate compatibility score between users
   */
  private calculateCompatibilityScore(
    currentUser: any,
    targetUser: any,
    distance: number
  ): number {
    let score = 100;

    // Distance factor (closer is better) - max 30 points deduction
    const distanceKm = distance / 1000;
    score -= Math.min(distanceKm * 2, 30);

    // Age difference factor - max 20 points deduction
    const ageDiff = Math.abs((currentUser.age || 25) - (targetUser.age || 25));
    score -= Math.min(ageDiff * 2, 20);

    // Common interests - add up to 20 points
    if (currentUser.interests && targetUser.interests) {
      const commonInterests = currentUser.interests.filter((interest: string) =>
        targetUser.interests.includes(interest)
      );
      score += Math.min(commonInterests.length * 4, 20);
    }

    // Online status bonus - 10 points
    if (targetUser.isOnline) {
      score += 10;
    }

    // Has photo bonus - 10 points
    if (
      targetUser.image ||
      (targetUser.images && targetUser.images.length > 0)
    ) {
      score += 10;
    }

    // Has bio bonus - 5 points
    if (targetUser.bio && targetUser.bio.length > 20) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get discover profiles from queue (primary method)
   */
  async getDiscoverProfiles(
    filters: SearchFilters,
    page: number = 1
  ): Promise<ApiResponse<User[]>> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const pageSize = 20;

      // Check discovery queue first
      const queueQuery = query(
        collection(db, 'discovery_queue'),
        where('userId', '==', user.uid),
        where('shown', '==', false),
        limit(pageSize)
      );

      const queueSnapshot = await getDocs(queueQuery);

      // If queue is empty or has less than 5 profiles, repopulate
      if (queueSnapshot.size < 5) {
        console.log('Discovery queue low, repopulating...');
        await this.populateDiscoveryQueue(user.uid, filters, 50);

        // Fetch again after populating
        const newQueueSnapshot = await getDocs(queueQuery);

        if (newQueueSnapshot.empty) {
          // Queue still empty, fall back to direct query
          console.log(
            'Queue still empty after repopulation, using direct query'
          );
          return this.getDiscoverProfilesDirect(filters, page);
        }

        return this.getProfilesFromQueue(newQueueSnapshot, pageSize, page);
      }

      return this.getProfilesFromQueue(queueSnapshot, pageSize, page);
    } catch (error) {
      console.error('Error getting discover profiles:', error);
      return {
        data: [],
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get profiles',
      };
    }
  }

  /**
   * Helper to get profiles from queue snapshot
   */
  private async getProfilesFromQueue(
    queueSnapshot: any,
    pageSize: number,
    page: number
  ): Promise<ApiResponse<User[]>> {
    const profiles: User[] = [];
    const seenProfileIds = new Set<string>();

    // Deduplicate profile IDs from queue
    const profileIds = queueSnapshot.docs
      .map((doc: any) => doc.data().profileId)
      .filter((profileId: string) => {
        if (seenProfileIds.has(profileId)) {
          console.warn(
            `⚠️ Duplicate profile ${profileId} found in queue, skipping`
          );
          return false;
        }
        seenProfileIds.add(profileId);
        return true;
      });

    // Fetch actual profile data
    for (const profileId of profileIds) {
      try {
        const profileDoc = await getDoc(doc(db, 'users', profileId));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          profiles.push({
            id: profileDoc.id,
            ...data,
            lastSeen: convertTimestamp(data.lastSeen),
          } as User);
        }
      } catch (error) {
        console.warn(`Error fetching profile ${profileId}:`, error);
      }
    }

    return {
      data: profiles,
      success: true,
      message: 'Profiles retrieved successfully',
      pagination: {
        page,
        limit: pageSize,
        total: profiles.length,
        hasMore: queueSnapshot.size >= pageSize,
      },
    };
  }

  /**
   * Mark profile as shown in discovery queue
   */
  async markProfileAsShown(userId: string, profileId: string): Promise<void> {
    try {
      const queueQuery = query(
        collection(db, 'discovery_queue'),
        where('userId', '==', userId),
        where('profileId', '==', profileId)
      );

      const queueSnapshot = await getDocs(queueQuery);

      if (!queueSnapshot.empty) {
        await updateDoc(queueSnapshot.docs[0].ref, {
          shown: true,
          shownAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error marking profile as shown:', error);
    }
  }

  /**
   * Remove profile from discovery queue (called after like/dislike/match)
   */
  async removeFromQueue(userId: string, profileId: string): Promise<void> {
    try {
      const queueQuery = query(
        collection(db, 'discovery_queue'),
        where('userId', '==', userId),
        where('profileId', '==', profileId)
      );

      const queueSnapshot = await getDocs(queueQuery);

      if (queueSnapshot.empty) {
        return; // Nothing to remove
      }

      const batch = writeBatch(db);
      queueSnapshot.docs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });

      await batch.commit();
      console.log(`🗑️ Removed profile ${profileId} from discovery queue`);
    } catch (error) {
      console.error('Error removing from queue:', error);
    }
  }

  /**
   * Clear all discovery queue entries for a user (useful when filters change)
   */
  async clearDiscoveryQueue(userId: string): Promise<void> {
    try {
      const queueQuery = query(
        collection(db, 'discovery_queue'),
        where('userId', '==', userId)
      );

      const queueSnapshot = await getDocs(queueQuery);

      if (queueSnapshot.empty) {
        return;
      }

      const batch = writeBatch(db);
      queueSnapshot.docs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });

      await batch.commit();
      console.log(
        `🧹 Cleared ${queueSnapshot.size} profiles from discovery queue`
      );
    } catch (error) {
      console.error('Error clearing discovery queue:', error);
    }
  }

  /**
   * Clean duplicate entries in discovery queue for a user using HashMap
   * Keeps the most recent entry for each unique profileId
   */
  async cleanDuplicatesInQueue(userId: string): Promise<number> {
    try {
      const queueQuery = query(
        collection(db, 'discovery_queue'),
        where('userId', '==', userId)
      );

      const queueSnapshot = await getDocs(queueQuery);

      if (queueSnapshot.empty) {
        return 0;
      }

      // Use HashMap to group by profileId - O(n) instead of O(n²)
      const profileMap = new Map<string, Array<{ id: string; data: any }>>();

      queueSnapshot.docs.forEach((doc) => {
        const profileId = doc.data().profileId;
        if (!profileMap.has(profileId)) {
          profileMap.set(profileId, []);
        }
        profileMap.get(profileId)!.push({ id: doc.id, data: doc.data() });
      });

      // Find duplicates using Set for O(1) lookups
      const duplicatesToDelete = new Set<string>();

      profileMap.forEach((docs, profileId) => {
        if (docs.length > 1) {
          // Sort by addedAt timestamp, keep the most recent
          docs.sort((a, b) => {
            const timeA = a.data.addedAt?.toMillis?.() || 0;
            const timeB = b.data.addedAt?.toMillis?.() || 0;
            return timeB - timeA; // Descending (newest first)
          });

          // Delete all except the first (most recent) using Set
          for (let i = 1; i < docs.length; i++) {
            duplicatesToDelete.add(docs[i].id);
          }

          console.log(
            `🔍 Found ${docs.length - 1} duplicate(s) for profile ${profileId}`
          );
        }
      });

      if (duplicatesToDelete.size === 0) {
        console.log('✅ No duplicates found in discovery queue');
        return 0;
      }

      // Delete duplicates in batches
      const batch = writeBatch(db);
      duplicatesToDelete.forEach((docId) => {
        batch.delete(doc(db, 'discovery_queue', docId));
      });

      await batch.commit();
      console.log(
        `🗑️ Cleaned ${duplicatesToDelete.size} duplicate entries from discovery queue (using Set)`
      );

      return duplicatesToDelete.size;
    } catch (error) {
      console.error('Error cleaning duplicates in queue:', error);
      return 0;
    }
  }

  /**
   * Synchronize discovery queue with current interactions and matches
   * Removes profiles that should not be in queue based on:
   * - Existing interactions (likes, non-expired dislikes)
   * - Existing matches
   * - Self (user's own profile)
   */
  async syncDiscoveryQueue(userId: string): Promise<number> {
    try {
      console.log(`🔄 Starting queue sync for user ${userId}`);

      // Get all queue entries for user
      const queueQuery = query(
        collection(db, 'discovery_queue'),
        where('userId', '==', userId)
      );
      const queueSnapshot = await getDocs(queueQuery);

      if (queueSnapshot.empty) {
        console.log('📭 Queue is empty, nothing to sync');
        return 0;
      }

      console.log(`📋 Found ${queueSnapshot.size} profiles in queue`);

      // Get interactions to check
      const interactionsQuery = query(
        collection(db, 'interactions'),
        where('userId', '==', userId)
      );
      const interactionsSnapshot = await getDocs(interactionsQuery);

      const now = new Date();
      const interactedUserIds = new Set<string>();

      interactionsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const targetUserId = data.targetUserId;

        // Check if it's a dislike with expiration
        if (data.type === 'dislike' && data.expiresAt) {
          const expiresAt = data.expiresAt.toDate
            ? data.expiresAt.toDate()
            : new Date(data.expiresAt);

          // If expired, don't exclude
          if (expiresAt <= now) {
            return; // Skip expired dislikes
          }
        }

        // Add to exclusion set (likes and non-expired dislikes)
        interactedUserIds.add(targetUserId);
      });

      // Get matches to check
      const matchesQuery1 = query(
        collection(db, 'matches'),
        where('user1', '==', userId),
        where('unmatched', '==', false)
      );
      const matchesQuery2 = query(
        collection(db, 'matches'),
        where('user2', '==', userId),
        where('unmatched', '==', false)
      );
      const [matches1, matches2] = await Promise.all([
        getDocs(matchesQuery1),
        getDocs(matchesQuery2),
      ]);

      const matchedUserIds = new Set<string>();
      matches1.docs.forEach((doc) => matchedUserIds.add(doc.data().user2));
      matches2.docs.forEach((doc) => matchedUserIds.add(doc.data().user1));

      console.log(
        `🔍 Found ${interactedUserIds.size} interactions and ${matchedUserIds.size} matches`
      );

      // Find profiles that should be removed - using Set for O(1) add operations
      const profilesToRemove = new Set<string>();

      queueSnapshot.docs.forEach((doc) => {
        const profileId = doc.data().profileId;

        // Check if should be removed using Set.has() for O(1) lookup
        if (
          profileId === userId || // User's own profile
          interactedUserIds.has(profileId) || // Already interacted (O(1))
          matchedUserIds.has(profileId) // Already matched (O(1))
        ) {
          profilesToRemove.add(doc.id); // O(1) add
        }
      });

      if (profilesToRemove.size === 0) {
        console.log('✅ Queue is already in sync');
        return 0;
      }

      console.log(
        `🗑️ Removing ${profilesToRemove.size} profiles from queue (using Set)`
      );

      // Remove invalid entries in batches
      const batch = writeBatch(db);
      profilesToRemove.forEach((docId) => {
        batch.delete(doc(db, 'discovery_queue', docId));
      });

      await batch.commit();

      console.log(
        `✅ Queue sync complete! Removed ${profilesToRemove.size} profiles`
      );

      return profilesToRemove.length;
    } catch (error) {
      console.error('Error syncing discovery queue:', error);
      return 0;
    }
  }

  /**
   * Legacy method - fallback for direct geohash queries
   */
  private async getDiscoverProfilesDirect(
    filters: SearchFilters,
    page: number = 1
  ): Promise<ApiResponse<User[]>> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Get current user's location
      const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
      if (!currentUserDoc.exists()) {
        throw new Error('Current user not found');
      }

      const currentUserData = currentUserDoc.data();
      const userLocation = currentUserData?.coordinates;

      // If user doesn't have location, fall back to basic query without location
      if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
        console.warn('User location not set, using basic query', userLocation);
        return this.getDiscoverProfilesBasic(filters, page, user.uid);
      }

      // IMPORTANT: Get existing interactions to exclude (likes and non-expired dislikes)
      const interactionsQuery = query(
        collection(db, 'interactions'),
        where('userId', '==', user.uid)
      );
      const interactionsSnapshot = await getDocs(interactionsQuery);

      const now = new Date();
      const interactedUserIds = new Set<string>();

      interactionsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const targetUserId = data.targetUserId;

        // Check if it's a dislike with expiration
        if (data.type === 'dislike' && data.expiresAt) {
          const expiresAt = data.expiresAt.toDate
            ? data.expiresAt.toDate()
            : new Date(data.expiresAt);

          // If expired, don't exclude
          if (expiresAt <= now) {
            console.log(
              `⏰ Dislike for ${targetUserId} has expired (direct query)`
            );
            return; // Don't add to exclusion set
          }
        }

        // Add to exclusion set (likes and non-expired dislikes)
        interactedUserIds.add(targetUserId);
      });

      // Get existing matches to exclude
      const matchesQuery1 = query(
        collection(db, 'matches'),
        where('user1', '==', user.uid),
        where('unmatched', '==', false)
      );
      const matchesQuery2 = query(
        collection(db, 'matches'),
        where('user2', '==', user.uid),
        where('unmatched', '==', false)
      );
      const [matches1, matches2] = await Promise.all([
        getDocs(matchesQuery1),
        getDocs(matchesQuery2),
      ]);

      const matchedUserIds = new Set<string>();
      matches1.docs.forEach((doc) => matchedUserIds.add(doc.data().user2));
      matches2.docs.forEach((doc) => matchedUserIds.add(doc.data().user1));

      console.log(
        `🔍 Direct Query - Excluding ${interactedUserIds.size} interacted + ${matchedUserIds.size} matched users`
      );

      // Get geohash query bounds for the search radius
      const bounds = LocationService.getQueryBounds(
        userLocation,
        filters.maxDistance
      );

      const profiles: User[] = [];
      const pageSize = 20;
      const seenIds = new Set<string>([user.uid]); // Track seen profiles to avoid duplicates

      // Query each geohash range
      for (const bound of bounds) {
        const [startHash, endHash] = bound;

        const q = query(
          collection(db, 'users'),
          where('geohash', '>=', startHash),
          where('geohash', '<=', endHash),
          limit(pageSize)
        );

        const snapshot = await getDocs(q);

        snapshot.forEach((docSnapshot) => {
          // Skip current user, already seen, interacted, and matched profiles
          if (
            seenIds.has(docSnapshot.id) ||
            interactedUserIds.has(docSnapshot.id) ||
            matchedUserIds.has(docSnapshot.id)
          ) {
            return;
          }
          seenIds.add(docSnapshot.id);

          const data = docSnapshot.data();

          // Validate required fields
          if (!data || typeof data.age !== 'number' || !data.gender) {
            console.warn(
              `Skipping profile ${docSnapshot.id}: missing required fields`
            );
            return;
          }

          // Check if profile matches filters
          const matchesGender =
            filters.gender === 'both' || data.gender === filters.gender;
          const matchesAge =
            data.age >= filters.ageRange[0] && data.age <= filters.ageRange[1];

          if (!matchesGender || !matchesAge) return;

          // Calculate actual distance if coordinates exist
          let distance: number | null = null;
          if (data.coordinates?.latitude && data.coordinates?.longitude) {
            try {
              distance = LocationService.calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                data.coordinates.latitude,
                data.coordinates.longitude
              );

              // Skip if beyond max distance
              if (distance > filters.maxDistance) return;
            } catch (distError) {
              console.warn(
                `Error calculating distance for ${docSnapshot.id}:`,
                distError
              );
            }
          }

          profiles.push({
            id: docSnapshot.id,
            ...data,
            distance,
            lastSeen: convertTimestamp(data.lastSeen),
          } as User);
        });
      }

      // Remove duplicates and sort by distance
      const uniqueProfiles = Array.from(
        new Map(profiles.map((p) => [p.id, p])).values()
      );

      const sortedProfiles = LocationService.sortByDistance(
        uniqueProfiles,
        userLocation
      );

      return {
        data: sortedProfiles.slice(0, pageSize),
        success: true,
        message: 'Profiles retrieved successfully',
        pagination: {
          page,
          limit: pageSize,
          total: sortedProfiles.length,
          hasMore: sortedProfiles.length > pageSize,
        },
      };
    } catch (error) {
      console.error('Error getting discover profiles:', error);
      return {
        data: [],
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get profiles',
      };
    }
  }

  /**
   * Fallback method for profiles without geohash (for migration period)
   */
  private async getDiscoverProfilesBasic(
    filters: SearchFilters,
    page: number,
    currentUserId: string
  ): Promise<ApiResponse<User[]>> {
    try {
      const pageSize = 20;

      // IMPORTANT: Get existing interactions to exclude
      const interactionsQuery = query(
        collection(db, 'interactions'),
        where('userId', '==', currentUserId)
      );
      const interactionsSnapshot = await getDocs(interactionsQuery);

      const now = new Date();
      const interactedUserIds = new Set<string>();

      interactionsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const targetUserId = data.targetUserId;

        // Check if it's a dislike with expiration
        if (data.type === 'dislike' && data.expiresAt) {
          const expiresAt = data.expiresAt.toDate
            ? data.expiresAt.toDate()
            : new Date(data.expiresAt);

          // If expired, don't exclude
          if (expiresAt <= now) {
            return; // Don't add to exclusion set
          }
        }

        // Add to exclusion set (likes and non-expired dislikes)
        interactedUserIds.add(targetUserId);
      });

      // Get existing matches to exclude
      const matchesQuery1 = query(
        collection(db, 'matches'),
        where('user1', '==', currentUserId),
        where('unmatched', '==', false)
      );
      const matchesQuery2 = query(
        collection(db, 'matches'),
        where('user2', '==', currentUserId),
        where('unmatched', '==', false)
      );
      const [matches1, matches2] = await Promise.all([
        getDocs(matchesQuery1),
        getDocs(matchesQuery2),
      ]);

      const matchedUserIds = new Set<string>();
      matches1.docs.forEach((doc) => matchedUserIds.add(doc.data().user2));
      matches2.docs.forEach((doc) => matchedUserIds.add(doc.data().user1));

      console.log(
        `🔍 Basic Query - Excluding ${interactedUserIds.size} interacted + ${matchedUserIds.size} matched users`
      );

      // Basic query without location filtering
      let q = query(
        collection(db, 'users'),
        where('id', '!=', currentUserId),
        limit(pageSize)
      );

      // Add gender filter if not 'both'
      if (filters.gender !== 'both') {
        q = query(
          collection(db, 'users'),
          where('gender', '==', filters.gender),
          where('id', '!=', currentUserId),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const profiles: User[] = [];

      snapshot.forEach((docSnapshot) => {
        // Skip current user, interacted, and matched users
        if (
          docSnapshot.id === currentUserId ||
          interactedUserIds.has(docSnapshot.id) ||
          matchedUserIds.has(docSnapshot.id)
        ) {
          return;
        }

        const data = docSnapshot.data();

        // Validate required fields
        if (!data || typeof data.age !== 'number') {
          console.warn(
            `Skipping profile ${docSnapshot.id}: missing required fields`
          );
          return;
        }

        // Check age filter
        const matchesAge =
          data.age >= filters.ageRange[0] && data.age <= filters.ageRange[1];
        if (!matchesAge) return;

        profiles.push({
          id: docSnapshot.id,
          ...data,
          distance: null, // No distance available without location
          lastSeen: convertTimestamp(data.lastSeen),
        } as User);
      });

      return {
        data: profiles,
        success: true,
        message: 'Profiles retrieved successfully (basic mode)',
        pagination: {
          page,
          limit: pageSize,
          total: profiles.length,
          hasMore: snapshot.size === pageSize,
        },
      };
    } catch (error) {
      console.error('Error in basic profile discovery:', error);
      return {
        data: [],
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get profiles',
      };
    }
  }

  /**
   * Like a profile and check for mutual match
   */
  async likeProfile(
    userId: string,
    targetUserId: string
  ): Promise<
    ApiResponse<{ isMatch: boolean; matchId?: string; matchedUser?: User }>
  > {
    try {
      console.log(`❤️ LIKE: User ${userId} is liking ${targetUserId}`);

      // Remove from discovery queue first
      await this.removeFromQueue(userId, targetUserId);

      // Check if user already interacted with this profile
      const existingInteractionQuery = query(
        collection(db, 'interactions'),
        where('userId', '==', userId),
        where('targetUserId', '==', targetUserId)
      );
      const existingInteractionSnapshot = await getDocs(
        existingInteractionQuery
      );

      console.log(
        `📋 Existing interaction found: ${!existingInteractionSnapshot.empty}`
      );

      if (!existingInteractionSnapshot.empty) {
        const existingType = existingInteractionSnapshot.docs[0].data().type;

        if (existingType === 'like') {
          return {
            data: { isMatch: false },
            success: true,
            message: 'Profile already liked',
          };
        } else {
          // User previously disliked, update to like
          await updateDoc(existingInteractionSnapshot.docs[0].ref, {
            type: 'like',
            createdAt: serverTimestamp(),
          });
        }
      } else {
        // Add new like interaction
        await addDoc(collection(db, 'interactions'), {
          userId,
          targetUserId,
          type: 'like',
          createdAt: serverTimestamp(),
        });
        console.log(
          `✅ Created new like interaction: ${userId} → ${targetUserId}`
        );
      }

      // Check for mutual like (match)
      const mutualLikeQuery = query(
        collection(db, 'interactions'),
        where('userId', '==', targetUserId),
        where('targetUserId', '==', userId),
        where('type', '==', 'like')
      );

      const mutualLikeSnapshot = await getDocs(mutualLikeQuery);

      console.log(`🔍 Checking mutual like: ${userId} liked ${targetUserId}`);
      console.log(`🔍 Looking for: ${targetUserId} liked ${userId}`);
      console.log(`🔍 Mutual like found: ${!mutualLikeSnapshot.empty}`);
      console.log(`🔍 Mutual docs count: ${mutualLikeSnapshot.size}`);

      if (!mutualLikeSnapshot.empty) {
        // Check if match already exists (not unmatched)
        const [user1, user2] = [userId, targetUserId].sort();

        const existingMatchQuery = query(
          collection(db, 'matches'),
          where('user1', '==', user1),
          where('user2', '==', user2)
        );
        const existingMatchSnapshot = await getDocs(existingMatchQuery);

        let matchDoc = existingMatchSnapshot.docs[0];

        if (matchDoc && !matchDoc.data().unmatched) {
          // Match already exists and is active - get matched user data
          const matchedUserDoc = await getDoc(doc(db, 'users', targetUserId));
          const matchedUserData = matchedUserDoc.exists()
            ? matchedUserDoc.data()
            : null;

          return {
            data: {
              isMatch: true,
              matchId: matchDoc.id,
              conversationId: matchDoc.data().conversationId,
              matchedUser: matchedUserData
                ? ({
                    id: matchedUserDoc.id,
                    ...matchedUserData,
                    lastSeen: convertTimestamp(matchedUserData.lastSeen),
                  } as User)
                : undefined,
            },
            success: true,
            message: 'Match already exists',
          };
        }

        // Create new match or reactivate unmatched
        const batch = writeBatch(db);

        // Create conversation first
        const conversationRef = doc(collection(db, 'conversations'));
        const conversationId = conversationRef.id;

        batch.set(conversationRef, {
          participants: [userId, targetUserId],
          matchId: '',
          unreadCount: {
            [userId]: 0,
            [targetUserId]: 0,
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        let matchRef;
        // Create or update match
        if (matchDoc && matchDoc.data().unmatched) {
          // Reactivate unmatched
          matchRef = matchDoc.ref;
          batch.update(matchRef, {
            unmatched: false,
            unmatchedAt: null,
            unmatchedBy: null,
            conversationId,
            createdAt: serverTimestamp(),
          });

          // Update conversation with matchId
          batch.update(conversationRef, {
            matchId: matchRef.id,
          });
        } else {
          // Create new match
          matchRef = doc(collection(db, 'matches'));
          batch.set(matchRef, {
            users: [userId, targetUserId],
            user1,
            user2,
            conversationId,
            unmatched: false,
            animationPlayed: false, // Animation not yet shown
            createdAt: serverTimestamp(),
          });

          // Update conversation with matchId
          batch.update(conversationRef, {
            matchId: matchRef.id,
          });
        }

        await batch.commit();

        console.log(`🎉 MATCH CREATED! ${userId} ❤️ ${targetUserId}`);
        console.log(`💬 Conversation created with ID: ${conversationId}`);
        console.log(`🔗 Match ID: ${matchRef.id}`);

        // Remove both users from each other's discovery queue
        await Promise.all([
          this.removeFromQueue(userId, targetUserId),
          this.removeFromQueue(targetUserId, userId),
        ]);

        // Get matched user data
        const matchedUserDoc = await getDoc(doc(db, 'users', targetUserId));
        const matchedUserData = matchedUserDoc.exists()
          ? matchedUserDoc.data()
          : null;

        console.log(`✅ Match data prepared, returning isMatch: true`);
        console.log(`💬 Conversation ID: ${conversationId}`);

        return {
          data: {
            isMatch: true,
            matchId: matchRef.id,
            conversationId: conversationId,
            matchedUser: matchedUserData
              ? ({
                  id: matchedUserDoc.id,
                  ...matchedUserData,
                  lastSeen: convertTimestamp(matchedUserData.lastSeen),
                } as User)
              : undefined,
          },
          success: true,
          message: 'Match created successfully',
        };
      }

      console.log(`👍 Like successful, but NO MATCH (no mutual like)`);

      return {
        data: { isMatch: false },
        success: true,
        message: 'Profile liked successfully',
      };
    } catch (error) {
      console.error('Error liking profile:', error);
      return {
        data: false,
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to like profile',
      };
    }
  }

  /**
   * Dislike a profile
   */
  async dislikeProfile(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      // Remove from discovery queue first
      await this.removeFromQueue(userId, targetUserId);

      // Check if interaction already exists
      const existingInteractionQuery = query(
        collection(db, 'interactions'),
        where('userId', '==', userId),
        where('targetUserId', '==', targetUserId)
      );
      const existingInteractionSnapshot = await getDocs(
        existingInteractionQuery
      );

      // Calculate expiration time: 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      if (!existingInteractionSnapshot.empty) {
        // Update existing interaction to dislike with 24-hour expiration
        await updateDoc(existingInteractionSnapshot.docs[0].ref, {
          type: 'dislike',
          createdAt: serverTimestamp(),
          expiresAt: expiresAt, // Block for 24 hours
        });
      } else {
        // Add new dislike interaction with 24-hour expiration
        await addDoc(collection(db, 'interactions'), {
          userId,
          targetUserId,
          type: 'dislike',
          createdAt: serverTimestamp(),
          expiresAt: expiresAt, // Block for 24 hours
        });
      }

      return {
        data: true,
        success: true,
        message: 'Profile disliked successfully',
      };
    } catch (error) {
      console.error('Error disliking profile:', error);
      return {
        data: false,
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to dislike profile',
      };
    }
  }

  /**
   * Report a profile
   */
  async reportProfile(
    userId: string,
    targetUserId: string,
    reason: string
  ): Promise<ApiResponse<boolean>> {
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: userId,
        reportedUserId: targetUserId,
        reason,
        createdAt: serverTimestamp(),
        status: 'pending',
      });

      return {
        data: true,
        success: true,
        message: 'Profile reported successfully',
      };
    } catch (error) {
      console.error('Error reporting profile:', error);
      return {
        data: false,
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to report profile',
      };
    }
  }
}

// ============================================
// Firebase Matching Service
// ============================================
export class FirebaseMatchingService implements IMatchingService {
  /**
   * Get all matches for a user (active matches only)
   */
  async getMatches(
    userId: string,
    page: number = 1
  ): Promise<ApiResponse<User[]>> {
    try {
      const pageSize = 20;

      // Query matches where user is user1
      const matchesQuery1 = query(
        collection(db, 'matches'),
        where('user1', '==', userId),
        where('unmatched', '==', false),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      // Query matches where user is user2
      const matchesQuery2 = query(
        collection(db, 'matches'),
        where('user2', '==', userId),
        where('unmatched', '==', false),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      const [matchesSnapshot1, matchesSnapshot2] = await Promise.all([
        getDocs(matchesQuery1),
        getDocs(matchesQuery2),
      ]);

      const matchedUsers: User[] = [];
      const seenUserIds = new Set<string>();

      // Process matches from both queries
      const allMatches = [...matchesSnapshot1.docs, ...matchesSnapshot2.docs];

      for (const matchDoc of allMatches) {
        const matchData = matchDoc.data();
        const otherUserId =
          matchData.user1 === userId ? matchData.user2 : matchData.user1;

        if (!seenUserIds.has(otherUserId)) {
          seenUserIds.add(otherUserId);

          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            matchedUsers.push({
              id: userDoc.id,
              ...userData,
              lastSeen: convertTimestamp(userData.lastSeen),
            } as User);
          }
        }
      }

      // Sort by match creation date
      matchedUsers.sort((a, b) => {
        const matchA = allMatches.find((m) => {
          const data = m.data();
          return data.user1 === a.id || data.user2 === a.id;
        });
        const matchB = allMatches.find((m) => {
          const data = m.data();
          return data.user1 === b.id || data.user2 === b.id;
        });

        if (!matchA || !matchB) return 0;

        const timeA = matchA.data().createdAt?.toMillis() || 0;
        const timeB = matchB.data().createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      return {
        data: matchedUsers.slice(0, pageSize),
        success: true,
        message: 'Matches retrieved successfully',
        pagination: {
          page,
          limit: pageSize,
          total: matchedUsers.length,
          hasMore: matchedUsers.length > pageSize,
        },
      };
    } catch (error) {
      console.error('Error getting matches:', error);
      return {
        data: [],
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get matches',
      };
    }
  }

  /**
   * Get all liked profiles for a user (that haven't matched yet)
   */
  async getLikedProfiles(
    userId: string,
    page: number = 1
  ): Promise<ApiResponse<User[]>> {
    try {
      const pageSize = 20;
      const interactionsQuery = query(
        collection(db, 'interactions'),
        where('userId', '==', userId),
        where('type', '==', 'like'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      const interactionsSnapshot = await getDocs(interactionsQuery);
      const likedUsers: User[] = [];

      // Get user's matches to filter them out
      const [user1, user2] = [userId, userId];
      const matchesQuery1 = query(
        collection(db, 'matches'),
        where('user1', '==', userId),
        where('unmatched', '==', false)
      );
      const matchesQuery2 = query(
        collection(db, 'matches'),
        where('user2', '==', userId),
        where('unmatched', '==', false)
      );

      const [matchesSnapshot1, matchesSnapshot2] = await Promise.all([
        getDocs(matchesQuery1),
        getDocs(matchesQuery2),
      ]);

      const matchedUserIds = new Set<string>();
      [...matchesSnapshot1.docs, ...matchesSnapshot2.docs].forEach(
        (matchDoc) => {
          const matchData = matchDoc.data();
          const otherId =
            matchData.user1 === userId ? matchData.user2 : matchData.user1;
          matchedUserIds.add(otherId);
        }
      );

      // Fetch liked user profiles (excluding matched ones)
      for (const interactionDoc of interactionsSnapshot.docs) {
        const interactionData = interactionDoc.data();
        const targetUserId = interactionData.targetUserId;

        // Skip if already matched
        if (matchedUserIds.has(targetUserId)) continue;

        const userDoc = await getDoc(doc(db, 'users', targetUserId));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          likedUsers.push({
            id: userDoc.id,
            ...userData,
            lastSeen: convertTimestamp(userData.lastSeen),
          } as User);
        }
      }

      return {
        data: likedUsers,
        success: true,
        message: 'Liked profiles retrieved successfully',
        pagination: {
          page,
          limit: pageSize,
          total: likedUsers.length,
          hasMore: interactionsSnapshot.size === pageSize,
        },
      };
    } catch (error) {
      console.error('Error getting liked profiles:', error);
      return {
        data: [],
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to get liked profiles',
      };
    }
  }

  /**
   * Unmatch a profile (soft delete - marks as unmatched)
   */
  async unmatchProfile(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      // Find the match document
      const [user1, user2] = [userId, targetUserId].sort();

      const matchQuery = query(
        collection(db, 'matches'),
        where('user1', '==', user1),
        where('user2', '==', user2)
      );
      const matchSnapshot = await getDocs(matchQuery);

      if (matchSnapshot.empty) {
        return {
          data: false,
          success: false,
          message: 'Match not found',
        };
      }

      const matchDoc = matchSnapshot.docs[0];
      const matchData = matchDoc.data();
      const conversationId = matchData.conversationId;

      console.log(
        `🗑️ Starting unmatch cleanup for ${userId} ⟷ ${targetUserId}`
      );
      console.log(`🗑️ Match ID: ${matchDoc.id}`);
      console.log(`🗑️ Conversation ID: ${conversationId}`);

      // Use batch for atomic operations
      const batch = writeBatch(db);

      // 1. Delete the match document
      batch.delete(matchDoc.ref);

      // 2. Delete all messages in the conversation subcollection
      if (conversationId) {
        try {
          const messagesQuery = query(
            collection(db, 'conversations', conversationId, 'messages')
          );
          const messagesSnapshot = await getDocs(messagesQuery);

          console.log(
            `🗑️ Deleting ${messagesSnapshot.size} messages from conversation`
          );

          messagesSnapshot.docs.forEach((messageDoc) => {
            batch.delete(messageDoc.ref);
          });
        } catch (error) {
          console.error('Error deleting messages:', error);
        }

        // 3. Delete the conversation document
        batch.delete(doc(db, 'conversations', conversationId));
      }

      // 4. Replace interaction with 24-hour dislike ban: userId → targetUserId
      try {
        const interaction1Query = query(
          collection(db, 'interactions'),
          where('userId', '==', userId),
          where('targetUserId', '==', targetUserId)
        );
        const interaction1Snapshot = await getDocs(interaction1Query);

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour ban

        if (!interaction1Snapshot.empty) {
          // Update existing interaction to dislike with expiration
          interaction1Snapshot.docs.forEach((interactionDoc) => {
            batch.update(interactionDoc.ref, {
              type: 'dislike',
              createdAt: serverTimestamp(),
              expiresAt: expiresAt,
            });
          });
          console.log(
            `🚫 Updated interaction to 24h dislike: ${userId} → ${targetUserId}`
          );
        } else {
          // Create new dislike interaction
          const interactionRef = doc(collection(db, 'interactions'));
          batch.set(interactionRef, {
            userId,
            targetUserId,
            type: 'dislike',
            createdAt: serverTimestamp(),
            expiresAt: expiresAt,
          });
          console.log(
            `🚫 Created 24h dislike interaction: ${userId} → ${targetUserId}`
          );
        }
      } catch (error) {
        console.error('Error creating unmatch dislike 1:', error);
      }

      // 5. Replace interaction with 24-hour dislike ban: targetUserId → userId
      try {
        const interaction2Query = query(
          collection(db, 'interactions'),
          where('userId', '==', targetUserId),
          where('targetUserId', '==', userId)
        );
        const interaction2Snapshot = await getDocs(interaction2Query);

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour ban

        if (!interaction2Snapshot.empty) {
          // Update existing interaction to dislike with expiration
          interaction2Snapshot.docs.forEach((interactionDoc) => {
            batch.update(interactionDoc.ref, {
              type: 'dislike',
              createdAt: serverTimestamp(),
              expiresAt: expiresAt,
            });
          });
          console.log(
            `🚫 Updated interaction to 24h dislike: ${targetUserId} → ${userId}`
          );
        } else {
          // Create new dislike interaction
          const interactionRef = doc(collection(db, 'interactions'));
          batch.set(interactionRef, {
            userId: targetUserId,
            targetUserId: userId,
            type: 'dislike',
            createdAt: serverTimestamp(),
            expiresAt: expiresAt,
          });
          console.log(
            `🚫 Created 24h dislike interaction: ${targetUserId} → ${userId}`
          );
        }
      } catch (error) {
        console.error('Error creating unmatch dislike 2:', error);
      }

      // Commit all operations atomically
      await batch.commit();

      console.log(`✅ UNMATCH COMPLETE! Actions taken:`);
      console.log(`   ✓ Match document deleted`);
      console.log(`   ✓ Conversation + all messages deleted`);
      console.log(`   ✓ 24-hour dislike ban applied (both directions)`);

      return {
        data: true,
        success: true,
        message: 'Profile unmatched successfully',
      };
    } catch (error) {
      console.error('Error unmatching profile:', error);
      return {
        data: false,
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to unmatch profile',
      };
    }
  }

  /**
   * Mark match animation as played to prevent showing it again
   */
  async markMatchAnimationPlayed(
    matchId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await updateDoc(matchRef, {
        animationPlayed: true,
      });

      console.log(`✅ Match animation marked as played for match: ${matchId}`);

      return {
        data: true,
        success: true,
        message: 'Animation marked as played',
      };
    } catch (error) {
      console.error('Error marking animation as played:', error);
      return {
        data: false,
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update match',
      };
    }
  }

  /**
   * Get detailed information about a match
   */
  async getMatchDetails(
    userId: string,
    matchId: string
  ): Promise<ApiResponse<User>> {
    try {
      const userDoc = await getDoc(doc(db, 'users', matchId));

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();

      return {
        data: {
          id: userDoc.id,
          ...userData,
          lastSeen: convertTimestamp(userData.lastSeen),
        } as User,
        success: true,
        message: 'Match details retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting match details:', error);
      return {
        data: {} as User,
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to get match details',
      };
    }
  }

  /**
   * Subscribe to new matches for real-time updates
   * This allows both users to see the match animation when it happens
   */
  subscribeToMatches(
    userId: string,
    onMatchCreated: (match: {
      matchId: string;
      matchedUserId: string;
      matchedUser: User;
      conversationId: string;
    }) => void
  ): Unsubscribe {
    console.log(`🔔 Setting up match listener for user: ${userId}`);

    // Listen for matches where current user is user1
    const matchesQuery1 = query(
      collection(db, 'matches'),
      where('user1', '==', userId),
      where('unmatched', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    // Listen for matches where current user is user2
    const matchesQuery2 = query(
      collection(db, 'matches'),
      where('user2', '==', userId),
      where('unmatched', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    let lastMatchId: string | null = null;

    const unsubscribe1 = onSnapshot(matchesQuery1, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added' && change.doc.id !== lastMatchId) {
          const matchData = change.doc.data();
          const matchedUserId = matchData.user2;

          console.log(`🎉 New match detected (as user1): ${matchedUserId}`);
          lastMatchId = change.doc.id;

          // Fetch matched user data
          const userDoc = await getDoc(doc(db, 'users', matchedUserId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            onMatchCreated({
              matchId: change.doc.id,
              matchedUserId,
              matchedUser: {
                id: userDoc.id,
                ...userData,
                lastSeen: convertTimestamp(userData.lastSeen),
              } as User,
              conversationId: matchData.conversationId,
            });
          }
        }
      });
    });

    const unsubscribe2 = onSnapshot(matchesQuery2, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added' && change.doc.id !== lastMatchId) {
          const matchData = change.doc.data();
          const matchedUserId = matchData.user1;

          console.log(`🎉 New match detected (as user2): ${matchedUserId}`);
          lastMatchId = change.doc.id;

          // Fetch matched user data
          const userDoc = await getDoc(doc(db, 'users', matchedUserId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            onMatchCreated({
              matchId: change.doc.id,
              matchedUserId,
              matchedUser: {
                id: userDoc.id,
                ...userData,
                lastSeen: convertTimestamp(userData.lastSeen),
              } as User,
              conversationId: matchData.conversationId,
            });
          }
        }
      });
    });

    // Return combined unsubscribe function
    return () => {
      console.log(`🔕 Unsubscribing from match listener for user: ${userId}`);
      unsubscribe1();
      unsubscribe2();
    };
  }
}

// ============================================
// Firebase Chat Service
// ============================================
export class FirebaseChatService implements IChatService {
  /**
   * Get all conversations for a user
   */
  async getConversations(
    userId: string,
    page: number = 1
  ): Promise<ApiResponse<Conversation[]>> {
    try {
      const pageSize = 20;
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId),
        limit(pageSize)
      );

      const conversationsSnapshot = await getDocs(conversationsQuery);
      const conversations: Conversation[] = [];

      for (const convDoc of conversationsSnapshot.docs) {
        const convData = convDoc.data();

        const messagesQuery = query(
          collection(db, 'conversations', convDoc.id, 'messages'),
          orderBy('timestamp', 'desc'),
          limit(1)
        );

        const messagesSnapshot = await getDocs(messagesQuery);
        const lastMessage = messagesSnapshot.docs[0]?.data();

        conversations.push({
          id: convDoc.id,
          participants: convData.participants,
          messages: [],
          lastMessage: lastMessage
            ? ({
                ...lastMessage,
                timestamp: convertTimestamp(lastMessage.timestamp),
              } as ChatMessage)
            : undefined,
          createdAt: convertTimestamp(convData.createdAt),
          updatedAt: convertTimestamp(convData.updatedAt),
          unreadCount: convData.unreadCount || 0,
        });
      }

      // Sort by updatedAt (client-side sorting)
      conversations.sort((a, b) => {
        const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0;
        const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0;
        return bTime - aTime;
      });

      return {
        data: conversations,
        success: true,
        message: 'Conversations retrieved successfully',
        pagination: {
          page,
          limit: pageSize,
          total: conversations.length,
          hasMore: conversationsSnapshot.size === pageSize,
        },
      };
    } catch (error) {
      console.error('Error getting conversations:', error);
      return {
        data: [],
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to get conversations',
      };
    }
  }

  /**
   * Get a specific conversation with messages
   */
  async getConversation(
    conversationId: string,
    page: number = 1
  ): Promise<ApiResponse<Conversation>> {
    try {
      const convDoc = await getDoc(doc(db, 'conversations', conversationId));

      if (!convDoc.exists()) {
        throw new Error('Conversation not found');
      }

      const convData = convDoc.data();

      const pageSize = 50;
      const messagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(pageSize)
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      const messages: ChatMessage[] = [];

      messagesSnapshot.forEach((msgDoc) => {
        const msgData = msgDoc.data();
        messages.push({
          id: msgDoc.id,
          ...msgData,
          timestamp: convertTimestamp(msgData.timestamp),
        } as ChatMessage);
      });

      const conversation: Conversation = {
        id: convDoc.id,
        participants: convData.participants,
        messages: messages.reverse(), // Reverse to show oldest first
        lastMessage: messages[messages.length - 1],
        createdAt: convertTimestamp(convData.createdAt),
        updatedAt: convertTimestamp(convData.updatedAt),
        unreadCount: convData.unreadCount || 0,
      };

      return {
        data: conversation,
        success: true,
        message: 'Conversation retrieved successfully',
        pagination: {
          page,
          limit: pageSize,
          total: messages.length,
          hasMore: messagesSnapshot.size === pageSize,
        },
      };
    } catch (error) {
      console.error('Error getting conversation:', error);
      return {
        data: {} as Conversation,
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get conversation',
      };
    }
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ): Promise<ApiResponse<ChatMessage>> {
    try {
      const messageData = {
        senderId: message.senderId,
        text: message.text,
        isRead: false,
        createdAt: serverTimestamp(),
      };

      const messageRef = await addDoc(
        collection(db, 'conversations', conversationId, 'messages'),
        messageData
      );

      // Get conversation to determine recipient
      const convDoc = await getDoc(doc(db, 'conversations', conversationId));
      if (!convDoc.exists()) {
        throw new Error('Conversation not found');
      }

      const convData = convDoc.data();
      const recipientId = convData.participants.find(
        (id: string) => id !== message.senderId
      );

      // Update conversation with last message and increment unread count
      const updates: any = {
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: message.text,
          senderId: message.senderId,
          createdAt: new Date(),
        },
      };

      // Increment unread count for recipient
      if (recipientId) {
        updates[`unreadCount.${recipientId}`] =
          (convData.unreadCount?.[recipientId] || 0) + 1;
      }

      await updateDoc(doc(db, 'conversations', conversationId), updates);

      const newMessage: ChatMessage = {
        id: messageRef.id,
        ...message,
        timestamp: new Date(),
      };

      return {
        data: newMessage,
        success: true,
        message: 'Message sent successfully',
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        data: {} as ChatMessage,
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to send message',
      };
    }
  }

  /**
   * Mark messages as read and reset unread count for user
   */
  async markMessagesAsRead(
    conversationId: string,
    messageIds: string[],
    userId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const batch = writeBatch(db);

      // Mark individual messages as read
      for (const messageId of messageIds) {
        const messageRef = doc(
          db,
          'conversations',
          conversationId,
          'messages',
          messageId
        );
        batch.update(messageRef, {
          isRead: true,
          readAt: serverTimestamp(),
        });
      }

      // Reset unread count for this user in conversation
      const convRef = doc(db, 'conversations', conversationId);
      batch.update(convRef, {
        [`unreadCount.${userId}`]: 0,
      });

      await batch.commit();

      return {
        data: true,
        success: true,
        message: 'Messages marked as read successfully',
      };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return {
        data: false,
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to mark messages as read',
      };
    }
  }

  /**
   * Delete a conversation and all its messages
   */
  async deleteConversation(
    conversationId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const messagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages')
      );
      const messagesSnapshot = await getDocs(messagesQuery);

      const batch = writeBatch(db);
      messagesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
      batch.delete(doc(db, 'conversations', conversationId));

      await batch.commit();

      return {
        data: true,
        success: true,
        message: 'Conversation deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return {
        data: false,
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to delete conversation',
      };
    }
  }
}

// ============================================
// Firebase Auth Service
// ============================================
export class FirebaseAuthService implements IAuthService {
  /**
   * Login with email and password
   */
  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      let userData: User;

      if (userDoc.exists()) {
        const data = userDoc.data();
        userData = {
          id: userDoc.id,
          ...data,
          lastSeen: convertTimestamp(data.lastSeen),
        } as User;

        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          lastSeen: serverTimestamp(),
          isOnline: true,
        });
      } else {
        // Create basic user profile if it doesn't exist
        userData = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Unknown User',
          age: 25,
          image: firebaseUser.photoURL || '',
          gender: 'other' as const,
          bio: '',
          interests: [],
          location: '',
          preferences: {
            ageRange: [20, 35] as [number, number],
            maxDistance: 50,
            interestedIn: 'both' as const,
          },
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...userData,
          email: firebaseUser.email,
          createdAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
          isOnline: true,
        });
      }

      const token = await firebaseUser.getIdToken();

      return {
        data: { user: userData, token },
        success: true,
        message: 'Login successful',
      };
    } catch (error) {
      console.error('Error during login:', error);
      let errorMessage = 'Login failed';

      if (error instanceof Error) {
        const code = (error as any).code;
        switch (code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later';
            break;
          default:
            errorMessage = error.message;
        }
      }

      return {
        data: { user: {} as User, token: '' },
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Register a new user with email and password
   */
  async register(
    userData: Partial<User> & { email: string; password: string }
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const { email, password, ...profileData } = userData;

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      const newUser: User = {
        id: firebaseUser.uid,
        name: profileData.name || 'Unknown User',
        age: profileData.age || 25,
        image: profileData.image || '',
        gender: profileData.gender || 'other',
        bio: profileData.bio || '',
        interests: profileData.interests || [],
        location: profileData.location || '',
        preferences: profileData.preferences || {
          ageRange: [20, 35] as [number, number],
          maxDistance: 50,
          interestedIn: 'both' as const,
        },
      };

      // Generate geohash if coordinates are provided
      let geohash: string | undefined;
      if (profileData.coordinates) {
        geohash = LocationService.generateGeohash(
          profileData.coordinates.latitude,
          profileData.coordinates.longitude
        );
        console.log('📍 Generated geohash for new user:', geohash);
      }

      // Upload image if provided as local file
      let imageUrl = newUser.image;
      if (
        imageUrl &&
        (imageUrl.startsWith('file://') ||
          imageUrl.startsWith('content://') ||
          imageUrl.startsWith('data:') ||
          imageUrl.startsWith('/'))
      ) {
        console.log('📤 Uploading registration image to Cloudinary...');
        const uploadResult = await storageService.uploadImage(imageUrl);
        if (uploadResult.success && uploadResult.secureUrl) {
          imageUrl = uploadResult.secureUrl;
          newUser.image = imageUrl;
          console.log('✅ Registration image uploaded:', imageUrl);
        }
      }

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...newUser,
        ...(geohash && { geohash }),
        ...(profileData.coordinates && {
          coordinates: profileData.coordinates,
        }),
        email,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        isOnline: true,
      });

      try {
        await sendEmailVerification(firebaseUser);
      } catch (emailError) {
        console.warn('Failed to send email verification:', emailError);
      }

      const token = await firebaseUser.getIdToken();

      return {
        data: { user: newUser, token },
        success: true,
        message:
          'Registration successful. Please check your email to verify your account.',
      };
    } catch (error) {
      console.error('Error during registration:', error);
      let errorMessage = 'Registration failed';

      if (error instanceof Error) {
        const code = (error as any).code;
        switch (code) {
          case 'auth/email-already-in-use':
            errorMessage = 'An account with this email already exists';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          default:
            errorMessage = error.message;
        }
      }

      return {
        data: { user: {} as User, token: '' },
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<ApiResponse<boolean>> {
    try {
      const user = auth.currentUser;

      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            lastSeen: serverTimestamp(),
            isOnline: false,
          });
        } catch (updateError) {
          console.warn('Failed to update user status on logout:', updateError);
        }
      }

      await signOut(auth);
      return {
        data: true,
        success: true,
        message: 'Logout successful',
      };
    } catch (error) {
      console.error('Error during logout:', error);
      return {
        data: false,
        success: false,
        message: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const token = await user.getIdToken(true);

      return {
        data: { token },
        success: true,
        message: 'Token refreshed successfully',
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      return {
        data: { token: '' },
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to refresh token',
      };
    }
  }

  /**
   * Send password reset email
   */
  async forgotPassword(email: string): Promise<ApiResponse<boolean>> {
    try {
      await sendPasswordResetEmail(auth, email);

      return {
        data: true,
        success: true,
        message: 'Password reset email sent. Please check your inbox.',
      };
    } catch (error) {
      console.error('Error sending reset email:', error);
      let errorMessage = 'Failed to send reset email';

      if (error instanceof Error) {
        const code = (error as any).code;
        switch (code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          default:
            errorMessage = error.message;
        }
      }

      return {
        data: false,
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Reset password for logged-in user
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      await updatePassword(user, newPassword);

      return {
        data: true,
        success: true,
        message: 'Password updated successfully',
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      let errorMessage = 'Failed to reset password';

      if (error instanceof Error) {
        const code = (error as any).code;
        switch (code) {
          case 'auth/requires-recent-login':
            errorMessage =
              'Please log out and log back in before changing your password';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters';
            break;
          default:
            errorMessage = error.message;
        }
      }

      return {
        data: false,
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Verify email (placeholder - handled by Firebase auth link)
   */
  async verifyEmail(token: string): Promise<ApiResponse<boolean>> {
    try {
      // Firebase handles email verification through links
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        data: true,
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      console.error('Error verifying email:', error);
      return {
        data: false,
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to verify email',
      };
    }
  }

  /**
   * Clean up orphaned authentication records
   * Useful when a user exists in Firebase Auth but not in Firestore
   */
  async cleanupOrphanedAuth(
    firebaseUser: FirebaseUser
  ): Promise<ApiResponse<boolean>> {
    try {
      console.log(
        '🧹 Checking for orphaned auth record for user:',
        firebaseUser.uid
      );

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        console.log(
          '⚠️ User exists in Auth but not in Firestore. Cleaning up...'
        );

        try {
          await deleteUser(firebaseUser);
          console.log('✅ Orphaned auth record deleted successfully');

          return {
            data: true,
            success: true,
            message:
              'Orphaned authentication record has been cleaned up. Please register again.',
          };
        } catch (deleteError) {
          console.error(
            '❌ Failed to delete orphaned auth record:',
            deleteError
          );
          await signOut(auth);

          return {
            data: false,
            success: false,
            message: 'Authentication mismatch detected. Please log in again.',
          };
        }
      }

      return {
        data: true,
        success: true,
        message: 'User authentication is valid',
      };
    } catch (error) {
      console.error('Error during orphaned auth cleanup:', error);

      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error('Failed to sign out during cleanup:', signOutError);
      }

      return {
        data: false,
        success: false,
        message: 'Authentication error. Please log in again.',
      };
    }
  }
}
