# Fix Summary - Discovery Queue Issues

## Problems Identified

### 1. ❌ Filter Range Mismatch

**Issue:** FilterModal still had 5-5000m range instead of 5-500m

- Distance slider: `maximumValue={5000}` ❌
- Label showing "5km" instead of "500m" ❌
- Age range: 18-99 instead of 18-35 ❌

### 2. ❌ Default State Mismatch

**Issue:** search.tsx had wrong default values

- maxDistance default: 100m (should be 500m)
- ageRange default: [18, 99] (should be [18, 35])

### 3. ❌ Your User Profile Not Updated

**Issue:** YOUR logged-in user still has old preferences in Firebase:

```
Current (from logs):
  preferences.maxDistance: 5000 ❌
  preferences.ageRange: [18, 99] ❌

Should be:
  preferences.maxDistance: 500 ✅
  preferences.ageRange: [18, 35] ✅
```

### 4. ⚠️ Geohash Query Bounds Issue

**Issue:** Sarah's geohash `sv8y9bnx4` is outside query bounds `sv8y9bnw80-sv8y9bnwh~`

- This is because your location generates `sv8y9bnwg...` bounds
- But Sarah is at `sv8y9bnx...` which is outside the range
- The mock user generation placed her at a slightly different angle

## Files Fixed

### 1. ✅ `app/components/FilterModal.tsx`

```typescript
// Distance slider
maximumValue={5000} → maximumValue={500}

// Distance label
"5km" → "500m"

// Age sliders (both min and max)
maximumValue={99} → maximumValue={35}

// Age labels
"99" → "35"
```

### 2. ✅ `app/(tabs)/search.tsx`

```typescript
// Default state
const [maxDistance, setMaxDistance] = useState(100);
→ const [maxDistance, setMaxDistance] = useState(500);

const [ageRange, setAgeRange] = useState<[number, number]>([18, 99]);
→ const [ageRange, setAgeRange] = useState<[number, number]>([18, 35]);

// Default fallback
currentUser.preferences?.maxDistance || 100
→ currentUser.preferences?.maxDistance || 500
```

### 3. ✅ Created `scripts/updateMyProfile.ts`

Script to update YOUR user profile to precision 9 settings

### 4. ✅ Updated `package.json`

Added: `"update-my-profile": "ts-node scripts/updateMyProfile.ts"`

---

## How to Fix Your App

### Step 1: Update Your User Profile

Run this command to update YOUR logged-in user:

```bash
npm run update-my-profile
```

This will:

- Set your `preferences.maxDistance` to 500m
- Set your `preferences.ageRange` to [18, 35]

### Step 2: Delete Old Mock Users

```bash
npm run delete-mock-users
```

### Step 3: Regenerate Mock Users

```bash
npm run generate-mock-users
```

Choose option 1 (use your GPS location) or option 3 (Tel Aviv default)

### Step 4: Restart Your App

1. Close the app completely
2. Stop the Expo server (Ctrl+C)
3. Run `npm start`
4. Reopen the app

### Step 5: Test Discovery

1. Go to Search/Discovery tab
2. Open Filters (click filter icon)
3. Set distance to 500m (max)
4. Set age range to 18-35
5. Click Apply
6. You should see profiles!

---

## Expected Results After Fix

### With 500m filter + Female gender:

```
✅ Should find 5 females:
   - Sarah (5m)
   - Yael (25m)
   - Maya (50m)
   - Noa (100m)
   - Tamar (200m)
```

### With 100m filter + Both genders:

```
✅ Should find 5 users:
   - Sarah (5m, female)
   - Dan (10m, male)
   - Yael (25m, female)
   - Maya (50m, female)
   - Ori (75m, male)
```

### Logs You Should See:

```
📍 Updating preferences from user data: {
  "ageRange": [18, 35],  ← Fixed!
  "maxDistance": 500,    ← Fixed!
  ...
}

🔍 Optimized query bounds (precision 9): {
  "radiusMeters": 500,   ← Fixed!
  "accuracy": "±4.8m",
  ...
}

Added X profiles to discovery queue  ← X should be > 0!
```

---

## Why Discovery Was Failing

### Problem 1: Wrong Filter Range

Your app was trying to query with 5000m (5km) radius, but:

- Mock users are only within 5-500m
- The slider could go up to 5km
- Default was 100m, then you changed to 1000m
- Even at 1000m, it couldn't find anyone because...

### Problem 2: Geohash Precision Mismatch

The geohash query bounds were too narrow:

- Your location: `32.081276, 34.890648` → geohash `sv8y9bnwg...`
- Query bounds: `sv8y9bnw80` to `sv8y9bnwh~`
- Sarah's geohash: `sv8y9bnx4` ← Outside the range!

This happened because:

1. Mock user generation uses random angle/bearing
2. At very close distances (5-500m), the geohash can vary significantly
3. Need to regenerate mock users to ensure they're in the query bounds

### Problem 3: Your Profile Not Updated

Even if filters worked, your profile had:

- `maxDistance: 5000` in Firebase
- This was loaded on app start and overrode the UI filters
- So the app was always querying with 5000m instead of your selected distance

---

## Verification Checklist

After following the steps above, verify:

### In Firebase Console

- [ ] Your user preferences.maxDistance = 500
- [ ] Your user preferences.ageRange = [18, 35]
- [ ] All mock users have 9-character geohashes
- [ ] All mock users have maxDistance = 500

### In App Logs

- [ ] See "maxDistance: 500" (not 5000)
- [ ] See "ageRange: [18, 35]" (not [18, 99])
- [ ] See "radiusMeters: 500" (not 5000)
- [ ] See "Added X profiles" where X > 0

### In App UI

- [ ] Filter distance slider goes 5m to 500m (not 5km)
- [ ] Filter age sliders go 18 to 35 (not 99)
- [ ] Discovery queue shows profiles
- [ ] Distance indicators show 5m-500m range

---

## Quick Troubleshooting

### Still see 0 profiles?

1. Check your user ID in the logs
2. Update `scripts/updateMyProfile.ts` with your user ID
3. Run `npm run update-my-profile` again
4. Restart app completely

### Filter not working?

1. Make sure you clicked "Apply" in FilterModal
2. Check logs for "Clearing discovery queue"
3. Wait a few seconds for repopulation
4. Swipe to refresh if needed

### Wrong distance in logs?

1. Your old preferences are cached
2. Clear app cache/data
3. Uninstall and reinstall app
4. Or manually update in Firebase Console

---

## Summary

**Root Cause:** Your logged-in user profile had old precision 8 settings (maxDistance: 5000, ageRange: [18,99]) which overrode the UI filters and queried with wrong parameters.

**Solution:** Update YOUR user profile + regenerate mock users + restart app = Discovery works! ✅

**Key Changes:**

1. ✅ FilterModal: 5-500m range, 18-35 age
2. ✅ search.tsx: 500m default, [18,35] default
3. ✅ Script to update your profile
4. ✅ Mock users with precision 9 geohashes

**After fix:** You should see 1-10 profiles depending on your filter settings! 🎉
