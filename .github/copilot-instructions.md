# MeetBridge AI Coding Guidelines

## 🏗️ Architecture Overview

MeetBridge is a modern dating app built with **React Native + Expo** featuring a layered architecture:

- **Presentation Layer**: Expo Router (file-based), custom UI components with animations
- **State Management**: Zustand store + React Context (AuthContext, ThemeContext)
- **Service Layer**: Firebase services with real-time listeners
- **Backend**: Firebase (Auth, Firestore, Storage) with geohash-based location queries

## 🔑 Critical Patterns & Conventions

### State Management (Zustand)

```typescript
// Always use optimistic updates for better UX
likeProfile: async (profileId: string) => {
  // 1. Update local state immediately
  set((state) => ({
    ...state,
    likedProfiles: [...state.likedProfiles, profileId],
  }));

  try {
    // 2. Call Firebase service
    const result = await matchingService.likeProfile(profileId);
    // 3. Handle success (real-time listeners will update UI)
  } catch (error) {
    // 4. Rollback on failure
    set((state) => ({
      ...state,
      likedProfiles: state.likedProfiles.filter((id) => id !== profileId),
    }));
  }
};
```

### Service Layer Pattern

```typescript
// Services follow consistent interface pattern
export class FirebaseMatchingService {
  async likeProfile(userId: string, targetId: string) {
    // 1. Create Firestore document
    // 2. Check for mutual match
    // 3. Return result with metadata
  }
}
```

### Real-Time Listeners

```typescript
// Always set up Firestore listeners for live updates
useEffect(() => {
  const unsubscribe = onSnapshot(
    query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId)
    ),
    (snapshot) => {
      const conversations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      set({ conversations });
    }
  );
  return unsubscribe;
}, [userId]);
```

### Location & Discovery

```typescript
// Use geohash for efficient proximity queries
const geohashes = geohashService.neighbors(centerGeohash);
const query = query(
  collection(db, 'users'),
  where('location.geohash', 'in', [centerGeohash, ...geohashes]),
  where('gender', '==', preferences.interestedIn)
);
// Filter by exact distance client-side using haversine formula
```

## 🚀 Development Workflow

### Essential Commands

```bash
# Start development server
npm run dev          # Clear cache + start
npm run tunnel       # For testing on physical devices

# Build for production
npx expo export --platform web  # Web build

# Database management scripts
npm run generate-mock-users     # Create test users
npm run delete-mock-users       # Clean up test data
npm run drop-collections        # Reset database
```

### File Structure Conventions

```
app/                    # Expo Router pages (file-based routing)
  _layout.tsx          # Root layout with navigation
  (tabs)/              # Tab navigation group
    loved.tsx          # Discover tab
    search.tsx         # Search tab
    chat.tsx           # Chat list tab
    connections.tsx    # Board tab

services/              # Business logic layer
  firebase/            # Firebase service implementations
  location/            # Geohash & location services

store/                 # Zustand state management
  userStore.ts         # Main app state
  types.ts             # State type definitions

components/            # Reusable UI components
  ui/                  # Base UI kit (Button, Card, etc.)
```

## 🎯 Key Implementation Patterns

### Profile Discovery Flow

1. **Load Filters**: Sync search filters with user preferences
2. **Geohash Query**: Query users within geohash bounds
3. **Client Filtering**: Apply exact distance + preference filters
4. **Deduplication**: Exclude liked/disliked/matched profiles
5. **Pagination**: Load more profiles on scroll

### Match Creation Flow

1. **Optimistic UI**: Show like animation immediately
2. **Firestore Write**: Create like document
3. **Match Check**: Query reciprocal like
4. **Real-time Update**: Listeners update both users' UI
5. **Notifications**: Send match notifications

### Chat Architecture

1. **Conversation Creation**: Auto-create on match
2. **Real-time Messages**: Firestore listeners for live chat
3. **Read Receipts**: Update unread counts
4. **Presence**: Track online/offline status

## 🔒 Security & Privacy

### Data Storage

```typescript
// Use secureStorageService - auto-routes sensitive data
import { secureStorageService } from '../services/secureStorageService';

// Sensitive data → SecureStore, regular data → AsyncStorage
await secureStorageService.saveSecure('auth_token', token);
await secureStorageService.getSecure('auth_token');
```

### Location Privacy

```typescript
// Always apply privacy radius before storing/sending location
const blurredLocation = privacyService.blurLocation(lat, lng, radius);
// Use geohash precision 7-9 for balance of accuracy vs privacy
```

## ⚡ Performance Optimizations

### List Virtualization

```typescript
<FlatList
  removeClippedSubviews={true}
  maxToRenderPerBatch={5}
  windowSize={3}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### Memoization Strategy

```typescript
// Memoize expensive computations
const filteredProfiles = useMemo(
  () => profiles.filter((profile) => distance <= maxDistance),
  [profiles, maxDistance]
);

// Memoize callbacks
const handleLike = useCallback((profileId) => {
  likeProfile(profileId);
}, []);
```

### Caching Strategy

```typescript
// Cache with TTL for different data types
const CACHE_TTL = {
  CURRENT_USER: 10 * 60 * 1000, // 10 minutes
  DISCOVER_PROFILES: 5 * 60 * 1000, // 5 minutes
  CONVERSATIONS: 2 * 60 * 1000, // 2 minutes
};
```

## 🎨 UI/UX Patterns

### Animation System

```typescript
// Use Reanimated for smooth animations
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: withTiming(isLiked ? 1.2 : 1) }],
}));

// Haptic feedback for interactions
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
```

### Responsive Design

```typescript
// Use responsive utilities
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
6. **Add Real-time**: Set up Firestore listeners if needed

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

Remember: This codebase emphasizes **optimistic updates**, **real-time synchronization**, and **performance optimization**. Always consider the user experience impact of changes, especially around matching and chat features.
