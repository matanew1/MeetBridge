// services/firebase/missedConnectionsService.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  getDoc,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  increment,
} from 'firebase/firestore';
import { db, auth } from './config';
import { safeGetDoc } from './firestoreHelpers';
import { geohashService } from '../location';
import notificationService from '../notificationService';
import storageService from '../storageService';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  text: string;
  createdAt: Date;
  isAnonymous?: boolean;
}

export interface MissedConnection {
  id: string;
  userId: string;
  userName?: string;
  userImage?: string;
  location: {
    lat: number;
    lng: number;
    landmark: string;
    category: string;
    icon: string;
  };
  description: string;
  tags?: string[];
  images?: string[];
  timeOccurred: Date;
  createdAt: Date;
  likes: number;
  likedBy?: string[];
  views: number;
  viewedBy?: string[];
  claims: number;
  comments: number;
  claimed: boolean;
  claimedBy?: string;
  verified: boolean;
  isAnonymous?: boolean;
  isEdited?: boolean;
  editedAt?: Date;
  savedBy?: string[];
}

export interface MissedConnectionClaim {
  id: string;
  connectionId: string;
  claimerId: string;
  claimerName: string;
  claimerImage?: string;
  locationVerified: boolean;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ChatRequest {
  id: string;
  users: string[];
  sender: string;
  receiver: string;
  claimId: string;
  connectionId: string;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
  acceptedBy: string[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'match' | 'chat_request' | 'claim_accepted' | 'general';
  data?: any;
  read: boolean;
  createdAt: Date;
}

// Helper to convert Firestore timestamps
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) return timestamp.toDate();
  if (timestamp?.seconds) return new Date(timestamp.seconds * 1000);
  return timestamp instanceof Date ? timestamp : new Date();
};

class MissedConnectionsService {
  /**
   * Create a new missed connection post
   */
  async createConnection(data: {
    location: {
      lat: number;
      lng: number;
      landmark: string;
      category: string;
      icon: string;
    };
    description: string;
    tags?: string[];
    images?: string[];
    timeOccurred: Date;
    isAnonymous?: boolean;
  }): Promise<{ success: boolean; connectionId?: string; message: string }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Get user profile for display info
      const userDoc = await safeGetDoc(
        doc(db, 'users', user.uid),
        `users:${user.uid}`
      );
      const userData = userDoc.exists() ? userDoc.data() : null;

      // Handle image upload to Cloudinary
      let uploadedImages: string[] = [];
      if (data.images && data.images.length > 0) {
        console.log('📤 Uploading images to Cloudinary...');
        for (const imageUri of data.images) {
          if (
            typeof imageUri === 'string' &&
            (imageUri.startsWith('file://') ||
              imageUri.startsWith('content://') ||
              imageUri.startsWith('data:') ||
              imageUri.startsWith('/'))
          ) {
            console.log('📤 Uploading image to Cloudinary...');
            const uploadResult = await storageService.uploadImage(imageUri);

            if (uploadResult.success && uploadResult.secureUrl) {
              uploadedImages.push(uploadResult.secureUrl);
              console.log('✅ Image uploaded:', uploadResult.secureUrl);
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
        console.log('✅ Images processed:', uploadedImages);
      }

      const connectionData = {
        userId: user.uid,
        userName: data.isAnonymous
          ? 'Anonymous'
          : userData?.name || 'Anonymous',
        userImage: data.isAnonymous ? null : userData?.image || null,
        location: data.location,
        description: data.description,
        tags: data.tags || [],
        images: uploadedImages,
        timeOccurred: data.timeOccurred,
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
        views: 0,
        viewedBy: [],
        claims: 0,
        comments: 0,
        claimed: false,
        verified: true, // User posted from actual location
        isAnonymous: data.isAnonymous || false,
        isEdited: false,
      };

      const docRef = await addDoc(
        collection(db, 'missed_connections'),
        connectionData
      );

      console.log('✅ Missed connection created:', docRef.id);
      return {
        success: true,
        connectionId: docRef.id,
        message: 'Connection posted successfully',
      };
    } catch (error) {
      console.error('❌ Error creating connection:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create connection',
      };
    }
  }

  /**
   * Update a missed connection
   */
  async updateConnection(
    connectionId: string,
    updates: {
      description?: string;
      timeOccurred?: Date;
      isAnonymous?: boolean;
      category?: string;
      tags?: string[];
      images?: string[];
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!auth.currentUser) {
        return {
          success: false,
          message: 'User not authenticated',
        };
      }

      const connectionRef = doc(db, 'missed_connections', connectionId);
      const connectionSnap = await safeGetDoc(
        connectionRef,
        `connections:${connectionRef.id}`
      );

      if (!connectionSnap.exists()) {
        return {
          success: false,
          message: 'Connection not found',
        };
      }

      const connectionData = connectionSnap.data();

      // Check if user owns this connection
      if (connectionData.userId !== auth.currentUser.uid) {
        return {
          success: false,
          message: 'You can only edit your own posts',
        };
      }

      const updateData: any = {
        isEdited: true,
        editedAt: serverTimestamp(),
      };

      // Handle individual field updates
      if (updates.description !== undefined) {
        updateData.description = updates.description;
      }
      if (updates.timeOccurred !== undefined) {
        updateData.timeOccurred = updates.timeOccurred;
      }
      if (updates.isAnonymous !== undefined) {
        updateData.isAnonymous = updates.isAnonymous;
      }
      if (updates.category !== undefined) {
        // Update the location.category by updating the entire location object
        const currentLocation = connectionData.location;
        updateData.location = {
          ...currentLocation,
          category: updates.category,
        };
      }
      if (updates.tags !== undefined) {
        updateData.tags = updates.tags;
      }
      if (updates.images !== undefined) {
        // Handle image upload to Cloudinary
        let uploadedImages: string[] = [];
        if (updates.images.length > 0) {
          console.log('📤 Uploading images to Cloudinary...');
          for (const imageUri of updates.images) {
            if (
              typeof imageUri === 'string' &&
              (imageUri.startsWith('file://') ||
                imageUri.startsWith('content://') ||
                imageUri.startsWith('data:') ||
                imageUri.startsWith('/'))
            ) {
              console.log('📤 Uploading image to Cloudinary...');
              const uploadResult = await storageService.uploadImage(imageUri);

              if (uploadResult.success && uploadResult.secureUrl) {
                uploadedImages.push(uploadResult.secureUrl);
                console.log('✅ Image uploaded:', uploadResult.secureUrl);
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
          console.log('✅ Images processed:', uploadedImages);
        }
        updateData.images = uploadedImages;
      }

      // If changing anonymity, update user info
      if (updates.isAnonymous !== undefined) {
        if (updates.isAnonymous) {
          updateData.userName = 'Anonymous';
          updateData.userImage = null;
        } else {
          // Get current user data
          const userDoc = await safeGetDoc(
            doc(db, 'users', auth.currentUser.uid),
            `users:${auth.currentUser.uid}`
          );
          const userData = userDoc.data();
          updateData.userName = userData?.name || 'Anonymous';
          updateData.userImage = userData?.image || null;
        }
      }

      await updateDoc(connectionRef, updateData);

      console.log('✅ Missed connection updated:', connectionId);
      return {
        success: true,
        message: 'Connection updated successfully',
      };
    } catch (error) {
      console.error('❌ Error updating connection:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update connection',
      };
    }
  }

  /**
   * Get all missed connections with optional filters
   */
  async getConnections(filters?: {
    category?: string;
    timeRange?: 'today' | 'week' | 'month' | 'all';
    nearLocation?: { lat: number; lng: number; radiusMeters: number };
    limitCount?: number;
  }): Promise<{ success: boolean; data: MissedConnection[]; message: string }> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return {
          success: false,
          data: [],
          message: 'User not authenticated',
        };
      }

      // Get current user's blocked users
      const currentUserDoc = await safeGetDoc(
        doc(db, 'users', currentUser.uid),
        `users:${currentUser.uid}`
      );
      if (!currentUserDoc.exists()) {
        return {
          success: false,
          data: [],
          message: 'User profile not found',
        };
      }
      const currentUserData = currentUserDoc.data();
      const blockedUsers = new Set(currentUserData.blockedUsers || []);

      let q = query(
        collection(db, 'missed_connections'),
        orderBy('createdAt', 'desc')
      );

      // Apply limit
      if (filters?.limitCount) {
        q = query(q, limit(filters.limitCount));
      } else {
        q = query(q, limit(50)); // Default limit
      }

      const snapshot = await getDocs(q);
      let connections: MissedConnection[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userImage: data.userImage,
          location: data.location,
          description: data.description,
          tags: data.tags || [],
          images: data.images || [],
          timeOccurred: convertTimestamp(data.timeOccurred),
          createdAt: convertTimestamp(data.createdAt),
          likes: data.likes || 0,
          likedBy: data.likedBy || [],
          views: data.views || 0,
          viewedBy: data.viewedBy || [],
          claims: data.claims || 0,
          comments: data.comments || 0,
          claimed: data.claimed || false,
          claimedBy: data.claimedBy,
          verified: data.verified || false,
          isAnonymous: data.isAnonymous || false,
          isEdited: data.isEdited || false,
          editedAt: data.editedAt ? convertTimestamp(data.editedAt) : undefined,
          savedBy: data.savedBy || [],
        };
      });

      // Apply category filter
      if (filters?.category) {
        connections = connections.filter(
          (conn) => conn.location.category === filters.category
        );
      }

      // Apply time range filter
      if (filters?.timeRange) {
        const now = new Date();
        connections = connections.filter((conn) => {
          const diff = now.getTime() - conn.createdAt.getTime();
          switch (filters.timeRange) {
            case 'today':
              return diff < 24 * 60 * 60 * 1000;
            case 'week':
              return diff < 7 * 24 * 60 * 60 * 1000;
            case 'month':
              return diff < 30 * 24 * 60 * 60 * 1000;
            default:
              return true;
          }
        });
      }

      // Apply location filter (near you)
      if (filters?.nearLocation) {
        connections = connections.filter((conn) => {
          const distance = geohashService.calculateDistance(
            {
              latitude: filters.nearLocation!.lat,
              longitude: filters.nearLocation!.lng,
              timestamp: Date.now(),
            },
            {
              latitude: conn.location.lat,
              longitude: conn.location.lng,
              timestamp: Date.now(),
            }
          );
          return distance <= filters.nearLocation!.radiusMeters;
        });
      }

      // Apply block filter - remove posts from blocked users and users who blocked current user
      connections = await Promise.all(
        connections.map(async (conn) => {
          // Check if current user blocked this post owner
          if (blockedUsers.has(conn.userId)) {
            return null;
          }

          // Check if post owner blocked current user
          const blockQuery = query(
            collection(db, 'blocks'),
            where('userId', '==', conn.userId),
            where('blockedUserId', '==', currentUser.uid)
          );
          const blockSnapshot = await getDocs(blockQuery);
          if (!blockSnapshot.empty) {
            return null;
          }

          return conn;
        })
      ).then(
        (results) =>
          results.filter((conn) => conn !== null) as MissedConnection[]
      );

      return {
        success: true,
        data: connections,
        message: 'Connections retrieved successfully',
      };
    } catch (error) {
      console.error('❌ Error getting connections:', error);
      return {
        success: false,
        data: [],
        message:
          error instanceof Error ? error.message : 'Failed to get connections',
      };
    }
  }

  /**
   * Toggle like on a connection (one like per user)
   */
  async toggleLike(
    connectionId: string,
    userId: string
  ): Promise<{ success: boolean; message: string; isLiked?: boolean }> {
    try {
      const connectionRef = doc(db, 'missed_connections', connectionId);
      const connectionDoc = await safeGetDoc(
        connectionRef,
        `connections:${connectionRef.id}`
      );

      if (!connectionDoc.exists()) {
        return { success: false, message: 'Connection not found' };
      }

      const data = connectionDoc.data();
      const likedBy = data.likedBy || [];
      const isCurrentlyLiked = likedBy.includes(userId);

      if (isCurrentlyLiked) {
        // Unlike: remove user from likedBy array
        await updateDoc(connectionRef, {
          likes: increment(-1),
          likedBy: likedBy.filter((id: string) => id !== userId),
        });
        console.log('✅ Connection unliked:', connectionId);
        return { success: true, message: 'Like removed', isLiked: false };
      } else {
        // Like: add user to likedBy array
        await updateDoc(connectionRef, {
          likes: increment(1),
          likedBy: [...likedBy, userId],
        });
        console.log('✅ Connection liked:', connectionId);
        return { success: true, message: 'Connection liked', isLiked: true };
      }
    } catch (error) {
      console.error('❌ Error toggling like:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to like connection',
      };
    }
  }

  /**
   * Track view of a connection (one view per user)
   */
  async viewConnection(
    connectionId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const connectionRef = doc(db, 'missed_connections', connectionId);
      const connectionDoc = await safeGetDoc(
        connectionRef,
        `connections:${connectionRef.id}`
      );

      if (!connectionDoc.exists()) {
        return { success: false, message: 'Connection not found' };
      }

      const data = connectionDoc.data();
      const viewedBy = data.viewedBy || [];
      const alreadyViewed = viewedBy.includes(userId);

      // Only increment view count if user hasn't viewed before
      if (!alreadyViewed) {
        await updateDoc(connectionRef, {
          views: increment(1),
          viewedBy: [...viewedBy, userId],
        });
        console.log('✅ Connection view tracked:', connectionId);
      }

      return { success: true, message: 'View tracked' };
    } catch (error) {
      console.error('❌ Error tracking view:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to track view',
      };
    }
  }

  /**
   * Claim a connection (That's Me!)
   */
  async claimConnection(
    connectionId: string
  ): Promise<{ success: boolean; claimId?: string; message: string }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Get the connection to find the post owner
      const connectionDoc = await safeGetDoc(
        doc(db, 'missed_connections', connectionId)
      );
      if (!connectionDoc.exists()) {
        return { success: false, message: 'Connection not found' };
      }

      const connectionData = connectionDoc.data();
      const postOwnerId = connectionData.userId;

      // Check if current user blocked the post owner
      const currentUserDoc = await safeGetDoc(
        doc(db, 'users', user.uid),
        `users:${user.uid}`
      );
      if (currentUserDoc.exists()) {
        const currentUserData = currentUserDoc.data();
        const blockedUsers = currentUserData.blockedUsers || [];
        if (blockedUsers.includes(postOwnerId)) {
          return {
            success: false,
            message: 'You cannot claim posts from users you have blocked',
          };
        }
      }

      // Check if post owner blocked current user
      const blockQuery = query(
        collection(db, 'blocks'),
        where('userId', '==', postOwnerId),
        where('blockedUserId', '==', user.uid)
      );
      const blockSnapshot = await getDocs(blockQuery);
      if (!blockSnapshot.empty) {
        return {
          success: false,
          message: 'You cannot claim posts from users who have blocked you',
        };
      }

      // Check if a conversation already exists between these users
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', user.uid)
      );
      const conversationsSnapshot = await getDocs(conversationsQuery);

      const existingConversation = conversationsSnapshot.docs.find((doc) => {
        const participants = doc.data().participants || [];
        return participants.includes(postOwnerId);
      });

      if (existingConversation) {
        return {
          success: false,
          message: 'You already have a conversation with this person',
        };
      }

      // Check if user already claimed this connection
      const existingClaimQuery = query(
        collection(db, 'missed_connection_claims'),
        where('connectionId', '==', connectionId),
        where('claimerId', '==', user.uid)
      );
      const existingClaimSnapshot = await getDocs(existingClaimQuery);

      if (!existingClaimSnapshot.empty) {
        return {
          success: false,
          message: 'You have already claimed this connection',
        };
      }

      // Get user profile
      const userDoc = await safeGetDoc(
        doc(db, 'users', user.uid),
        `users:${user.uid}`
      );
      const userData = userDoc.exists() ? userDoc.data() : null;

      // Create claim
      const claimData = {
        connectionId,
        claimerId: user.uid,
        claimerName: userData?.name || 'Anonymous',
        claimerImage: userData?.image || null,
        locationVerified: false, // TODO: Implement location verification
        createdAt: serverTimestamp(),
        status: 'pending',
      };

      const claimRef = await addDoc(
        collection(db, 'missed_connection_claims'),
        claimData
      );

      // Update connection
      const connectionRef = doc(db, 'missed_connections', connectionId);
      await updateDoc(connectionRef, {
        claims: increment(1),
      });

      console.log('✅ Connection claimed:', connectionId);
      return {
        success: true,
        claimId: claimRef.id,
        message: 'Claim submitted successfully',
      };
    } catch (error) {
      console.error('❌ Error claiming connection:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to claim connection',
      };
    }
  }

  /**
   * Get claims for a specific connection
   */
  async getClaims(connectionId: string): Promise<{
    success: boolean;
    data: MissedConnectionClaim[];
    message: string;
  }> {
    try {
      const q = query(
        collection(db, 'missed_connection_claims'),
        where('connectionId', '==', connectionId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const claims: MissedConnectionClaim[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          connectionId: data.connectionId,
          claimerId: data.claimerId,
          claimerName: data.claimerName,
          claimerImage: data.claimerImage,
          locationVerified: data.locationVerified || false,
          createdAt: convertTimestamp(data.createdAt),
          status: data.status || 'pending',
        };
      });

      return {
        success: true,
        data: claims,
        message: 'Claims retrieved successfully',
      };
    } catch (error) {
      console.error('❌ Error getting claims:', error);
      return {
        success: false,
        data: [],
        message:
          error instanceof Error ? error.message : 'Failed to get claims',
      };
    }
  }

  /**
   * Real-time listener for connections
   */
  subscribeToConnections(
    callback: (connections: MissedConnection[]) => void,
    filters?: {
      category?: string;
      limitCount?: number;
    }
  ): Unsubscribe {
    let q = query(
      collection(db, 'missed_connections'),
      orderBy('createdAt', 'desc')
    );

    if (filters?.limitCount) {
      q = query(q, limit(filters.limitCount));
    } else {
      q = query(q, limit(1000));
    }

    return onSnapshot(q, (snapshot) => {
      let connections: MissedConnection[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userImage: data.userImage,
          location: data.location,
          description: data.description,
          tags: data.tags || [],
          images: data.images || [],
          timeOccurred: convertTimestamp(data.timeOccurred),
          createdAt: convertTimestamp(data.createdAt),
          likes: data.likes || 0,
          likedBy: data.likedBy || [],
          views: data.views || 0,
          viewedBy: data.viewedBy || [],
          claims: data.claims || 0,
          comments: data.comments || 0,
          claimed: data.claimed || false,
          claimedBy: data.claimedBy,
          verified: data.verified || false,
          isAnonymous: data.isAnonymous || false,
          isEdited: data.isEdited || false,
          editedAt: data.editedAt ? convertTimestamp(data.editedAt) : undefined,
          savedBy: data.savedBy || [],
        };
      });

      // Apply category filter
      if (filters?.category) {
        connections = connections.filter(
          (conn) => conn.location.category === filters.category
        );
      }

      callback(connections);
    });
  }

  /**
   * Get a single connection by ID
   */
  async getConnectionById(connectionId: string): Promise<{
    success: boolean;
    data?: MissedConnection;
    message: string;
  }> {
    try {
      const connectionDoc = await safeGetDoc(
        doc(db, 'missed_connections', connectionId),
        `connections:${connectionId}`
      );

      if (!connectionDoc.exists()) {
        return { success: false, message: 'Connection not found' };
      }

      const data = connectionDoc.data();
      const connection: MissedConnection = {
        id: connectionDoc.id,
        userId: data.userId,
        userName: data.userName,
        userImage: data.userImage,
        location: data.location,
        description: data.description,
        tags: data.tags || [],
        images: data.images || [],
        timeOccurred: convertTimestamp(data.timeOccurred),
        createdAt: convertTimestamp(data.createdAt),
        likes: data.likes || 0,
        likedBy: data.likedBy || [],
        views: data.views || 0,
        viewedBy: data.viewedBy || [],
        claims: data.claims || 0,
        comments: data.comments || 0,
        claimed: data.claimed || false,
        claimedBy: data.claimedBy,
        verified: data.verified || false,
        isAnonymous: data.isAnonymous || false,
        isEdited: data.isEdited || false,
        editedAt: data.editedAt ? convertTimestamp(data.editedAt) : undefined,
        savedBy: data.savedBy || [],
      };

      return {
        success: true,
        data: connection,
        message: 'Connection retrieved successfully',
      };
    } catch (error) {
      console.error('❌ Error getting connection:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get connection',
      };
    }
  }

  /**
   * Add a comment to a connection
   */
  async addComment(
    connectionId: string,
    userId: string,
    commentText: string,
    isAnonymous: boolean = false
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Get user profile for display info
      let userData = null;
      try {
        const userDoc = await safeGetDoc(
          doc(db, 'users', userId),
          `users:${userId}`
        );
        userData = userDoc.exists() ? userDoc.data() : null;
      } catch (err) {
        console.log('Could not fetch user data, using defaults');
      }

      const commentData = {
        connectionId,
        userId: isAnonymous ? userId : userId, // Keep userId for tracking but hide identity
        userName: isAnonymous ? 'Anonymous' : userData?.name || 'Anonymous',
        userImage: isAnonymous ? null : userData?.image || null,
        text: commentText,
        isAnonymous,
        createdAt: serverTimestamp(),
      };

      // Add comment to subcollection
      await addDoc(
        collection(db, 'missed_connections', connectionId, 'comments'),
        commentData
      );

      // Increment comment count
      const connectionRef = doc(db, 'missed_connections', connectionId);
      await updateDoc(connectionRef, {
        comments: increment(1),
      });

      console.log('✅ Comment added to connection:', connectionId);
      return { success: true, message: 'Comment added successfully' };
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to add comment',
      };
    }
  }

  /**
   * Get comments for a connection
   */
  async getComments(connectionId: string): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      userId: string;
      userName: string;
      userImage?: string;
      text: string;
      createdAt: Date;
    }>;
    message: string;
  }> {
    try {
      const commentsQuery = query(
        collection(db, 'missed_connections', connectionId, 'comments'),
        orderBy('createdAt', 'asc')
      );

      const snapshot = await getDocs(commentsQuery);
      const comments = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userImage: data.userImage,
          text: data.text,
          createdAt: convertTimestamp(data.createdAt),
        };
      });

      return {
        success: true,
        data: comments,
        message: 'Comments retrieved successfully',
      };
    } catch (error) {
      console.error('❌ Error getting comments:', error);
      return {
        success: false,
        data: [],
        message:
          error instanceof Error ? error.message : 'Failed to get comments',
      };
    }
  }

  /**
   * Real-time listener for comments on a connection
   */
  subscribeToComments(
    connectionId: string,
    callback: (
      comments: Array<{
        id: string;
        userId: string;
        userName: string;
        userImage?: string;
        text: string;
        createdAt: Date;
      }>
    ) => void
  ): Unsubscribe {
    const commentsQuery = query(
      collection(db, 'missed_connections', connectionId, 'comments'),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(commentsQuery, (snapshot) => {
      const comments = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userImage: data.userImage,
          text: data.text,
          createdAt: convertTimestamp(data.createdAt),
        };
      });

      callback(comments);
    });
  }

  /**
   * Toggle save on a connection (one save per user)
   */
  async toggleSave(
    connectionId: string,
    userId: string
  ): Promise<{ success: boolean; message: string; isSaved?: boolean }> {
    try {
      const connectionRef = doc(db, 'missed_connections', connectionId);
      const connectionDoc = await safeGetDoc(
        connectionRef,
        `connections:${connectionRef.id}`
      );

      if (!connectionDoc.exists()) {
        return { success: false, message: 'Connection not found' };
      }

      const data = connectionDoc.data();
      const savedBy = data.savedBy || [];
      const isCurrentlySaved = savedBy.includes(userId);

      if (isCurrentlySaved) {
        // Unsave: remove user from savedBy array
        await updateDoc(connectionRef, {
          savedBy: savedBy.filter((id: string) => id !== userId),
        });
        console.log('✅ Connection unsaved:', connectionId);
        return { success: true, message: 'Save removed', isSaved: false };
      } else {
        // Save: add user to savedBy array
        await updateDoc(connectionRef, {
          savedBy: [...savedBy, userId],
        });
        console.log('✅ Connection saved:', connectionId);
        return { success: true, message: 'Connection saved', isSaved: true };
      }
    } catch (error) {
      console.error('❌ Error toggling save:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to save connection',
      };
    }
  }

  /**
   * Get user's own posts
   */
  async getUserPosts(
    userId: string,
    limitCount: number = 50
  ): Promise<{ success: boolean; data: MissedConnection[]; message: string }> {
    try {
      const q = query(
        collection(db, 'missed_connections'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const connections: MissedConnection[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userImage: data.userImage,
          location: data.location,
          description: data.description,
          tags: data.tags || [],
          images: data.images || [],
          timeOccurred: convertTimestamp(data.timeOccurred),
          createdAt: convertTimestamp(data.createdAt),
          likes: data.likes || 0,
          likedBy: data.likedBy || [],
          views: data.views || 0,
          viewedBy: data.viewedBy || [],
          claims: data.claims || 0,
          comments: data.comments || 0,
          claimed: data.claimed || false,
          claimedBy: data.claimedBy,
          verified: data.verified || false,
          isAnonymous: data.isAnonymous || false,
          isEdited: data.isEdited || false,
          editedAt: data.editedAt ? convertTimestamp(data.editedAt) : undefined,
          savedBy: data.savedBy || [],
        };
      });

      return {
        success: true,
        data: connections,
        message: 'User posts retrieved successfully',
      };
    } catch (error) {
      console.error('❌ Error getting user posts:', error);
      return {
        success: false,
        data: [],
        message:
          error instanceof Error ? error.message : 'Failed to get user posts',
      };
    }
  }

  /**
   * Get user's saved posts
   */
  async getSavedPosts(
    userId: string,
    limitCount: number = 50
  ): Promise<{ success: boolean; data: MissedConnection[]; message: string }> {
    try {
      const q = query(
        collection(db, 'missed_connections'),
        where('savedBy', 'array-contains', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const connections: MissedConnection[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userImage: data.userImage,
          location: data.location,
          description: data.description,
          tags: data.tags || [],
          images: data.images || [],
          timeOccurred: convertTimestamp(data.timeOccurred),
          createdAt: convertTimestamp(data.createdAt),
          likes: data.likes || 0,
          likedBy: data.likedBy || [],
          views: data.views || 0,
          viewedBy: data.viewedBy || [],
          claims: data.claims || 0,
          comments: data.comments || 0,
          claimed: data.claimed || false,
          claimedBy: data.claimedBy,
          verified: data.verified || false,
          isAnonymous: data.isAnonymous || false,
          isEdited: data.isEdited || false,
          editedAt: data.editedAt ? convertTimestamp(data.editedAt) : undefined,
          savedBy: data.savedBy || [],
        };
      });

      return {
        success: true,
        data: connections,
        message: 'Saved posts retrieved successfully',
      };
    } catch (error) {
      console.error('❌ Error getting saved posts:', error);
      return {
        success: false,
        data: [],
        message:
          error instanceof Error ? error.message : 'Failed to get saved posts',
      };
    }
  }

  /**
   * Accept a claim and create a chat request
   */
  async acceptClaim(
    claimId: string
  ): Promise<{ success: boolean; chatRequestId?: string; message: string }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Get the claim
      const claimRef = doc(db, 'missed_connection_claims', claimId);
      const claimDoc = await safeGetDoc(claimRef, `claims:${claimRef.id}`);

      if (!claimDoc.exists()) {
        return { success: false, message: 'Claim not found' };
      }

      const claimData = claimDoc.data();

      // Verify the current user owns the connection
      const connectionRef = doc(
        db,
        'missed_connections',
        claimData.connectionId
      );
      const connectionDoc = await safeGetDoc(
        connectionRef,
        `connections:${connectionRef.id}`
      );

      if (!connectionDoc.exists()) {
        return { success: false, message: 'Connection not found' };
      }

      const connectionData = connectionDoc.data();
      if (connectionData.userId !== user.uid) {
        return {
          success: false,
          message: 'You can only accept claims on your own posts',
        };
      }

      // Update claim status
      await updateDoc(claimRef, {
        status: 'accepted',
      });

      // Create a chat request (no expiry, simple request system)
      const chatRequestData = {
        users: [user.uid, claimData.claimerId],
        sender: user.uid, // Person who accepted the claim (post owner)
        receiver: claimData.claimerId, // Person who claimed
        claimId: claimId,
        connectionId: claimData.connectionId,
        createdAt: serverTimestamp(),
        status: 'pending',
        acceptedBy: [user.uid], // Sender automatically accepts
      };

      const chatRequestRef = await addDoc(
        collection(db, 'chat_requests'),
        chatRequestData
      );

      // Send push notification to the claimer (receiver)
      try {
        const [senderDoc, receiverDoc] = await Promise.all([
          safeGetDoc(doc(db, 'users', user.uid), `users:${user.uid}`),
          safeGetDoc(
            doc(db, 'users', claimData.claimerId),
            `users:${claimData.claimerId}`
          ),
        ]);

        if (senderDoc.exists() && receiverDoc.exists()) {
          const senderData = senderDoc.data();
          const receiverData = receiverDoc.data();

          if (
            receiverData.pushToken &&
            receiverData.notificationsEnabled !== false
          ) {
            // Send push notification using the broadcast method
            const message = {
              to: receiverData.pushToken,
              sound: 'default',
              title: 'Chat Request 💬',
              body: `${senderData.name || 'Someone'} wants to chat with you!`,
              data: {
                type: 'chat_request',
                chatRequestId: chatRequestRef.id,
                senderId: user.uid,
              },
              priority: 'high',
            };

            const response = await fetch(
              'https://exp.host/--/api/v2/push/send',
              {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Accept-encoding': 'gzip, deflate',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
              }
            );

            const result = await response.json();
            console.log('📲 Push notification sent to receiver:', result);

            // Store notification in database
            await this.storeNotification(
              claimData.claimerId,
              'Chat Request 💬',
              `${senderData.name || 'Someone'} wants to chat with you!`,
              'chat_request',
              {
                chatRequestId: chatRequestRef.id,
                senderId: user.uid,
                connectionId: claimData.connectionId,
              }
            );
          }
        }
      } catch (notifError) {
        console.error('❌ Error sending notification:', notifError);
        // Don't fail the whole operation if notification fails
      }

      // Delete the claim now that it's been accepted and chat request created
      await deleteDoc(claimRef);
      console.log('✅ Claim deleted after acceptance:', claimId);

      console.log('✅ Chat request created:', chatRequestRef.id);
      return {
        success: true,
        chatRequestId: chatRequestRef.id,
        message: 'Chat request sent successfully',
      };
    } catch (error) {
      console.error('❌ Error accepting claim:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to accept claim',
      };
    }
  }

  /**
   * Reject a claim
   */
  async rejectClaim(
    claimId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Get the claim
      const claimRef = doc(db, 'missed_connection_claims', claimId);
      const claimDoc = await safeGetDoc(claimRef, `claims:${claimRef.id}`);

      if (!claimDoc.exists()) {
        return { success: false, message: 'Claim not found' };
      }

      const claimData = claimDoc.data();

      // Verify the current user owns the connection
      const connectionRef = doc(
        db,
        'missed_connections',
        claimData.connectionId
      );
      const connectionDoc = await safeGetDoc(
        connectionRef,
        `connections:${connectionRef.id}`
      );

      if (!connectionDoc.exists()) {
        return { success: false, message: 'Connection not found' };
      }

      const connectionData = connectionDoc.data();
      if (connectionData.userId !== user.uid) {
        return {
          success: false,
          message: 'You can only reject claims on your own posts',
        };
      }

      // Update claim status
      await updateDoc(claimRef, {
        status: 'rejected',
      });

      console.log('✅ Claim rejected:', claimId);
      return {
        success: true,
        message: 'Claim rejected successfully',
      };
    } catch (error) {
      console.error('❌ Error rejecting claim:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to reject claim',
      };
    }
  }

  /**
   * Accept chat request (both users must accept to create conversation)
   */
  async acceptChatRequest(chatRequestId: string): Promise<{
    success: boolean;
    matchId?: string;
    conversationId?: string;
    message: string;
  }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const chatRequestRef = doc(db, 'chat_requests', chatRequestId);
      const chatRequestDoc = await safeGetDoc(
        chatRequestRef,
        `chatRequests:${chatRequestRef.id}`
      );

      if (!chatRequestDoc.exists()) {
        return { success: false, message: 'Chat request not found' };
      }

      const chatRequestData = chatRequestDoc.data();

      // Add user to acceptedBy array
      const acceptedBy = chatRequestData.acceptedBy || [];
      if (!acceptedBy.includes(user.uid)) {
        acceptedBy.push(user.uid);
        await updateDoc(chatRequestRef, { acceptedBy });
      }

      // If both users accepted, create permanent match and conversation
      if (acceptedBy.length === 2) {
        // Create conversation
        const conversationData = {
          participants: chatRequestData.users,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          unreadCount: {
            [chatRequestData.users[0]]: 0,
            [chatRequestData.users[1]]: 0,
          },
          isMissedConnection: true, // Flag to identify missed connection chats
        };

        const conversationRef = await addDoc(
          collection(db, 'conversations'),
          conversationData
        );

        // Create permanent match
        const matchData = {
          users: chatRequestData.users,
          user1: chatRequestData.users[0],
          user2: chatRequestData.users[1],
          conversationId: conversationRef.id,
          createdAt: serverTimestamp(),
          animationPlayed: true, // Animation already played during chat request acceptance
          unmatched: false, // Required field to appear in Winks tab queries
          isMissedConnection: true, // Flag to identify missed connection matches
          matchInitiator: user.uid, // Track who completed the match (second to accept)
        };

        const matchRef = await addDoc(collection(db, 'matches'), matchData);

        // Update connection to mark as claimed
        const connectionRef = doc(
          db,
          'missed_connections',
          chatRequestData.connectionId
        );
        await updateDoc(connectionRef, {
          claimed: true,
          claimedBy: chatRequestData.users.find(
            (id: string) => id !== chatRequestData.sender
          ),
        });

        // Update chat request status
        await updateDoc(chatRequestRef, {
          status: 'accepted',
          conversationId: conversationRef.id,
        });

        // Send match notifications to BOTH users
        try {
          const [user1Doc, user2Doc] = await Promise.all([
            safeGetDoc(
              doc(db, 'users', chatRequestData.users[0]),
              `users:${chatRequestData.users[0]}`
            ),
            safeGetDoc(
              doc(db, 'users', chatRequestData.users[1]),
              `users:${chatRequestData.users[1]}`
            ),
          ]);

          if (user1Doc.exists() && user2Doc.exists()) {
            const user1Data = user1Doc.data();
            const user2Data = user2Doc.data();

            // Send notification to BOTH users
            const notifications = [
              {
                userData: user1Data,
                otherUserData: user2Data,
                userId: chatRequestData.users[0],
              },
              {
                userData: user2Data,
                otherUserData: user1Data,
                userId: chatRequestData.users[1],
              },
            ];

            for (const { userData, otherUserData, userId } of notifications) {
              if (
                userData.pushToken &&
                userData.notificationsEnabled !== false
              ) {
                const message = {
                  to: userData.pushToken,
                  sound: 'default',
                  title: "It's a Missed Match! 🎉",
                  body: `You and ${
                    otherUserData.name || 'someone'
                  } matched! Conversation created - start chatting now!`,
                  data: {
                    type: 'missed_match',
                    matchId: matchRef.id,
                    conversationId: conversationRef.id,
                    isMissedConnection: true,
                    showAnimation: userId === user.uid, // Show animation for the user who just accepted
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

                // Store notification in database
                await this.storeNotification(
                  userId,
                  "It's a Missed Match! 🎉",
                  `You and ${
                    otherUserData.name || 'someone'
                  } matched! Conversation created - start chatting now!`,
                  'match',
                  {
                    matchId: matchRef.id,
                    conversationId: conversationRef.id,
                    isMissedConnection: true,
                    showAnimation: userId === user.uid,
                  }
                );
              }
            }
          }
        } catch (notifError) {
          console.error('❌ Error sending match notifications:', notifError);
          // Don't fail the operation if notifications fail
        }

        // Delete the chat request now that match is created
        await deleteDoc(chatRequestRef);
        console.log('✅ Chat request deleted after match creation');

        console.log('✅ Permanent match created:', matchRef.id);
        return {
          success: true,
          matchId: matchRef.id,
          conversationId: conversationRef.id,
          message: 'Match created! You can now chat.',
        };
      }

      return {
        success: true,
        message: 'Waiting for the other person to accept...',
      };
    } catch (error) {
      console.error('❌ Error accepting chat request:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to accept request',
      };
    }
  }

  async getPendingClaimsForUser(userId: string): Promise<{
    success: boolean;
    data: Array<MissedConnectionClaim>;
    message: string;
  }> {
    try {
      const q = query(
        collection(db, 'missed_connection_claims'),
        where('claimerId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const claims: MissedConnectionClaim[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          connectionId: data.connectionId,
          claimerId: data.claimerId,
          claimerName: data.claimerName,
          claimerImage: data.claimerImage,
        };
      });

      return {
        success: true,
        data: claims,
        message: 'Pending claims retrieved successfully',
      };
    } catch (error) {
      console.error('❌ Error getting pending claims:', error);
      return {
        success: false,
        data: [],
        message:
          error instanceof Error
            ? error.message
            : 'Failed to get pending claims',
      };
    }
  }

  /**
   * Decline chat request
   */
  async declineChatRequest(
    chatRequestId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const chatRequestRef = doc(db, 'chat_requests', chatRequestId);
      const chatRequestDoc = await safeGetDoc(
        chatRequestRef,
        `chatRequests:${chatRequestRef.id}`
      );

      if (!chatRequestDoc.exists()) {
        return { success: false, message: 'Chat request not found' };
      }

      await updateDoc(chatRequestRef, {
        status: 'declined',
      });

      console.log('✅ Chat request declined:', chatRequestId);
      return {
        success: true,
        message: 'Request declined',
      };
    } catch (error) {
      console.error('❌ Error declining chat request:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to decline request',
      };
    }
  }

  /**
   * Store a notification for a user
   */
  async storeNotification(
    userId: string,
    title: string,
    message: string,
    type: 'match' | 'chat_request' | 'claim_accepted' | 'general' = 'general',
    data?: any
  ): Promise<{ success: boolean; notificationId?: string; message: string }> {
    try {
      if (!auth.currentUser) {
        return {
          success: false,
          message: 'User not authenticated',
        };
      }

      const notificationData = {
        userId,
        title,
        message,
        type,
        data: data || null,
        read: false,
        createdAt: serverTimestamp(),
      };

      const notificationRef = await addDoc(
        collection(db, 'notifications'),
        notificationData
      );

      console.log('✅ Notification stored:', notificationRef.id);
      return {
        success: true,
        notificationId: notificationRef.id,
        message: 'Notification stored successfully',
      };
    } catch (error) {
      console.error('❌ Error storing notification:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to store notification',
      };
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    limitCount: number = 50
  ): Promise<{ success: boolean; data: NotificationItem[]; message: string }> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const notifications: NotificationItem[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type || 'general',
          data: data.data || null,
          read: data.read || false,
          createdAt: convertTimestamp(data.createdAt),
        };
      });

      return {
        success: true,
        data: notifications,
        message: 'Notifications retrieved successfully',
      };
    } catch (error) {
      console.error('❌ Error getting notifications:', error);
      return {
        success: false,
        data: [],
        message:
          error instanceof Error
            ? error.message
            : 'Failed to get notifications',
      };
    }
  }

  /**
   * Subscribe to notifications for a user with real-time updates
   */
  subscribeToNotifications(
    userId: string,
    callback: (notifications: NotificationItem[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications: NotificationItem[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type || 'general',
          data: data.data || null,
          read: data.read || false,
          createdAt: convertTimestamp(data.createdAt),
        };
      });

      callback(notifications);
    });
  }

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(
    notificationId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!auth.currentUser) {
        return {
          success: false,
          message: 'User not authenticated',
        };
      }

      const notificationRef = doc(db, 'notifications', notificationId);
      const notificationDoc = await safeGetDoc(
        notificationRef,
        `notifications:${notificationRef.id}`
      );

      if (!notificationDoc.exists()) {
        return { success: false, message: 'Notification not found' };
      }

      const notificationData = notificationDoc.data();

      // Verify ownership
      if (notificationData.userId !== auth.currentUser.uid) {
        return {
          success: false,
          message: 'You can only mark your own notifications as read',
        };
      }

      await updateDoc(notificationRef, {
        read: true,
      });

      console.log('✅ Notification marked as read:', notificationId);
      return {
        success: true,
        message: 'Notification marked as read',
      };
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to mark notification as read',
      };
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(
    notificationId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!auth.currentUser) {
        return {
          success: false,
          message: 'User not authenticated',
        };
      }

      const notificationRef = doc(db, 'notifications', notificationId);
      const notificationDoc = await safeGetDoc(
        notificationRef,
        `notifications:${notificationRef.id}`
      );

      if (!notificationDoc.exists()) {
        return { success: false, message: 'Notification not found' };
      }

      const notificationData = notificationDoc.data();

      // Verify ownership
      if (notificationData.userId !== auth.currentUser.uid) {
        return {
          success: false,
          message: 'You can only delete your own notifications',
        };
      }

      await deleteDoc(notificationRef);

      console.log('✅ Notification deleted:', notificationId);
      return {
        success: true,
        message: 'Notification deleted successfully',
      };
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to delete notification',
      };
    }
  }

  /**
   * Subscribe to pending claims for a user (claims on their posts)
   */
  subscribeToClaimsForUser(
    userId: string,
    callback: (
      claims: Array<MissedConnectionClaim & { connection?: MissedConnection }>
    ) => void
  ): Unsubscribe {
    // Listen to all pending claims
    const claimsQuery = query(
      collection(db, 'missed_connection_claims'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(claimsQuery, async (claimsSnapshot) => {
      const claims: Array<
        MissedConnectionClaim & { connection?: MissedConnection }
      > = [];

      // Process claims in batches to avoid too many concurrent requests
      const claimPromises = claimsSnapshot.docs.map(async (claimDoc) => {
        const claimData = claimDoc.data();

        // Check if the connection belongs to the user
        try {
          const connectionDoc = await getDoc(
            doc(db, 'missed_connections', claimData.connectionId)
          );
          if (connectionDoc.exists()) {
            const connectionData = connectionDoc.data();
            if (connectionData.userId === userId) {
              const claim: MissedConnectionClaim & {
                connection?: MissedConnection;
              } = {
                id: claimDoc.id,
                connectionId: claimData.connectionId,
                claimerId: claimData.claimerId,
                claimerName: claimData.claimerName,
                claimerImage: claimData.claimerImage,
                locationVerified: claimData.locationVerified || false,
                createdAt: convertTimestamp(claimData.createdAt),
                status: claimData.status || 'pending',
                connection: {
                  id: connectionDoc.id,
                  userId: connectionData.userId,
                  userName: connectionData.userName,
                  userImage: connectionData.userImage,
                  location: connectionData.location,
                  description: connectionData.description,
                  tags: connectionData.tags || [],
                  images: connectionData.images || [],
                  timeOccurred: convertTimestamp(connectionData.timeOccurred),
                  createdAt: convertTimestamp(connectionData.createdAt),
                  likes: connectionData.likes || 0,
                  likedBy: connectionData.likedBy || [],
                  views: connectionData.views || 0,
                  viewedBy: connectionData.viewedBy || [],
                  claims: connectionData.claims || 0,
                  comments: connectionData.comments || 0,
                  claimed: connectionData.claimed || false,
                  claimedBy: connectionData.claimedBy,
                  verified: connectionData.verified || false,
                  isAnonymous: connectionData.isAnonymous || false,
                  isEdited: connectionData.isEdited || false,
                  editedAt: connectionData.editedAt
                    ? convertTimestamp(connectionData.editedAt)
                    : undefined,
                  savedBy: connectionData.savedBy || [],
                },
              };
              return claim;
            }
          }
        } catch (error) {
          console.error('Error fetching connection for claim:', error);
        }
        return null;
      });

      const resolvedClaims = await Promise.all(claimPromises);
      claims.push(...resolvedClaims.filter((claim) => claim !== null));

      callback(claims);
    });
  }

  /**
   * Subscribe to pending chat requests for a user
   */
  subscribeToChatRequests(
    userId: string,
    callback: (requests: ChatRequest[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'chat_requests'),
      where('receiver', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const requests: ChatRequest[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          users: data.users || [],
          sender: data.sender,
          receiver: data.receiver,
          claimId: data.claimId,
          connectionId: data.connectionId,
          createdAt: convertTimestamp(data.createdAt),
          status: data.status || 'pending',
          acceptedBy: data.acceptedBy || [],
        };
      });

      callback(requests);
    });
  }

  /**
   * Subscribe to user's own posts (real-time)
   */
  subscribeToUserPosts(
    userId: string,
    callback: (posts: MissedConnection[]) => void,
    limitCount: number = 50
  ): Unsubscribe {
    const q = query(
      collection(db, 'missed_connections'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
      const posts: MissedConnection[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userImage: data.userImage,
          location: data.location,
          description: data.description,
          tags: data.tags || [],
          images: data.images || [],
          timeOccurred: convertTimestamp(data.timeOccurred),
          createdAt: convertTimestamp(data.createdAt),
          likes: data.likes || 0,
          likedBy: data.likedBy || [],
          views: data.views || 0,
          viewedBy: data.viewedBy || [],
          claims: data.claims || 0,
          comments: data.comments || 0,
          claimed: data.claimed || false,
          claimedBy: data.claimedBy,
          verified: data.verified || false,
          isAnonymous: data.isAnonymous || false,
          isEdited: data.isEdited || false,
          editedAt: data.editedAt ? convertTimestamp(data.editedAt) : undefined,
          savedBy: data.savedBy || [],
        };
      });

      callback(posts);
    });
  }

  /**
   * Subscribe to user's saved posts (real-time)
   */
  subscribeToSavedPosts(
    userId: string,
    callback: (posts: MissedConnection[]) => void,
    limitCount: number = 50
  ): Unsubscribe {
    const q = query(
      collection(db, 'missed_connections'),
      where('savedBy', 'array-contains', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
      const posts: MissedConnection[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userImage: data.userImage,
          location: data.location,
          description: data.description,
          tags: data.tags || [],
          images: data.images || [],
          timeOccurred: convertTimestamp(data.timeOccurred),
          createdAt: convertTimestamp(data.createdAt),
          likes: data.likes || 0,
          likedBy: data.likedBy || [],
          views: data.views || 0,
          viewedBy: data.viewedBy || [],
          claims: data.claims || 0,
          comments: data.comments || 0,
          claimed: data.claimed || false,
          claimedBy: data.claimedBy,
          verified: data.verified || false,
          isAnonymous: data.isAnonymous || false,
          isEdited: data.isEdited || false,
          editedAt: data.editedAt ? convertTimestamp(data.editedAt) : undefined,
          savedBy: data.savedBy || [],
        };
      });

      callback(posts);
    });
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadNotificationCount(
    userId: string
  ): Promise<{ success: boolean; count: number; message: string }> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const count = snapshot.size;

      return {
        success: true,
        count,
        message: 'Unread count retrieved successfully',
      };
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return {
        success: false,
        count: 0,
        message:
          error instanceof Error ? error.message : 'Failed to get unread count',
      };
    }
  }
}

export default new MissedConnectionsService();
