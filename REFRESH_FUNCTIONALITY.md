# Refresh Button Functionality

## Overview

The refresh button in the search screen allows users to manually refresh the discovery queue and get new profiles that match their current filters.

## Location

**Screen**: Search Tab (`app/(tabs)/search.tsx`)
**Position**: Top-right header, next to the filter button
**Icon**: RefreshCw (rotating circular arrow)

## Functionality

### What Happens When Refresh is Pressed

1. **Haptic Feedback**

   - Medium impact vibration on button press

2. **Clear Discovery Queue**

   ```typescript
   await discoveryService.clearDiscoveryQueue(currentUser.id);
   ```

   - Removes all cached profiles from the discovery queue
   - Ensures fresh results on next load

3. **Trigger Search Animation**

   ```typescript
   setShowAnimation(true);
   triggerSearchAnimation();
   ```

   - Shows the discovery animation for visual feedback
   - Provides smooth transition while loading new profiles

4. **Reload Discovery Profiles**

   ```typescript
   await loadDiscoverProfiles(true);
   ```

   - Fetches new profiles based on current filters
   - Uses geohash queries with current `maxDistance` and `ageRange`
   - Respects all active filters

5. **Success Feedback**
   - Success haptic notification
   - Console log: `✅ Discovery profiles reloaded - Queue refreshed!`

### Error Handling

- If an error occurs, error haptic feedback is triggered
- Error is logged to console with details

## User Experience

### Visual States

1. **Normal State**: Shows RefreshCw icon
2. **Loading State**: Shows ActivityIndicator (spinner)
3. **Animation**: Discovery animation plays during refresh

### When to Use

Users should press refresh when:

- ✅ They've seen all current profiles
- ✅ They want to check for new nearby users
- ✅ They changed filters and want immediate results
- ✅ They've been using the app for a while and want fresh matches

### Automatic Queue Updates

The queue also clears automatically when:

- ✅ User changes `maxDistance` filter
- ✅ User changes `ageRange` filter
- ✅ Queue has fewer than 5 profiles remaining

## Technical Implementation

### Function: `handleSearchButton()`

```typescript
const handleSearchButton = async () => {
  if (currentUser) {
    try {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Clear queue
      await discoveryService.clearDiscoveryQueue(currentUser.id);

      // Animate
      setShowAnimation(true);
      triggerSearchAnimation();

      // Reload
      await loadDiscoverProfiles(true);

      // Success feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }
};
```

### Dependencies

- `expo-haptics`: For tactile feedback
- `FirebaseDiscoveryService`: For queue management
- `useUserStore`: For profile loading and state management

## Benefits

1. ✅ **User Control**: Users can manually refresh when they want
2. ✅ **Fresh Results**: Always gets latest matching profiles
3. ✅ **Filter Sync**: Respects current distance and age filters
4. ✅ **Performance**: Clears old cache for better performance
5. ✅ **Feedback**: Clear visual and haptic feedback
6. ✅ **Error Handling**: Graceful error handling with user feedback

## Testing

To test the refresh functionality:

1. **Basic Refresh**:

   - Press refresh button
   - Verify discovery animation plays
   - Check console logs for queue clearing and reloading
   - Verify new profiles appear

2. **Filter Changes**:

   - Set distance to 100m
   - Press refresh
   - Verify only profiles within 100m appear
   - Change distance to 500m
   - Press refresh again
   - Verify profiles up to 500m now appear

3. **Empty Queue**:

   - Swipe through all profiles
   - Press refresh
   - Verify new profiles are loaded (if available)

4. **Error Handling**:
   - Disable network
   - Press refresh
   - Verify error haptic feedback
   - Check console for error message

## Logging

The refresh button logs these messages:

```
🔄 Refresh button pressed - clearing discovery queue...
✅ Discovery queue cleared
🔄 Reloading discovery profiles...
✅ Discovery profiles reloaded - Queue refreshed!
```

Or on error:

```
❌ Error refreshing discovery queue: [error details]
```
