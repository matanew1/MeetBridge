# 🗑️ Drop Collections Script

## Overview

This script allows you to **delete entire Firestore collections** from your database. Use with caution!

## Usage

### Drop ALL Collections

Deletes all data from Firestore:

```powershell
npm run drop-collections
```

This will delete:

- `users` collection
- `matches` collection
- `likes` collection
- `dislikes` collection
- `conversations` collection
- `conversations/{id}/messages` subcollections

### Drop Specific Collections

Delete only specific collections:

```powershell
npm run drop-collection users matches
```

```powershell
npm run drop-collection conversations
```

```powershell
npm run drop-collection conversations/messages
```

## What Gets Deleted

| Collection                    | Description                       |
| ----------------------------- | --------------------------------- |
| `users`                       | All user profiles                 |
| `matches`                     | All match documents               |
| `likes`                       | All like records                  |
| `dislikes`                    | All dislike records               |
| `conversations`               | All conversation metadata         |
| `conversations/{id}/messages` | All messages in all conversations |

## Safety Features

1. **3-Second Warning**: Script waits 3 seconds before starting deletion
2. **Batch Processing**: Uses Firestore batch operations for efficiency
3. **Progress Logging**: Shows real-time progress during deletion
4. **Statistics**: Reports total documents deleted and time taken

## Example Output

```
🚨 WARNING: This will DELETE ALL DATA from Firestore!
Collections to be deleted:
  - users
  - matches
  - likes
  - dislikes
  - conversations
  - conversations/{id}/messages (subcollection)

⏳ Starting deletion in 3 seconds...

📦 Step 1: Deleting subcollections...

🗑️  Deleting subcollection "messages" from all documents in "conversations"
   Deleted 15 messages from conversation abc123
   Deleted 8 messages from conversation def456
✅ Total deleted from "conversations/{id}/messages": 23 documents

📦 Step 2: Deleting main collections...

🗑️  Starting to delete collection: conversations
   Deleted 5 documents... (Total: 5)
✅ Collection "conversations" is now empty
✅ Total deleted from "conversations": 5 documents

🗑️  Starting to delete collection: matches
   Deleted 12 documents... (Total: 12)
✅ Collection "matches" is now empty
✅ Total deleted from "matches": 12 documents

🗑️  Starting to delete collection: likes
   Deleted 45 documents... (Total: 45)
✅ Collection "likes" is now empty
✅ Total deleted from "likes": 45 documents

🗑️  Starting to delete collection: dislikes
   Deleted 23 documents... (Total: 23)
✅ Collection "dislikes" is now empty
✅ Total deleted from "dislikes": 23 documents

🗑️  Starting to delete collection: users
   Deleted 20 documents... (Total: 20)
✅ Collection "users" is now empty
✅ Total deleted from "users": 20 documents

✅ ===== DELETION COMPLETE ===== ✅
📊 Total documents deleted: 105
⏱️  Time taken: 3.45 seconds

💡 Note: Firebase Auth users are NOT deleted (requires Admin SDK)
   To delete Auth users, use Firebase Console or Admin SDK

🎉 All collections dropped successfully!
```

## Important Notes

### Firebase Auth Users

⚠️ **This script does NOT delete Firebase Authentication users**

Firebase Auth users require Admin SDK or Firebase Console to delete:

1. **Option 1: Firebase Console**

   - Go to Firebase Console → Authentication
   - Manually delete users one by one

2. **Option 2: Use Delete Mock Users Script**
   ```powershell
   npm run delete-mock-users
   ```
   This script deletes both Firestore documents AND Auth users

### When to Use This Script

✅ **Good for:**

- Cleaning up test data
- Resetting development database
- Removing old collections
- Starting fresh with new data schema

❌ **Don't use for:**

- Production data (unless you're sure!)
- Partial cleanup (use specific collection names instead)
- Regular maintenance (too destructive)

## Use Cases

### 1. Clean Slate for Testing

```powershell
# Drop all collections
npm run drop-collections

# Generate fresh mock users
npm run generate-mock-users
```

### 2. Remove Only Matches

```powershell
npm run drop-collection matches likes dislikes
```

### 3. Clean Up Conversations

```powershell
# Delete all conversations and messages
npm run drop-collection conversations/messages conversations
```

### 4. Keep Users, Reset Interactions

```powershell
# Delete everything except users
npm run drop-collection matches likes dislikes conversations conversations/messages
```

## Technical Details

### Batch Operations

The script uses Firestore batch operations:

- Maximum 500 documents per batch
- Efficient and atomic
- Handles large collections

### Subcollections

Firestore subcollections must be deleted separately:

- Script detects subcollection patterns
- Iterates through parent documents
- Deletes messages in each conversation

### Performance

- **Small collections** (<100 docs): ~1-2 seconds
- **Medium collections** (100-1000 docs): ~3-10 seconds
- **Large collections** (1000+ docs): ~30-60 seconds

## Troubleshooting

### Permission Denied

If you get permission errors:

1. Check Firestore Security Rules
2. Make sure you have write access
3. Temporarily disable rules for development:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Development only!
    }
  }
}
```

### Timeout Errors

For very large collections:

- Script will automatically retry
- Run multiple times if needed
- Consider deleting in smaller batches

### Authentication Required

Script uses Firebase config directly:

- No manual login required
- Uses service account credentials
- Works for automated scripts

## Safety Checklist

Before running, verify:

- [ ] You're connected to the correct Firebase project
- [ ] You have a backup if needed (production)
- [ ] You understand what will be deleted
- [ ] You've waited for the 3-second warning
- [ ] You're ready to regenerate test data

## Related Scripts

| Script              | Command                       | Purpose                    |
| ------------------- | ----------------------------- | -------------------------- |
| Generate Mock Users | `npm run generate-mock-users` | Create test users          |
| Delete Mock Users   | `npm run delete-mock-users`   | Delete users + auth        |
| Drop Collections    | `npm run drop-collections`    | Delete Firestore data only |

## Quick Reference

```powershell
# Nuclear option - delete everything
npm run drop-collections

# Surgical - delete specific collections
npm run drop-collection users
npm run drop-collection matches likes
npm run drop-collection conversations/messages

# Clean slate workflow
npm run drop-collections && npm run generate-mock-users
```

---

⚠️ **Remember**: This is a destructive operation. Use with caution!
