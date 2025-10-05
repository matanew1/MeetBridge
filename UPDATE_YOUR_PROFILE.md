# Script to Update Your User Profile

Run this script to update YOUR logged-in user to match the new precision 9 settings:

```typescript
// updateMyProfile.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBPdV1BiL67xJes80Gv_tozl1E1ZAqslbk',
  authDomain: 'meetbridge-b5cdc.firebaseapp.com',
  projectId: 'meetbridge-b5cdc',
  storageBucket: 'meetbridge-b5cdc.firebasestorage.app',
  messagingSenderId: '331612362377',
  appId: '1:331612362377:web:6ad392ab246120d4461858',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateMyProfile() {
  // Replace with YOUR user ID (check Firebase Console or logs)
  const YOUR_USER_ID = 'eiX3goZgAWUgvPyY1uqNCeizD0Z2'; // From your logs

  try {
    await updateDoc(doc(db, 'users', YOUR_USER_ID), {
      'preferences.maxDistance': 500, // 500m max (was 5000m)
      'preferences.ageRange': [18, 35], // 18-35 range (was 18-99)
    });

    console.log('✅ Your profile updated successfully!');
    console.log('   maxDistance: 5000m → 500m');
    console.log('   ageRange: [18,99] → [18,35]');
    console.log('');
    console.log('🔄 Now restart your app to see the changes!');
  } catch (error) {
    console.error('❌ Error updating profile:', error);
  }

  process.exit(0);
}

updateMyProfile();
```

Save this as `scripts/updateMyProfile.ts` and run:

```bash
ts-node scripts/updateMyProfile.ts
```

OR manually update in Firebase Console:

1. Go to Firebase Console → Firestore
2. Find users collection → YOUR_USER_ID
3. Edit `preferences` field:
   - `maxDistance`: 5000 → 500
   - `ageRange`: [18, 99] → [18, 35]
4. Save
5. Restart your app
