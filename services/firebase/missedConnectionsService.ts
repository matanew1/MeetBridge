// services/firebase/missedConnectionsService.ts
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  increment,
} from 'firebase/firestore';
import { db, auth } from './config';
import LocationService from '../locationService';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  text: string;
  createdAt: Date;
  isAnonymous?: boolean;
}

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
  claimerName?: string;
  claimerImage?: string;
  locationVerified: boolean;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
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
    timeOccurred: Date;
    isAnonymous?: boolean;
  }): Promise<{ success: boolean; connectionId?: string; message: string }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Get user profile for display info
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;

      const connectionData = {
        userId: user.uid,
        userName: data.isAnonymous
          ? 'Anonymous'
          : userData?.name || 'Anonymous',
        userImage: data.isAnonymous ? null : userData?.image || null,
        location: data.location,
        description: data.description,
        tags: data.tags || [],
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
      const connectionSnap = await getDoc(connectionRef);

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

      // If changing anonymity, update user info
      if (updates.isAnonymous !== undefined) {
        if (updates.isAnonymous) {
          updateData.userName = 'Anonymous';
          updateData.userImage = null;
        } else {
          // Get current user data
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
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
          const distance = LocationService.calculateDistancePrecise(
            filters.nearLocation!.lat,
            filters.nearLocation!.lng,
            conn.location.lat,
            conn.location.lng
          );
          return distance <= filters.nearLocation!.radiusMeters;
        });
      }

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
      const connectionDoc = await getDoc(connectionRef);

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
      const connectionDoc = await getDoc(connectionRef);

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

      // Get user profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
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
      const connectionDoc = await getDoc(
        doc(db, 'missed_connections', connectionId)
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
        const userDoc = await getDoc(doc(db, 'users', userId));
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
      const connectionDoc = await getDoc(connectionRef);

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
   * Add a comment to a connection
   */
  async addComment(
    connectionId: string,
    userId: string,
    text: string,
    isAnonymous: boolean = false
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!auth.currentUser) {
        return {
          success: false,
          message: 'User not authenticated',
        };
      }

      // Get user data for the comment
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      const commentData = {
        userId,
        userName: isAnonymous ? 'Anonymous' : userData?.name || 'Anonymous',
        userImage: isAnonymous ? null : userData?.image || null,
        text,
        createdAt: serverTimestamp(),
        isAnonymous,
      };

      // Add comment to subcollection
      await addDoc(
        collection(db, 'missed_connections', connectionId, 'comments'),
        commentData
      );

      // Update comment count on the connection
      await updateDoc(doc(db, 'missed_connections', connectionId), {
        comments: increment(1),
      });

      console.log('✅ Comment added to connection:', connectionId);
      return {
        success: true,
        message: 'Comment added successfully',
      };
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
  async getComments(
    connectionId: string
  ): Promise<{ success: boolean; data: Comment[]; message: string }> {
    try {
      const q = query(
        collection(db, 'missed_connections', connectionId, 'comments'),
        orderBy('createdAt', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const comments: Comment[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        comments.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userImage: data.userImage,
          text: data.text,
          createdAt: data.createdAt?.toDate() || new Date(),
          isAnonymous: data.isAnonymous || false,
        });
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
   * Subscribe to real-time comment updates
   */
  subscribeToComments(
    connectionId: string,
    callback: (comments: Comment[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'missed_connections', connectionId, 'comments'),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const comments: Comment[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        comments.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userImage: data.userImage,
          text: data.text,
          createdAt: data.createdAt?.toDate() || new Date(),
          isAnonymous: data.isAnonymous || false,
        });
      });
      callback(comments);
    });
  }

  /**
   * Delete a connection (only by owner)
   */
  async deleteConnection(
    connectionId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Verify ownership
      const connectionDoc = await getDoc(
        doc(db, 'missed_connections', connectionId)
      );
      if (!connectionDoc.exists()) {
        return { success: false, message: 'Connection not found' };
      }

      const connectionData = connectionDoc.data();
      if (connectionData.userId !== user.uid) {
        return {
          success: false,
          message: 'You can only delete your own connections',
        };
      }

      await deleteDoc(doc(db, 'missed_connections', connectionId));

      console.log('✅ Connection deleted:', connectionId);
      return { success: true, message: 'Connection deleted successfully' };
    } catch (error) {
      console.error('❌ Error deleting connection:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to delete connection',
      };
    }
  }

  /**
   * Real-time listener for user's own posts
   */
  subscribeToUserPosts(
    userId: string,
    callback: (connections: MissedConnection[]) => void,
    limitCount: number = 1000
  ): Unsubscribe {
    const q = query(
      collection(db, 'missed_connections'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
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

      callback(connections);
    });
  }

  /**
   * Real-time listener for saved posts
   */
  subscribeToSavedPosts(
    userId: string,
    callback: (connections: MissedConnection[]) => void,
    limitCount: number = 1000
  ): Unsubscribe {
    const q = query(
      collection(db, 'missed_connections'),
      where('savedBy', 'array-contains', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
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

      callback(connections);
    });
  }

  /**
   * Get user's interactions (likes, saves, comments) on a connection
   */
  async getUserInteractions(
    connectionId: string,
    userId: string
  ): Promise<{
    success: boolean;
    data?: {
      liked: boolean;
      saved: boolean;
      commented: boolean;
    };
    message: string;
  }> {
    try {
      const connectionDoc = await getDoc(
        doc(db, 'missed_connections', connectionId)
      );

      if (!connectionDoc.exists()) {
        return { success: false, message: 'Connection not found' };
      }

      const data = connectionDoc.data();
      const liked = (data.likedBy || []).includes(userId);
      const saved = (data.savedBy || []).includes(userId);

      // Check if user has commented by looking up in the comments subcollection
      const commentsQuery = query(
        collection(db, 'missed_connections', connectionId, 'comments'),
        where('userId', '==', userId),
        limit(1)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const commented = !commentsSnapshot.empty;

      return {
        success: true,
        data: {
          liked,
          saved,
          commented,
        },
        message: 'User interactions retrieved successfully',
      };
    } catch (error) {
      console.error('❌ Error getting user interactions:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get interactions',
      };
    }
  }
}

export default new MissedConnectionsService();
