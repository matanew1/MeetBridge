export interface User {
  id: string;
  name: string;
  age: number;
  image: string;
  bio?: string;
  interests?: string[];
  location?: string;
  distance?: number;
  isOnline?: boolean;
  lastSeen?: Date;
  gender: 'male' | 'female' | 'other';
  preferences?: {
    ageRange: [number, number];
    maxDistance: number;
    interestedIn: 'male' | 'female' | 'both';
  };
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
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  createdAt: Date;
  updatedAt: Date;
  unreadCount: number;
}
