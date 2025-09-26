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

// Discovery Service
export interface IDiscoveryService {
  getDiscoverProfiles(
    filters: SearchFilters,
    page?: number
  ): Promise<ApiResponse<User[]>>;
  likeProfile(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>>;
  dislikeProfile(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>>;
  superLikeProfile(
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
  getMatchDetails(userId: string, matchId: string): Promise<ApiResponse<User>>;
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

// Location Service
export interface ILocationService {
  getCurrentLocation(): Promise<
    ApiResponse<{ latitude: number; longitude: number }>
  >;
  updateLocation(
    userId: string,
    location: { latitude: number; longitude: number }
  ): Promise<ApiResponse<boolean>>;
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number;
}

// Notification Service
export interface INotificationService {
  registerForPushNotifications(
    userId: string,
    deviceToken: string
  ): Promise<ApiResponse<boolean>>;
  unregisterFromPushNotifications(
    userId: string,
    deviceToken: string
  ): Promise<ApiResponse<boolean>>;
  getNotifications(userId: string, page?: number): Promise<ApiResponse<any[]>>;
  markNotificationAsRead(notificationId: string): Promise<ApiResponse<boolean>>;
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

// Base API client configuration
export interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  apiKey?: string;
  authToken?: string;
  headers?: Record<string, string>;
}

// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Generic API request interface
export interface ApiRequest {
  url: string;
  method: HttpMethod;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

// Base API client interface
export interface IApiClient {
  request<T>(request: ApiRequest): Promise<ApiResponse<T>>;
  get<T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>>;
  post<T>(url: string, data?: any): Promise<ApiResponse<T>>;
  put<T>(url: string, data?: any): Promise<ApiResponse<T>>;
  delete<T>(url: string): Promise<ApiResponse<T>>;
  patch<T>(url: string, data?: any): Promise<ApiResponse<T>>;
}

// Authentication service
export interface IAuthService {
  login(
    email: string,
    password: string
  ): Promise<ApiResponse<{ user: User; token: string }>>;
  loginWithGoogle(): Promise<ApiResponse<{ user: User; token: string }>>;
  register(
    userData: Partial<User> & { email: string; password: string }
  ): Promise<ApiResponse<{ user: User; token: string }>>;
  logout(): Promise<ApiResponse<boolean>>;
  refreshToken(): Promise<ApiResponse<{ token: string }>>;
  forgotPassword(email: string): Promise<ApiResponse<boolean>>;
  resetPassword(
    token: string,
    newPassword: string
  ): Promise<ApiResponse<boolean>>;
  verifyEmail(token: string): Promise<ApiResponse<boolean>>;
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

// Analytics service for tracking user interactions
export interface IAnalyticsService {
  trackEvent(
    eventName: string,
    properties?: Record<string, any>
  ): Promise<void>;
  trackScreenView(screenName: string): Promise<void>;
  setUserProperties(properties: Record<string, any>): Promise<void>;
  identifyUser(userId: string, properties?: Record<string, any>): Promise<void>;
}

// Main service container interface
export interface IServiceContainer {
  userProfile: IUserProfileService;
  discovery: IDiscoveryService;
  matching: IMatchingService;
  chat: IChatService;
  location: ILocationService;
  notification: INotificationService;
  auth: IAuthService;
  storage: IStorageService;
  analytics: IAnalyticsService;
  apiClient: IApiClient;
}
