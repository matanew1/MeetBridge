import { User, SearchFilters, Conversation, ChatMessage } from '../store/types';
import { APP_CONFIG } from '../constants';
import { User as FirebaseUser } from 'firebase/auth';

// Base API service interface - ready for backend integration
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// User Profile Service
export interface IUserProfileService {
  getCurrentUser(): Promise<ApiResponse<User | null>>;
  updateProfile(user: Partial<User>): Promise<ApiResponse<User>>;
  uploadProfileImage(image: File | string): Promise<ApiResponse<string>>;
  deleteProfile(userId: string): Promise<ApiResponse<boolean>>;
}

// Match result type
export interface MatchResult {
  isMatch: boolean;
  matchId?: string;
  matchedUser?: User;
  conversationId?: string;
}

// Discovery Service
export interface IDiscoveryService {
  getDiscoverProfiles(
    filters: SearchFilters,
    page?: number
  ): Promise<ApiResponse<User[]>>;
  likeProfile(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<MatchResult>>;
  dislikeProfile(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>>;
  reportProfile(
    userId: string,
    targetUserId: string,
    reason: string
  ): Promise<ApiResponse<boolean>>;
}

// Matching Service
export interface IMatchingService {
  getMatches(userId: string, page?: number): Promise<ApiResponse<User[]>>;
  getLikedProfiles(userId: string, page?: number): Promise<ApiResponse<User[]>>;
  unmatchProfile(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>>;
  markMatchAnimationPlayed(matchId: string): Promise<ApiResponse<boolean>>;
}

// Chat Service
export interface IChatService {
  getConversations(
    userId: string,
    page?: number
  ): Promise<ApiResponse<Conversation[]>>;
  getConversation(
    conversationId: string,
    page?: number
  ): Promise<ApiResponse<Conversation>>;
  sendMessage(
    conversationId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ): Promise<ApiResponse<ChatMessage>>;
  markMessagesAsRead(
    conversationId: string,
    messageIds: string[]
  ): Promise<ApiResponse<boolean>>;
  deleteConversation(conversationId: string): Promise<ApiResponse<boolean>>;
}

// Error handling utility
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Authentication service
export interface IAuthService {
  login(
    email: string,
    password: string
  ): Promise<ApiResponse<{ user: User; token: string }>>;
  register(
    userData: Partial<User> & { email: string; password: string }
  ): Promise<ApiResponse<{ user: User; token: string }>>;
  logout(): Promise<ApiResponse<boolean>>;
  forgotPassword(email: string): Promise<ApiResponse<boolean>>;
  resetPassword(
    token: string,
    newPassword: string
  ): Promise<ApiResponse<boolean>>;
  deleteAccount(password: string): Promise<ApiResponse<boolean>>;
  cleanupOrphanedAuth(
    firebaseUser: FirebaseUser
  ): Promise<ApiResponse<boolean>>;
}

// Storage service for local data persistence
export interface IStorageService {
  setItem(key: string, value: any): Promise<boolean>;
  getItem<T>(key: string): Promise<T | null>;
  removeItem(key: string): Promise<boolean>;
  clear(): Promise<boolean>;
  getAllKeys(): Promise<string[]>;
}

// Main service container interface
export interface IServiceContainer {
  userProfile: IUserProfileService;
  discovery: IDiscoveryService;
  matching: IMatchingService;
  chat: IChatService;
  auth: IAuthService;
  storage: IStorageService;
}
