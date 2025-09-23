import {
  IUserProfileService,
  IDiscoveryService,
  IMatchingService,
  IChatService,
  ApiResponse,
} from './interfaces';
import { User, SearchFilters, Conversation, ChatMessage } from '../store/types';
import {
  generateMockUsers,
  generateMockUser,
  generateMockChatMessage,
} from '../data/mockData';
import { APP_CONFIG } from '../constants';

// Mock delay to simulate network requests
const mockDelay = (ms: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Mock User Profile Service
export class MockUserProfileService implements IUserProfileService {
  private currentUser: User | null = null;

  async getCurrentUser(): Promise<ApiResponse<User | null>> {
    await mockDelay(300);

    if (!this.currentUser) {
      // Generate a mock current user
      this.currentUser = generateMockUser('current_user_123');
      this.currentUser.name = 'המשתמש שלי';
    }

    return {
      data: this.currentUser,
      success: true,
      message: 'User profile retrieved successfully',
    };
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    await mockDelay(800);

    if (!this.currentUser) {
      throw new Error('No current user found');
    }

    this.currentUser = { ...this.currentUser, ...userData };

    return {
      data: this.currentUser,
      success: true,
      message: 'Profile updated successfully',
    };
  }

  async uploadProfileImage(image: File | string): Promise<ApiResponse<string>> {
    await mockDelay(1200);

    // Mock image URL - in real implementation this would upload to cloud storage
    const mockImageUrl = `https://api.meetbridge.com/images/${Date.now()}.jpg`;

    return {
      data: mockImageUrl,
      success: true,
      message: 'Image uploaded successfully',
    };
  }

  async deleteProfile(userId: string): Promise<ApiResponse<boolean>> {
    await mockDelay(1000);

    this.currentUser = null;

    return {
      data: true,
      success: true,
      message: 'Profile deleted successfully',
    };
  }
}

// Mock Discovery Service
export class MockDiscoveryService implements IDiscoveryService {
  private mockProfiles: User[] = [];
  private likedProfileIds: Set<string> = new Set();
  private dislikedProfileIds: Set<string> = new Set();

  constructor() {
    // Initialize with mock profiles
    this.mockProfiles = generateMockUsers(50);
  }

  async getDiscoverProfiles(
    filters: SearchFilters,
    page: number = 1
  ): Promise<ApiResponse<User[]>> {
    await mockDelay(600);

    // Apply filters to mock profiles
    let filteredProfiles = this.mockProfiles.filter((profile) => {
      // Filter by age range
      if (
        profile.age < filters.ageRange[0] ||
        profile.age > filters.ageRange[1]
      ) {
        return false;
      }

      // Filter by distance
      if (profile.distance && profile.distance > filters.maxDistance) {
        return false;
      }

      // Filter by gender preference
      if (filters.gender !== 'both' && profile.gender !== filters.gender) {
        return false;
      }

      // Filter by interests if specified
      if (filters.interests && filters.interests.length > 0) {
        const hasCommonInterest = profile.interests?.some((interest) =>
          filters.interests?.includes(interest)
        );
        if (!hasCommonInterest) return false;
      }

      // Exclude already liked/disliked profiles
      return (
        !this.likedProfileIds.has(profile.id) &&
        !this.dislikedProfileIds.has(profile.id)
      );
    });

    // Pagination
    const limit = APP_CONFIG.PAGINATION_LIMIT;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProfiles = filteredProfiles.slice(startIndex, endIndex);

    return {
      data: paginatedProfiles,
      success: true,
      message: 'Profiles retrieved successfully',
      pagination: {
        page,
        limit,
        total: filteredProfiles.length,
        hasMore: endIndex < filteredProfiles.length,
      },
    };
  }

  async likeProfile(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>> {
    await mockDelay(400);

    this.likedProfileIds.add(targetUserId);

    // Simulate match probability (30% chance)
    const isMatch = Math.random() < 0.3;

    return {
      data: isMatch,
      success: true,
      message: isMatch ? "It's a match!" : 'Profile liked successfully',
    };
  }

  async dislikeProfile(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>> {
    await mockDelay(300);

    this.dislikedProfileIds.add(targetUserId);

    return {
      data: true,
      success: true,
      message: 'Profile disliked',
    };
  }

  async superLikeProfile(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>> {
    await mockDelay(500);

    this.likedProfileIds.add(targetUserId);

    // Super likes have higher match probability (60% chance)
    const isMatch = Math.random() < 0.6;

    return {
      data: isMatch,
      success: true,
      message: isMatch ? 'Super match!' : 'Super like sent successfully',
    };
  }

  async reportProfile(
    userId: string,
    targetUserId: string,
    reason: string
  ): Promise<ApiResponse<boolean>> {
    await mockDelay(600);

    // In real implementation, this would send report to moderation system
    console.log(`Profile ${targetUserId} reported by ${userId} for: ${reason}`);

    return {
      data: true,
      success: true,
      message: 'Profile reported successfully',
    };
  }

  // Getter methods for accessing internal state (for mock purposes)
  getLikedProfileIds(): string[] {
    return Array.from(this.likedProfileIds);
  }

  getDislikedProfileIds(): string[] {
    return Array.from(this.dislikedProfileIds);
  }
}

// Mock Matching Service
export class MockMatchingService implements IMatchingService {
  private matches: User[] = [];

  constructor(private discoveryService: MockDiscoveryService) {
    // Generate some initial matches
    const likedIds = this.discoveryService.getLikedProfileIds();
    if (likedIds.length > 0) {
      this.matches = generateMockUsers(Math.min(likedIds.length, 5));
    }
  }

  async getMatches(
    userId: string,
    page: number = 1
  ): Promise<ApiResponse<User[]>> {
    await mockDelay(500);

    const limit = APP_CONFIG.PAGINATION_LIMIT;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMatches = this.matches.slice(startIndex, endIndex);

    return {
      data: paginatedMatches,
      success: true,
      message: 'Matches retrieved successfully',
      pagination: {
        page,
        limit,
        total: this.matches.length,
        hasMore: endIndex < this.matches.length,
      },
    };
  }

  async getLikedProfiles(
    userId: string,
    page: number = 1
  ): Promise<ApiResponse<User[]>> {
    await mockDelay(400);

    const likedIds = this.discoveryService.getLikedProfileIds();
    const likedProfiles = generateMockUsers(likedIds.length);

    const limit = APP_CONFIG.PAGINATION_LIMIT;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProfiles = likedProfiles.slice(startIndex, endIndex);

    return {
      data: paginatedProfiles,
      success: true,
      message: 'Liked profiles retrieved successfully',
      pagination: {
        page,
        limit,
        total: likedProfiles.length,
        hasMore: endIndex < likedProfiles.length,
      },
    };
  }

  async unmatchProfile(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>> {
    await mockDelay(600);

    // Remove from matches
    this.matches = this.matches.filter((match) => match.id !== targetUserId);

    return {
      data: true,
      success: true,
      message: 'Profile unmatched successfully',
    };
  }

  async getMatchDetails(
    userId: string,
    matchId: string
  ): Promise<ApiResponse<User>> {
    await mockDelay(300);

    const match = this.matches.find((m) => m.id === matchId);

    if (!match) {
      throw new Error('Match not found');
    }

    return {
      data: match,
      success: true,
      message: 'Match details retrieved successfully',
    };
  }

  // Method to add matches (for testing purposes)
  addMatch(user: User): void {
    this.matches.push(user);
  }
}

// Mock Chat Service
export class MockChatService implements IChatService {
  private conversations: Map<string, Conversation> = new Map();

  async getConversations(
    userId: string,
    page: number = 1
  ): Promise<ApiResponse<Conversation[]>> {
    await mockDelay(400);

    const allConversations = Array.from(this.conversations.values())
      .filter((conv) => conv.participants.includes(userId))
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

    const limit = APP_CONFIG.PAGINATION_LIMIT;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedConversations = allConversations.slice(startIndex, endIndex);

    return {
      data: paginatedConversations,
      success: true,
      message: 'Conversations retrieved successfully',
      pagination: {
        page,
        limit,
        total: allConversations.length,
        hasMore: endIndex < allConversations.length,
      },
    };
  }

  async getConversation(
    conversationId: string,
    page: number = 1
  ): Promise<ApiResponse<Conversation>> {
    await mockDelay(300);

    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return {
      data: conversation,
      success: true,
      message: 'Conversation retrieved successfully',
    };
  }

  async sendMessage(
    conversationId: string,
    messageData: Omit<ChatMessage, 'id' | 'timestamp'>
  ): Promise<ApiResponse<ChatMessage>> {
    await mockDelay(200);

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...messageData,
    };

    let conversation = this.conversations.get(conversationId);

    if (!conversation) {
      // Create new conversation if it doesn't exist
      conversation = {
        id: conversationId,
        participants: [messageData.senderId, 'other_user'] as [string, string],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        unreadCount: 0,
      };
    }

    conversation.messages.push(message);
    conversation.lastMessage = message;
    conversation.updatedAt = new Date();

    this.conversations.set(conversationId, conversation);

    return {
      data: message,
      success: true,
      message: 'Message sent successfully',
    };
  }

  async markMessagesAsRead(
    conversationId: string,
    messageIds: string[]
  ): Promise<ApiResponse<boolean>> {
    await mockDelay(200);

    const conversation = this.conversations.get(conversationId);

    if (conversation) {
      conversation.messages.forEach((msg) => {
        if (messageIds.includes(msg.id)) {
          msg.isRead = true;
        }
      });

      conversation.unreadCount = Math.max(
        0,
        conversation.unreadCount - messageIds.length
      );
      this.conversations.set(conversationId, conversation);
    }

    return {
      data: true,
      success: true,
      message: 'Messages marked as read',
    };
  }

  async deleteConversation(
    conversationId: string
  ): Promise<ApiResponse<boolean>> {
    await mockDelay(500);

    const deleted = this.conversations.delete(conversationId);

    return {
      data: deleted,
      success: true,
      message: deleted
        ? 'Conversation deleted successfully'
        : 'Conversation not found',
    };
  }

  // Helper method to create conversation with initial message
  createConversationWithMessage(
    userId: string,
    matchId: string,
    matchInterests?: string[]
  ): Conversation {
    const conversationId = `conv_${userId}_${matchId}`;

    // Check if conversation already exists
    const existingConversation = this.conversations.get(conversationId);
    if (existingConversation) {
      return existingConversation;
    }

    const initialMessage = generateMockChatMessage(matchId, matchInterests);

    const conversation: Conversation = {
      id: conversationId,
      participants: [userId, matchId] as [string, string],
      messages: [initialMessage],
      lastMessage: initialMessage,
      createdAt: new Date(),
      updatedAt: new Date(),
      unreadCount: 1,
    };

    this.conversations.set(conversationId, conversation);
    return conversation;
  }
}
