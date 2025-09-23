import { create } from 'zustand';
import { User, MatchProfile, SearchFilters } from './types';

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
  resetDiscoverProfiles: () => void;
  getLikedProfiles: () => User[];
  getMatchedProfiles: () => User[];
  triggerSearchAnimation: () => void;

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

export const useUserStore = create<UserState>((set, get) => ({
  // Initial state
  currentUser: null,
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
    set((state) => ({
      likedProfiles: [...state.likedProfiles, profileId],
    })),

  dislikeProfile: (profileId: string) =>
    set((state) => ({
      dislikedProfiles: [...state.dislikedProfiles, profileId],
    })),

  resetDiscoverProfiles: () =>
    set({
      discoverProfiles: [],
      likedProfiles: [],
      dislikedProfiles: [],
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
    const { discoverProfiles, likedProfiles } = get();
    // For simulation purposes, we'll consider some liked profiles as "mutual matches"
    // In a real app, this would check if both users liked each other
    const likedProfilesData = discoverProfiles.filter((profile) =>
      likedProfiles.includes(profile.id)
    );

    // Simulate mutual matches - randomly make about 30% of liked profiles mutual matches
    return likedProfilesData.filter(() => Math.random() > 0.7);
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
}));
