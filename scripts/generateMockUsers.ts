import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
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

// Base location (Tel Aviv area - your current location)
const BASE_LAT = 32.081273;
const BASE_LON = 34.890642;

// Helper function to generate random location near base
function generateNearbyLocation(distanceMeters: number): {
  latitude: number;
  longitude: number;
} {
  // 1 degree ≈ 111km = 111000 meters
  const degreeOffset = distanceMeters / 111000;

  // Random angle
  const angle = Math.random() * 2 * Math.PI;

  // Calculate offset
  const latOffset = degreeOffset * Math.cos(angle);
  const lonOffset =
    (degreeOffset * Math.sin(angle)) / Math.cos((BASE_LAT * Math.PI) / 180);

  return {
    latitude: BASE_LAT + latOffset,
    longitude: BASE_LON + lonOffset,
  };
}

// Random placeholder image generator
function getRandomPlaceholderImage(
  gender: 'male' | 'female',
  seed: number
): string {
  // Using UI Avatars as placeholder - generates random avatars based on name
  // Alternative services: RandomUser.me, Pravatar.cc, UIFaces.com
  const backgrounds = [
    '8b5cf6',
    'ec4899',
    '3b82f6',
    '10b981',
    'f59e0b',
    'ef4444',
  ];
  const bgColor = backgrounds[seed % backgrounds.length];

  // Using a more diverse set of placeholder images
  if (gender === 'female') {
    const femaleImages = [
      `https://i.pravatar.cc/400?img=${44 + seed}`, // pravatar female images
      `https://randomuser.me/api/portraits/women/${seed + 1}.jpg`,
      `https://xsgames.co/randomusers/assets/avatars/female/${seed}.jpg`,
    ];
    return femaleImages[seed % femaleImages.length];
  } else {
    const maleImages = [
      `https://i.pravatar.cc/400?img=${10 + seed}`, // pravatar male images
      `https://randomuser.me/api/portraits/men/${seed + 1}.jpg`,
      `https://xsgames.co/randomusers/assets/avatars/male/${seed}.jpg`,
    ];
    return maleImages[seed % maleImages.length];
  }
}

// Mock user data - All distances in METERS
// Filter range: 50m-5000m (configured in FilterModal.tsx)
// These users are spread from 50m to 900m for testing
const mockUsers = [
  {
    name: 'Sarah',
    age: 25,
    gender: 'female' as const,
    lookingFor: 'male' as const,
    bio: 'Love hiking and beach volleyball 🏐',
    interests: ['Sports', 'Nature', 'Travel', 'Music'],
    height: 168,
    distanceMeters: 50, // 50m away - minimum filter distance
  },
  {
    name: 'Yael',
    age: 23,
    gender: 'female' as const,
    lookingFor: 'male' as const,
    bio: 'Foodie and coffee enthusiast ☕',
    interests: ['Food', 'Photography', 'Art', 'Music'],
    height: 165,
    distanceMeters: 150, // 150m away
  },
  {
    name: 'Maya',
    age: 27,
    gender: 'female' as const,
    lookingFor: 'male' as const,
    bio: 'Yoga instructor & wellness coach 🧘‍♀️',
    interests: ['Fitness', 'Nature', 'Wellness', 'Meditation'],
    height: 170,
    distanceMeters: 300, // 300m away
  },
  {
    name: 'Noa',
    age: 24,
    gender: 'female' as const,
    lookingFor: 'male' as const,
    bio: 'Tech enthusiast and gamer 🎮',
    interests: ['Gaming', 'Technology', 'Movies', 'Anime'],
    height: 162,
    distanceMeters: 500, // 500m away
  },
  {
    name: 'Tamar',
    age: 26,
    gender: 'female' as const,
    lookingFor: 'male' as const,
    bio: 'Artist and dreamer 🎨',
    interests: ['Art', 'Music', 'Theater', 'Photography'],
    height: 172,
    distanceMeters: 750, // 750m away
  },
  {
    name: 'Dan',
    age: 28,
    gender: 'male' as const,
    lookingFor: 'female' as const,
    bio: 'Entrepreneur and adventure seeker 🚀',
    interests: ['Business', 'Travel', 'Sports', 'Technology'],
    height: 180,
    distanceMeters: 100, // 100m away
  },
  {
    name: 'Ori',
    age: 26,
    gender: 'male' as const,
    lookingFor: 'female' as const,
    bio: 'Music producer and DJ 🎧',
    interests: ['Music', 'Nightlife', 'Travel', 'Art'],
    height: 178,
    distanceMeters: 250, // 250m away
  },
  {
    name: 'Avi',
    age: 29,
    gender: 'male' as const,
    lookingFor: 'female' as const,
    bio: 'Chef and food lover 👨‍🍳',
    interests: ['Food', 'Cooking', 'Wine', 'Travel'],
    height: 182,
    distanceMeters: 400, // 400m away
  },
  {
    name: 'Tom',
    age: 25,
    gender: 'male' as const,
    lookingFor: 'female' as const,
    bio: 'Software engineer and book nerd 📚',
    interests: ['Technology', 'Reading', 'Gaming', 'Science'],
    height: 175,
    distanceMeters: 600, // 600m away
  },
  {
    name: 'Eitan',
    age: 27,
    gender: 'male' as const,
    lookingFor: 'female' as const,
    bio: 'Fitness trainer and sports enthusiast 💪',
    interests: ['Fitness', 'Sports', 'Health', 'Nature'],
    height: 185,
    distanceMeters: 900, // 900m away
  },
];

async function createMockUser(userData: (typeof mockUsers)[0], index: number) {
  const email = `mock${index + 1}@meetbridge.test`;
  const password = 'Test1234!';

  try {
    console.log(`\n🔄 Creating user: ${userData.name}...`);

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const userId = userCredential.user.uid;

    console.log(`✅ Auth user created: ${userId}`);

    // Generate location near base coordinates
    const location = generateNearbyLocation(userData.distanceMeters);
    // Use precision 9 for ~4.8m accuracy (highest accuracy for matching)
    const geohash = geohashForLocation(
      [location.latitude, location.longitude],
      9
    );

    console.log(`📍 Generated location for ${userData.name}:`, {
      coords: {
        lat: location.latitude.toFixed(6),
        lon: location.longitude.toFixed(6),
      },
      targetDistanceMeters: userData.distanceMeters,
      geohash,
      geohashPrecision: 9,
    });

    // Calculate date of birth from age
    const today = new Date();
    const birthYear = today.getFullYear() - userData.age;
    const dateOfBirth = new Date(birthYear, 0, 1);

    // Generate random placeholder image
    const placeholderImage = getRandomPlaceholderImage(userData.gender, index);

    // Create Firestore document
    const userDoc = {
      id: userId,
      email,
      name: userData.name,
      displayName: userData.name,
      age: userData.age,
      dateOfBirth,
      gender: userData.gender,
      lookingFor: userData.lookingFor,
      bio: userData.bio,
      interests: userData.interests,
      height: userData.height,
      image: placeholderImage,
      images: [placeholderImage],
      location: 'Tel Aviv, Israel',
      coordinates: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      geohash,
      preferences: {
        ageRange: [18, 35],
        maxDistance: 1000, // 1km in METERS (within 50m-5000m filter range)
        interestedIn: userData.lookingFor,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      isOnline: true,
      notificationsEnabled: true,
      pushToken: '',
    };

    await setDoc(doc(db, 'users', userId), userDoc);

    console.log(`✅ Firestore doc created for: ${userData.name}`);
    console.log(
      `   📍 Location: ${location.latitude.toFixed(
        6
      )}, ${location.longitude.toFixed(6)}`
    );
    console.log(
      `   📏 Distance: ~${userData.distanceMeters}m (~${(
        userData.distanceMeters / 1000
      ).toFixed(1)}km) from base`
    );
    console.log(`   �️  Image: ${placeholderImage}`);
    console.log(`   �📧 Email: ${email} | Password: ${password}`);

    return { success: true, email, password, userId };
  } catch (error: any) {
    console.error(`❌ Error creating ${userData.name}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function generateAllMockUsers() {
  console.log('🚀 Starting mock user generation...');
  console.log(`📍 Base location: ${BASE_LAT}, ${BASE_LON} (Tel Aviv area)\n`);

  const results = [];

  for (let i = 0; i < mockUsers.length; i++) {
    const result = await createMockUser(mockUsers[i], i);
    results.push(result);

    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n\n📊 Summary:');
  console.log('='.repeat(50));
  const successful = results.filter((r) => r.success).length;
  console.log(
    `✅ Successfully created: ${successful}/${mockUsers.length} users`
  );

  if (successful > 0) {
    console.log('\n📝 Login credentials for all mock users:');
    console.log('Email format: mock[1-10]@meetbridge.test');
    console.log('Password: Test1234!');

    console.log('\n📏 Distance Configuration (ALL IN METERS):');
    console.log('Filter range: 50m - 5000m');
    console.log(
      `Mock users spread: ${Math.min(
        ...mockUsers.map((u) => u.distanceMeters)
      )}m - ${Math.max(...mockUsers.map((u) => u.distanceMeters))}m`
    );
    console.log('User preferences maxDistance: 1000m');
    console.log('✅ All users are within discoverable range!');
  }

  process.exit(0);
}

// Run the script
generateAllMockUsers().catch(console.error);
