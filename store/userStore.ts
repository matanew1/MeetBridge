import { create } from 'zustand';
import {
  User,
  MatchProfile,
  SearchFilters,
  Conversation,
  ChatMessage,
} from './types';

interface UserState {
  // Current user
  currentUser: User | null;

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

  // Chat and conversations
  conversations: Conversation[];

  // Actions
  setCurrentUser: (user: User | null) => void;
  updateSearchFilters: (filters: Partial<SearchFilters>) => void;
  setMatchProfiles: (profiles: MatchProfile[]) => void;
  setCenterProfile: (profile: User | null) => void;
  setIsSearching: (searching: boolean) => void;
  startSearch: () => void;
  clearSearch: () => void;

  // Discover actions
  loadDiscoverProfiles: () => void;
  likeProfile: (profileId: string) => void;
  dislikeProfile: (profileId: string) => void;
  unmatchProfile: (profileId: string) => void;
  resetDiscoverProfiles: () => void;
  getLikedProfiles: () => User[];
  getMatchedProfiles: () => User[];
  triggerSearchAnimation: () => void;

  // Chat actions
  getConversations: () => Conversation[];
  createConversation: (matchedUserId: string) => void;
  addMessage: (conversationId: string, text: string, senderId: string) => void;
  markMessagesAsRead: (conversationId: string) => void;

  // Mock data generators (to be replaced with API calls)
  generateMockProfiles: () => void;
  generateRandomProfile: () => User;
}

// Mock data for development
const mockImages = [
  'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=300',
];

const mockNames = [
  'שרה',
  'רחל',
  'לאה',
  'מרים',
  'רבקה',
  'דינה',
  'יעל',
  'תמר',
  'דוד',
  'שלמה',
  'יוסף',
  'אברהם',
  'יצחק',
  'יעקב',
  'משה',
  'אהרן',
];

const mockInterests = [
  'צילום',
  'מוזיקה',
  'ספורט',
  'בישול',
  'נסיעות',
  'קריאה',
  'אמנות',
  'טכנולוגיה',
  'יוגה',
  'ריקוד',
  'סרטים',
  'משחקים',
  'טבע',
  'אופנה',
  'פילוסופיה',
];

// Mock messages for automatic conversation generation
const mockMatchMessages = [
  'היי! איך אתה? נחמד להכיר!',
  'וואו, נראה שיש לנו הרבה במשותף!',
  'היי! ראיתי שאת אוהבת {interest}, גם אני!',
  'שלום! איך היום שלך?',
  'היי! מקווה שנוכל להכיר יותר',
  'נחמד מאוד להכיר אותך!',
  'היי! איך אתה? יש לך תוכניות לסוף השבוע?',
  'וואו, יש לנו המון במשותף! איך אתה?',
];

const generateAutoMessage = (matchedProfile: User): string => {
  const messages = [...mockMatchMessages];
  let selectedMessage = messages[Math.floor(Math.random() * messages.length)];

  // Replace placeholder with random interest if available
  if (
    selectedMessage.includes('{interest}') &&
    matchedProfile.interests &&
    matchedProfile.interests.length > 0
  ) {
    const randomInterest =
      matchedProfile.interests[
        Math.floor(Math.random() * matchedProfile.interests.length)
      ];
    selectedMessage = selectedMessage.replace('{interest}', randomInterest);
  }

  return selectedMessage;
};

export const useUserStore = create<UserState>((set, get) => ({
  // Initial state
  currentUser: {
    id: 'current-user',
    name: 'אני',
    age: 25,
    image:
      'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300',
    gender: 'male',
    bio: 'המשתמש הנוכחי',
    interests: ['מוזיקה', 'ספורט'],
    location: 'תל אביב',
  },
  searchFilters: {
    gender: 'female',
    ageRange: [18, 35],
    maxDistance: 50,
  },
  matchProfiles: [],
  centerProfile: null,
  isSearching: false,

  // Discover state
  discoverProfiles: [],
  isLoadingDiscover: false,
  likedProfiles: [],
  dislikedProfiles: [],
  matchedProfiles: [],

  // Chat state
  conversations: [],

  // Actions
  setCurrentUser: (user) => set({ currentUser: user }),

  updateSearchFilters: (filters) =>
    set((state) => ({
      searchFilters: { ...state.searchFilters, ...filters },
    })),

  setMatchProfiles: (profiles) => set({ matchProfiles: profiles }),

  setCenterProfile: (profile) => set({ centerProfile: profile }),

  setIsSearching: (searching) => set({ isSearching: searching }),

  startSearch: () => {
    set({ isSearching: true });
    // Simulate search delay
    setTimeout(() => {
      get().generateMockProfiles();
    }, 1000);
  },

  clearSearch: () =>
    set({
      isSearching: false,
      matchProfiles: [],
      centerProfile: null,
    }),

  // Discover actions
  loadDiscoverProfiles: () => {
    set({ isLoadingDiscover: true });

    // Simulate API call delay
    setTimeout(() => {
      const profiles = Array.from({ length: 8 }, () =>
        get().generateRandomProfile()
      );
      set({
        discoverProfiles: profiles,
        isLoadingDiscover: false,
      });
    }, 500);
  },

  likeProfile: (profileId: string) =>
    set((state) => {
      const newLikedProfiles = [...state.likedProfiles, profileId];
      const newMatchedProfiles = [...state.matchedProfiles];

      // Simulate mutual match - randomly decide if it's a match
      const isMatch = Math.random() < 0.3;
      if (isMatch) {
        newMatchedProfiles.push(profileId);
        console.log('🎉 Match created with profile:', profileId);

        // Automatically create a conversation when a match occurs
        setTimeout(() => {
          console.log('Creating conversation for match:', profileId);
          get().createConversation(profileId);
        }, 100);
      } else {
        console.log('❤️ Like sent to profile:', profileId, '(no match)');
      }

      return {
        likedProfiles: newLikedProfiles,
        matchedProfiles: newMatchedProfiles,
      };
    }),

  dislikeProfile: (profileId: string) =>
    set((state) => ({
      dislikedProfiles: [...state.dislikedProfiles, profileId],
    })),

  unmatchProfile: (profileId: string) =>
    set((state) => {
      console.log('💔 Unmatching profile:', profileId);

      // Remove from matched profiles
      const newMatchedProfiles = state.matchedProfiles.filter(
        (id) => id !== profileId
      );

      // Remove from liked profiles
      const newLikedProfiles = state.likedProfiles.filter(
        (id) => id !== profileId
      );

      // Remove any conversations with this user
      const newConversations = state.conversations.filter(
        (conversation) => !conversation.participants.includes(profileId)
      );

      console.log('✅ Profile unmatched successfully');

      return {
        matchedProfiles: newMatchedProfiles,
        likedProfiles: newLikedProfiles,
        conversations: newConversations,
      };
    }),

  resetDiscoverProfiles: () =>
    set({
      discoverProfiles: [],
      likedProfiles: [],
      dislikedProfiles: [],
      matchedProfiles: [],
      conversations: [],
    }),

  getLikedProfiles: () => {
    const { discoverProfiles, likedProfiles } = get();
    // Return profiles that are in the liked list from discover profiles
    // This ensures we only show profiles that were actually loaded and liked
    return discoverProfiles.filter((profile) =>
      likedProfiles.includes(profile.id)
    );
  },

  getMatchedProfiles: () => {
    const { discoverProfiles, matchedProfiles } = get();
    // Return only profiles that are in the matchedProfiles array
    return discoverProfiles.filter((profile) =>
      matchedProfiles.includes(profile.id)
    );
  },
  triggerSearchAnimation: () => {
    // This method triggers the search animation and acts as a refresh
    // Reset all discover-related data like a refresh would do
    set({
      isSearching: true,
      isLoadingDiscover: false,
      discoverProfiles: [],
      likedProfiles: [],
      dislikedProfiles: [],
      matchedProfiles: [],
      conversations: [],
    });

    // Generate new profiles and stop animation after 5 seconds
    setTimeout(() => {
      get().generateMockProfiles();
      set({ isSearching: false });

      // Load discover profiles after generating mock profiles
      setTimeout(() => {
        get().loadDiscoverProfiles();
      }, 500);
    }, 5000);
  },

  // Mock data generators (replace with API calls)
  generateRandomProfile: (): User => {
    const id = Math.random().toString(36).substr(2, 9);
    const name = mockNames[Math.floor(Math.random() * mockNames.length)];
    const age = Math.floor(Math.random() * 17) + 20; // 20-36
    const image = mockImages[Math.floor(Math.random() * mockImages.length)];
    const gender = Math.random() > 0.5 ? 'female' : 'male';
    const interests = mockInterests
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 5) + 2);

    return {
      id,
      name,
      age,
      image,
      gender,
      bio: `היי, אני ${name}! אוהב/ת ${interests.slice(0, 2).join(' ו')}.`,
      interests,
      location: 'תל אביב',
      distance: Math.floor(Math.random() * 30) + 1,
      isOnline: Math.random() > 0.3,
      lastSeen: new Date(Date.now() - Math.random() * 86400000), // Within last day
    };
  },

  generateMockProfiles: () => {
    const { searchFilters } = get();

    // Generate center profile
    const centerProfile = get().generateRandomProfile();

    // Generate surrounding profiles with varied sizes and positions
    const sizes = [70, 45, 60, 80, 50]; // Different sizes
    const radii = [150, 130, 140, 160, 135]; // Different positions

    const surroundingProfiles: MatchProfile[] = Array.from(
      { length: 5 },
      (_, index) => {
        const profile = get().generateRandomProfile();
        return {
          ...profile,
          size: sizes[index],
          radius: radii[index],
          matchScore: Math.floor(Math.random() * 40) + 60, // 60-99% match
        };
      }
    );

    set({
      centerProfile,
      matchProfiles: surroundingProfiles,
      isSearching: false,
    });
  },

  // Chat management functions
  getConversations: () => {
    const { conversations } = get();
    return conversations.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  },

  createConversation: (matchedUserId: string) => {
    const { conversations, discoverProfiles, currentUser } = get();

    console.log('📝 Creating conversation for user:', matchedUserId);
    console.log('Current conversations count:', conversations.length);
    console.log('Discover profiles count:', discoverProfiles.length);

    // Check if conversation already exists
    const existingConversation = conversations.find((conv) =>
      conv.participants.includes(matchedUserId)
    );

    if (existingConversation) {
      console.log('⚠️ Conversation already exists for user:', matchedUserId);
      return; // Conversation already exists
    }

    // Find the matched profile
    const matchedProfile = discoverProfiles.find(
      (profile) => profile.id === matchedUserId
    );
    if (!matchedProfile) {
      console.log('❌ Profile not found in discoverProfiles:', matchedUserId);
      return; // Profile not found
    }

    console.log('✅ Found matched profile:', matchedProfile.name);

    // Generate automatic initial message from the matched user
    const autoMessage = generateAutoMessage(matchedProfile);
    const messageId = Math.random().toString(36).substr(2, 9);
    const conversationId = Math.random().toString(36).substr(2, 9);
    const now = new Date();

    const initialMessage: ChatMessage = {
      id: messageId,
      senderId: matchedUserId,
      text: autoMessage,
      timestamp: now,
      isRead: false,
    };

    const newConversation: Conversation = {
      id: conversationId,
      participants: [currentUser?.id || 'current-user', matchedUserId],
      messages: [initialMessage],
      lastMessage: initialMessage,
      createdAt: now,
      updatedAt: now,
      unreadCount: 1,
    };

    console.log('💬 Creating new conversation:', {
      id: conversationId,
      participants: newConversation.participants,
      message: autoMessage,
    });

    set((state) => ({
      conversations: [...state.conversations, newConversation],
    }));

    console.log('✅ Conversation created successfully');
  },

  addMessage: (conversationId: string, text: string, senderId: string) =>
    set((state) => {
      const messageId = Math.random().toString(36).substr(2, 9);
      const now = new Date();

      const newMessage: ChatMessage = {
        id: messageId,
        senderId,
        text,
        timestamp: now,
        isRead: false,
      };

      const updatedConversations = state.conversations.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: [...conv.messages, newMessage],
            lastMessage: newMessage,
            updatedAt: now,
            unreadCount:
              senderId !== state.currentUser?.id
                ? conv.unreadCount + 1
                : conv.unreadCount,
          };
        }
        return conv;
      });

      return { conversations: updatedConversations };
    }),

  markMessagesAsRead: (conversationId: string) =>
    set((state) => {
      const updatedConversations = state.conversations.map((conv) => {
        if (conv.id === conversationId) {
          const updatedMessages = conv.messages.map((msg) => ({
            ...msg,
            isRead: true,
          }));

          return {
            ...conv,
            messages: updatedMessages,
            unreadCount: 0,
          };
        }
        return conv;
      });

      return { conversations: updatedConversations };
    }),
}));
