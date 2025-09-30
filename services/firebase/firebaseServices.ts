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
import geohashService from '../geohashService';

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
        dataToUpdate.geohash = geohashService.generateGeohash(
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
   * Get discover profiles using geohash-based location queries
   */
  async getDiscoverProfiles(
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
      if (!userLocation) {
        console.warn('User location not set, using basic query');
        return this.getDiscoverProfilesBasic(filters, page, user.uid);
      }

      // Get geohash query bounds for the search radius
      const bounds = geohashService.getQueryBounds(
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
          // Skip current user and already seen profiles
          if (seenIds.has(docSnapshot.id)) return;
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
              distance = geohashService.calculateDistance(
                userLocation,
                data.coordinates
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

      const sortedProfiles = geohashService.sortByDistance(
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
        if (docSnapshot.id === currentUserId) return; // Extra safety check

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
  ): Promise<ApiResponse<boolean>> {
    try {
      // Check if user already liked this profile
      const existingLikeQuery = query(
        collection(db, 'likes'),
        where('userId', '==', userId),
        where('targetUserId', '==', targetUserId)
      );
      const existingLikeSnapshot = await getDocs(existingLikeQuery);

      if (!existingLikeSnapshot.empty) {
        return {
          data: false,
          success: true,
          message: 'Profile already liked',
        };
      }

      // Add like
      await addDoc(collection(db, 'likes'), {
        userId,
        targetUserId,
        createdAt: serverTimestamp(),
        type: 'like',
      });

      // Check for mutual like (match)
      const matchQuery = query(
        collection(db, 'likes'),
        where('userId', '==', targetUserId),
        where('targetUserId', '==', userId),
        where('type', '==', 'like')
      );

      const matchSnapshot = await getDocs(matchQuery);

      if (!matchSnapshot.empty) {
        // Check if match already exists
        const existingMatchQuery = query(
          collection(db, 'matches'),
          where('users', 'array-contains', userId)
        );
        const existingMatchSnapshot = await getDocs(existingMatchQuery);

        let isNewMatch = true;
        for (const matchDoc of existingMatchSnapshot.docs) {
          const matchData = matchDoc.data();
          if (matchData.users.includes(targetUserId)) {
            isNewMatch = false;
            break;
          }
        }

        if (isNewMatch) {
          const batch = writeBatch(db);

          // Create match
          const matchRef = doc(collection(db, 'matches'));
          batch.set(matchRef, {
            users: [userId, targetUserId],
            createdAt: serverTimestamp(),
          });

          // Create conversation
          const conversationRef = doc(collection(db, 'conversations'));
          batch.set(conversationRef, {
            participants: [userId, targetUserId],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            unreadCount: 0,
          });

          await batch.commit();

          return {
            data: true,
            success: true,
            message: 'Match created successfully',
          };
        }
      }

      return {
        data: false,
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
      await addDoc(collection(db, 'likes'), {
        userId,
        targetUserId,
        createdAt: serverTimestamp(),
        type: 'dislike',
      });

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
   * Super like a profile
   */
  async superLikeProfile(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      await addDoc(collection(db, 'likes'), {
        userId,
        targetUserId,
        createdAt: serverTimestamp(),
        type: 'super_like',
      });

      return {
        data: true,
        success: true,
        message: 'Profile super-liked successfully',
      };
    } catch (error) {
      console.error('Error super-liking profile:', error);
      return {
        data: false,
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to super-like profile',
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
   * Get all matches for a user
   */
  async getMatches(
    userId: string,
    page: number = 1
  ): Promise<ApiResponse<User[]>> {
    try {
      const pageSize = 20;
      const matchesQuery = query(
        collection(db, 'matches'),
        where('users', 'array-contains', userId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      const matchesSnapshot = await getDocs(matchesQuery);
      const matchedUsers: User[] = [];

      for (const matchDoc of matchesSnapshot.docs) {
        const matchData = matchDoc.data();
        const otherUserId = matchData.users.find((id: string) => id !== userId);

        if (otherUserId) {
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
        pagination: {
          page,
          limit: pageSize,
          total: matchedUsers.length,
          hasMore: matchesSnapshot.size === pageSize,
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
   * Get all liked profiles for a user
   */
  async getLikedProfiles(
    userId: string,
    page: number = 1
  ): Promise<ApiResponse<User[]>> {
    try {
      const pageSize = 20;
      const likesQuery = query(
        collection(db, 'likes'),
        where('userId', '==', userId),
        where('type', '==', 'like'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      const likesSnapshot = await getDocs(likesQuery);
      const likedUsers: User[] = [];

      for (const likeDoc of likesSnapshot.docs) {
        const likeData = likeDoc.data();
        const userDoc = await getDoc(doc(db, 'users', likeData.targetUserId));

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
          hasMore: likesSnapshot.size === pageSize,
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
   * Unmatch a profile (removes match and conversation)
   */
  async unmatchProfile(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const batch = writeBatch(db);

      // Delete match
      const matchQuery = query(
        collection(db, 'matches'),
        where('users', 'array-contains', userId)
      );
      const matchSnapshot = await getDocs(matchQuery);

      for (const matchDoc of matchSnapshot.docs) {
        const matchData = matchDoc.data();
        if (matchData.users.includes(targetUserId)) {
          batch.delete(matchDoc.ref);
        }
      }

      // Delete conversation
      const convQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId)
      );
      const convSnapshot = await getDocs(convQuery);

      for (const convDoc of convSnapshot.docs) {
        const convData = convDoc.data();
        if (convData.participants.includes(targetUserId)) {
          batch.delete(convDoc.ref);
        }
      }

      await batch.commit();

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
        ...message,
        timestamp: serverTimestamp(),
      };

      const messageRef = await addDoc(
        collection(db, 'conversations', conversationId, 'messages'),
        messageData
      );

      await updateDoc(doc(db, 'conversations', conversationId), {
        updatedAt: serverTimestamp(),
      });

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
   * Mark messages as read
   */
  async markMessagesAsRead(
    conversationId: string,
    messageIds: string[]
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
        batch.update(messageRef, { isRead: true });
      }

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
        geohash = geohashService.generateGeohash(
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
   * Google Sign-In (requires additional setup)
   */
  async loginWithGoogle(): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      // This requires expo-auth-session and Google OAuth setup
      // Implementation depends on your specific OAuth configuration
      throw new Error(
        'Google login not implemented. Please configure OAuth in your app.'
      );
    } catch (error) {
      console.error('Error during Google login:', error);
      return {
        data: { user: {} as User, token: '' },
        success: false,
        message: error instanceof Error ? error.message : 'Google login failed',
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
