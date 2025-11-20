import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { geohashForLocation } from 'geofire-common';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBPdV1BiL67xJes80Gv_tozl1E1ZAqslbk',
  authDomain: 'meetbridge-b5cdc.firebaseapp.com',
  projectId: 'meetbridge-b5cdc',
  storageBucket: 'meetbridge-b5cdc.firebasestorage.app',
  messagingSenderId: '331612362377',
  appId: '1:331612362377:web:6ad392ab246120d4461858',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Base location
let BASE_LAT = 32.081271689366034; // Petah Tikva
let BASE_LON = 34.89067520447793; // Petah Tikva

// Generate nearby location
function generateNearbyLocation(distanceMeters: number) {
  const variation = 0.15;
  const randomFactor = 1 + (Math.random() - 0.5) * 2 * variation;
  const actualDistance = distanceMeters * randomFactor;

  const degreeOffset = actualDistance / 111000;
  const angle = Math.random() * 2 * Math.PI;

  const latOffset = degreeOffset * Math.cos(angle);
  const lonOffset =
    (degreeOffset * Math.sin(angle)) / Math.cos((BASE_LAT * Math.PI) / 180);

  return {
    latitude: BASE_LAT + latOffset,
    longitude: BASE_LON + lonOffset,
  };
}

async function moveUsers() {
  console.log('🚶 Moving users to new locations...');

  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    let movedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();

      // Skip if user doesn't have coordinates or is not online
      if (!userData.coordinates || !userData.isOnline) {
        continue;
      }

      // Generate new location within 1km
      const newLocation = generateNearbyLocation(Math.random() * 1000);
      const geohash = geohashForLocation(
        [newLocation.latitude, newLocation.longitude],
        9
      );

      // Update user location
      await updateDoc(doc(db, 'users', userDoc.id), {
        coordinates: {
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
        },
        geohash,
        lastSeen: serverTimestamp(),
      });

      movedCount++;
      if (movedCount % 10 === 0) {
        console.log(`✅ Moved ${movedCount} users...`);
      }
    }

    console.log(`✅ Successfully moved ${movedCount} users to new locations`);
  } catch (error) {
    console.error('❌ Error moving users:', error);
  }
}

// Run the script
moveUsers()
  .then(() => {
    console.log('🎉 User movement simulation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
