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
import toastService from '../services/toastService';

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
  preloadedNextPage: User[] | null; // Pre-loaded next page for instant UX

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
  loadLikes: () => Promise<void>; // Load existing likes from Firestore
  likeProfile: (profileId: string) => Promise<{
    isMatch: boolean;
    matchId?: string;
    matchedUser?: User;
    conversationId?: string;
  }>;
  dislikeProfile: (profileId: string) => Promise<void>;
  unmatchProfile: (profileId: string) => Promise<void>;
  reportProfile: (profileId: string, reason: string) => Promise<void>;
  subscribeToDiscoveryUpdates: () => (() => void) | null; // Returns unsubscribe function
  removeProfileFromLists: (profileId: string) => void;

  // Actions - Getters
  getLikedProfiles: () => User[];
  getMatchedProfiles: () => User[];

  // Actions - Chat
  loadConversations: () => Promise<void>;
  setConversations: (conversations: Conversation[]) => void;
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
  gender: 'female', // Default to female (users must choose male or female)
  ageRange: APP_CONFIG.DEFAULT_AGE_RANGE,
  maxDistance: APP_CONFIG.MAX_PROFILE_DISTANCE,
  interests: [],
};

// Track loading state to prevent duplicate calls
let isLoadingDiscoverProfiles = false;
let lastLoadTime = 0;
const LOAD_DEBOUNCE_MS = 1000; // Minimum 1 second between loads

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
  preloadedNextPage: null,
  conversations: [],
  isLoadingConversations: false,
  error: null,
  isLoadingLike: false,
  isLoadingUnmatch: false,

  // User Profile Actions
  setCurrentUser: (user) => set({ currentUser: user }),

  loadCurrentUser: async () => {
    // Always fetch fresh user data to ensure preferences are up-to-date
    // Don't use cache for critical user profile data
    console.log('🔄 Loading fresh user data from Firebase...');

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

          // Sync search filters with user preferences immediately
          const { searchFilters } = get();
          if (response.data.preferences?.interestedIn) {
            const updatedFilters = {
              ...searchFilters,
              gender: response.data.preferences.interestedIn,
              ageRange:
                response.data.preferences?.ageRange || searchFilters.ageRange,
              maxDistance:
                response.data.preferences?.maxDistance ||
                searchFilters.maxDistance,
            };
            console.log(
              '✅ Auto-syncing search filters with user preferences:',
              {
                oldGender: searchFilters.gender,
                newGender: updatedFilters.gender,
                userPreferences: response.data.preferences,
              }
            );
            set({ searchFilters: updatedFilters });
          }
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

        // Sync search filters with updated user preferences
        const { searchFilters } = get();
        if (response.data?.preferences?.interestedIn) {
          set({
            searchFilters: {
              ...searchFilters,
              gender: response.data.preferences.interestedIn,
              ageRange:
                response.data.preferences?.ageRange || searchFilters.ageRange,
              maxDistance:
                response.data.preferences?.maxDistance ||
                searchFilters.maxDistance,
            },
          });
        }
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
      preloadedNextPage: null, // Clear preloaded data when filters change
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
    // Prevent duplicate calls within debounce window
    const now = Date.now();
    if (!refresh && isLoadingDiscoverProfiles) {
      console.log(
        '⏭️ loadDiscoverProfiles already in progress, skipping duplicate call'
      );
      return;
    }

    if (!refresh && now - lastLoadTime < LOAD_DEBOUNCE_MS) {
      console.log('⏭️ loadDiscoverProfiles called too soon, debouncing...');
      return;
    }

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

    isLoadingDiscoverProfiles = true;
    lastLoadTime = now;

    console.log('🔍 loadDiscoverProfiles - Current searchFilters:', {
      gender: searchFilters.gender,
      ageRange: searchFilters.ageRange,
      maxDistance: searchFilters.maxDistance,
      currentUserGender: currentUser.gender,
      currentUserPreferences: currentUser.preferences,
    });

    set({
      isLoadingDiscover: true,
      error: null,
      ...(refresh && {
        currentPage: 1,
        hasMoreProfiles: true,
        preloadedNextPage: null,
      }),
    });

    try {
      const page = refresh ? 1 : get().currentPage;

      // ⚡ ALWAYS FETCH FRESH DATA - NO CACHE for search/discovery
      console.log('� Fetching fresh profiles from Firebase (no cache)');

      const response = await discoveryService.getDiscoverProfiles(
        searchFilters,
        page,
        refresh
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
            preloadedNextPage: (response as any)._preloadedNextPage || null,
          };
        });
      } else {
        set({ error: response.message || 'Failed to load profiles' });
      }
    } catch (error) {
      set({ error: 'Failed to load profiles' });
      console.error('Error loading discover profiles:', error);
    } finally {
      set({ isLoadingDiscover: false });
      isLoadingDiscoverProfiles = false;
    }
  },

  loadMoreProfiles: async () => {
    const {
      hasMoreProfiles,
      isLoadingDiscover,
      currentPage,
      preloadedNextPage,
      discoverProfiles,
    } = get();

    if (!hasMoreProfiles || isLoadingDiscover) return;

    // 🚀 UX OPTIMIZATION: Use preloaded data if available for instant loading
    if (preloadedNextPage && preloadedNextPage.length > 0) {
      console.log(
        `⚡ Using preloaded ${
          preloadedNextPage.length
        } profiles for instant page ${currentPage + 1}`
      );

      set((state) => ({
        discoverProfiles: [...state.discoverProfiles, ...preloadedNextPage],
        currentPage: currentPage + 1,
        preloadedNextPage: null, // Clear preloaded data after use
      }));

      return;
    }

    // Fallback to API call if no preloaded data
    set({ currentPage: currentPage + 1 });
    await get().loadDiscoverProfiles();
  },

  loadMatches: async () => {
    const { currentUser } = get();
    if (!currentUser) {
      console.log('No user logged in, skipping matches loading');
      return;
    }

    console.log('🔄 Loading fresh matches from Firestore - NO CACHE');
    set({ isLoadingDiscover: true, error: null });

    try {
      // Invalidate cache to force fresh data
      cacheService.invalidateByPrefix('matches_');

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

  loadLikes: async () => {
    const { currentUser } = get();
    if (!currentUser) {
      console.log('No user logged in, skipping likes loading');
      return;
    }

    console.log('🔄 Loading fresh likes from Firestore - NO CACHE');
    set({ isLoadingDiscover: true, error: null });

    try {
      // Invalidate cache to force fresh data
      cacheService.invalidateByPrefix('likes_');

      const response = await matchingService.getLikedProfiles(currentUser.id);

      if (response.success) {
        const likedUsers = response.data;
        console.log(
          `✅ Loaded ${likedUsers.length} liked profiles:`,
          likedUsers.map((u) => u.id)
        );

        set({
          likedProfiles: likedUsers.map((u) => u.id),
          likedProfilesData: likedUsers,
        });
      } else {
        console.error('❌ Failed to load likes:', response.message);
        set({ error: response.message || 'Failed to load likes' });
      }
    } catch (error) {
      console.error('❌ Error loading likes:', error);
      set({ error: 'Failed to load likes' });
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

  removeProfileFromLists: (profileId) => {
    set((state) => ({
      discoverProfiles: state.discoverProfiles.filter(
        (profile) => profile.id !== profileId
      ),
      likedProfiles: state.likedProfiles.filter((id) => id !== profileId),
      dislikedProfiles: state.dislikedProfiles.filter((id) => id !== profileId),
      matchedProfiles: state.matchedProfiles.filter((id) => id !== profileId),
      likedProfilesData: state.likedProfilesData.filter(
        (profile) => profile.id !== profileId
      ),
      matchedProfilesData: state.matchedProfilesData.filter(
        (profile) => profile.id !== profileId
      ),
      conversations: state.conversations.filter(
        (conv) => !conv.participants.includes(profileId)
      ),
    }));
    cacheService.invalidateByPrefix('conversations_');
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

    console.log('🔄 Loading fresh conversations from Firestore - NO CACHE');
    set({ isLoadingConversations: true, error: null });

    try {
      // Clear cache to ensure fresh data with isMissedConnection flag
      const cacheKey = `conversations_${currentUser.id}`;
      cacheService.delete(cacheKey);
      // Also invalidate all conversation-related cache
      cacheService.invalidateByPrefix('conversations_');

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

  setConversations: (conversations) => {
    set({ conversations });
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

  // Subscribe to real-time discovery queue updates
  subscribeToDiscoveryUpdates: () => {
    const currentUser = get().currentUser;
    if (!currentUser) {
      console.log('⚠️ Cannot subscribe to discovery updates: No current user');
      return null;
    }

    console.log('👂 Subscribing to real-time discovery queue updates');

    const unsubscribe = discoveryService.subscribeToDiscoveryQueueUpdates(
      currentUser.id,
      (profiles) => {
        console.log(
          `🔄 Real-time update: ${profiles.length} profiles in queue`
        );
        // Update the discover profiles with the latest data from the queue
        set({ discoverProfiles: profiles });
        // Invalidate cache since we have fresh real-time data
        cacheService.invalidateByPrefix('discoverProfiles_');
      }
    );

    return unsubscribe;
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
