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
  // Replace with YOUR user ID from Firebase Console or app logs
  const YOUR_USER_ID = 'eiX3goZgAWUgvPyY1uqNCeizD0Z2';

  console.log('🔧 Updating your user profile to precision 9 settings...\n');

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
    console.log('📱 You should now see profiles in discovery queue.');
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    console.log('\n💡 Alternative: Update manually in Firebase Console:');
    console.log('   1. Go to Firebase Console → Firestore');
    console.log(`   2. Users collection → ${YOUR_USER_ID}`);
    console.log('   3. Edit preferences field:');
    console.log('      maxDistance: 500');
    console.log('      ageRange: [18, 35]');
  }

  process.exit(0);
}

updateMyProfile();
