# MeetBridge Development Guidelines# MeetBridge AI Coding Guidelines

## Architecture Overview## 🏗️ Architecture Overview

**Tech Stack**: React Native + Expo, TypeScript, Firebase (Auth/Firestore/Storage), Zustand, React Native ReanimatedMeetBridge is a modern dating app built with **React Native + Expo** featuring a layered architecture:

**Architecture**:- **Presentation Layer**: Expo Router (file-based), custom UI components with animations

- **Presentation**: Expo Router (file-based), custom UI components with Reanimated animations- **State Management**: Zustand store + React Context (AuthContext, ThemeContext)

- **State**: Zustand stores + React Context (AuthContext, ThemeContext)- **Service Layer**: Firebase services with real-time listeners

- **Services**: Firebase services with real-time Firestore listeners- **Backend**: Firebase (Auth, Firestore, Storage) with geohash-based location queries

- **Location**: Geohash-based proximity queries with client-side distance filtering

## 🔑 Critical Patterns & Conventions

## Core Patterns

### State Management (Zustand)

### State Management (Zustand)

`typescript`typescript

// Optimistic updates pattern// Always use optimistic updates for better UX

likeProfile: async (profileId: string) => {likeProfile: async (profileId: string) => {

set((state) => ({ likedProfiles: [...state.likedProfiles, profileId] })); // 1. Update local state immediately

try { set((state) => ({

    await matchingService.likeProfile(profileId);    ...state,

} catch (error) { likedProfiles: [...state.likedProfiles, profileId],

    // Rollback on failure  }));

    set((state) => ({ likedProfiles: state.likedProfiles.filter(id => id !== profileId) }));

} try {

}; // 2. Call Firebase service

````const result = await matchingService.likeProfile(profileId);

    // 3. Handle success (real-time listeners will update UI)

### Real-Time Listeners    // 4. Show match animation if mutual match found

```typescript  } catch (error) {

// Firestore real-time pattern    // 5. Rollback on failure

useEffect(() => {    set((state) => ({

  const unsubscribe = onSnapshot(query(collection(db, 'conversations'),      ...state,

    where('participants', 'array-contains', userId)), (snapshot) => {      likedProfiles: state.likedProfiles.filter((id) => id !== profileId),

      const conversations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));    }));

      set({ conversations });  }

    });};

  return unsubscribe;```

}, [userId]);

```### Service Layer Pattern



### Location Queries```typescript

```typescript// Services follow consistent interface pattern with real-time capabilities

// Geohash proximity patternexport class FirebaseDiscoveryService {

const geohashes = geohashService.neighbors(centerGeohash);  async getDiscoverProfiles(filters: SearchFilters) {

const q = query(collection(db, 'users'),    // Query and filter profiles

  where('location.geohash', 'in', [centerGeohash, ...geohashes]),  }

  where('gender', '==', preferences.interestedIn));

// Filter by exact distance client-side  async likeProfile(userId: string, targetId: string) {

```    // Create like document and check for match

  }

## Development Workflow

  // Real-time listeners for instant UI updates

### Essential Commands  onMatchAdded(userId: string, callback: Function): () => void {

```bash    // Set up Firestore listener for new matches

npm run dev          # Start development server  }

npm run tunnel       # Test on physical devices

npx expo export --platform web  # Build for web  onMatchRemoved(userId: string, callback: Function): () => void {

npm run generate-mock-users    # Create test data    // Set up Firestore listener for removed matches

npm run drop-collections       # Reset database  }

```}

````

### File Structure

````### Real-Time Listeners

app/                    # Expo Router pages

  (tabs)/              # Tab navigation```typescript

    search.tsx         # Discovery/search interface// Always set up Firestore listeners for live updates

    loved.tsx          # Liked profilesuseEffect(() => {

    chat.tsx           # Conversations  const unsubscribe = onSnapshot(

    connections.tsx    # Matches/connections    query(

services/              # Business logic      collection(db, 'conversations'),

  firebase/            # Firebase implementations      where('participants', 'array-contains', userId)

  location/            # Geohash/location services    ),

store/                 # Zustand state management    (snapshot) => {

components/            # Reusable UI components      const conversations = snapshot.docs.map((doc) => ({

  ui/                  # Base component library        id: doc.id,

```        ...doc.data(),

      }));

## Key Implementation Flows      set({ conversations });

    }

### Profile Discovery  );

1. Load user preferences and filters  return unsubscribe;

2. Query users within geohash bounds}, [userId]);

3. Apply client-side distance/preference filtering

4. Exclude previously liked/disliked profiles// Real-time match listeners for instant notifications

5. Handle pagination and real-time match notificationsuseEffect(() => {

  const unsubAdd = discoveryService.onMatchAdded(

### Match Creation    currentUser.id,

1. Optimistic UI update (immediate like animation)    (matchId, user, convId) => {

2. Create Firestore like document      // Show match animation and send notification

3. Check for mutual match      setShowMatch(true);

4. Trigger real-time notifications and animations      notificationService.sendMatchNotification(user.name, matchId);

5. Auto-create conversation on match    }

  );

### Chat System

1. Real-time message listeners  const unsubRemove = discoveryService.onMatchRemoved(

2. Unread count management    currentUser.id,

3. Online presence tracking    (otherUserId) => {

4. Message read receipts      // Handle match removal animations

      animatingOut.add(otherUserId);

## Security & Privacy      setTimeout(() => animatingOut.delete(otherUserId), 500);

    }

### Data Storage  );

```typescript

// Secure storage pattern  return () => {

import { secureStorageService } from '../services/secureStorageService';    unsubAdd();

await secureStorageService.saveSecure('auth_token', token); // → SecureStore    unsubRemove();

await secureStorageService.getSecure('auth_token');  };

```}, [currentUser?.id]);

````

### Location Privacy

````typescript### Location & Discovery

// Privacy-first location handling

const blurredLocation = privacyService.blurLocation(lat, lng, radius);```typescript

const geohash = geohashService.encode(lat, lng, 7); // Precision 7-9// Use geohash for efficient proximity queries

```const geohashes = geohashService.neighbors(centerGeohash);

const query = query(

## Performance Optimization  collection(db, 'users'),

  where('location.geohash', 'in', [centerGeohash, ...geohashes]),

### List Virtualization  where('gender', '==', preferences.interestedIn)

```typescript);

<FlatList// Filter by exact distance client-side using haversine formula

  removeClippedSubviews```

  maxToRenderPerBatch={5}

  windowSize={3}## 🚀 Development Workflow

  getItemLayout={(data, index) => ({

    length: ITEM_HEIGHT,### Essential Commands

    offset: ITEM_HEIGHT * index,

    index```bash

  })}# Start development server

/>npm run dev          # Clear cache + start

```npm run tunnel       # For testing on physical devices



### Memoization# Build for production

```typescriptnpx expo export --platform web  # Web build

const filteredProfiles = useMemo(

  () => profiles.filter(p => distance <= maxDistance),# Database management scripts

  [profiles, maxDistance]npm run generate-mock-users     # Create test users

);npm run delete-mock-users       # Clean up test data

const handleLike = useCallback((id) => likeProfile(id), []);npm run drop-collections        # Reset database

````

### Caching Strategy### File Structure Conventions

````typescript

const CACHE_TTL = {```

  CURRENT_USER: 10 * 60 * 1000,    // 10 minapp/                    # Expo Router pages (file-based routing)

  DISCOVER_PROFILES: 5 * 60 * 1000, // 5 min  _layout.tsx          # Root layout with navigation

  CONVERSATIONS: 2 * 60 * 1000,     // 2 min  (tabs)/              # Tab navigation group

};    loved.tsx          # Discover tab

```    search.tsx         # Search tab

    chat.tsx           # Chat list tab

## UI/UX Standards    connections.tsx    # Board tab



### Animationsservices/              # Business logic layer

```typescript  firebase/            # Firebase service implementations

const animatedStyle = useAnimatedStyle(() => ({  location/            # Geohash & location services

  transform: [{ scale: withTiming(isLiked ? 1.2 : 1) }]

}));store/                 # Zustand state management

await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);  userStore.ts         # Main app state

```  types.ts             # State type definitions



### Responsive Designcomponents/            # Reusable UI components

```typescript  ui/                  # Base UI kit (Button, Card, etc.)

import { scale, verticalScale } from '../utils/responsive';```

const iconSize = isTablet ? scale(26) : scale(20);

const padding = spacing.md;## 🎯 Key Implementation Patterns

````

### Profile Discovery Flow

### Theming

```typescript1. **Load Filters**: Sync search filters with user preferences

const { isDarkMode } = useTheme();2. **Geohash Query**: Query users within geohash bounds

const theme = isDarkMode ? darkTheme : lightTheme;3. **Client Filtering**: Apply exact distance + preference filters

<View style={{ backgroundColor: theme.background }}>4. **Deduplication**: Exclude liked/disliked/matched profiles

  <Text style={{ color: theme.text }}>{content}</Text>5. **Pagination**: Load more profiles on scroll

</View>6. **Real-time Matches**: Listen for new matches and show instant notifications

```

### Match Creation Flow

### Internationalization

````typescript1. **Optimistic UI**: Show like animation immediately

import { useTranslation } from 'react-i18next';2. **Firestore Write**: Create like document and check for mutual match

const { t } = useTranslation();3. **Real-time Update**: Firestore listeners (`onMatchAdded`) instantly notify both users

// NEVER use hardcoded strings - always use t('key')4. **Match Animation**: Trigger match modal and celebration animation

<Text>{t('settings.title')}</Text>;5. **Notifications**: Send push notifications to matched users

```6. **Conversation Creation**: Auto-create chat conversation on match

**Critical**: All user-facing text must be translated. Supported: English, Hebrew, Russian, Spanish.

### Chat Architecture

## Code Quality Standards

1. **Conversation Creation**: Auto-create on match

### TypeScript2. **Real-time Messages**: Firestore listeners for live chat

- Strict type checking enabled3. **Read Receipts**: Update unread counts

- Use interfaces for complex objects4. **Presence**: Track online/offline status

- Avoid `any` types except for external APIs

- Proper error handling with try/catch## 🔒 Security & Privacy



### Component Patterns### Data Storage

- Functional components with hooks

- Custom hooks for shared logic```typescript

- `React.memo` for expensive components// Use secureStorageService - auto-routes sensitive data

- Proper dependency arrays in useEffect/useCallbackimport { secureStorageService } from '../services/secureStorageService';



### Testing// Sensitive data → SecureStore, regular data → AsyncStorage

```typescriptawait secureStorageService.saveSecure('auth_token', token);

// Component testingawait secureStorageService.getSecure('auth_token');

fireEvent.press(getByText('Like'));```

await waitFor(() => expect(mockLikeProfile).toHaveBeenCalled());

### Location Privacy

// State testing

const { result } = renderHook(() => useUserStore());```typescript

act(() => result.current.likeProfile('user123'));// Always apply privacy radius before storing/sending location

expect(result.current.likedProfiles).toContain('user123');const blurredLocation = privacyService.blurLocation(lat, lng, radius);

```// Use geohash precision 7-9 for balance of accuracy vs privacy

````

## Platform Considerations

## ⚡ Performance Optimizations

### iOS/Android Handling

````typescript### List Virtualization

if (Platform.OS === 'ios') {

  // iOS-specific implementation```typescript

} else {<FlatList

  // Android-specific implementation  removeClippedSubviews={true}

}  maxToRenderPerBatch={5}

```  windowSize={3}

  getItemLayout={(data, index) => ({

### Expo APIs    length: ITEM_HEIGHT,

```typescript    offset: ITEM_HEIGHT * index,

try {    index,

  const { status } = await Location.requestForegroundPermissionsAsync();  })}

  if (status !== 'granted') {/>

    // Handle permission denied```

  }

} catch (error) {### Memoization Strategy

  // Handle location services unavailable

}```typescript

```// Memoize expensive computations

const filteredProfiles = useMemo(

## Recent Updates  () => profiles.filter((profile) => distance <= maxDistance),

  [profiles, maxDistance]

### Code Cleanup (2025-11-15));

- Removed unused components: `ConfirmationModal`, `ErrorBoundary`, `MatchModal`

- Removed unused hook: `useResponsive`// Memoize callbacks

- Removed unused utility functions from `inputSanitizer`const handleLike = useCallback((profileId) => {

- Removed unused dependencies: `@react-native-picker/picker`, `react-native-url-polyfill`  likeProfile(profileId);

- Kept `react-native-worklets` (required peer dependency of `react-native-reanimated`)}, []);

````

### UI Improvements

- Search list: Removed top padding for tighter layout### Caching Strategy

- Consistent spacing using design tokens

- Improved responsive scaling utilities```typescript

// Cache with TTL for different data types

## Development Best Practicesconst CACHE_TTL = {

CURRENT_USER: 10 _ 60 _ 1000, // 10 minutes

### Adding Features DISCOVER_PROFILES: 5 _ 60 _ 1000, // 5 minutes

1. Design Firestore document structure first CONVERSATIONS: 2 _ 60 _ 1000, // 2 minutes

2. Update types in `store/types.ts`};

3. Implement service layer logic```

4. Add Zustand store actions

5. Create UI components with proper state management## 🎨 UI/UX Patterns

6. Add real-time listeners if needed (`onMatchAdded`/`onMatchRemoved`)

### Animation System

### Debugging

1. Check Firestore listener cleanup in useEffect returns```typescript

2. Verify security rules for data access// Use Reanimated for smooth animations

3. Test offline behavior with Firestore persistenceconst animatedStyle = useAnimatedStyle(() => ({

4. Monitor performance with React DevTools Profiler transform: [{ scale: withTiming(isLiked ? 1.2 : 1) }],

}));

### Performance Troubleshooting

1. Audit FlatList virtualization props// Haptic feedback for interactions

2. Check for unnecessary re-renders with `React.memo`/`useMemo`await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

3. Monitor network requests and caching efficiency```

4. Profile component render times

### Responsive Design

---

```typescript

**Core Principles**: Optimistic updates, real-time synchronization, performance-first architecture, privacy-by-design. Always prioritize user experience, especially for matching and chat features.// Use responsive utilities
import { scale, verticalScale, moderateScale } from '../utils/responsive';

const iconSize = isTablet ? scale(26) : scale(20);
const padding = spacing.md; // Predefined spacing scale
```

### Theme System

```typescript
// Context-based theming
const { isDarkMode } = useTheme();
const theme = isDarkMode ? darkTheme : lightTheme;

<View style={{ backgroundColor: theme.background }}>
  <Text style={{ color: theme.text }}>{content}</Text>
</View>;
```

**Note**: Dark mode toggle is only available in Settings screen (`app/settings/index.tsx`). Do not add dark mode toggles to headers or other UI components.

### Internationalization (i18n)

All user-facing text must use i18n keys for multi-language support. Supported languages: English (en), Hebrew (he), Russian (ru), Spanish (es).

```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

// Use translation keys instead of hardcoded strings
<Text>{t('settings.title')}</Text>; // Instead of <Text>Settings</Text>
```

**Critical**: Never use hardcoded strings in components. All text visible to users must be translated.

## 🧪 Testing & Validation

### Component Testing

```typescript
// Test user interactions
fireEvent.press(getByText('Like'));
await waitFor(() => expect(mockLikeProfile).toHaveBeenCalled());
```

### State Testing

```typescript
// Test Zustand store actions
const { result } = renderHook(() => useUserStore());
act(() => result.current.likeProfile('user123'));
expect(result.current.likedProfiles).toContain('user123');
```

## 📱 Platform Considerations

### iOS/Android Differences

```typescript
// Handle platform-specific behavior
if (Platform.OS === 'ios') {
  // iOS-specific code
} else {
  // Android-specific code
}
```

### Expo-Specific Patterns

```typescript
// Use Expo APIs with proper error handling
try {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    // Handle permission denied
  }
} catch (error) {
  // Handle location services unavailable
}
```

## 🔧 Common Development Tasks

### Adding New Features

1. **Plan Data Flow**: Design Firestore document structure
2. **Update Types**: Add to `store/types.ts`
3. **Create Service**: Implement in appropriate service class
4. **Update Store**: Add actions to Zustand store
5. **Create UI**: Build components with proper state management
6. **Add Real-time**: Set up Firestore listeners using `onMatchAdded`/`onMatchRemoved` patterns if needed

### Debugging Real-time Issues

1. **Check Listeners**: Ensure proper cleanup with `useEffect` return
2. **Verify Permissions**: Confirm Firestore security rules
3. **Test Offline**: Verify offline behavior with Firestore persistence
4. **Monitor Performance**: Check for excessive re-renders

### Performance Troubleshooting

1. **Profile Lists**: Use React DevTools Profiler
2. **Check Virtualization**: Ensure FlatList optimization props
3. **Audit Re-renders**: Use `React.memo` and `useMemo` appropriately
4. **Monitor Network**: Check Firestore query efficiency

Remember: This codebase emphasizes **optimistic updates**, **real-time synchronization** with Firestore listeners for matches and conversations, and **performance optimization**. Always consider the user experience impact of changes, especially around matching and chat features.
