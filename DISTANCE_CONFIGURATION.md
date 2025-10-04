# Distance Configuration - All in METERS

## Summary

The entire app now works exclusively with **METERS** for all distance calculations and storage. No more km/meters confusion!

## Configuration

### Filter Range (FilterModal.tsx)

- **Minimum Distance**: 50m
- **Maximum Distance**: 5000m (5km)
- **Step**: 50m
- **Default**: 100m

### User Preferences

- `maxDistance` field: Stored in **METERS**
- Default value: 100m for nearby search
- Range: 5m - 5000m

### Mock Users (generateMockUsers.ts)

All 10 mock users are created with distances in **METERS**:

- Sarah: 50m (minimum filter distance)
- Dan: 100m
- Yael: 150m
- Ori: 250m
- Maya: 300m
- Avi: 400m
- Noa: 500m
- Tom: 600m
- Tamar: 750m
- Eitan: 900m

Mock user preferences: `maxDistance: 1000m`

### Geohash Configuration

- **Precision**: 9 (~4.8m x 4.8m accuracy)
- Provides highly accurate location matching
- Optimal for dating app proximity features

## Implementation Details

### LocationService (services/locationService.ts)

```typescript
calculateDistance(): number  // Returns METERS
getQueryBounds(radiusInMeters: number)  // Expects METERS
isWithinRadius(radiusInMeters: number)  // Expects METERS
formatDistance(meters: number): string  // Accepts METERS
```

### Firebase Services (services/firebase/firebaseServices.ts)

- All distance comparisons use meters
- `filters.maxDistance` is in METERS
- Distance returned from `calculateDistance()` is in METERS
- Compatibility score calculation uses meters

### UI Display (search.tsx)

```typescript
{
  user.distance >= 1000
    ? `${(user.distance / 1000).toFixed(1)}km` // Show km if >= 1000m
    : `${Math.round(user.distance)}m`;
} // Show m if < 1000m
```

### Type Definitions (store/types.ts)

```typescript
interface User {
  distance?: number; // Distance in METERS
  preferences?: {
    maxDistance: number; // Max distance in METERS
  };
}

interface SearchFilters {
  maxDistance: number; // Max distance in METERS
}
```

## Discovery Queue

- Queue is cleared automatically when filters change
- Repopulates with profiles matching current `maxDistance` filter
- All distance calculations use meters
- Fast HashMap-based duplicate detection

## Logging

All debug logs show distances in meters:

```
📏 Distance calculation: {"distanceMeters": 327, ...}
🔍 Geohash query bounds: {"radiusMeters": 650, ...}
✅ Including Sarah: 54m (within 650m)
⏭️ Skipping Maya: 2834m > 650m
```

## Benefits

1. ✅ **No confusion**: Everything uses the same unit
2. ✅ **Accurate**: Integer meters are precise for dating app ranges
3. ✅ **Consistent**: Database, calculations, and UI all aligned
4. ✅ **Fast**: No unnecessary conversions
5. ✅ **Clear**: Type comments document that distances are in meters

## Testing

To test the distance filtering:

1. Set filter to 100m → Should see Sarah (50m) and Dan (100m)
2. Set filter to 300m → Should see Sarah, Dan, Yael, Ori, Maya
3. Set filter to 1000m → Should see all 10 mock users
4. Set filter to 50m → Should see only Sarah (50m)

## Migration Complete

All previous km-based code has been converted to meters:

- ✅ LocationService methods
- ✅ Firebase query logic
- ✅ UI display components
- ✅ Type definitions
- ✅ Mock user generation
- ✅ Debug logging
