import { create } from 'zustand';
import {
  User,
  MatchProfile,
  SearchFilters,
  Conversation,
  ChatMessage,
} from './types';
import {
  MockUserProfileService,
  MockDiscoveryService,
  MockMatchingService,
  MockChatService,
} from '../services/mockServices';
import { APP_CONFIG, DATING_CONSTANTS } from '../constants';
import { generateMockUsers } from '../data/mockData';

// Initialize services (these will be replaced with real services when connecting to backend)
const userProfileService = new MockUserProfileService();
const discoveryService = new MockDiscoveryService();
const matchingService = new MockMatchingService(discoveryService);
const chatService = new MockChatService();

interface UserState {
  // Current user
  currentUser: User | null;
  isLoadingCurrentUser: boolean;

  // Search and matching
  searchFilters: SearchFilters;
  matchProfiles: MatchProfile[];
  centerProfile: User | null;
  isSearching: boolean;

  // Discover functionality
  discoverProfiles: User[];
  isLoadingDiscover: boolean;
  likedProfiles: string[]; // Array of profile IDs
  dislikedProfiles: string[]; // Array of profile IDs
  matchedProfiles: string[]; // Array of profile IDs that are mutual matches
  hasMoreProfiles: boolean;
  currentPage: number;

  // Chat and conversations
  conversations: Conversation[];
  isLoadingConversations: boolean;

  // Error handling
  error: string | null;

  // Loading states
  isLoadingLike: boolean;
  isLoadingUnmatch: boolean;

  // Actions - User Profile
  setCurrentUser: (user: User | null) => void;
  loadCurrentUser: () => Promise<void>;
  updateCurrentUser: (userData: Partial<User>) => Promise<void>;

  // Actions - Search and Discovery
  updateSearchFilters: (filters: Partial<SearchFilters>) => void;
  setMatchProfiles: (profiles: MatchProfile[]) => void;
  setCenterProfile: (profile: User | null) => void;
  setIsSearching: (searching: boolean) => void;
  startSearch: () => void;
  clearSearch: () => void;
  triggerSearchAnimation: () => void;

  // Actions - Discover
  loadDiscoverProfiles: (refresh?: boolean) => Promise<void>;
  loadMoreProfiles: () => Promise<void>;
  likeProfile: (profileId: string) => Promise<boolean>; // Returns true if it's a match
  dislikeProfile: (profileId: string) => Promise<void>;
  superLikeProfile: (profileId: string) => Promise<boolean>;
  unmatchProfile: (profileId: string) => Promise<void>;
  reportProfile: (profileId: string, reason: string) => Promise<void>;

  // Actions - Getters
  getLikedProfiles: () => User[];
  getMatchedProfiles: () => User[];

  // Actions - Chat
  loadConversations: () => Promise<void>;
  createConversation: (matchedUserId: string) => Promise<void>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  markMessagesAsRead: (
    conversationId: string,
    messageIds: string[]
  ) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;

  // Utility actions
  setError: (error: string | null) => void;
  clearError: () => void;
  resetState: () => void;

  // Mock data generation (for development only - will be removed)
  generateMockProfiles: () => void;
  generateRandomProfile: () => User;
}

// Default search filters
const defaultSearchFilters: SearchFilters = {
  gender: 'both',
  ageRange: APP_CONFIG.DEFAULT_AGE_RANGE,
  maxDistance: APP_CONFIG.MAX_PROFILE_DISTANCE,
  interests: [],
};

export const useUserStore = create<UserState>((set, get) => ({
  // Initial state
  currentUser: null,
  isLoadingCurrentUser: false,
  searchFilters: defaultSearchFilters,
  matchProfiles: [],
  centerProfile: null,
  isSearching: false,
  discoverProfiles: [],
  isLoadingDiscover: false,
  likedProfiles: [],
  dislikedProfiles: [],
  matchedProfiles: [],
  hasMoreProfiles: true,
  currentPage: 1,
  conversations: [],
  isLoadingConversations: false,
  error: null,
  isLoadingLike: false,
  isLoadingUnmatch: false,

  // User Profile Actions
  setCurrentUser: (user) => set({ currentUser: user }),

  loadCurrentUser: async () => {
    set({ isLoadingCurrentUser: true, error: null });
    try {
      const response = await userProfileService.getCurrentUser();
      if (response.success) {
        set({ currentUser: response.data });
      } else {
        set({ error: response.message || 'Failed to load user profile' });
      }
    } catch (error) {
      set({ error: 'Failed to load user profile' });
      console.error('Error loading current user:', error);
    } finally {
      set({ isLoadingCurrentUser: false });
    }
  },

  updateCurrentUser: async (userData) => {
    set({ isLoadingCurrentUser: true, error: null });
    try {
      const response = await userProfileService.updateProfile(userData);
      if (response.success) {
        set({ currentUser: response.data });
      } else {
        set({ error: response.message || 'Failed to update profile' });
      }
    } catch (error) {
      set({ error: 'Failed to update profile' });
      console.error('Error updating user profile:', error);
    } finally {
      set({ isLoadingCurrentUser: false });
    }
  },

  // Search and Discovery Actions
  updateSearchFilters: (filters) =>
    set((state) => ({
      searchFilters: { ...state.searchFilters, ...filters },
    })),

  setMatchProfiles: (profiles) => set({ matchProfiles: profiles }),

  setCenterProfile: (profile) => set({ centerProfile: profile }),

  setIsSearching: (searching) => set({ isSearching: searching }),

  startSearch: () => {
    set({ isSearching: true });
    // Simulate search animation duration
    setTimeout(() => {
      get().loadDiscoverProfiles(true);
    }, APP_CONFIG.ANIMATION_DURATION);
  },

  clearSearch: () =>
    set({
      matchProfiles: [],
      centerProfile: null,
      isSearching: false,
    }),

  triggerSearchAnimation: () => {
    const { searchFilters } = get();

    // Generate mock match profiles for animation
    const mockProfiles = generateMockUsers(5);
    const matchProfiles: MatchProfile[] = mockProfiles.map(
      (profile, index) => ({
        ...profile,
        size: 50 + Math.random() * 30, // Random size between 50-80
        radius: 80 + index * 10, // Radius increases with index
        matchScore: 0.7 + Math.random() * 0.3, // Score between 0.7-1.0
      })
    );

    const centerProfile =
      mockProfiles[Math.floor(Math.random() * mockProfiles.length)];

    set({
      matchProfiles,
      centerProfile,
      isSearching: true,
    });

    // End search animation after duration
    setTimeout(() => {
      set({ isSearching: false });
    }, APP_CONFIG.ANIMATION_DURATION);
  },

  // Discovery Actions
  loadDiscoverProfiles: async (refresh = false) => {
    const { searchFilters } = get();

    set({
      isLoadingDiscover: true,
      error: null,
      ...(refresh && { currentPage: 1, hasMoreProfiles: true }),
    });

    try {
      const page = refresh ? 1 : get().currentPage;
      const response = await discoveryService.getDiscoverProfiles(
        searchFilters,
        page
      );

      if (response.success) {
        set((state) => ({
          discoverProfiles: refresh
            ? response.data
            : [...state.discoverProfiles, ...response.data],
          hasMoreProfiles: response.pagination?.hasMore || false,
          currentPage: page,
        }));
      } else {
        set({ error: response.message || 'Failed to load profiles' });
      }
    } catch (error) {
      set({ error: 'Failed to load profiles' });
      console.error('Error loading discover profiles:', error);
    } finally {
      set({ isLoadingDiscover: false });
    }
  },

  loadMoreProfiles: async () => {
    const { hasMoreProfiles, isLoadingDiscover, currentPage } = get();

    if (!hasMoreProfiles || isLoadingDiscover) return;

    set({ currentPage: currentPage + 1 });
    await get().loadDiscoverProfiles();
  },

  likeProfile: async (profileId) => {
    console.log('Store likeProfile called for:', profileId);
    const { currentUser } = get();
    console.log('Current user:', currentUser);
    if (!currentUser) {
      console.log('No current user found, returning false');
      return false;
    }

    set({ isLoadingLike: true, error: null });

    try {
      const response = await discoveryService.likeProfile(
        currentUser.id,
        profileId
      );

      if (response.success) {
        set((state) => ({
          likedProfiles: [...state.likedProfiles, profileId],
          ...(response.data && {
            matchedProfiles: [...state.matchedProfiles, profileId],
          }),
        }));

        // If it's a match, create a conversation
        if (response.data) {
          const matchProfile = get().discoverProfiles.find(
            (p) => p.id === profileId
          );

          // Check if conversation already exists
          const existingConversation = get().conversations.find((conv) =>
            conv.participants.includes(profileId)
          );

          if (matchProfile && !existingConversation) {
            const conversation = chatService.createConversationWithMessage(
              currentUser.id,
              profileId,
              matchProfile.interests
            );

            // Add the conversation to the store
            set((state) => ({
              conversations: [conversation, ...state.conversations],
            }));
          }
        }

        return response.data; // Returns true if it's a match
      } else {
        set({ error: response.message || 'Failed to like profile' });
        return false;
      }
    } catch (error) {
      set({ error: 'Failed to like profile' });
      console.error('Error liking profile:', error);
      return false;
    } finally {
      set({ isLoadingLike: false });
    }
  },

  dislikeProfile: async (profileId) => {
    console.log('Store dislikeProfile called for:', profileId);
    const { currentUser } = get();
    console.log('Current user:', currentUser);
    if (!currentUser) {
      console.log('No current user found, returning');
      return;
    }

    try {
      const response = await discoveryService.dislikeProfile(
        currentUser.id,
        profileId
      );

      if (response.success) {
        set((state) => ({
          dislikedProfiles: [...state.dislikedProfiles, profileId],
        }));
      } else {
        set({ error: response.message || 'Failed to dislike profile' });
      }
    } catch (error) {
      set({ error: 'Failed to dislike profile' });
      console.error('Error disliking profile:', error);
    }
  },

  superLikeProfile: async (profileId) => {
    const { currentUser } = get();
    if (!currentUser) return false;

    set({ isLoadingLike: true, error: null });

    try {
      const response = await discoveryService.superLikeProfile(
        currentUser.id,
        profileId
      );

      if (response.success) {
        set((state) => ({
          likedProfiles: [...state.likedProfiles, profileId],
          ...(response.data && {
            matchedProfiles: [...state.matchedProfiles, profileId],
          }),
        }));

        return response.data;
      } else {
        set({ error: response.message || 'Failed to super like profile' });
        return false;
      }
    } catch (error) {
      set({ error: 'Failed to super like profile' });
      console.error('Error super liking profile:', error);
      return false;
    } finally {
      set({ isLoadingLike: false });
    }
  },

  unmatchProfile: async (profileId) => {
    const { currentUser } = get();
    if (!currentUser) return;

    set({ isLoadingUnmatch: true, error: null });

    try {
      const response = await matchingService.unmatchProfile(
        currentUser.id,
        profileId
      );

      if (response.success) {
        set((state) => ({
          matchedProfiles: state.matchedProfiles.filter(
            (id) => id !== profileId
          ),
          likedProfiles: state.likedProfiles.filter((id) => id !== profileId),
          conversations: state.conversations.filter(
            (conv) => !conv.participants.includes(profileId)
          ),
        }));
      } else {
        set({ error: response.message || 'Failed to unmatch profile' });
      }
    } catch (error) {
      set({ error: 'Failed to unmatch profile' });
      console.error('Error unmatching profile:', error);
    } finally {
      set({ isLoadingUnmatch: false });
    }
  },

  reportProfile: async (profileId, reason) => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const response = await discoveryService.reportProfile(
        currentUser.id,
        profileId,
        reason
      );

      if (!response.success) {
        set({ error: response.message || 'Failed to report profile' });
      }
    } catch (error) {
      set({ error: 'Failed to report profile' });
      console.error('Error reporting profile:', error);
    }
  },

  // Getters
  getLikedProfiles: () => {
    const { discoverProfiles, likedProfiles } = get();
    return discoverProfiles.filter((profile) =>
      likedProfiles.includes(profile.id)
    );
  },

  getMatchedProfiles: () => {
    const { discoverProfiles, matchedProfiles } = get();
    return discoverProfiles.filter((profile) =>
      matchedProfiles.includes(profile.id)
    );
  },

  // Chat Actions
  loadConversations: async () => {
    const { currentUser } = get();
    if (!currentUser) return;

    set({ isLoadingConversations: true, error: null });

    try {
      const response = await chatService.getConversations(currentUser.id);

      if (response.success) {
        set({ conversations: response.data });
      } else {
        set({ error: response.message || 'Failed to load conversations' });
      }
    } catch (error) {
      set({ error: 'Failed to load conversations' });
      console.error('Error loading conversations:', error);
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  createConversation: async (matchedUserId) => {
    const { currentUser, conversations } = get();
    if (!currentUser) return;

    // Check if conversation already exists in state
    const existingConversation = conversations.find((conv) =>
      conv.participants.includes(matchedUserId)
    );

    if (existingConversation) {
      return; // Don't create duplicate conversation
    }

    const matchProfile = get().discoverProfiles.find(
      (p) => p.id === matchedUserId
    );
    const conversation = chatService.createConversationWithMessage(
      currentUser.id,
      matchedUserId,
      matchProfile?.interests
    );

    set((state) => ({
      conversations: [conversation, ...state.conversations],
    }));
  },

  sendMessage: async (conversationId, text) => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const response = await chatService.sendMessage(conversationId, {
        senderId: currentUser.id,
        text,
        isRead: false,
      });

      if (response.success) {
        // Update conversations with new message
        await get().loadConversations();
      } else {
        set({ error: response.message || 'Failed to send message' });
      }
    } catch (error) {
      set({ error: 'Failed to send message' });
      console.error('Error sending message:', error);
    }
  },

  markMessagesAsRead: async (conversationId, messageIds) => {
    try {
      const response = await chatService.markMessagesAsRead(
        conversationId,
        messageIds
      );

      if (response.success) {
        // Update local conversation state
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
                  ),
                  unreadCount: Math.max(
                    0,
                    conv.unreadCount - messageIds.length
                  ),
                }
              : conv
          ),
        }));
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  },

  deleteConversation: async (conversationId) => {
    try {
      const response = await chatService.deleteConversation(conversationId);

      if (response.success) {
        set((state) => ({
          conversations: state.conversations.filter(
            (conv) => conv.id !== conversationId
          ),
        }));
      } else {
        set({ error: response.message || 'Failed to delete conversation' });
      }
    } catch (error) {
      set({ error: 'Failed to delete conversation' });
      console.error('Error deleting conversation:', error);
    }
  },

  // Utility Actions
  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  resetState: () =>
    set({
      currentUser: null,
      searchFilters: defaultSearchFilters,
      matchProfiles: [],
      centerProfile: null,
      isSearching: false,
      discoverProfiles: [],
      isLoadingDiscover: false,
      likedProfiles: [],
      dislikedProfiles: [],
      matchedProfiles: [],
      conversations: [],
      error: null,
      hasMoreProfiles: true,
      currentPage: 1,
    }),

  // Mock data generation (for development only)
  generateMockProfiles: () => {
    const mockProfiles = generateMockUsers(20);
    set({ discoverProfiles: mockProfiles });
  },

  generateRandomProfile: () => {
    const mockProfiles = generateMockUsers(1);
    return mockProfiles[0];
  },
}));
