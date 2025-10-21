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

//FIX: fix slider range in filter modal to 5-500m
//FIX: move save of edit profile modal in the bottom after all fields
//FIX: add popup on filter button "Set your filters to discover people nearby" will happen only once at registeration level
//FIX: notification only to target user not to all users
//FIX: notification sound (optional)

//TODO: toggle button show my status online/offline to others users everywhere (connection and in chat)
//TODO: is discovery search show online users only toggle on
//TODO: add search by name in connections tab

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

// Base location - Will be set from user input or default to Kriyat Ono
let BASE_LAT = 32.053783; // Default: Kriyat Ono
let BASE_LON = 34.858582; // Default: Kriyat Ono

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
  locationName: string = 'Kriyat Ono, Israel'
) {
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
    // Use precision 10 for ~1.2m accuracy (ULTRA HIGH PRECISION for 5-500m range)
    // Precision 10 provides:
    // - Excellent accuracy (±1.2m) - perfect for very close proximity matching
    // - Essential for 5-500m distance range
    // - Ultra granular location tracking
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

    console.log(`📍 Generated location for ${userData.name}:`, {
      coords: {
        lat: location.latitude.toFixed(6),
        lon: location.longitude.toFixed(6),
      },
      targetDistanceMeters: userData.distanceMeters,
      actualDistanceMeters: actualDistance,
      deviation: Math.abs(actualDistance - userData.distanceMeters) + 'm',
      geohash,
      geohashPrecision: 10,
      geohashAccuracy: '±1.2m',
    });

    // Calculate date of birth from age
    const today = new Date();
    const birthYear = today.getFullYear() - userData.age;
    const dateOfBirth = new Date(birthYear, 0, 1);

    // Generate multiple random placeholder images (2-5 images per user)
    const imageCount = Math.floor(Math.random() * 4) + 2; // Random 2-5 images
    const placeholderImages: string[] = [];

    for (let imgIndex = 0; imgIndex < imageCount; imgIndex++) {
      const img = getRandomPlaceholderImage(
        userData.gender,
        index * 10 + imgIndex
      );
      placeholderImages.push(img);
    }

    // Ensure the main 'image' field is always the first image in the 'images' array
    const placeholderImage = placeholderImages[0]; // Main image (first in array)

    // Create Firestore document
    const userDoc = {
      id: userId,
      email,
      name: userData.name, // Removed duplicate: displayName
      age: userData.age,
      dateOfBirth,
      gender: userData.gender,
      bio: userData.bio,
      interests: userData.interests,
      height: userData.height,
      image: placeholderImage, // First image (images[0])
      images: placeholderImages, // Full array including the first image
      location: locationName, // Use dynamic location name
      coordinates: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      geohash,
      preferences: {
        ageRange: [18, 99],
        maxDistance: 500, // 500m in METERS (matches new 5-500m range)
        interestedIn: userData.interestedIn, // Removed duplicate: lookingFor (using preferences.interestedIn)
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

// Function to get location from user
async function getUserLocation(): Promise<{
  lat: number;
  lon: number;
  locationName: string;
}> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log('\n📍 Location Setup for Mock Users');
    console.log('='.repeat(50));
    console.log('You can either:');
    console.log(
      '  1. Use your CURRENT device location (requires location services)'
    );
    console.log('  2. Enter coordinates manually');
    console.log('  3. Use default Kriyat Ono location');
    console.log('');

    rl.question('Choose option (1/2/3) [default: 3]: ', (answer) => {
      const choice = answer.trim() || '3';

      if (choice === '1') {
        console.log(
          '\n⚠️ Note: This script runs in Node.js and cannot access device location.'
        );
        console.log('Please use option 2 to enter your coordinates manually.');
        console.log(
          'You can find your coordinates at: https://www.latlong.net/\n'
        );

        rl.question('Enter latitude (e.g., 32.053783): ', (lat) => {
          rl.question('Enter longitude (e.g., 34.858582): ', (lon) => {
            rl.question('Enter location name (e.g., Kriyat Ono): ', (name) => {
              rl.close();
              const latitude = parseFloat(lat.trim());
              const longitude = parseFloat(lon.trim());

              if (isNaN(latitude) || isNaN(longitude)) {
                console.log('❌ Invalid coordinates, using Kriyat Ono default');
                resolve({
                  lat: 32.053783,
                  lon: 34.858582,
                  locationName: 'Kriyat Ono, Israel',
                });
              } else {
                resolve({
                  lat: latitude,
                  lon: longitude,
                  locationName: name.trim() || 'Custom Location',
                });
              }
            });
          });
        });
      } else if (choice === '2') {
        console.log(
          '\nEnter your coordinates (you can find them at https://www.latlong.net/)\n'
        );

        rl.question('Enter latitude (e.g., 32.053783): ', (lat) => {
          rl.question('Enter longitude (e.g., 34.858582): ', (lon) => {
            rl.question('Enter location name (e.g., Kriyat Ono): ', (name) => {
              rl.close();
              const latitude = parseFloat(lat.trim());
              const longitude = parseFloat(lon.trim());

              if (isNaN(latitude) || isNaN(longitude)) {
                console.log('❌ Invalid coordinates, using Kriyat Ono default');
                resolve({
                  lat: 32.053783,
                  lon: 34.858582,
                  locationName: 'Kriyat Ono, Israel',
                });
              } else {
                console.log(`✅ Using coordinates: ${latitude}, ${longitude}`);
                resolve({
                  lat: latitude,
                  lon: longitude,
                  locationName: name.trim() || 'Custom Location',
                });
              }
            });
          });
        });
      } else {
        rl.close();
        console.log('✅ Using default Kriyat Ono location');
        resolve({
          lat: 32.053783,
          lon: 34.858582,
          locationName: 'Kriyat Ono, Israel',
        });
      }
    });
  });
}

async function generateAllMockUsers() {
  console.log('🚀 Starting mock user generation...');
  console.log('');
  console.log(
    '📍 IMPORTANT: Make sure to choose option 3 (default) to use Kriyat Ono coordinates!'
  );
  console.log('   This ensures users are created near your actual location.');
  console.log('');

  // Get user's preferred location
  const userLocation = await getUserLocation();
  BASE_LAT = userLocation.lat;
  BASE_LON = userLocation.lon;

  console.log('\n📍 Base Location Configuration:');
  console.log(`   Latitude: ${BASE_LAT}`);
  console.log(`   Longitude: ${BASE_LON}`);
  console.log(`   Location: ${userLocation.locationName}`);
  console.log(
    `   Base Geohash (precision 10): ${geohashForLocation(
      [BASE_LAT, BASE_LON],
      10
    )}`
  );
  console.log(
    `   Note: All mock users will be generated within 500m of this location`
  );
  console.log('');

  const results = [];

  // Step 1: Create users
  for (let i = 0; i < mockUsers.length; i++) {
    const result = await createMockUser(
      mockUsers[i],
      i,
      userLocation.locationName
    );
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
    console.log('Filter range: 5m - 500m');
    console.log(
      `Mock users spread: ${Math.min(
        ...mockUsers.map((u) => u.distanceMeters)
      )}m - ${Math.max(...mockUsers.map((u) => u.distanceMeters))}m`
    );
    console.log('User preferences maxDistance: 500m');
    console.log('✅ All users are within the 500m discoverable range!');
    console.log('🎯 Geohash precision: 10 (±1.2m accuracy)');
    console.log(
      '🔍 Make sure your app queries with geohash precision 8-9 for 500m range'
    );

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
