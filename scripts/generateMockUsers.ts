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
import * as readline from 'readline';

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

// Base location - Will be set from user input or default to Petah Tikva
let BASE_LAT = 32.081271689366034; // Default: Petah Tikva
let BASE_LON = 34.89067520447793; // Default: Petah Tikva

// Helper function to generate random location near base
// Now supports creating realistic clusters around popular spots
function generateNearbyLocation(
  distanceMeters: number,
  clustering: boolean = true
): {
  latitude: number;
  longitude: number;
} {
  // Add random variation to distance (±15%) for more realistic placement
  // This prevents everyone being at exactly 5m, 10m, etc.
  const variation = 0.15; // 15% variation
  const randomFactor = 1 + (Math.random() - 0.5) * 2 * variation;
  const actualDistance = distanceMeters * randomFactor;

  // 1 degree ≈ 111km = 111000 meters
  const degreeOffset = actualDistance / 111000;

  let angle: number;

  if (clustering) {
    // Create clusters: 70% chance to be in 4 main directions (N, S, E, W)
    // representing popular areas like cafes, parks, etc.
    const clusterChance = Math.random();
    if (clusterChance < 0.7) {
      // Cluster around 4 main directions
      const directions = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]; // N, E, S, W
      const baseDirection = directions[Math.floor(Math.random() * 4)];
      // Add some randomness (±30 degrees)
      angle = baseDirection + (Math.random() - 0.5) * (Math.PI / 6);
    } else {
      // Random direction for variety
      angle = Math.random() * 2 * Math.PI;
    }
  } else {
    // Completely random angle
    angle = Math.random() * 2 * Math.PI;
  }

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
  // Using a more diverse set of placeholder images
  // Each service has different image IDs to maximize variety
  if (gender === 'female') {
    const femaleImages = [
      `https://i.pravatar.cc/400?img=${44 + (seed % 25)}`, // pravatar female images (44-68)
      `https://randomuser.me/api/portraits/women/${(seed % 96) + 1}.jpg`, // randomuser (1-96)
      `https://xsgames.co/randomusers/assets/avatars/female/${seed % 78}.jpg`, // xsgames (0-77)
    ];
    // Distribute seed across different services for variety
    const serviceIndex = Math.floor(seed / 30) % 3;
    return femaleImages[serviceIndex];
  } else {
    const maleImages = [
      `https://i.pravatar.cc/400?img=${10 + (seed % 33)}`, // pravatar male images (10-42)
      `https://randomuser.me/api/portraits/men/${(seed % 96) + 1}.jpg`, // randomuser (1-96)
      `https://xsgames.co/randomusers/assets/avatars/male/${seed % 78}.jpg`, // xsgames (0-77)
    ];
    // Distribute seed across different services for variety
    const serviceIndex = Math.floor(seed / 30) % 3;
    return maleImages[serviceIndex];
  }
}

// Mock user data - All distances in METERS
// Filter range: 50m-5000m (configured in FilterModal.tsx)
// Wide spread of distances for comprehensive filter testing: 50m to 4500m
const mockUsers = [
  {
    name: 'שרה',
    age: 25,
    gender: 'female' as const,
    interestedIn: 'male' as const,
    bio: 'אוהבת טיולים וקרבסט בים 🏐',
    interests: ['ספורט', 'טבע', 'טיולים', 'מוזיקה'],
    height: 168,
    distanceMeters: 5, // 5m away - very close!
  },
  {
    name: 'יעל',
    age: 23,
    gender: 'female' as const,
    interestedIn: 'male' as const,
    bio: 'חובבת אוכל וקפה ☕',
    interests: ['אוכל', 'צילום', 'אמנות', 'מוזיקה'],
    height: 165,
    distanceMeters: 25, // 25m away
  },
  {
    name: 'מאיה',
    age: 27,
    gender: 'female' as const,
    interestedIn: 'male' as const,
    bio: 'מדריכת יוגה ומאמנת בריאות 🧘‍♀️',
    interests: ['כושר', 'טבע', 'בריאות', 'מדיטציה'],
    height: 170,
    distanceMeters: 50, // 50m away
  },
  {
    name: 'נועה',
    age: 24,
    gender: 'female' as const,
    interestedIn: 'male' as const,
    bio: 'חובבת טכנולוגיה וגיימרית 🎮',
    interests: ['גיימינג', 'טכנולוגיה', 'סרטים', 'אנימה'],
    height: 162,
    distanceMeters: 100, // 100m away
  },
  {
    name: 'תמר',
    age: 26,
    gender: 'female' as const,
    interestedIn: 'male' as const,
    bio: 'אמנית וחולמת 🎨',
    interests: ['אמנות', 'מוזיקה', 'תיאטרון', 'צילום'],
    height: 172,
    distanceMeters: 200, // 200m away
  },
  {
    name: 'דן',
    age: 28,
    gender: 'male' as const,
    interestedIn: 'female' as const,
    bio: 'יזם וחובב הרפתקאות 🚀',
    interests: ['עסקים', 'טיולים', 'ספורט', 'טכנולוגיה'],
    height: 180,
    distanceMeters: 10, // 10m away - very close!
  },
  {
    name: 'אורי',
    age: 26,
    gender: 'male' as const,
    interestedIn: 'female' as const,
    bio: 'מפיק מוזיקה ודי ג׳יי 🎧',
    interests: ['מוזיקה', 'חיי לילה', 'טיולים', 'אמנות'],
    height: 178,
    distanceMeters: 75, // 75m away
  },
  {
    name: 'אבי',
    age: 29,
    gender: 'male' as const,
    interestedIn: 'female' as const,
    bio: 'שף וחובב אוכל 👨‍🍳',
    interests: ['אוכל', 'בישול', 'יין', 'טיולים'],
    height: 182,
    distanceMeters: 150, // 150m away
  },
  {
    name: 'תום',
    age: 25,
    gender: 'male' as const,
    interestedIn: 'female' as const,
    bio: 'מהנדס תוכנה וחובב ספרים 📚',
    interests: ['טכנולוגיה', 'קריאה', 'גיימינג', 'מדע'],
    height: 175,
    distanceMeters: 300, // 300m away
  },
  {
    name: 'איתן',
    age: 27,
    gender: 'male' as const,
    interestedIn: 'female' as const,
    bio: 'מאמן כושר וחובב ספורט 💪',
    interests: ['כושר', 'ספורט', 'בריאות', 'טבע'],
    height: 185,
    distanceMeters: 500, // 500m away - max distance
  },
  {
    name: 'יוסי',
    age: 30,
    gender: 'male' as const,
    interestedIn: 'female' as const,
    bio: 'צלם מקצועי ומטייל בעולם 📸',
    interests: ['צילום', 'טיולים', 'אמנות', 'טבע'],
    height: 178,
    distanceMeters: 15, // 15m away
  },
  {
    name: 'רון',
    age: 24,
    gender: 'male' as const,
    interestedIn: 'female' as const,
    bio: 'סטודנט למדעי המחשב וגיימר 🎮',
    interests: ['גיימינג', 'טכנולוגיה', 'מדע', 'אנימה'],
    height: 172,
    distanceMeters: 35, // 35m away
  },
  {
    name: 'עומר',
    age: 29,
    gender: 'male' as const,
    interestedIn: 'female' as const,
    bio: 'מוזיקאי וחובב ג׳אז 🎷',
    interests: ['מוזיקה', 'ג׳אז', 'אמנות', 'חיי לילה'],
    height: 180,
    distanceMeters: 80, // 80m away
  },
  {
    name: 'גל',
    age: 26,
    gender: 'male' as const,
    interestedIn: 'female' as const,
    bio: 'חובב אוכל ומבקר מסעדות 🍽️',
    interests: ['אוכל', 'בישול', 'יין', 'טיולים'],
    height: 176,
    distanceMeters: 120, // 120m away
  },
  {
    name: 'ניר',
    age: 31,
    gender: 'male' as const,
    interestedIn: 'female' as const,
    bio: 'רופא וחובב ריצה 🏃‍♂️',
    interests: ['כושר', 'ריצה', 'בריאות', 'מדע'],
    height: 183,
    distanceMeters: 180, // 180m away
  },
  {
    name: 'אלון',
    age: 28,
    gender: 'male' as const,
    interestedIn: 'female' as const,
    bio: 'יזם טכנולוגי ומשקיע 💼',
    interests: ['עסקים', 'טכנולוגיה', 'השקעות', 'חדשנות'],
    height: 179,
    distanceMeters: 250, // 250m away
  },
  {
    name: 'שי',
    age: 25,
    gender: 'male' as const,
    interestedIn: 'female' as const,
    bio: 'חובב סרטים וקולנוע 🎬',
    interests: ['סרטים', 'קולנוע', 'תיאטרון', 'אמנות'],
    height: 174,
    distanceMeters: 400, // 400m away
  },
  {
    name: 'ליאור',
    age: 27,
    gender: 'male' as const,
    interestedIn: 'female' as const,
    bio: 'מדריך טיולים וחובב הרפתקאות 🗺️',
    interests: ['טיולים', 'הרפתקאות', 'טבע', 'צילום'],
    height: 181,
    distanceMeters: 45, // 45m away
  },
  {
    name: 'דור',
    age: 29,
    gender: 'male' as const,
    interestedIn: 'female' as const,
    bio: 'אדריכל ומעצב פנים 🏗️',
    interests: ['אדריכלות', 'עיצוב', 'אמנות', 'חדשנות'],
    height: 177,
    distanceMeters: 90, // 90m away
  },
];

// Mock posts data - will be created by random users
const mockPosts = [
  {
    description:
      "ראיתי אותך קורא את 'הגטסבי הגדול' בבית הקפה היום ☕📚. עשינו קשר עיניים וחייכנו. מת על לדבר על ספרים!",
    tags: ['ספרים', 'קפה', 'פגישה'],
    locationIcon: '☕',
    locationName: 'קפה נואר',
  },
  {
    description:
      'מופע ריקוד מטורף בפסטיבל הרחוב היום! 💃🎵 האנרגיה הייתה פשוט מדהימה. מישהו אחר היה שם?',
    tags: ['ריקוד', 'פסטיבל', 'מוזיקה'],
    locationIcon: '🎪',
    locationName: 'כיכר העיר',
  },
  {
    description:
      'שקיעה מדהימה בחוף 🌅 חלקתי רגע עם מישהו מיוחד. מקווה שניפגש שוב!',
    tags: ['חוף', 'שקיעה', 'רומנטיקה'],
    locationIcon: '🏖️',
    locationName: 'חוף הים',
  },
  {
    description:
      'יציאה לפיצה באמצע הלילה 🍕 צחקתי כל כך מהבדיחות שלך. המפגש הכי מגניב שהיה לי!',
    tags: ['אוכל', 'חיי לילה', 'מצחיק'],
    locationIcon: '🍕',
    locationName: 'פיצה פרדייז',
  },
  {
    description:
      'יוגה בבוקר בפארק 🧘‍♀️ אווירה כל כך רגועה. תפסתי אותך מסתכל עליי כמה פעמים 😊',
    tags: ['יוגה', 'פארק', 'בריאות'],
    locationIcon: '🌳',
    locationName: 'פארק העיר',
  },
  {
    description:
      'נתקלתי בך בחנות הספרים 📖 שנינו הלכנו לאותו ספר! גורל או מה? 😄',
    tags: ['ספרים', 'גורל', 'קריאה'],
    locationIcon: '📚',
    locationName: 'הספרייה העירונית',
  },
  {
    description:
      'קשר עיניים מטורף ברכבת 🚊 התחנה שלי הגיעה יותר מדי מהר. עדיין חושב על זה...',
    tags: ['רכבת', 'נסיעה', 'פספסתי'],
    locationIcon: '🚊',
    locationName: 'תחנת הרכבת',
  },
];

// Mock comments for posts
const mockComments = [
  'זה אני! מת על להתחבר שוב! 😊',
  'אני חושב שראיתי אותך שם גם!',
  'סיפור מקסים, מקווה שתמצא אותו! ❤️',
  'זה כל כך חמוד!',
  'בהצלחה! 🍀',
  'זה היה אתמול?',
  'הייתי שם גם! אווירה מטורפת!',
  'מקווה שזה יצליח לך!',
  'אוהב את זה! עדכן אותנו 😍',
  'שולח אנרגיות טובות! ✨',
];

async function createMockUser(
  userData: (typeof mockUsers)[0],
  index: number,
  locationName: string = 'Petah Tikva, Israel'
) {
  const email = `mock${index + 1}@meetbridge.test`;
  const password = 'Test1234!';

  try {
    console.log(
      `\n🔄 Creating user ${index + 1}/${mockUsers.length}: ${userData.name}...`
    );

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const userId = userCredential.user.uid;

    console.log(`✅ Auth user created: ${userId}`);

    // Generate location near base coordinates with clustering for realism
    // Users closer than 1km use clustering (simulating popular spots)
    const useClustering = userData.distanceMeters < 1000;
    const location = generateNearbyLocation(
      userData.distanceMeters,
      useClustering
    );
    // Use precision 10 for ~1.2m accuracy (ULTRA HIGH PRECISION for 5-500m range)
    const geohash = geohashForLocation(
      [location.latitude, location.longitude],
      10
    );

    // Verify actual distance for debugging
    const actualDistance = Math.round(
      Math.sqrt(
        Math.pow((location.latitude - BASE_LAT) * 111000, 2) +
          Math.pow(
            (location.longitude - BASE_LON) *
              111000 *
              Math.cos((BASE_LAT * Math.PI) / 180),
            2
          )
      )
    );

    console.log(
      `   📍 Location: ${location.latitude.toFixed(
        6
      )}, ${location.longitude.toFixed(6)}`
    );
    console.log(
      `   📏 Target: ${
        userData.distanceMeters
      }m | Actual: ${actualDistance}m (±${Math.abs(
        actualDistance - userData.distanceMeters
      )}m)`
    );

    // Calculate date of birth from age
    const today = new Date();
    const birthYear = today.getFullYear() - userData.age;
    const dateOfBirth = new Date(birthYear, 0, 1);

    // Generate multiple random placeholder images (2-5 images per user)
    const imageCount = Math.floor(Math.random() * 4) + 2;
    const placeholderImages: string[] = [];

    for (let imgIndex = 0; imgIndex < imageCount; imgIndex++) {
      const img = getRandomPlaceholderImage(
        userData.gender,
        index * 10 + imgIndex
      );
      placeholderImages.push(img);
    }

    const placeholderImage = placeholderImages[0];

    // Create Firestore document with all required fields
    const userDoc = {
      id: userId,
      email,
      name: userData.name,
      age: userData.age,
      dateOfBirth,
      gender: userData.gender,
      bio: userData.bio,
      interests: userData.interests,
      height: userData.height,
      image: placeholderImage,
      images: placeholderImages,
      location: locationName,
      coordinates: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      geohash,
      preferences: {
        ageRange: [18, 99],
        maxDistance: 500, // 500m in METERS
        interestedIn: userData.interestedIn,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      isOnline: true,
      notificationsEnabled: true,
      pushToken: '',
      isProfileComplete: true,
      hasSeenTutorial: false,
      settings: {
        notifications: {
          pushEnabled: true,
          messageNotifications: true,
          matchNotifications: true,
        },
        privacy: {
          showOnlineStatus: true,
          locationSharing: true,
          profileVisibility: 'public',
          dataSharing: true,
        },
        appearance: {
          language: 'en',
          theme: 'system',
        },
      },
    };

    await setDoc(doc(db, 'users', userId), userDoc);

    console.log(`   ✅ ${userData.name} created successfully!`);

    return {
      success: true,
      email,
      password,
      userId,
      userName: userData.name,
      userImage: placeholderImage,
    };
  } catch (error: any) {
    console.error(`   ❌ Error creating ${userData.name}:`, error.message);
    // Check if it's a duplicate email error
    if (error.code === 'auth/email-already-in-use') {
      console.log(`   ℹ️  User ${email} already exists, skipping...`);
    }
    return { success: false, error: error.message };
  }
}

// Create mock posts
async function createMockPosts(
  users: Array<{ userId: string; userName: string; userImage: string }>
) {
  console.log('\n\n📝 Creating mock posts...');
  const createdPosts: string[] = [];

  // Create 500 posts by repeating the mockPosts array
  const targetPosts = 500;
  const postsToCreate = Math.max(targetPosts, mockPosts.length);

  for (let i = 0; i < postsToCreate; i++) {
    const postData = mockPosts[i % mockPosts.length]; // Cycle through available posts
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
        timeOccurred: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ), // Random time in last 30 days
        createdAt: serverTimestamp(),
        likes: Math.floor(Math.random() * 50), // Random likes 0-49
        likedBy: [],
        views: Math.floor(Math.random() * 100), // Random views 0-99
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
      if ((i + 1) % 50 === 0) {
        console.log(`✅ Created ${i + 1}/${postsToCreate} posts...`);
      }
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

// Function to get location from user - simplified
async function getUserLocation(): Promise<{
  lat: number;
  lon: number;
  locationName: string;
}> {
  // Check for command line arguments for auto mode
  const args = process.argv.slice(2);
  const autoMode = args.includes('--auto') || args.includes('-y');
  const useCurrentUser = args.includes('--current') || args.includes('-c');

  // If --current flag is used, try to fetch current user's location
  if (useCurrentUser) {
    console.log('🔍 Attempting to fetch current user location...');
    try {
      // Prompt for user ID
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const userId = await new Promise<string>((resolve) => {
        rl.question('Enter your user ID: ', (id) => {
          rl.close();
          resolve(id.trim());
        });
      });

      if (userId) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.location?.coordinates) {
            console.log('✅ Found user location!');
            return {
              lat: userData.location.coordinates.latitude,
              lon: userData.location.coordinates.longitude,
              locationName: userData.location.city || 'Your Location',
            };
          }
        }
      }
      console.log('⚠️  Could not fetch user location, using default...');
    } catch (error) {
      console.log('⚠️  Error fetching user location, using default...');
    }
  }

  if (autoMode) {
    console.log('✅ Auto mode: Using default Petah Tikva location');
    return {
      lat: 32.081271689366034,
      lon: 34.89067520447793,
      locationName: 'Petah Tikva, Israel',
    };
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log('\n📍 Location Setup for Mock Users');
    console.log('='.repeat(50));
    console.log('Options:');
    console.log('  1. Enter custom coordinates');
    console.log('  2. Use default Petah Tikva location (Press Enter)');
    console.log('  3. Fetch from your user profile (use --current flag)');
    console.log('');

    rl.question('Choose option (1/2) [default: 2]: ', (answer) => {
      const choice = answer.trim() || '2';

      if (choice === '1') {
        console.log(
          '\nEnter your coordinates (find them at https://www.latlong.net/)\n'
        );

        rl.question('Enter latitude (e.g., 32.081271): ', (lat) => {
          rl.question('Enter longitude (e.g., 34.890675): ', (lon) => {
            rl.question(
              'Enter location name (e.g., Petah Tikva, Israel): ',
              (name) => {
                rl.close();
                const latitude = parseFloat(lat.trim());
                const longitude = parseFloat(lon.trim());

                if (isNaN(latitude) || isNaN(longitude)) {
                  console.log(
                    '❌ Invalid coordinates, using Petah Tikva default'
                  );
                  resolve({
                    lat: 32.081271689366034,
                    lon: 34.89067520447793,
                    locationName: 'Petah Tikva, Israel',
                  });
                } else {
                  console.log(
                    `✅ Using coordinates: ${latitude}, ${longitude}`
                  );
                  resolve({
                    lat: latitude,
                    lon: longitude,
                    locationName: name.trim() || 'Custom Location',
                  });
                }
              }
            );
          });
        });
      } else {
        rl.close();
        console.log('✅ Using default Petah Tikva location');
        resolve({
          lat: 32.081271689366034,
          lon: 34.89067520447793,
          locationName: 'Petah Tikva, Israel',
        });
      }
    });
  });
}

async function generateAllMockUsers() {
  console.log('🚀 Starting Mock User Generation');
  console.log('='.repeat(50));

  // Get user's preferred location
  const userLocation = await getUserLocation();
  BASE_LAT = userLocation.lat;
  BASE_LON = userLocation.lon;

  console.log('\n📍 Base Location:');
  console.log(`   Latitude: ${BASE_LAT}`);
  console.log(`   Longitude: ${BASE_LON}`);
  console.log(`   Location: ${userLocation.locationName}`);
  console.log(`   Geohash: ${geohashForLocation([BASE_LAT, BASE_LON], 10)}`);
  // Create users - 25 women and 25 men
  const targetUsers = 50;
  const womenCount = 25;
  const menCount = 25;

  // Separate male and female templates
  const femaleTemplates = mockUsers.filter((user) => user.gender === 'female');
  const maleTemplates = mockUsers.filter((user) => user.gender === 'male');

  const usersToCreate = [];

  // Create 25 women
  for (let i = 0; i < womenCount; i++) {
    const templateIndex = i % femaleTemplates.length;
    const baseUser = femaleTemplates[templateIndex];

    // Create variation for repeated users
    const variation = Math.floor(i / femaleTemplates.length);
    const variedUser = {
      ...baseUser,
      name: variation > 0 ? `${baseUser.name}${variation}` : baseUser.name,
      age: baseUser.age + Math.floor(Math.random() * 5) - 2, // ±2 years variation
      distanceMeters:
        baseUser.distanceMeters + Math.floor(Math.random() * 100) - 50, // ±50m variation
    };

    usersToCreate.push(variedUser);
  }

  // Create 25 men
  for (let i = 0; i < menCount; i++) {
    const templateIndex = i % maleTemplates.length;
    const baseUser = maleTemplates[templateIndex];

    // Create variation for repeated users
    const variation = Math.floor(i / maleTemplates.length);
    const variedUser = {
      ...baseUser,
      name: variation > 0 ? `${baseUser.name}${variation}` : baseUser.name,
      age: baseUser.age + Math.floor(Math.random() * 5) - 2, // ±2 years variation
      distanceMeters:
        baseUser.distanceMeters + Math.floor(Math.random() * 100) - 50, // ±50m variation
    };

    usersToCreate.push(variedUser);
  }

  console.log(
    `📊 Creating ${usersToCreate.length} mock users (${womenCount} women, ${menCount} men)...\n`
  );

  const results = [];

  // Step 1: Create users with progress tracking
  for (let i = 0; i < usersToCreate.length; i++) {
    const result = await createMockUser(
      usersToCreate[i],
      i,
      userLocation.locationName
    );
    results.push(result);

    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 GENERATION SUMMARY');
  console.log('='.repeat(50));

  const successful = results.filter((r) => r.success).length;
  const failed = results.length - successful;

  console.log(
    `✅ Successfully created: ${successful}/${mockUsers.length} users`
  );
  if (failed > 0) {
    console.log(`⚠️  Failed: ${failed} users`);
  }

  if (successful > 0) {
    console.log('\n📝 Login Credentials:');
    console.log('   Email: mock[1-50]@meetbridge.test');
    console.log('   Password: Test1234!');

    console.log('\n📏 Distance Configuration:');
    console.log('   Filter range: 5m - 500m');
    console.log(
      `   Users spread: ${Math.min(
        ...mockUsers.map((u) => u.distanceMeters)
      )}m - ${Math.max(...mockUsers.map((u) => u.distanceMeters))}m`
    );
    console.log('   Geohash precision: 10 (±1.2m accuracy)');

    // Step 2: Create posts
    console.log('\n\n� Creating mock posts and comments...\n');
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

      console.log('\n' + '='.repeat(50));
      console.log('🎉 COMPLETE!');
      console.log('='.repeat(50));
      console.log(`✅ ${successful} users created`);
      console.log(`✅ ${postIds.length} posts created`);
      console.log(`✅ Comments added to posts`);
      console.log('\n🚀 Mock data is ready to use!');
    }
  } else {
    console.log('\n❌ No users were created successfully.');
    console.log('Please check the errors above and try again.');
  }

  process.exit(0);
}

// Run the script with error handling
generateAllMockUsers().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
