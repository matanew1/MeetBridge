// types/chat.ts
export interface Profile {
  id: string;
  name: string;
  age: number;
  image?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  dateOfBirth?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Date;
  };
  unreadCount?: number;
  isMissedConnection?: boolean;
}

export interface ChatItem {
  id: string;
  name: string;
  age: number;
  lastMessage: string;
  time: string;
  image?: string;
  unread: boolean;
  isOnline: boolean;
}
