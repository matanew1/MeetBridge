// services/firebase/firebaseServices.ts
// [SECURITY FIX] Added input sanitization throughout
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
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { db, auth } from './config';
import { safeGetDoc } from './firestoreHelpers';
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
import { geohashService, firestoreGeoHelper } from '../location';
import notificationService from '../notificationService';
import { calculateZodiacSign } from '../../utils/dateUtils';
// [SECURITY FIX] Import sanitization utilities
import {
  sanitizeCoordinates,
  sanitizeObjectKeys,
  sanitizeStringArray,
  sanitizeAge,
  sanitizeDisplayName,
  sanitizeBio,
} from '../../utils/inputSanitizer';
import cacheService from '../cacheService';
import performanceMonitor from '../performanceMonitor';

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

      let userDoc: any = null;
      try {
        userDoc = await safeGetDoc(
          doc(db, 'users', user.uid),
          `user_${user.uid}`
        );
      } catch (e) {
        console.warn(
          'Failed to get user doc from Firestore, will try cache',
          e
        );
        const cached = await cacheService.get(`user_${user.uid}`);
        if (cached) {
          // emulate snapshot-like object
          userDoc = {
            exists: () => true,
            id: user.uid,
            data: () => cached,
          } as any;
        }
      }
      if (
        !userDoc ||
        (typeof userDoc.exists === 'function' && !userDoc.exists())
      ) {
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

      // [SECURITY FIX] Sanitize user input before updating
      let dataToUpdate: Record<string, any> = { ...userData };

      // Sanitize string fields
      if (dataToUpdate.name) {
        dataToUpdate.name = sanitizeDisplayName(dataToUpdate.name);
        if (!dataToUpdate.name) {
          throw new Error('Invalid name');
        }
      }

      if (dataToUpdate.bio) {
        dataToUpdate.bio = sanitizeBio(dataToUpdate.bio, 500);
      }

      if (dataToUpdate.age !== undefined) {
        const sanitizedAge = sanitizeAge(dataToUpdate.age);
        if (sanitizedAge === null) {
          throw new Error('Invalid age');
        }
        dataToUpdate.age = sanitizedAge;
      }

      // [SECURITY] Sanitize coordinates
      if (dataToUpdate.coordinates) {
        const coords = sanitizeCoordinates(
          dataToUpdate.coordinates.latitude,
          dataToUpdate.coordinates.longitude
        );
        if (!coords) {
          throw new Error('Invalid coordinates');
        }
        dataToUpdate.coordinates = coords;
      }

      // [SECURITY] Sanitize interests array
      if (Array.isArray(dataToUpdate.interests)) {
        dataToUpdate.interests = sanitizeStringArray(
          dataToUpdate.interests,
          50,
          20
        );
      }

      // [SECURITY] Sanitize object keys to prevent prototype pollution
      dataToUpdate = sanitizeObjectKeys(dataToUpdate) as Record<string, any>;

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
        dataToUpdate.geohash = geohashService.encode(
          latitude,
          longitude,
          9 // Use precision 9 for maximum accuracy
        );
        console.log('📍 Generated geohash:', dataToUpdate.geohash);
      }

      // Remove undefined fields
      Object.keys(dataToUpdate).forEach((key) => {
        if (dataToUpdate[key] === undefined) {
          delete dataToUpdate[key];
        }
      });

      // Handle nested preferences and settings with dot notation
      const updateData: Record<string, any> = { updatedAt: serverTimestamp() };

      Object.keys(dataToUpdate).forEach((key) => {
        if (key === 'preferences' && typeof dataToUpdate[key] === 'object') {
          const prefs = dataToUpdate[key] as Record<string, any>;
          Object.keys(prefs).forEach((prefKey) => {
            updateData[`preferences.${prefKey}`] = prefs[prefKey];
          });
        } else if (
          key === 'settings' &&
          typeof dataToUpdate[key] === 'object'
        ) {
          const settings = dataToUpdate[key] as Record<string, any>;
          Object.keys(settings).forEach((settingsKey) => {
            if (typeof settings[settingsKey] === 'object') {
              const subSettings = settings[settingsKey] as Record<string, any>;
              Object.keys(subSettings).forEach((subKey) => {
                updateData[`settings.${settingsKey}.${subKey}`] =
                  subSettings[subKey];
              });
            } else {
              updateData[`settings.${settingsKey}`] = settings[settingsKey];
            }
          });
        } else {
          updateData[key] = dataToUpdate[key];
        }
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updateData);

      // Get updated document
      const updatedDoc = await safeGetDoc(userRef, `users:${userRef.id}`);
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
    page: number = 1,
    refresh: boolean = false
  ): Promise<ApiResponse<User[]>> {
    const startTime = Date.now();

    try {
      const pageSize = 20;
      const currentUserId = auth.currentUser?.uid;

      if (!currentUserId) {
        throw new Error('No user logged in');
      }

      const currentUserDoc = await safeGetDoc(
        doc(db, 'users', currentUserId),
        `users:${currentUserId}`
      );
      if (!currentUserDoc.exists()) {
        throw new Error('Current user not found');
      }

      const currentUserData = {
        ...currentUserDoc.data(),
        id: currentUserId,
      } as User;
      const userLocation = currentUserData?.coordinates;

      console.log('🔍 Discovery: Checking cache first');
      console.log('📍 Current user location:', userLocation);
      console.log('👤 Current user preferences:', currentUserData.preferences);
      console.log('✅ Is profile complete?', currentUserData.isProfileComplete);
      console.log('🎯 Search filters:', filters);

      if (!userLocation?.latitude || !userLocation?.longitude) {
        console.warn('User location not set');
        return {
          data: [],
          success: true,
          message: 'Location not available',
        };
      }

      // Create cache key based on location, filters, and user
      const locationGeohash = geohashService.encode(
        userLocation.latitude,
        userLocation.longitude
      );
      const cacheKey = `${currentUserId}:${locationGeohash}:${JSON.stringify(
        filters
      )}`;

      // 🔥 REAL-TIME APP: Skip cache entirely for discovery to ensure fresh data
      // Cache causes stale data issues in real-time apps where profiles change frequently
      console.log('🔥 REAL-TIME: Skipping cache for fresh discovery data');

      console.log(
        '🔥 FETCHING FRESH DATA FROM FIREBASE',
        refresh ? '(forced refresh)' : '(no cache)'
      );

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

      console.log(
        `🚫 Excluded users - Interacted: ${interactedIds.size}, Matched: ${matchedIds.size}`
      );
      console.log(
        `🚫 Interacted IDs: ${JSON.stringify(Array.from(interactedIds))}`
      );
      console.log(`🚫 Matched IDs: ${JSON.stringify(Array.from(matchedIds))}`);

      // Get query bounds using new geohash service
      const bounds = geohashService.getGeohashesInBounds(
        { ...userLocation, timestamp: Date.now() },
        filters.maxDistance
      );

      if (!bounds || !Array.isArray(bounds)) {
        console.error(
          'Invalid bounds returned from getGeohashesInBounds:',
          bounds
        );
        return {
          data: [],
          success: false,
          message: 'Failed to calculate location bounds',
        };
      }

      const profiles: User[] = [];
      const seenIds = new Set<string>([currentUserId]);
      let totalCandidates = 0;
      let filteredOutStats = {
        validation: 0,
        gender: 0,
        age: 0,
        distance: 0,
        excluded: 0,
      };

      // 🚀 OPTIMIZED: Single efficient query instead of multiple parallel queries
      // Use the first (primary) bound and limit results to reduce data transfer
      const primaryBound = bounds[0]; // Use the main bound that covers most of the area
      const maxUsersToFetch = Math.min(100, pageSize * 5); // Increased limit since we'll filter age client-side

      let q = query(
        collection(db, 'users'),
        where('geohash', '>=', primaryBound.lower),
        where('geohash', '<=', primaryBound.upper),
        where('isProfileComplete', '==', true), // Server-side filter for complete profiles
        limit(maxUsersToFetch)
      );

      // Add gender filter server-side if specified
      if (filters.gender) {
        q = query(q, where('gender', '==', filters.gender));
      }

      // 🔥 OPTIMIZATION: Moved age filtering to client-side to avoid compound query limitations
      // This allows the query to use indexes efficiently without requiring complex composite indexes

      console.log(
        '🔥 Executing optimized single query with server-side geohash/gender filters (age filtered client-side)'
      );

      // Execute single optimized query
      const snapshot = await getDocs(q);
      totalCandidates = snapshot.size;

      console.log(
        `📊 Query returned ${totalCandidates} candidates (server-side filtered)`
      );

      // Process results (simplified since most filtering is now server-side)
      snapshot.forEach((docSnapshot) => {
        const userId = docSnapshot.id;
        const data = { ...docSnapshot.data(), id: userId } as User;

        console.log(`👤 Found candidate: ${data.name || userId} (${userId})`);

        if (
          seenIds.has(userId) ||
          interactedIds.has(userId) ||
          matchedIds.has(userId)
        ) {
          console.log(`🚫 Excluding user ${userId}:`, {
            alreadySeen: seenIds.has(userId),
            inInteracted: interactedIds.has(userId),
            inMatched: matchedIds.has(userId),
          });
          filteredOutStats.excluded++;
          return;
        }
        seenIds.add(userId);

        // Basic validation (most filtering now done server-side)
        if (!data.coordinates?.latitude || !data.coordinates?.longitude) {
          filteredOutStats.validation++;
          return;
        }

        // 🔥 OPTIMIZATION: Client-side age filtering to avoid compound query issues
        if (data.age < filters.ageRange[0] || data.age > filters.ageRange[1]) {
          console.log(
            `🚫 Filtered by age: ${data.name || userId} (age ${
              data.age
            } not in ${filters.ageRange[0]}-${filters.ageRange[1]})`
          );
          filteredOutStats.age++;
          return;
        }

        if (data.coordinates?.latitude && data.coordinates?.longitude) {
          const distance = geohashService.calculateDistance(
            {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              timestamp: Date.now(),
            },
            {
              latitude: data.coordinates.latitude,
              longitude: data.coordinates.longitude,
              timestamp: Date.now(),
            }
          );

          console.log(`📏 Distance check for ${data.name || userId}:`, {
            distance: distance.toFixed(1) + 'm',
            maxDistance: filters.maxDistance + 'm',
            willInclude: distance <= filters.maxDistance,
          });

          if (distance > filters.maxDistance) {
            console.log(
              `🚫 Filtered by distance: ${
                data.name || userId
              } (${distance.toFixed(1)}m > ${filters.maxDistance}m)`
            );
            filteredOutStats.distance++;
            return;
          }

          profiles.push({
            id: userId,
            ...data,
            distance,
            lastSeen: convertTimestamp(data.lastSeen),
          } as User);
        }
      });

      console.log(`📊 Discovery Stats:
        - Total candidates found: ${totalCandidates}
        - Filtered out: ${JSON.stringify(filteredOutStats, null, 2)}
        - Final profiles: ${profiles.length}
      `);

      // Sort profiles by distance (already calculated)
      const sortedProfiles = profiles.sort((a, b) => {
        const distA = a.distance || Infinity;
        const distB = b.distance || Infinity;
        return distA - distB;
      });

      const queryTime = Date.now() - startTime;

      // 🔥 REAL-TIME APP: No caching - always fresh data from Firebase

      // Track performance metrics
      await performanceMonitor.trackDiscoveryPerformance({
        queryTime,
        resultCount: sortedProfiles.length,
        cacheHit: false, // Always fresh data in real-time app
        boundsCount: bounds.length,
        userId: currentUserId,
        filters,
      });

      // 🚀 UX OPTIMIZATION: Pre-load next page for instant scrolling
      let preloadedNextPage: User[] | null = null;
      if (page === 1 && sortedProfiles.length > pageSize) {
        // Pre-load page 2 in background for instant UX
        const nextPageStart = pageSize;
        const nextPageEnd = pageSize * 2;
        preloadedNextPage = sortedProfiles.slice(nextPageStart, nextPageEnd);

        console.log(
          `⚡ Pre-loaded ${preloadedNextPage.length} profiles for page 2`
        );
      }

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
        // Include pre-loaded next page for instant UX
        _preloadedNextPage: preloadedNextPage,
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
      data.coordinates?.longitude &&
      data.isProfileComplete === true
    );
  }

  private matchesGenderFilter(
    currentUser: any,
    targetUser: any,
    filters: SearchFilters
  ): boolean {
    if (!filters.gender) return true;
    const targetUserGender = targetUser.gender;
    const currentUserGender = currentUser.gender;
    const targetUserInterestedIn = targetUser.preferences?.interestedIn;

    // Debug logging for bi-directional matching
    const step1Pass = targetUserGender === filters.gender;
    const step2Pass = targetUserInterestedIn === currentUserGender;
    const willMatch = step1Pass && step2Pass;

    // Always log gender filter checks
    console.log(
      `🔍 Gender Filter: ${currentUser.name || currentUser.id} checking ${
        targetUser.name || targetUser.id
      }`,
      {
        currentGender: currentUserGender,
        targetGender: targetUserGender,
        targetInterestedIn: targetUserInterestedIn,
        filterGender: filters.gender,
        step1_targetMatchesFilter: step1Pass,
        step2_mutualInterest: step2Pass,
        result: willMatch ? '✅ MATCH' : '❌ FILTERED OUT',
      }
    );

    // Check if target user matches the gender current user is interested in
    if (!step1Pass) return false;

    // Check if target user is also interested in current user's gender (mutual interest)
    return step2Pass;
  }

  private matchesAgeFilter(targetUser: any, filters: SearchFilters): boolean {
    return (
      targetUser.age >= filters.ageRange[0] &&
      targetUser.age <= filters.ageRange[1]
    );
  }

  private async getInteractedUserIds(userId: string): Promise<Set<string>> {
    console.log(
      `🔄 Fetching fresh interactions for user ${userId} from Firestore`
    );

    const interactionsQuery = query(
      collection(db, 'interactions'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(interactionsQuery);

    console.log(
      `📊 Found ${snapshot.size} interaction documents in Firestore for user ${userId}`
    );

    const now = new Date();
    const interactedIds = new Set<string>();
    const expiredDocs: string[] = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const targetUserId = data.targetUserId;

      console.log(
        `🔍 Interaction doc ${doc.id}: userId=${data.userId}, targetUserId=${targetUserId}, type=${data.type}`
      );

      if (data.type === 'dislike' && data.expiresAt) {
        const expiresAt = data.expiresAt.toDate
          ? data.expiresAt.toDate()
          : new Date(data.expiresAt);

        if (expiresAt <= now) {
          // Mark expired interaction for deletion
          expiredDocs.push(doc.id);
          return;
        }
      }

      interactedIds.add(targetUserId);
    });

    // Delete expired interactions
    if (expiredDocs.length > 0) {
      const batch = writeBatch(db);
      expiredDocs.forEach((docId) => {
        const docRef = doc(db, 'interactions', docId);
        batch.delete(docRef);
      });
      await batch.commit();
    }

    // Cache the result for 5 minutes (300 seconds) - shorter TTL for real-time app
    const interactionsArray = Array.from(interactedIds);
    await cacheService.cacheUserInteractions(userId, interactionsArray, 300);

    console.log(
      `✅ Cached ${interactionsArray.length} interactions for user ${userId}`
    );

    return interactedIds;
  }

  /**
   * Clear interaction cache for a user (useful for debugging real-time sync issues)
   */
  async clearInteractionCache(userId: string): Promise<void> {
    console.log(
      `🗑️ Clearing interaction cache for user ${userId} (real-time app)`
    );
    // Clear both interaction cache and discovery cache since they are related
    await cacheService.invalidateByPrefix(`interactions:${userId}`);
    await cacheService.invalidateByPrefix(`discovery:`);
    console.log(
      `✅ Cleared interaction and discovery caches for real-time sync`
    );
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
          const matchedUserDoc = await safeGetDoc(
            doc(db, 'users', targetUserId),
            `users:${targetUserId}`
          );
          const matchedUserData =
            matchedUserDoc && matchedUserDoc.exists()
              ? matchedUserDoc.data()
              : null;

          // Send match notification to the target user (only from the user with smaller ID to avoid duplicates)
          if (userId < targetUserId) {
            try {
              const currentUserDoc = await safeGetDoc(
                doc(db, 'users', userId),
                `users:${userId}`
              );
              const currentUserData =
                currentUserDoc && currentUserDoc.exists()
                  ? currentUserDoc.data()
                  : null;
              const currentUserToken = currentUserData?.pushToken;

              const targetUserDoc = await safeGetDoc(
                doc(db, 'users', targetUserId),
                `users:${targetUserId}`
              );
              const targetUserData =
                targetUserDoc && targetUserDoc.exists()
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
                const currentUserName =
                  currentUserDoc && currentUserDoc.exists()
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
    } finally {
      // Invalidate interaction cache for this user
      await cacheService.delete(`interactions:${userId}`);
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
    } finally {
      // Invalidate interaction cache for this user
      await cacheService.delete(`interactions:${userId}`);
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
        matchInitiator: userId, // Track who completed the match (last to like)
      });

      batch.update(conversationRef, {
        matchId: matchRef.id,
      });

      await batch.commit();

      console.log('🎉 Match created:', matchRef.id);

      // Send notifications to both users
      try {
        const [user1Doc, user2Doc] = await Promise.all([
          safeGetDoc(doc(db, 'users', userId), `users:${userId}`),
          safeGetDoc(doc(db, 'users', targetUserId), `users:${targetUserId}`),
        ]);

        if (user1Doc.exists() && user2Doc.exists()) {
          const user1Data = user1Doc.data();
          const user2Data = user2Doc.data();

          // Send notification to the OTHER user (not the one who just liked)
          if (user2Data.pushToken && user2Data.notificationsEnabled !== false) {
            const message = {
              to: user2Data.pushToken,
              sound: 'default',
              title: "It's a Match! 💕",
              body: `You and ${
                user1Data.name || 'someone'
              } liked each other! Start chatting now.`,
              data: {
                type: 'match',
                matchId: matchRef.id,
                conversationId,
                showAnimation: false, // This user gets notification, not animation
              },
              priority: 'high',
            };

            fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(message),
            }).catch((e) => console.error('Push notification error:', e));
          }
        }
      } catch (notifError) {
        console.error('❌ Error sending match notification:', notifError);
        // Don't fail the match creation if notification fails
      }

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

  /**
   * Listen for new matches in real-time
   */
  onMatchAdded(
    userId: string,
    callback: (matchId: string, user: User, conversationId: string) => void
  ): () => void {
    const matchesQuery = query(
      collection(db, 'matches'),
      where('users', 'array-contains', userId),
      where('unmatched', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(matchesQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const matchData = change.doc.data();
          const matchId = change.doc.id;

          // Determine the other user in the match
          const otherUserId =
            matchData.user1 === userId ? matchData.user2 : matchData.user1;

          // Get the other user's profile (safe get with cache fallback)
          safeGetDoc(doc(db, 'users', otherUserId), `users:${otherUserId}`)
            .then((userDoc) => {
              if (userDoc && userDoc.exists && userDoc.exists()) {
                const user = {
                  ...userDoc.data(),
                  id: otherUserId,
                } as User;

                // Get or create conversation
                const conversationId =
                  matchData.conversationId || `${userId}_${otherUserId}`;

                callback(matchId, user, conversationId);
              }
            })
            .catch((error) => {
              console.error('Error fetching matched user:', error);
            });
        }
      });
    });

    return unsubscribe;
  }

  /**
   * Listen for removed matches in real-time
   */
  onMatchRemoved(
    userId: string,
    callback: (otherUserId: string) => void
  ): () => void {
    const matchesQuery = query(
      collection(db, 'matches'),
      where('participants', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(matchesQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const matchData = change.doc.data();

          // Check if the match was unmarked (unmatched)
          if (matchData.unmatched === true) {
            const otherUserId =
              matchData.user1 === userId ? matchData.user2 : matchData.user1;
            callback(otherUserId);
          }
        }
      });
    });

    return unsubscribe;
  }
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

      // Get current user's blocked users
      const currentUserDoc = await safeGetDoc(
        doc(db, 'users', userId),
        `users:${userId}`
      );
      if (!currentUserDoc.exists()) {
        return {
          data: [],
          success: false,
          message: 'User not found',
        };
      }
      const currentUserData = currentUserDoc.data();
      const blockedUsers = new Set(currentUserData.blockedUsers || []);
      console.log(`🔍 getMatches called for user ${userId}`);
      console.log(
        `🚫 User's blocked users: ${JSON.stringify(
          currentUserData.blockedUsers || []
        )}`
      );

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

      console.log(
        `📊 Query results: user1 matches: ${matchesSnapshot1.size}, user2 matches: ${matchesSnapshot2.size}`
      );

      const matchedUsers: User[] = [];
      const seenUserIds = new Set<string>();

      const allMatches = [...matchesSnapshot1.docs, ...matchesSnapshot2.docs];
      console.log(`📊 Total matches found: ${allMatches.length}`);

      for (const matchDoc of allMatches) {
        const matchData = matchDoc.data();
        const otherUserId =
          matchData.user1 === userId ? matchData.user2 : matchData.user1;

        console.log(
          `🔍 Processing match ${matchDoc.id}: current user ${userId}, other user ${otherUserId}`
        );
        console.log(`🚫 Blocked users: ${Array.from(blockedUsers)}`);
        console.log(
          `🚫 Is other user blocked? ${blockedUsers.has(otherUserId)}`
        );

        if (!seenUserIds.has(otherUserId) && !blockedUsers.has(otherUserId)) {
          seenUserIds.add(otherUserId);

          const userDoc = await safeGetDoc(
            doc(db, 'users', otherUserId),
            `users:${otherUserId}`
          );
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log(
              `✅ Found user document for ${otherUserId}: ${
                userData.name || userData.name
              }`
            );
            matchedUsers.push({
              id: userDoc.id,
              ...userData,
              lastSeen: convertTimestamp(userData.lastSeen),
              isMissedConnection: matchData.isMissedConnection || false, // Include the flag from match
            } as User);
          } else {
            console.log(`❌ User document not found for ${otherUserId}`);
          }
        } else {
          console.log(
            `🚫 Skipping user ${otherUserId} - seen: ${seenUserIds.has(
              otherUserId
            )}, blocked: ${blockedUsers.has(otherUserId)}`
          );
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

      // Get current user's blocked users
      const currentUserDoc = await safeGetDoc(
        doc(db, 'users', userId),
        `users:${userId}`
      );
      if (!currentUserDoc.exists()) {
        return {
          data: [],
          success: false,
          message: 'User not found',
        };
      }
      const currentUserData = currentUserDoc.data();
      const blockedUsers = new Set(currentUserData.blockedUsers || []);

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

        if (matchedUserIds.has(targetUserId) || blockedUsers.has(targetUserId))
          continue;

        const userDoc = await safeGetDoc(
          doc(db, 'users', targetUserId),
          `users:${targetUserId}`
        );

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
      // Try to find match with alphabetically sorted user IDs (regular matches)
      const [sortedUser1, sortedUser2] = [userId, targetUserId].sort();

      let matchQuery = query(
        collection(db, 'matches'),
        where('user1', '==', sortedUser1),
        where('user2', '==', sortedUser2)
      );
      let matchSnapshot = await getDocs(matchQuery);

      // If not found, try the reverse order (for missed connection matches)
      if (matchSnapshot.empty) {
        matchQuery = query(
          collection(db, 'matches'),
          where('user1', '==', sortedUser2),
          where('user2', '==', sortedUser1)
        );
        matchSnapshot = await getDocs(matchQuery);
      }

      if (matchSnapshot.empty) {
        console.log(
          'No match record found, but unmatch goal is already achieved'
        );
        return {
          data: true,
          success: true,
          message: 'Profile unmatched (no match record existed)',
        };
      }

      const matchDoc = matchSnapshot.docs[0];
      const matchData = matchDoc.data();

      // Check if already unmatched
      if (matchData.unmatched === true) {
        console.log('Match already unmatched, no action needed');
        return {
          data: true,
          success: true,
          message: 'Profile already unmatched',
        };
      }
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

      // Delete existing interactions between the users
      const existingInteractionsQuery = query(
        collection(db, 'interactions'),
        where('userId', 'in', [userId, targetUserId]),
        where('targetUserId', 'in', [userId, targetUserId])
      );
      const existingInteractionsSnapshot = await getDocs(
        existingInteractionsQuery
      );

      existingInteractionsSnapshot.docs.forEach((interactionDoc) => {
        batch.delete(interactionDoc.ref);
      });

      await batch.commit();

      console.log('✅ Unmatch complete - all interactions removed');

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
          isMissedConnection: convData.isMissedConnection || false,
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
      const convDoc = await safeGetDoc(
        doc(db, 'conversations', conversationId),
        `conversations:${conversationId}`
      );

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
        isMissedConnection: convData.isMissedConnection || false,
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

      const convDoc = await safeGetDoc(
        doc(db, 'conversations', conversationId),
        `conversations:${conversationId}`
      );
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
          createdAt: new Date(), // Use client timestamp for now to test
        },
      };

      if (recipientId) {
        updates[`unreadCount.${recipientId}`] =
          (convData.unreadCount?.[recipientId] || 0) + 1;
      }

      console.log('📤 Updating conversation with lastMessage:', {
        conversationId,
        text: message.text,
        senderId: message.senderId,
      });

      await updateDoc(doc(db, 'conversations', conversationId), updates);

      console.log('✅ Conversation updated with lastMessage');

      if (recipientId) {
        try {
          const senderDoc = await safeGetDoc(
            doc(db, 'users', message.senderId),
            `users:${message.senderId}`
          );
          const senderData = senderDoc.exists() ? senderDoc.data() : null;
          const senderToken = senderData?.pushToken;

          const recipientDoc = await safeGetDoc(
            doc(db, 'users', recipientId),
            `users:${recipientId}`
          );
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

      const userDoc = await safeGetDoc(
        doc(db, 'users', firebaseUser.uid),
        `users:${firebaseUser.uid}`
      );
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
      let errorMessage = 'Login failed';

      if (error instanceof Error) {
        const code = (error as any).code;
        switch (code) {
          case 'auth/invalid-credential':
            errorMessage =
              'Invalid email or password. Please check your credentials and try again';
            break;
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
        settings: profileData.settings || {
          notifications: {
            pushEnabled: true,
            messageNotifications: true,
            matchNotifications: true,
          },
          privacy: {
            showOnlineStatus: true,
            locationSharing: true,
            profileVisibility: 'public' as 'public' | 'matches' | 'private',
            dataSharing: true,
          },
          appearance: {
            language: 'en',
            theme: 'system' as 'light' | 'dark' | 'system',
          },
        },
      };

      let geohash: string | undefined;
      if (profileData.coordinates) {
        geohash = geohashService.encode(
          profileData.coordinates.latitude,
          profileData.coordinates.longitude,
          9 // Use precision 9 for maximum accuracy
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

  async cleanupOrphanedAuth(
    firebaseUser: FirebaseUser
  ): Promise<ApiResponse<boolean>> {
    try {
      console.log(
        '🧹 Checking for orphaned auth record for user:',
        firebaseUser.uid
      );

      const userDoc = await safeGetDoc(
        doc(db, 'users', firebaseUser.uid),
        `users:${firebaseUser.uid}`
      );

      if (!userDoc.exists()) {
        console.log(
          '⚠️ User exists in Auth but not in Firestore. Cleaning up...'
        );

        try {
          // NOTE: Deleting a Firebase Authentication user from the client can
          // fail (requires recent auth) and is potentially dangerous — an
          // attacker could trigger this path. Instead of attempting to delete
          // the auth record from the client, sign the user out and surface a
          // clear message instructing the user to re-register. If permanent
          // deletion is required, handle it via a trusted server-side (Admin
          // SDK) flow.
          console.warn(
            '⚠️ Not deleting auth user from client. Signing out instead.'
          );

          await signOut(auth);

          return {
            data: false,
            success: false,
            message:
              'No matching user profile found. You have been signed out. Please register again or contact support.',
          };
        } catch (deleteError) {
          // If signOut or the above flow fails, try to sign the user out and
          // return an explanatory error. Do not attempt to perform admin
          // actions from the client.
          console.error(
            '❌ Failed while handling orphaned auth case (client-side):',
            deleteError
          );

          try {
            await signOut(auth);
          } catch (signOutErr) {
            console.error(
              '❌ Failed to sign out during orphaned auth handling:',
              signOutErr
            );
          }

          return {
            data: false,
            success: false,
            message:
              'Authentication mismatch detected. You have been signed out. Please log in again or contact support.',
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

  async deleteAccount(password: string): Promise<ApiResponse<boolean>> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error('No authenticated user found');
      }

      const userId = firebaseUser.uid;
      console.log('🗑️ Starting account deletion for user:', userId);

      // Step 1: Reauthenticate user
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        password
      );
      await reauthenticateWithCredential(firebaseUser, credential);
      console.log('✅ User reauthenticated successfully');

      // Step 2: Delete user's profile image from storage
      try {
        const userDoc = await safeGetDoc(
          doc(db, 'users', userId),
          `users:${userId}`
        );
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.image) {
            await storageService.deleteImage(userData.image);
            console.log('✅ Profile image deleted');
          }
        }
      } catch (error) {
        console.error('⚠️ Error deleting profile image:', error);
        // Continue with deletion even if image deletion fails
      }

      // Step 3: Delete user's conversations and messages
      try {
        const conversationsQuery = query(
          collection(db, 'conversations'),
          where('participants', 'array-contains', userId)
        );
        const conversationsSnapshot = await getDocs(conversationsQuery);

        const batch = writeBatch(db);
        let batchCount = 0;

        for (const conversationDoc of conversationsSnapshot.docs) {
          // Delete all messages in this conversation
          const messagesQuery = query(
            collection(db, 'conversations', conversationDoc.id, 'messages')
          );
          const messagesSnapshot = await getDocs(messagesQuery);

          messagesSnapshot.docs.forEach((messageDoc) => {
            batch.delete(messageDoc.ref);
            batchCount++;
          });

          // Delete the conversation
          batch.delete(conversationDoc.ref);
          batchCount++;

          // Commit batch if it reaches 500 operations (Firestore limit)
          if (batchCount >= 450) {
            await batch.commit();
            batchCount = 0;
          }
        }

        if (batchCount > 0) {
          await batch.commit();
        }
        console.log('✅ Conversations and messages deleted');
      } catch (error) {
        console.error('⚠️ Error deleting conversations:', error);
        // Continue with deletion
      }

      // Step 4: Delete user's matches
      try {
        const matchesQuery = query(
          collection(db, 'matches'),
          where('users', 'array-contains', userId)
        );
        const matchesSnapshot = await getDocs(matchesQuery);

        const batch = writeBatch(db);
        matchesSnapshot.docs.forEach((matchDoc) => {
          batch.delete(matchDoc.ref);
        });

        if (matchesSnapshot.size > 0) {
          await batch.commit();
          console.log('✅ Matches deleted');
        }
      } catch (error) {
        console.error('⚠️ Error deleting matches:', error);
        // Continue with deletion
      }

      // Step 5: Delete user's likes (given and received)
      try {
        const likesGivenQuery = query(
          collection(db, 'likes'),
          where('userId', '==', userId)
        );
        const likesReceivedQuery = query(
          collection(db, 'likes'),
          where('likedUserId', '==', userId)
        );

        const [likesGivenSnapshot, likesReceivedSnapshot] = await Promise.all([
          getDocs(likesGivenQuery),
          getDocs(likesReceivedQuery),
        ]);

        const batch = writeBatch(db);
        likesGivenSnapshot.docs.forEach((likeDoc) => {
          batch.delete(likeDoc.ref);
        });
        likesReceivedSnapshot.docs.forEach((likeDoc) => {
          batch.delete(likeDoc.ref);
        });

        if (likesGivenSnapshot.size > 0 || likesReceivedSnapshot.size > 0) {
          await batch.commit();
          console.log('✅ Likes deleted');
        }
      } catch (error) {
        console.error('⚠️ Error deleting likes:', error);
        // Continue with deletion
      }

      // Step 6: Delete user's missed connections
      try {
        const connectionsQuery = query(
          collection(db, 'missedConnections'),
          where('userId', '==', userId)
        );
        const connectionsSnapshot = await getDocs(connectionsQuery);

        const batch = writeBatch(db);
        connectionsSnapshot.docs.forEach((connectionDoc) => {
          batch.delete(connectionDoc.ref);
        });

        if (connectionsSnapshot.size > 0) {
          await batch.commit();
          console.log('✅ Missed connections deleted');
        }
      } catch (error) {
        console.error('⚠️ Error deleting missed connections:', error);
        // Continue with deletion
      }

      // Step 7: Delete user profile from Firestore
      await deleteDoc(doc(db, 'users', userId));
      console.log('✅ User profile deleted from Firestore');

      // Step 8: Delete Firebase Authentication account
      await deleteUser(firebaseUser);
      console.log('✅ Firebase Authentication account deleted');

      return {
        data: true,
        success: true,
        message: 'Your account has been permanently deleted',
      };
    } catch (error) {
      console.error('❌ Error deleting account:', error);

      let errorMessage = 'Failed to delete account';

      if (error instanceof Error) {
        const code = (error as any).code;
        switch (code) {
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password. Please try again';
            break;
          case 'auth/requires-recent-login':
            errorMessage =
              'Please log out and log back in before deleting your account';
            break;
          case 'auth/user-not-found':
            errorMessage = 'User account not found';
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
}
