import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
  getDoc,
} from 'firebase/firestore';
import { geohashForLocation } from 'geofire-common';

//TODO: remove unused fields
//TODO: add to mock more images to view them later
//TODO: when unmatch remove the chats in both users
//TODO: add view images
//TODO: fix height not to be 170 cm default
//TODO: on match make sure image occur in both users animations
//TODO: notification for message received
//TODO: when there is a chat already  - dont show the default text "it's a match! say hi", show the last message that received
//TODO: make sure everything is LTR on english and RTL on hebrew
//TODO: when there is a suggestion for email, dont skip fields that has already value ( jump to password  field)
//TODO: add zodiac sign
//TODO: toggle button switch offline/online
//TODO: add edit and delete only my posts in missed connections
//TODO: add search by name in connections tab
//TODO: when user login it is reseting to default values (User, 170 and etc...)

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
// Precise distances: 5m, 10m, 20m, 50m, 100m, 200m, 500m, 1000m for accurate testing
const mockUsers = [
  {
    name: 'Sarah',
    age: 25,
    gender: 'female' as const,
    lookingFor: 'male' as const,
    bio: 'Love hiking and beach volleyball 🏐',
    interests: ['Sports', 'Nature', 'Travel', 'Music'],
    height: 168,
    distanceMeters: 5, // 5m away - ultra close!
  },
  {
    name: 'Yael',
    age: 23,
    gender: 'female' as const,
    lookingFor: 'male' as const,
    bio: 'Foodie and coffee enthusiast ☕',
    interests: ['Food', 'Photography', 'Art', 'Music'],
    height: 165,
    distanceMeters: 10, // 10m away
  },
  {
    name: 'Maya',
    age: 27,
    gender: 'female' as const,
    lookingFor: 'male' as const,
    bio: 'Yoga instructor & wellness coach 🧘‍♀️',
    interests: ['Fitness', 'Nature', 'Wellness', 'Meditation'],
    height: 170,
    distanceMeters: 20, // 20m away
  },
  {
    name: 'Noa',
    age: 24,
    gender: 'female' as const,
    lookingFor: 'male' as const,
    bio: 'Tech enthusiast and gamer 🎮',
    interests: ['Gaming', 'Technology', 'Movies', 'Anime'],
    height: 162,
    distanceMeters: 50, // 50m away - minimum filter distance
  },
  {
    name: 'Tamar',
    age: 26,
    gender: 'female' as const,
    lookingFor: 'male' as const,
    bio: 'Artist and dreamer 🎨',
    interests: ['Art', 'Music', 'Theater', 'Photography'],
    height: 172,
    distanceMeters: 100, // 100m away
  },
  {
    name: 'Dan',
    age: 28,
    gender: 'male' as const,
    lookingFor: 'female' as const,
    bio: 'Entrepreneur and adventure seeker 🚀',
    interests: ['Business', 'Travel', 'Sports', 'Technology'],
    height: 180,
    distanceMeters: 10, // 10m away
  },
  {
    name: 'Ori',
    age: 26,
    gender: 'male' as const,
    lookingFor: 'female' as const,
    bio: 'Music producer and DJ 🎧',
    interests: ['Music', 'Nightlife', 'Travel', 'Art'],
    height: 178,
    distanceMeters: 20, // 20m away
  },
  {
    name: 'Avi',
    age: 29,
    gender: 'male' as const,
    lookingFor: 'female' as const,
    bio: 'Chef and food lover 👨‍🍳',
    interests: ['Food', 'Cooking', 'Wine', 'Travel'],
    height: 182,
    distanceMeters: 200, // 200m away
  },
  {
    name: 'Tom',
    age: 25,
    gender: 'male' as const,
    lookingFor: 'female' as const,
    bio: 'Software engineer and book nerd 📚',
    interests: ['Technology', 'Reading', 'Gaming', 'Science'],
    height: 175,
    distanceMeters: 500, // 500m away
  },
  {
    name: 'Eitan',
    age: 27,
    gender: 'male' as const,
    lookingFor: 'female' as const,
    bio: 'Fitness trainer and sports enthusiast 💪',
    interests: ['Fitness', 'Sports', 'Health', 'Nature'],
    height: 185,
    distanceMeters: 1000, // 1000m away (1km)
  },
];

// Mock posts data - will be created by random users
const mockPosts = [
  {
    description:
      "Saw someone reading 'The Great Gatsby' at the coffee shop today ☕📚. We made eye contact and smiled. Would love to chat about books!",
    tags: ['books', 'coffee', 'meeting'],
    locationIcon: '☕',
    locationName: 'Cafe Noir',
  },
  {
    description:
      'Amazing dance performance at the street festival today! 💃🎵 The energy was incredible. Anyone else there?',
    tags: ['dance', 'festival', 'music'],
    locationIcon: '🎪',
    locationName: 'Rothschild Boulevard',
  },
  {
    description:
      'Beautiful sunset at the beach 🌅 Shared a moment with someone special. Hope to see you again!',
    tags: ['beach', 'sunset', 'romance'],
    locationIcon: '🏖️',
    locationName: 'Tel Aviv Beach',
  },
  {
    description:
      'Late night pizza run 🍕 Laughed so hard at the jokes. Best random encounter ever!',
    tags: ['food', 'nightlife', 'funny'],
    locationIcon: '🍕',
    locationName: 'Pizza Paradise',
  },
  {
    description:
      'Morning yoga in the park 🧘‍♀️ Peaceful vibes. Caught your eye a few times 😊',
    tags: ['yoga', 'park', 'wellness'],
    locationIcon: '🌳',
    locationName: 'Yarkon Park',
  },
  {
    description:
      'Bumped into you at the bookstore 📖 We were reaching for the same book! Fate? 😄',
    tags: ['books', 'fate', 'reading'],
    locationIcon: '📚',
    locationName: 'Central Library',
  },
  {
    description:
      'That eye contact on the train 🚊 My stop came too soon. Still thinking about it...',
    tags: ['train', 'commute', 'missed'],
    locationIcon: '🚊',
    locationName: 'Light Rail Station',
  },
];

// Mock comments for posts
const mockComments = [
  'That was me! Would love to reconnect! 😊',
  'I think I saw you there too!',
  'Beautiful story, hope you find them! ❤️',
  'This is so sweet!',
  'Good luck! 🍀',
  'Was this yesterday?',
  'I was there too! Amazing vibe!',
  'Hope this works out for you!',
  'Love this! Keep us updated 😍',
  'Sending positive vibes! ✨',
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

    return {
      success: true,
      email,
      password,
      userId,
      userName: userData.name,
      userImage: placeholderImage,
    };
  } catch (error: any) {
    console.error(`❌ Error creating ${userData.name}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Create mock posts
async function createMockPosts(
  users: Array<{ userId: string; userName: string; userImage: string }>
) {
  console.log('\n\n📝 Creating mock posts...');
  const createdPosts: string[] = [];

  for (let i = 0; i < mockPosts.length; i++) {
    const postData = mockPosts[i];
    const randomUser = users[Math.floor(Math.random() * users.length)];

    // Generate location near base
    const location = generateNearbyLocation(Math.random() * 500); // Within 500m

    try {
      const connectionData = {
        userId: randomUser.userId,
        userName: randomUser.userName,
        userImage: randomUser.userImage,
        location: {
          lat: location.latitude,
          lng: location.longitude,
          landmark: postData.locationName,
          category: 'general',
          icon: postData.locationIcon,
        },
        description: postData.description,
        tags: postData.tags,
        timeOccurred: new Date(),
        createdAt: serverTimestamp(),
        likes: Math.floor(Math.random() * 10), // Random likes 0-9
        likedBy: [],
        views: Math.floor(Math.random() * 20), // Random views 0-19
        viewedBy: [],
        claims: 0,
        comments: 0,
        claimed: false,
        verified: true,
        isAnonymous: false,
        isEdited: false,
      };

      const docRef = await addDoc(
        collection(db, 'missed_connections'),
        connectionData
      );

      createdPosts.push(docRef.id);
      console.log(
        `✅ Post ${i + 1}/${mockPosts.length} created by ${randomUser.userName}`
      );
    } catch (error: any) {
      console.error(`❌ Error creating post ${i + 1}:`, error.message);
    }

    // Small delay
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return createdPosts;
}

// Create mock comments on posts
async function createMockComments(
  postIds: string[],
  users: Array<{ userId: string; userName: string; userImage: string }>
) {
  console.log('\n\n💬 Creating mock comments...');
  let totalComments = 0;

  for (const postId of postIds) {
    // Random number of comments per post (1-4)
    const numComments = Math.floor(Math.random() * 4) + 1;

    for (let i = 0; i < numComments; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomComment =
        mockComments[Math.floor(Math.random() * mockComments.length)];

      try {
        const commentData = {
          connectionId: postId,
          userId: randomUser.userId,
          userName: randomUser.userName,
          userImage: randomUser.userImage,
          text: randomComment,
          createdAt: serverTimestamp(),
        };

        await addDoc(
          collection(db, 'missed_connections', postId, 'comments'),
          commentData
        );

        // Update comment count
        const connectionRef = doc(db, 'missed_connections', postId);
        const connectionDoc = await getDoc(connectionRef);
        const currentComments = connectionDoc.data()?.comments || 0;
        await setDoc(
          connectionRef,
          { comments: currentComments + 1 },
          { merge: true }
        );

        totalComments++;
      } catch (error: any) {
        console.error(`❌ Error creating comment:`, error.message);
      }
    }
  }

  console.log(
    `✅ Created ${totalComments} comments across ${postIds.length} posts`
  );
}

async function generateAllMockUsers() {
  console.log('🚀 Starting mock user generation...');
  console.log(`📍 Base location: ${BASE_LAT}, ${BASE_LON} (Tel Aviv area)\n`);

  const results = [];

  // Step 1: Create users
  for (let i = 0; i < mockUsers.length; i++) {
    const result = await createMockUser(mockUsers[i], i);
    results.push(result);

    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n\n📊 User Creation Summary:');
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

    // Step 2: Create posts
    const successfulUsers = results
      .filter((r) => r.success)
      .map((r) => ({
        userId: r.userId!,
        userName: r.userName!,
        userImage: r.userImage!,
      }));

    if (successfulUsers.length > 0) {
      const postIds = await createMockPosts(successfulUsers);

      // Step 3: Create comments
      if (postIds.length > 0) {
        await createMockComments(postIds, successfulUsers);
      }

      console.log('\n\n🎉 All Done!');
      console.log('='.repeat(50));
      console.log(`✅ Created ${successful} users`);
      console.log(`✅ Created ${postIds.length} posts`);
      console.log(`✅ Comments added to posts`);
    }
  }

  process.exit(0);
}

// Run the script
generateAllMockUsers().catch(console.error);
