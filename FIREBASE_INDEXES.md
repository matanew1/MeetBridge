# Firebase Firestore Indexes Setup

This document explains how to set up the required Firestore indexes for the MeetBridge app.

## Required Indexes

### 1. Conversations Collection Index

**Collection:** `conversations`
**Fields:**

- `participants` (Array)
- `updatedAt` (Descending)
- `__name__` (Ascending)

**Purpose:** This index is required for querying conversations where a user is a participant, ordered by last update time.

**Query that requires this index:**

```typescript
query(
  collection(db, 'conversations'),
  where('participants', 'array-contains', userId),
  orderBy('updatedAt', 'desc'),
  limit(pageSize)
);
```

## How to Create the Index

### Method 1: Automatic Creation (Recommended)

When you get the index error, Firebase provides a direct link to create the index. Click on this link:

```
https://console.firebase.google.com/v1/r/project/meetbridge-b5cdc/firestore/indexes?create_composite=ClZwcm9qZWN0cy9tZWV0YnJpZGdlLWI1Y2RjL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jb252ZXJzYXRpb25zL2luZGV4ZXMvXxABGhAKDHBhcnRpY2lwYW50cxgBGg0KCXVwZGF0ZWRBdBACGgwKCF9fbmFtZV9fEAI
```

### Method 2: Manual Creation

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`meetbridge-b5cdc`)
3. Go to **Firestore Database**
4. Click on the **Indexes** tab
5. Click **Create Index**
6. Set:
   - Collection ID: `conversations`
   - Add fields:
     - Field: `participants`, Type: `Array`
     - Field: `updatedAt`, Type: `Descending`
     - Field: `__name__`, Type: `Ascending` (auto-added)

### Method 3: Using Firebase CLI

You can also define indexes in a `firestore.indexes.json` file:

```json
{
  "indexes": [
    {
      "collectionGroup": "conversations",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "participants",
          "arrayConfig": "CONTAINS"
        },
        {
          "fieldPath": "updatedAt",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

Then deploy with:

```bash
firebase deploy --only firestore:indexes
```

## Index Building Time

- **Small collections (< 1000 documents):** Usually builds within minutes
- **Large collections:** Can take several hours
- **Status:** Check the Indexes tab in Firebase Console for build progress

## Temporary Workaround

While the index is building, the app uses a temporary workaround:

- Queries without `orderBy` to avoid index requirement
- Client-side sorting of results
- This is less efficient but allows the app to function

**Location of workaround:** `services/firebase/firebaseServices.ts` in the `getConversations` method.

## After Index is Created

Once the index is built:

1. Remove the temporary workaround code
2. Restore the original query with `orderBy`
3. Test that the error no longer occurs

## Common Issues

### "Query requires an index" Error

- **Cause:** Compound queries need composite indexes
- **Solution:** Create the required index as described above

### Index Build Failures

- **Check field types:** Ensure all fields exist and have correct types
- **Check permissions:** Ensure you have admin access to the Firebase project
- **Retry:** Sometimes builds fail temporarily; try creating again

### Performance Issues

- **Too many indexes:** Only create indexes you actually need
- **Large arrays:** `array-contains` queries on large arrays can be slow
- **Consider denormalization:** Sometimes it's better to restructure data

## Next Steps

1. Click the provided link to create the index
2. Wait for the index to build (check Firebase Console)
3. Test the conversations loading functionality
4. Remove the temporary workaround code when ready

---

**Note:** This index is specifically for the conversations feature. Additional indexes may be needed as the app grows and more complex queries are added.
