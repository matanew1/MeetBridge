// Quick diagnostic script to check mock users geohash precision
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

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

async function checkMockUsers() {
  console.log('🔍 Checking Mock Users in Firestore...\n');

  try {
    // Get all mock users
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '>=', 'mock'),
      where('email', '<=', 'mock\uf8ff')
    );

    const snapshot = await getDocs(usersQuery);

    console.log(`📊 Found ${snapshot.size} mock users\n`);

    if (snapshot.empty) {
      console.log('❌ No mock users found!');
      console.log('💡 Run: npm run generate-mock-users');
      process.exit(1);
    }

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${data.name || 'Unknown'}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Gender: ${data.gender}`);
      console.log(`   Geohash: ${data.geohash || 'MISSING!'}`);
      console.log(
        `   Geohash Length: ${data.geohash?.length || 0} (should be 8)`
      );
      console.log(
        `   Coordinates: ${data.coordinates?.latitude?.toFixed(
          6
        )}, ${data.coordinates?.longitude?.toFixed(6)}`
      );
      console.log(`   Location: ${data.location}`);
      console.log('');
    });

    // Analysis
    const withGeohash = snapshot.docs.filter((doc) => doc.data().geohash);
    const precision8 = snapshot.docs.filter(
      (doc) => doc.data().geohash?.length === 8
    );
    const precision9 = snapshot.docs.filter(
      (doc) => doc.data().geohash?.length === 9
    );

    console.log('📈 Analysis:');
    console.log(`   Total mock users: ${snapshot.size}`);
    console.log(`   With geohash: ${withGeohash.length}`);
    console.log(`   Precision 8: ${precision8.length} ✅`);
    console.log(
      `   Precision 9: ${precision9.length} ${
        precision9.length > 0 ? '⚠️ (WRONG!)' : ''
      }`
    );
    console.log(`   Missing geohash: ${snapshot.size - withGeohash.length}`);

    if (precision9.length > 0) {
      console.log('\n❌ PROBLEM FOUND!');
      console.log('   Some users have precision 9 geohashes (old data)');
      console.log('   Solution: Delete and regenerate mock users');
      console.log('\n💡 Run these commands:');
      console.log('   npm run delete-mock-users');
      console.log('   npm run generate-mock-users');
    } else if (precision8.length === snapshot.size) {
      console.log('\n✅ All mock users have correct precision 8 geohashes!');
      console.log('   The issue might be elsewhere. Check:');
      console.log('   1. Are you at the same location as mock users?');
      console.log('   2. Is your geohash query working correctly?');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

checkMockUsers();
