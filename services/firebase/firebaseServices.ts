// services/firebase/firebaseServices.ts
// Fixed to remove queue-related methods and simplify

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
  increment,
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
import notificationService from '../notificationService';
import { calculateZodiacSign } from '../../utils/dateUtils';

// ============================================
// Utility Functions
// ============================================

const convertTimestamp = (timestamp: any): Date | undefined => {
  if (timestamp?.toDate) return timestamp.toDate();
  if (timestamp?.seconds) return new Date(timestamp.seconds * 1000);
  return timestamp;
};

// ============================================
// Firebase User Profile Service
// ============================================
export class FirebaseUserProfileService implements IUserProfileService {
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

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const dataToUpdate: Record<string, any> = { ...userData };

      // Handle image upload if it's a local file
      if (
        typeof dataToUpdate.image === 'string' &&
        (dataToUpdate.image.startsWith('file://') ||
          dataToUpdate.image.startsWith('content://') ||
          dataToUpdate.image.startsWith('data:') ||
          dataToUpdate.image.startsWith('/'))
      ) {
        console.log('📤 Uploading main image to Cloudinary...');
        const uploadResult = await storageService.uploadImage(
          dataToUpdate.image
        );

        if (uploadResult.success && uploadResult.secureUrl) {
          dataToUpdate.image = uploadResult.secureUrl;
          console.log('✅ Main image uploaded:', dataToUpdate.image);
        } else {
          throw new Error(uploadResult.message || 'Image upload failed');
        }
      }

      // Handle images array upload - upload any local file URIs to Cloudinary
      if (Array.isArray(dataToUpdate.images)) {
        console.log('📤 Processing images array...');
        const uploadedImages: string[] = [];

        for (const imageUri of dataToUpdate.images) {
          if (
            typeof imageUri === 'string' &&
            (imageUri.startsWith('file://') ||
              imageUri.startsWith('content://') ||
              imageUri.startsWith('data:') ||
              imageUri.startsWith('/'))
          ) {
            console.log('📤 Uploading additional image to Cloudinary...');
            const uploadResult = await storageService.uploadImage(imageUri);

            if (uploadResult.success && uploadResult.secureUrl) {
              uploadedImages.push(uploadResult.secureUrl);
              console.log(
                '✅ Additional image uploaded:',
                uploadResult.secureUrl
              );
            } else {
              console.warn('⚠️ Failed to upload image:', imageUri);
              // Keep the original URI if upload fails
              uploadedImages.push(imageUri);
            }
          } else {
            // Keep existing Cloudinary URLs or other valid URLs
            uploadedImages.push(imageUri);
          }
        }

        dataToUpdate.images = uploadedImages;
        console.log('✅ Images array processed:', dataToUpdate.images);
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

      // Handle nested preferences with dot notation
      const updateData: Record<string, any> = { updatedAt: serverTimestamp() };

      Object.keys(dataToUpdate).forEach((key) => {
        if (key === 'preferences' && typeof dataToUpdate[key] === 'object') {
          const prefs = dataToUpdate[key] as Record<string, any>;
          Object.keys(prefs).forEach((prefKey) => {
            updateData[`preferences.${prefKey}`] = prefs[prefKey];
          });
        } else {
          updateData[key] = dataToUpdate[key];
        }
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updateData);

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
// Firebase Discovery Service (Simplified)
// ============================================
export class FirebaseDiscoveryService implements IDiscoveryService {
  /**
   * Get discover profiles - simplified direct query
   */
  async getDiscoverProfiles(
    filters: SearchFilters,
    page: number = 1
  ): Promise<ApiResponse<User[]>> {
    try {
      const pageSize = 20;
      const currentUserId = auth.currentUser?.uid;

      if (!currentUserId) {
        throw new Error('No user logged in');
      }

      const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
      if (!currentUserDoc.exists()) {
        throw new Error('Current user not found');
      }

      const currentUserData = currentUserDoc.data();
      const userLocation = currentUserData?.coordinates;

      if (!userLocation?.latitude || !userLocation?.longitude) {
        console.warn('User location not set');
        return {
          data: [],
          success: true,
          message: 'Location not available',
        };
      }

      // Get exclusions
      const [interactedIds, matchedIds] = await Promise.all([
        this.getInteractedUserIds(currentUserId),
        this.getMatchedUserIds(currentUserId),
      ]);

      // Get query bounds
      const bounds = LocationService.getQueryBoundsMeters(
        userLocation,
        filters.maxDistance
      );

      const profiles: User[] = [];
      const seenIds = new Set<string>([currentUserId]);

      // Query users
      for (const [startHash, endHash] of bounds) {
        const q = query(
          collection(db, 'users'),
          where('geohash', '>=', startHash),
          where('geohash', '<=', endHash),
          limit(100)
        );

        const snapshot = await getDocs(q);

        snapshot.forEach((docSnapshot) => {
          const userId = docSnapshot.id;

          if (
            seenIds.has(userId) ||
            interactedIds.has(userId) ||
            matchedIds.has(userId)
          ) {
            return;
          }
          seenIds.add(userId);

          const data = docSnapshot.data();

          if (!this.validateUserData(data)) return;
          if (!this.matchesGenderFilter(currentUserData, data, filters)) return;
          if (!this.matchesAgeFilter(data, filters)) return;

          if (data.coordinates?.latitude && data.coordinates?.longitude) {
            const distance = LocationService.calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              data.coordinates.latitude,
              data.coordinates.longitude
            );

            if (distance > filters.maxDistance) return;

            profiles.push({
              id: userId,
              ...data,
              distance,
              lastSeen: convertTimestamp(data.lastSeen),
            } as User);
          }
        });
      }

      const sortedProfiles = LocationService.sortByDistance(
        profiles,
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

  private validateUserData(data: any): boolean {
    return !!(
      data &&
      typeof data.age === 'number' &&
      data.gender &&
      data.coordinates?.latitude &&
      data.coordinates?.longitude
    );
  }

  private matchesGenderFilter(
    currentUser: any,
    targetUser: any,
    filters: SearchFilters
  ): boolean {
    const currentUserGender = currentUser?.gender || 'other';
    const targetUserGender = targetUser.gender;
    const targetInterestedIn = targetUser.preferences?.interestedIn;

    const userInterestedInTarget = targetUserGender === filters.gender;
    const targetInterestedInUser = targetInterestedIn === currentUserGender;

    return userInterestedInTarget && targetInterestedInUser;
  }

  private matchesAgeFilter(targetUser: any, filters: SearchFilters): boolean {
    return (
      targetUser.age >= filters.ageRange[0] &&
      targetUser.age <= filters.ageRange[1]
    );
  }

  private async getInteractedUserIds(userId: string): Promise<Set<string>> {
    const interactionsQuery = query(
      collection(db, 'interactions'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(interactionsQuery);

    const now = new Date();
    const interactedIds = new Set<string>();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const targetUserId = data.targetUserId;

      if (data.type === 'dislike' && data.expiresAt) {
        const expiresAt = data.expiresAt.toDate
          ? data.expiresAt.toDate()
          : new Date(data.expiresAt);

        if (expiresAt <= now) return;
      }

      interactedIds.add(targetUserId);
    });

    return interactedIds;
  }

  private async getMatchedUserIds(userId: string): Promise<Set<string>> {
    const [matches1, matches2] = await Promise.all([
      getDocs(
        query(
          collection(db, 'matches'),
          where('user1', '==', userId),
          where('unmatched', '==', false)
        )
      ),
      getDocs(
        query(
          collection(db, 'matches'),
          where('user2', '==', userId),
          where('unmatched', '==', false)
        )
      ),
    ]);

    const matchedIds = new Set<string>();
    matches1.docs.forEach((doc) => matchedIds.add(doc.data().user2));
    matches2.docs.forEach((doc) => matchedIds.add(doc.data().user1));

    return matchedIds;
  }

  async likeProfile(
    userId: string,
    targetUserId: string
  ): Promise<
    ApiResponse<{
      isMatch: boolean;
      matchId?: string;
      conversationId?: string;
      matchedUser?: User;
    }>
  > {
    try {
      console.log(`❤️ LIKE: ${userId} → ${targetUserId}`);

      const existingInteraction = await this.getInteraction(
        userId,
        targetUserId
      );

      if (existingInteraction) {
        if (existingInteraction.type === 'like') {
          return {
            data: { isMatch: false },
            success: true,
            message: 'Profile already liked',
          };
        }
        await this.updateInteraction(existingInteraction.id, 'like');
      } else {
        await this.createInteraction(userId, targetUserId, 'like');
      }

      const mutualLike = await this.checkMutualLike(userId, targetUserId);

      if (mutualLike) {
        const matchResult = await this.createMatch(userId, targetUserId);

        if (matchResult.success) {
          const matchedUserDoc = await getDoc(doc(db, 'users', targetUserId));
          const matchedUserData = matchedUserDoc.exists()
            ? matchedUserDoc.data()
            : null;

          // Send match notification to the target user (only from the user with smaller ID to avoid duplicates)
          if (userId < targetUserId) {
            try {
              const currentUserDoc = await getDoc(doc(db, 'users', userId));
              const currentUserData = currentUserDoc.exists()
                ? currentUserDoc.data()
                : null;
              const currentUserToken = currentUserData?.pushToken;

              const targetUserDoc = await getDoc(
                doc(db, 'users', targetUserId)
              );
              const targetUserData = targetUserDoc.exists()
                ? targetUserDoc.data()
                : null;
              const targetUserToken = targetUserData?.pushToken;

              // Don't send notification if both users have the same push token (same device)
              if (
                currentUserToken &&
                targetUserToken &&
                currentUserToken === targetUserToken
              ) {
                console.log(
                  '📱 Same push token, skipping match notification to avoid self-notification'
                );
              } else {
                const currentUserName = currentUserDoc.exists()
                  ? currentUserDoc.data().name || 'Someone'
                  : 'Someone';

                notificationService
                  .broadcastMatchNotification(
                    targetUserId,
                    currentUserName,
                    matchResult.matchId
                  )
                  .catch((err) => {
                    console.error('Failed to send match notification:', err);
                  });
              }
            } catch (notifError) {
              console.error('Error preparing match notification:', notifError);
            }
          }

          return {
            data: {
              isMatch: true,
              matchId: matchResult.matchId,
              conversationId: matchResult.conversationId,
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
      }

      return {
        data: { isMatch: false },
        success: true,
        message: 'Profile liked successfully',
      };
    } catch (error) {
      console.error('Error liking profile:', error);
      return {
        data: { isMatch: false },
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to like profile',
      };
    }
  }

  async dislikeProfile(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const existingInteraction = await this.getInteraction(
        userId,
        targetUserId
      );
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      if (existingInteraction) {
        await this.updateInteraction(
          existingInteraction.id,
          'dislike',
          expiresAt
        );
      } else {
        await this.createInteraction(
          userId,
          targetUserId,
          'dislike',
          expiresAt
        );
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

  private async getInteraction(
    userId: string,
    targetUserId: string
  ): Promise<{ id: string; type: string } | null> {
    const q = query(
      collection(db, 'interactions'),
      where('userId', '==', userId),
      where('targetUserId', '==', targetUserId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    return {
      id: docSnap.id,
      type: docSnap.data().type,
    };
  }

  private async createInteraction(
    userId: string,
    targetUserId: string,
    type: 'like' | 'dislike',
    expiresAt?: Date
  ): Promise<void> {
    const interactionData: any = {
      userId,
      targetUserId,
      type,
      createdAt: serverTimestamp(),
    };

    if (expiresAt) {
      interactionData.expiresAt = expiresAt;
    }

    await addDoc(collection(db, 'interactions'), interactionData);
  }

  private async updateInteraction(
    interactionId: string,
    type: 'like' | 'dislike',
    expiresAt?: Date
  ): Promise<void> {
    const updateData: any = {
      type,
      createdAt: serverTimestamp(),
    };

    if (expiresAt) {
      updateData.expiresAt = expiresAt;
    }

    await updateDoc(doc(db, 'interactions', interactionId), updateData);
  }

  private async checkMutualLike(
    userId: string,
    targetUserId: string
  ): Promise<boolean> {
    const q = query(
      collection(db, 'interactions'),
      where('userId', '==', targetUserId),
      where('targetUserId', '==', userId),
      where('type', '==', 'like')
    );
    const snapshot = await getDocs(q);

    return !snapshot.empty;
  }

  private async createMatch(
    userId: string,
    targetUserId: string
  ): Promise<{ success: boolean; matchId?: string; conversationId?: string }> {
    try {
      const [user1, user2] = [userId, targetUserId].sort();

      const existingMatchQuery = query(
        collection(db, 'matches'),
        where('user1', '==', user1),
        where('user2', '==', user2)
      );
      const existingMatchSnapshot = await getDocs(existingMatchQuery);

      if (!existingMatchSnapshot.empty) {
        const matchDoc = existingMatchSnapshot.docs[0];
        return {
          success: true,
          matchId: matchDoc.id,
          conversationId: matchDoc.data().conversationId,
        };
      }

      const batch = writeBatch(db);

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

      const matchRef = doc(collection(db, 'matches'));
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      batch.set(matchRef, {
        users: [userId, targetUserId],
        user1,
        user2,
        conversationId,
        unmatched: false,
        animationPlayed: false,
        createdAt: serverTimestamp(),
        expiresAt,
      });

      batch.update(conversationRef, {
        matchId: matchRef.id,
      });

      await batch.commit();

      console.log('🎉 Match created:', matchRef.id);

      return {
        success: true,
        matchId: matchRef.id,
        conversationId,
      };
    } catch (error) {
      console.error('Error creating match:', error);
      return { success: false };
    }
  }

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

  // REMOVED: subscribeToDiscoveryQueueUpdates (not needed in simplified version)
  // REMOVED: markProfileAsShown (not needed without queue)
  // REMOVED: removeFromQueue (not needed without queue)
  // REMOVED: clearDiscoveryQueue (not needed without queue)
  // REMOVED: cleanDuplicatesInQueue (not needed without queue)
  // REMOVED: syncDiscoveryQueue (not needed without queue)
  // REMOVED: populateDiscoveryQueue (not needed without queue)
}

// ============================================
// Firebase Matching Service
// ============================================
export class FirebaseMatchingService implements IMatchingService {
  async getMatches(
    userId: string,
    page: number = 1
  ): Promise<ApiResponse<User[]>> {
    try {
      const pageSize = 20;

      const matchesQuery1 = query(
        collection(db, 'matches'),
        where('user1', '==', userId),
        where('unmatched', '==', false),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

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

      return {
        data: matchedUsers,
        success: true,
        message: 'Matches retrieved successfully',
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

      const matchedUserIds = await this.getMatchedUserIds(userId);

      for (const interactionDoc of interactionsSnapshot.docs) {
        const interactionData = interactionDoc.data();
        const targetUserId = interactionData.targetUserId;

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

  private async getMatchedUserIds(userId: string): Promise<Set<string>> {
    const [matches1, matches2] = await Promise.all([
      getDocs(
        query(
          collection(db, 'matches'),
          where('user1', '==', userId),
          where('unmatched', '==', false)
        )
      ),
      getDocs(
        query(
          collection(db, 'matches'),
          where('user2', '==', userId),
          where('unmatched', '==', false)
        )
      ),
    ]);

    const matchedIds = new Set<string>();
    matches1.docs.forEach((doc) => matchedIds.add(doc.data().user2));
    matches2.docs.forEach((doc) => matchedIds.add(doc.data().user1));

    return matchedIds;
  }

  async unmatchProfile(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>> {
    try {
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

      const batch = writeBatch(db);

      batch.delete(matchDoc.ref);

      if (conversationId) {
        const messagesQuery = query(
          collection(db, 'conversations', conversationId, 'messages')
        );
        const messagesSnapshot = await getDocs(messagesQuery);

        messagesSnapshot.docs.forEach((messageDoc) => {
          batch.delete(messageDoc.ref);
        });

        batch.delete(doc(db, 'conversations', conversationId));
      }

      // Update existing like interactions to dislike with 24h expiration
      const existingInteractionsQuery = query(
        collection(db, 'interactions'),
        where('userId', 'in', [userId, targetUserId]),
        where('targetUserId', 'in', [userId, targetUserId]),
        where('type', '==', 'like')
      );
      const existingInteractionsSnapshot = await getDocs(
        existingInteractionsQuery
      );

      existingInteractionsSnapshot.docs.forEach((interactionDoc) => {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        batch.update(interactionDoc.ref, {
          type: 'dislike',
          createdAt: serverTimestamp(),
          expiresAt,
        });
      });

      // Create 24h dislike blocks (in case no existing interactions)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const interaction1Ref = doc(collection(db, 'interactions'));
      batch.set(interaction1Ref, {
        userId,
        targetUserId,
        type: 'dislike',
        createdAt: serverTimestamp(),
        expiresAt,
      });

      const interaction2Ref = doc(collection(db, 'interactions'));
      batch.set(interaction2Ref, {
        userId: targetUserId,
        targetUserId: userId,
        type: 'dislike',
        createdAt: serverTimestamp(),
        expiresAt,
      });

      await batch.commit();

      console.log('✅ Unmatch complete');

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

  async markMatchAnimationPlayed(
    matchId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await updateDoc(matchRef, {
        animationPlayed: true,
      });

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

    const matchesQuery1 = query(
      collection(db, 'matches'),
      where('user1', '==', userId),
      where('unmatched', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

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

        const lastMessage = convData.lastMessage
          ? {
              id: 'last',
              senderId: convData.lastMessage.senderId,
              text: convData.lastMessage.text,
              timestamp: convertTimestamp(convData.lastMessage.createdAt),
              isRead: true,
            }
          : undefined;

        conversations.push({
          id: convDoc.id,
          participants: convData.participants,
          messages: [],
          lastMessage,
          createdAt: convertTimestamp(convData.createdAt),
          updatedAt: convertTimestamp(convData.updatedAt),
          unreadCount: convData.unreadCount || 0,
        });
      }

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
        messages: messages.reverse(),
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

      const convDoc = await getDoc(doc(db, 'conversations', conversationId));
      if (!convDoc.exists()) {
        throw new Error('Conversation not found');
      }

      const convData = convDoc.data();
      const recipientId = convData.participants.find(
        (id: string) => id !== message.senderId
      );

      const updates: any = {
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: message.text,
          senderId: message.senderId,
          createdAt: new Date(),
        },
      };

      if (recipientId) {
        updates[`unreadCount.${recipientId}`] =
          (convData.unreadCount?.[recipientId] || 0) + 1;
      }

      await updateDoc(doc(db, 'conversations', conversationId), updates);

      if (recipientId) {
        try {
          const senderDoc = await getDoc(doc(db, 'users', message.senderId));
          const senderData = senderDoc.exists() ? senderDoc.data() : null;
          const senderToken = senderData?.pushToken;

          const recipientDoc = await getDoc(doc(db, 'users', recipientId));
          const recipientData = recipientDoc.exists()
            ? recipientDoc.data()
            : null;
          const recipientToken = recipientData?.pushToken;

          // Don't send notification if sender and recipient have the same push token (same device)
          if (senderToken && recipientToken && senderToken === recipientToken) {
            console.log(
              '📱 Same push token, skipping message notification to avoid self-notification'
            );
          } else {
            const senderName = senderDoc.exists()
              ? senderDoc.data().name
              : 'Someone';

            notificationService
              .broadcastMessageNotification(
                recipientId,
                senderName,
                message.text,
                conversationId
              )
              .catch((err) => {
                console.error('Failed to send message notification:', err);
              });
          }
        } catch (notifError) {
          console.error('Error preparing notification:', notifError);
        }
      }

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

  async markMessagesAsRead(
    conversationId: string,
    messageIds: string[],
    userId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const batch = writeBatch(db);

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
        console.error(
          'User exists in Auth but not in Firestore:',
          firebaseUser.uid
        );
        throw new Error('User profile not found. Please contact support.');
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

      let calculatedAge = profileData.age || 25;
      let zodiacSign = profileData.zodiacSign;

      if (profileData.dateOfBirth) {
        const birthDate = new Date(profileData.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        calculatedAge = age;

        // Calculate zodiac sign from date of birth if not provided
        if (!zodiacSign) {
          zodiacSign =
            calculateZodiacSign(profileData.dateOfBirth) || undefined;
        }
      }

      const newUser: User = {
        id: firebaseUser.uid,
        name: profileData.name || 'Unknown User',
        age: calculatedAge,
        dateOfBirth: profileData.dateOfBirth || new Date().toISOString(),
        ...(zodiacSign && { zodiacSign }),
        image: profileData.image || '',
        gender: profileData.gender || 'other',
        height: profileData.height || 170,
        bio: profileData.bio || '',
        interests: profileData.interests || [],
        location: profileData.location || '',
        preferences: profileData.preferences || {
          ageRange: [18, 99] as [number, number],
          maxDistance: 500,
          interestedIn: 'female' as const,
        },
      };

      let geohash: string | undefined;
      if (profileData.coordinates) {
        geohash = LocationService.generateGeohash(
          profileData.coordinates.latitude,
          profileData.coordinates.longitude
        );
      }

      let imageUrl = newUser.image;
      if (
        imageUrl &&
        (imageUrl.startsWith('file://') ||
          imageUrl.startsWith('content://') ||
          imageUrl.startsWith('data:') ||
          imageUrl.startsWith('/'))
      ) {
        const uploadResult = await storageService.uploadImage(imageUrl);
        if (uploadResult.success && uploadResult.secureUrl) {
          imageUrl = uploadResult.secureUrl;
          newUser.image = imageUrl;
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
        isProfileComplete: profileData.isProfileComplete ?? false,
        hasSeenTutorial: profileData.hasSeenTutorial ?? false,
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

  async verifyEmail(token: string): Promise<ApiResponse<boolean>> {
    try {
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
