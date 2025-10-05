import { create } from 'zustand';
import {
  User,
  MatchProfile,
  SearchFilters,
  Conversation,
  ChatMessage,
} from './types';
import { services } from '../services';
import { APP_CONFIG, DATING_CONSTANTS } from '../constants';
import cacheService from '../services/cacheService';

// Use Firebase services
const userProfileService = services.userProfile;
const discoveryService = services.discovery;
const matchingService = services.matching;
const chatService = services.chat;

// Cache TTL constants (in milliseconds)
const CACHE_TTL = {
  CURRENT_USER: 10 * 60 * 1000, // 10 minutes
  DISCOVER_PROFILES: 5 * 60 * 1000, // 5 minutes
  CONVERSATIONS: 2 * 60 * 1000, // 2 minutes
};

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
  likedProfilesData: User[]; // Array of actual User objects that were liked
  matchedProfilesData: User[]; // Array of actual User objects that were matched
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
  loadMatches: () => Promise<void>; // Load existing matches from Firestore
  likeProfile: (profileId: string) => Promise<{
    isMatch: boolean;
    matchId?: string;
    matchedUser?: User;
    conversationId?: string;
  }>;
  dislikeProfile: (profileId: string) => Promise<void>;
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
  likedProfilesData: [],
  matchedProfilesData: [],
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
    // Check cache first
    const cachedUser = cacheService.get<User>('currentUser');
    if (cachedUser) {
      set({ currentUser: cachedUser });
      return;
    }

    set({ isLoadingCurrentUser: true, error: null });
    try {
      const response = await userProfileService.getCurrentUser();
      if (response.success) {
        set({ currentUser: response.data });
        // Cache the user data
        if (response.data) {
          cacheService.set(
            'currentUser',
            response.data,
            CACHE_TTL.CURRENT_USER
          );
        }
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
        // Invalidate and update cache
        cacheService.set('currentUser', response.data, CACHE_TTL.CURRENT_USER);
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
  updateSearchFilters: (filters) => {
    // Invalidate discover profiles cache when filters change
    cacheService.invalidateByPrefix('discoverProfiles_');
    set((state) => ({
      searchFilters: { ...state.searchFilters, ...filters },
    }));
  },

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

  triggerSearchAnimation: async () => {
    const { searchFilters, discoverProfiles, currentUser } = get();

    // Check if user is authenticated before triggering animation
    if (!currentUser) {
      console.log('No user logged in, skipping search animation');
      return;
    }

    set({ isSearching: true });

    try {
      // Use existing profiles for animation or load some new ones
      let animationProfiles = discoverProfiles.slice(0, 5);

      if (animationProfiles.length < 3) {
        // Load some profiles for the animation if we don't have enough
        const response = await discoveryService.getDiscoverProfiles(
          searchFilters,
          1
        );
        if (response.success) {
          animationProfiles = response.data.slice(0, 5);
        }
      }

      const matchProfiles: MatchProfile[] = animationProfiles.map(
        (profile, index) => ({
          ...profile,
          size: 50 + Math.random() * 30, // Random size between 50-80
          radius: 80 + index * 10, // Radius increases with index
          matchScore: 0.7 + Math.random() * 0.3, // Score between 0.7-1.0
        })
      );

      const centerProfile =
        animationProfiles[
          Math.floor(Math.random() * animationProfiles.length)
        ] || null;

      set({
        matchProfiles,
        centerProfile,
        isSearching: true,
      });

      // End search animation after duration
      setTimeout(() => {
        set({ isSearching: false });
      }, APP_CONFIG.ANIMATION_DURATION);
    } catch (error) {
      console.error('Error in search animation:', error);
      // Fallback to empty animation
      set({
        matchProfiles: [],
        centerProfile: null,
        isSearching: true,
      });

      setTimeout(() => {
        set({ isSearching: false });
      }, APP_CONFIG.ANIMATION_DURATION);
    }
  },

  // Discovery Actions
  loadDiscoverProfiles: async (refresh = false) => {
    // get() is for accessing current state
    const { searchFilters, currentUser } = get();

    // Check if user is authenticated before loading profiles
    if (!currentUser) {
      console.log('No user logged in, skipping profile loading');
      set({
        isLoadingDiscover: false,
        error: null,
      });
      return;
    }

    set({
      isLoadingDiscover: true,
      error: null,
      ...(refresh && { currentPage: 1, hasMoreProfiles: true }),
    });

    try {
      const page = refresh ? 1 : get().currentPage;

      // Use cache for first page only
      const cacheKey =
        page === 1 ? `discoverProfiles_${JSON.stringify(searchFilters)}` : null;

      if (cacheKey && !refresh) {
        const cached = cacheService.get<UserProfile[]>(cacheKey);
        if (cached) {
          set({
            discoverProfiles: cached,
            hasMoreProfiles: true,
            currentPage: page,
            isLoadingDiscover: false,
          });
          return;
        }
      }

      const response = await discoveryService.getDiscoverProfiles(
        searchFilters,
        page
      );

      if (response.success) {
        // Sort by distance
        const sortedProfiles = response.data.sort(
          (a, b) => (a.distance || 0) - (b.distance || 0)
        );

        set((state) => {
          let updatedProfiles: UserProfile[];

          if (refresh) {
            updatedProfiles = sortedProfiles;
          } else {
            // Combine existing and new profiles, then deduplicate by ID
            const combined = [...state.discoverProfiles, ...sortedProfiles];
            updatedProfiles = combined.filter(
              (profile, index, self) =>
                index === self.findIndex((p) => p.id === profile.id)
            );
          }

          return {
            discoverProfiles: updatedProfiles,
            hasMoreProfiles: response.pagination?.hasMore || false,
            currentPage: page,
          };
        });

        // Cache only first page results
        if (page === 1 && cacheKey) {
          cacheService.set(
            cacheKey,
            sortedProfiles,
            CACHE_TTL.DISCOVER_PROFILES
          );
        }
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

  loadMatches: async () => {
    const { currentUser } = get();
    if (!currentUser) {
      console.log('No user logged in, skipping matches loading');
      return;
    }

    console.log('🔄 Loading existing matches from Firestore...');
    set({ isLoadingDiscover: true, error: null });

    try {
      const response = await matchingService.getMatches(currentUser.id);

      if (response.success) {
        const matchedUsers = response.data;
        console.log(
          `✅ Loaded ${matchedUsers.length} matches:`,
          matchedUsers.map((u) => u.id)
        );

        set({
          matchedProfiles: matchedUsers.map((u) => u.id),
          matchedProfilesData: matchedUsers,
        });
      } else {
        console.error('❌ Failed to load matches:', response.message);
        set({ error: response.message || 'Failed to load matches' });
      }
    } catch (error) {
      console.error('❌ Error loading matches:', error);
      set({ error: 'Failed to load matches' });
    } finally {
      set({ isLoadingDiscover: false });
    }
  },

  likeProfile: async (profileId) => {
    console.log('Store likeProfile called for:', profileId);
    const { currentUser } = get();
    console.log('Current user:', currentUser);
    if (!currentUser) {
      console.log('No current user found, returning false');
      return { isMatch: false };
    }

    set({ isLoadingLike: true, error: null });

    try {
      const response = await discoveryService.likeProfile(
        currentUser.id,
        profileId
      );

      if (response.success) {
        // Find the user object before removing from discoverProfiles
        const userProfile = get().discoverProfiles.find(
          (p) => p.id === profileId
        );

        set((state) => ({
          likedProfiles: [...state.likedProfiles, profileId],
          likedProfilesData: userProfile
            ? [...state.likedProfilesData, userProfile]
            : state.likedProfilesData,
          discoverProfiles: state.discoverProfiles.filter(
            (profile) => profile.id !== profileId
          ),
        }));

        // If it's a match, update matched profiles and reload conversations
        if (response.data?.isMatch) {
          console.log('🎉 Match detected!');

          const matchedUser = response.data.matchedUser || userProfile;

          set((state) => {
            // Check if already in matched profiles to avoid duplicates
            if (state.matchedProfiles.includes(profileId)) {
              console.log(
                '⏭️ Profile already in matched list, skipping duplicate'
              );
              return state;
            }
            return {
              matchedProfiles: [...state.matchedProfiles, profileId],
              matchedProfilesData: matchedUser
                ? [...state.matchedProfilesData, matchedUser]
                : state.matchedProfilesData,
            };
          });

          // Invalidate conversations cache and reload to get the newly created one
          const { currentUser } = get();
          if (currentUser) {
            cacheService.invalidateByPrefix(`conversations_${currentUser.id}`);
          }
          await get().loadConversations();

          return {
            isMatch: true,
            matchId: response.data.matchId,
            matchedUser,
            conversationId: response.data.conversationId,
          };
        }

        return { isMatch: false };
      } else {
        set({ error: response.message || 'Failed to like profile' });
        return { isMatch: false };
      }
    } catch (error) {
      set({ error: 'Failed to like profile' });
      console.error('Error liking profile:', error);
      return { isMatch: false };
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
          // Remove from discover profiles
          discoverProfiles: state.discoverProfiles.filter(
            (profile) => profile.id !== profileId
          ),
          // Remove from liked profiles (if user previously liked them)
          likedProfiles: state.likedProfiles.filter((id) => id !== profileId),
          likedProfilesData: state.likedProfilesData.filter(
            (profile) => profile.id !== profileId
          ),
        }));

        console.log(
          `✅ Disliked profile ${profileId} - removed from discover and likes, blocked for 24 hours`
        );
      } else {
        set({ error: response.message || 'Failed to dislike profile' });
      }
    } catch (error) {
      set({ error: 'Failed to dislike profile' });
      console.error('Error disliking profile:', error);
    }
  },

  unmatchProfile: async (profileId) => {
    console.log('🔴 Store unmatchProfile called with profileId:', profileId);
    const { currentUser } = get();
    if (!currentUser) {
      console.log('🔴 No current user found');
      return;
    }

    console.log('🔴 Current user:', currentUser.id);
    set({ isLoadingUnmatch: true, error: null });

    try {
      console.log('🔴 Calling matchingService.unmatchProfile');
      const response = await matchingService.unmatchProfile(
        currentUser.id,
        profileId
      );

      console.log('🔴 Unmatch response:', response);
      if (response.success) {
        set((state) => ({
          matchedProfiles: state.matchedProfiles.filter(
            (id) => id !== profileId
          ),
          matchedProfilesData: state.matchedProfilesData.filter(
            (profile) => profile.id !== profileId
          ),
          likedProfiles: state.likedProfiles.filter((id) => id !== profileId),
          likedProfilesData: state.likedProfilesData.filter(
            (profile) => profile.id !== profileId
          ),
          conversations: state.conversations.filter(
            (conv) => !conv.participants.includes(profileId)
          ),
        }));

        // Invalidate conversations cache since we're filtering them
        cacheService.invalidateByPrefix('conversations_');

        console.log('🔴 Unmatch successful, state updated');
      } else {
        console.log('🔴 Unmatch failed:', response.message);
        set({ error: response.message || 'Failed to unmatch profile' });
      }
    } catch (error) {
      console.log('🔴 Unmatch error:', error);
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
    const { likedProfilesData } = get();
    return likedProfilesData;
  },

  getMatchedProfiles: () => {
    const { matchedProfilesData } = get();
    return matchedProfilesData;
  },

  // Chat Actions
  loadConversations: async () => {
    const { currentUser } = get();
    if (!currentUser) return;

    set({ isLoadingConversations: true, error: null });

    try {
      // Check cache first
      const cacheKey = `conversations_${currentUser.id}`;
      const cached = cacheService.get<Conversation[]>(cacheKey);

      if (cached) {
        set({ conversations: cached, isLoadingConversations: false });
        return;
      }

      const response = await chatService.getConversations(currentUser.id);

      if (response.success) {
        set({ conversations: response.data });
        cacheService.set(cacheKey, response.data, CACHE_TTL.CONVERSATIONS);
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

    try {
      // Create a new conversation document in Firebase
      const { db } = await import('../services/firebase/config');
      const { collection, addDoc, serverTimestamp } = await import(
        'firebase/firestore'
      );

      const conversationData = {
        participants: [currentUser.id, matchedUserId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadCount: 0,
      };

      const conversationRef = await addDoc(
        collection(db, 'conversations'),
        conversationData
      );

      // Create the conversation object for local state
      const newConversation: Conversation = {
        id: conversationRef.id,
        participants: [currentUser.id, matchedUserId],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        unreadCount: 0,
      };

      set((state) => ({
        conversations: [newConversation, ...state.conversations],
      }));

      // Invalidate conversations cache
      cacheService.invalidateByPrefix('conversations_');

      console.log('🔴 Conversation created:', conversationRef.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
      set({ error: 'Failed to create conversation' });
    }
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
        // Don't reload conversations here - the real-time listener in chat screen
        // will update messages automatically. Reloading would cause empty message arrays.
        console.log('✅ Message sent successfully');
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
      likedProfilesData: [],
      matchedProfilesData: [],
      conversations: [],
      error: null,
      hasMoreProfiles: true,
      currentPage: 1,
    }),
}));
