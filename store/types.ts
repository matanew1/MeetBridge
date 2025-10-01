export interface User {
  id: string;
  email: string;
  displayName: string;
  name: string;
  age: number;
  dateOfBirth: Date | string;
  image?: string;
  images?: string[];
  bio?: string;
  interests?: string[];
  location?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    lastUpdated?: Date;
  };
  geohash?: string;
  distance?: number;
  isOnline?: boolean;
  lastSeen?: Date;
  createdAt: Date | string;
  updatedAt?: Date | string;
  gender: 'male' | 'female' | 'other';
  lookingFor: 'male' | 'female' | 'both';
  preferences?: {
    ageRange: [number, number];
    maxDistance: number;
    interestedIn: 'male' | 'female' | 'both';
  };
}

export interface UserProfile extends User {
  // Alias for User, kept for backward compatibility
}

export interface MatchProfile extends User {
  size: number;
  radius: number;
  matchScore?: number;
}

export interface SearchFilters {
  gender: 'male' | 'female' | 'both';
  ageRange: [number, number];
  maxDistance: number;
  interests?: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: [string, string]; // [currentUserId, matchedUserId]
  matchId?: string;
  messages: ChatMessage[];
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  unreadCount: {
    [userId: string]: number; // Per-user unread counts
  };
}

export interface Match {
  id: string;
  users: [string, string];
  user1: string;
  user2: string;
  conversationId: string;
  createdAt: Date;
  unmatched?: boolean;
  unmatchedAt?: Date;
  unmatchedBy?: string;
  animationPlayed?: boolean; // Track if match animation has been shown
}

export interface Interaction {
  id: string;
  userId: string;
  targetUserId: string;
  type: 'like' | 'dislike';
  createdAt: Date;
}
