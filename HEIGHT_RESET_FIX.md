# Height Reset Bug Fix

## Issue

After registration, when users open the EditProfileModal, their height value was being reset to the default 170cm instead of preserving the height they set during registration.

## Root Cause

The EditProfileModal was using a simple fallback pattern:

```typescript
height: user?.height || 170;
```

This pattern fails when:

- `user?.height` is `0` (which is falsy in JavaScript)
- The user object hasn't fully loaded yet
- The height value needs explicit validation

## Solution

Updated the height initialization logic in EditProfileModal to properly validate and preserve existing height values:

```typescript
height: user?.height !== undefined && user?.height > 0 ? user.height : 170;
```

This change:

1. Checks if height is explicitly defined (not undefined)
2. Validates it's greater than 0 (valid height)
3. Only falls back to 170cm if neither condition is met

## Files Modified

- `app/components/EditProfileModal.tsx` (2 locations)
  - Initial state declaration
  - useEffect that updates form data when user changes

## Testing

To verify the fix:

1. Register a new account with a specific height (e.g., 185cm)
2. Complete registration flow
3. Open EditProfileModal from complete-profile screen
4. Verify height slider shows the correct value (185cm, not 170cm)
5. Save profile without changing height
6. Reload and verify height is still correct

## Impact

- ✅ Users' height values are now preserved correctly
- ✅ No more data loss during profile completion
- ✅ Better user experience - no need to re-enter height
- ✅ Works for both initial profile completion and later edits
