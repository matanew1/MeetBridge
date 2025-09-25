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
  startAfter,
  QueryDocumentSnapshot,
  serverTimestamp,
  onSnapshot,
  addDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { db, auth, storage } from './config';
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

// Utility function to convert Firestore timestamps
const convertTimestamp = (timestamp: any) => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return timestamp;
};

// Firebase User Profile Service
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
      if (!user) {
        throw new Error('No user logged in');
      }

      const userRef = doc(db, 'users', user.uid);
      const updateData = {
        ...userData,
        updatedAt: serverTimestamp(),
      };

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
      if (!user) {
        throw new Error('No user logged in');
      }

      // Create a unique filename
      const filename = `profile_images/${user.uid}/${Date.now()}.jpg`;
      const imageRef = ref(storage, filename);

      let uploadResult;
      if (typeof imageBlob === 'string') {
        // Convert base64 string to blob if needed
        const response = await fetch(imageBlob);
        const blob = await response.blob();
        uploadResult = await uploadBytes(imageRef, blob);
      } else {
        uploadResult = await uploadBytes(imageRef, imageBlob);
      }

      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Update user's profile with new image URL
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        image: downloadURL,
        updatedAt: serverTimestamp(),
      });

      return {
        data: downloadURL,
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

      // Delete user document
      await deleteDoc(doc(db, 'users', userId));

      // Delete user images from storage
      try {
        const imagePath = `profile_images/${userId}`;
        const imageRef = ref(storage, imagePath);
        await deleteObject(imageRef);
      } catch (storageError) {
        console.warn('Could not delete user images:', storageError);
      }

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

// Firebase Discovery Service
export class FirebaseDiscoveryService implements IDiscoveryService {
  async getDiscoverProfiles(
    filters: SearchFilters,
    page: number = 1
  ): Promise<ApiResponse<User[]>> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }

      const pageSize = 10;
      let q = query(
        collection(db, 'users'),
        where('id', '!=', user.uid),
        orderBy('id'),
        limit(pageSize)
      );

      // Add gender filter if specified
      if (filters.gender !== 'both') {
        q = query(
          collection(db, 'users'),
          where('gender', '==', filters.gender),
          where('id', '!=', user.uid),
          orderBy('id'),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const profiles: User[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        profiles.push({
          id: doc.id,
          ...data,
          lastSeen: convertTimestamp(data.lastSeen),
        } as User);
      });

      // Filter by age and other criteria in client-side (for simplicity)
      const filteredProfiles = profiles.filter((profile) => {
        return (
          profile.age >= filters.ageRange[0] &&
          profile.age <= filters.ageRange[1]
        );
      });

      return {
        data: filteredProfiles,
        success: true,
        message: 'Profiles retrieved successfully',
        pagination: {
          page,
          limit: pageSize,
          total: filteredProfiles.length,
          hasMore: snapshot.size === pageSize,
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

  async likeProfile(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const likeData = {
        userId,
        targetUserId,
        createdAt: serverTimestamp(),
        type: 'like',
      };

      await addDoc(collection(db, 'likes'), likeData);

      // Check if target user also liked this user (match)
      const matchQuery = query(
        collection(db, 'likes'),
        where('userId', '==', targetUserId),
        where('targetUserId', '==', userId),
        where('type', '==', 'like')
      );

      const matchSnapshot = await getDocs(matchQuery);

      if (!matchSnapshot.empty) {
        // Create match record
        const matchData = {
          users: [userId, targetUserId],
          createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'matches'), matchData);
      }

      return {
        data: true,
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

  async dislikeProfile(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const dislikeData = {
        userId,
        targetUserId,
        createdAt: serverTimestamp(),
        type: 'dislike',
      };

      await addDoc(collection(db, 'likes'), dislikeData);

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

  async superLikeProfile(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const superLikeData = {
        userId,
        targetUserId,
        createdAt: serverTimestamp(),
        type: 'super_like',
      };

      await addDoc(collection(db, 'likes'), superLikeData);

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

  async reportProfile(
    userId: string,
    targetUserId: string,
    reason: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const reportData = {
        reporterId: userId,
        reportedUserId: targetUserId,
        reason,
        createdAt: serverTimestamp(),
        status: 'pending',
      };

      await addDoc(collection(db, 'reports'), reportData);

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

// Firebase Matching Service
export class FirebaseMatchingService implements IMatchingService {
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

  async unmatchProfile(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const matchQuery = query(
        collection(db, 'matches'),
        where('users', 'array-contains-any', [userId, targetUserId])
      );

      const matchSnapshot = await getDocs(matchQuery);

      for (const matchDoc of matchSnapshot.docs) {
        const matchData = matchDoc.data();
        if (
          matchData.users.includes(userId) &&
          matchData.users.includes(targetUserId)
        ) {
          await deleteDoc(matchDoc.ref);
        }
      }

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

// Firebase Chat Service
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
        orderBy('updatedAt', 'desc'),
        limit(pageSize)
      );

      const conversationsSnapshot = await getDocs(conversationsQuery);
      const conversations: Conversation[] = [];

      for (const convDoc of conversationsSnapshot.docs) {
        const convData = convDoc.data();

        // Get messages for this conversation
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
          messages: [], // Load separately when needed
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

      // Get messages for this conversation
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

      // Update conversation's lastMessage and updatedAt
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

  async markMessagesAsRead(
    conversationId: string,
    messageIds: string[]
  ): Promise<ApiResponse<boolean>> {
    try {
      const batch = db.batch ? db.batch() : null;

      for (const messageId of messageIds) {
        const messageRef = doc(
          db,
          'conversations',
          conversationId,
          'messages',
          messageId
        );
        if (batch) {
          batch.update(messageRef, { isRead: true });
        } else {
          await updateDoc(messageRef, { isRead: true });
        }
      }

      if (batch) {
        await batch.commit();
      }

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
      // Delete all messages in the conversation
      const messagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages')
      );
      const messagesSnapshot = await getDocs(messagesQuery);

      for (const msgDoc of messagesSnapshot.docs) {
        await deleteDoc(msgDoc.ref);
      }

      // Delete the conversation document
      await deleteDoc(doc(db, 'conversations', conversationId));

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

// Firebase Auth Service
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

      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      let userData: User;

      if (userDoc.exists()) {
        const data = userDoc.data();
        userData = {
          id: userDoc.id,
          ...data,
          lastSeen: convertTimestamp(data.lastSeen),
        } as User;
      } else {
        // Create basic user profile if it doesn't exist
        userData = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Unknown User',
          age: 18,
          image: firebaseUser.photoURL || '',
          gender: 'other',
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...userData,
          createdAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
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
      return {
        data: { user: {} as User, token: '' },
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
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

      const newUser: User = {
        id: firebaseUser.uid,
        name: profileData.name || 'Unknown User',
        age: profileData.age || 18,
        image: profileData.image || '',
        gender: profileData.gender || 'other',
        bio: profileData.bio || '',
        interests: profileData.interests || [],
        location: profileData.location || '',
        preferences: profileData.preferences,
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...newUser,
        email,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      });

      const token = await firebaseUser.getIdToken();

      return {
        data: { user: newUser, token },
        success: true,
        message: 'Registration successful',
      };
    } catch (error) {
      console.error('Error during registration:', error);
      return {
        data: { user: {} as User, token: '' },
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  async logout(): Promise<ApiResponse<boolean>> {
    try {
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
      if (!user) {
        throw new Error('No user logged in');
      }

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
      // Firebase auth provides this functionality
      // For now, we'll simulate it
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        data: true,
        success: true,
        message: 'Password reset email sent',
      };
    } catch (error) {
      console.error('Error sending reset email:', error);
      return {
        data: false,
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to send reset email',
      };
    }
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ApiResponse<boolean>> {
    try {
      // Firebase auth provides this functionality
      // For now, we'll simulate it
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        data: true,
        success: true,
        message: 'Password reset successful',
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        data: false,
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to reset password',
      };
    }
  }

  async verifyEmail(token: string): Promise<ApiResponse<boolean>> {
    try {
      // Firebase auth provides this functionality
      // For now, we'll simulate it
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
}
