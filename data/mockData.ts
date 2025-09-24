import { User, ChatMessage } from '../store/types';
import { DATING_CONSTANTS } from '../constants';

// Mock Profile Images (replace with backend image URLs)
export const MOCK_PROFILE_IMAGES = [
  'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=300',
] as const;

// Realistic user profiles with consistent data structure
export const MOCK_USERS_DATABASE = [
  {
    id: 'user_001',
    firstName: 'Emma',
    lastName: 'Johnson',
    age: 28,
    email: 'emma.johnson@email.com',
    bio: 'Love exploring new places and trying different cuisines. Looking for someone who shares my passion for adventure and good conversations.',
    interests: ['Travel', 'Photography', 'Cooking', 'Hiking'],
    location: 'New York City',
    profession: 'Marketing Manager',
    education: "Bachelor's in Marketing",
    image:
      'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: 'user_002',
    firstName: 'Michael',
    lastName: 'Chen',
    age: 32,
    email: 'michael.chen@email.com',
    bio: 'Software engineer who loves building cool apps and playing guitar in my free time. Always up for a coffee and great conversation.',
    interests: ['Technology', 'Music', 'Coffee', 'Gaming'],
    location: 'San Francisco',
    profession: 'Software Engineer',
    education: "Master's in Computer Science",
    image:
      'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: 'user_003',
    firstName: 'Sarah',
    lastName: 'Davis',
    age: 26,
    email: 'sarah.davis@email.com',
    bio: 'Fitness enthusiast and yoga instructor. I believe in living a healthy, balanced lifestyle. Looking for someone who values wellness.',
    interests: ['Fitness', 'Yoga', 'Meditation', 'Health'],
    location: 'Los Angeles',
    profession: 'Yoga Instructor',
    education: 'Certified Yoga Teacher',
    image:
      'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: 'user_004',
    firstName: 'James',
    lastName: 'Wilson',
    age: 30,
    email: 'james.wilson@email.com',
    bio: 'Architect passionate about sustainable design. Weekend warrior who loves cycling and exploring local farmers markets.',
    interests: ['Architecture', 'Cycling', 'Sustainability', 'Design'],
    location: 'Seattle',
    profession: 'Architect',
    education: "Master's in Architecture",
    image:
      'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: 'user_005',
    firstName: 'Jessica',
    lastName: 'Martinez',
    age: 29,
    email: 'jessica.martinez@email.com',
    bio: 'Creative writer and book lover. I spend my days crafting stories and my evenings getting lost in a good novel. Dog lover too!',
    interests: ['Writing', 'Reading', 'Literature', 'Dogs'],
    location: 'Austin',
    profession: 'Content Writer',
    education: "Bachelor's in English Literature",
    image:
      'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: 'user_006',
    firstName: 'David',
    lastName: 'Thompson',
    age: 35,
    email: 'david.thompson@email.com',
    bio: "Doctor working in emergency medicine. High-energy person who loves rock climbing and outdoor adventures when I'm not saving lives.",
    interests: ['Medicine', 'Rock Climbing', 'Outdoors', 'Emergency Response'],
    location: 'Denver',
    profession: 'Emergency Room Doctor',
    education: 'MD from Johns Hopkins',
    image:
      'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: 'user_007',
    firstName: 'Amanda',
    lastName: 'Garcia',
    age: 27,
    email: 'amanda.garcia@email.com',
    bio: 'Elementary school teacher who loves inspiring young minds. In my free time, I enjoy painting, dancing, and volunteering at the animal shelter.',
    interests: ['Teaching', 'Painting', 'Dancing', 'Volunteering'],
    location: 'Miami',
    profession: 'Elementary School Teacher',
    education: "Bachelor's in Education",
    image:
      'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: 'user_008',
    firstName: 'Ryan',
    lastName: 'Anderson',
    age: 31,
    email: 'ryan.anderson@email.com',
    bio: 'Entrepreneur building the next big app. Love trying new restaurants, playing basketball, and discussing business ideas over a good beer.',
    interests: ['Entrepreneurship', 'Basketball', 'Food', 'Business'],
    location: 'Chicago',
    profession: 'Startup Founder',
    education: 'MBA from Northwestern',
    image:
      'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
] as const;

// Mock Chat Messages for initial conversations
export const MOCK_CHAT_MESSAGES = [
  'Hey! How are you? Nice to meet you!',
  'Wow, looks like we have a lot in common!',
  'Hi! I saw you love {interest}, me too!',
  'Hello! How was your day?',
  'Hey! Hope we can get to know each other better',
  'Really nice to meet you!',
  'Hi! How are you? Any plans for the weekend?',
  'Wow, we have so much in common! How are you?',
  'Hello! Nice to see we matched!',
  "Hey! How's it going? What's up?",
] as const;

// Utility function to generate random mock user data from the database
export const generateMockUser = (id?: string): User => {
  // Pick a random user from the database or create a new one
  const dbUser = id
    ? MOCK_USERS_DATABASE.find((u) => u.id === id)
    : MOCK_USERS_DATABASE[
        Math.floor(Math.random() * MOCK_USERS_DATABASE.length)
      ];

  if (dbUser) {
    const genders = DATING_CONSTANTS.GENDERS;
    const gender = genders[Math.floor(Math.random() * genders.length)];

    return {
      id: dbUser.id,
      name: `${dbUser.firstName} ${dbUser.lastName}`,
      age: dbUser.age,
      image: dbUser.image,
      bio: dbUser.bio,
      interests: [...dbUser.interests], // Convert readonly array to mutable array
      location: dbUser.location,
      distance: Math.floor(Math.random() * 50) + 1, // 1-50 km
      isOnline: Math.random() > 0.7, // 30% online
      lastSeen: new Date(Date.now() - Math.random() * 86400000), // Last 24 hours
      gender,
      preferences: {
        ageRange: [
          Math.max(18, dbUser.age - 10),
          Math.min(80, dbUser.age + 10),
        ],
        maxDistance: Math.floor(Math.random() * 50) + 25, // 25-75 km
        interestedIn:
          Math.random() > 0.5
            ? 'both'
            : Math.random() > 0.5
            ? 'male'
            : 'female',
      },
    };
  }

  // Fallback: create completely random user if database user not found
  const names = [
    'Alex Johnson',
    'Taylor Smith',
    'Jordan Brown',
    'Casey Wilson',
  ];
  const name = names[Math.floor(Math.random() * names.length)];
  const age = Math.floor(Math.random() * 25) + 20;
  const image =
    MOCK_PROFILE_IMAGES[Math.floor(Math.random() * MOCK_PROFILE_IMAGES.length)];
  const locations = ['Boston', 'Portland', 'Nashville', 'Phoenix'];
  const location = locations[Math.floor(Math.random() * locations.length)];
  const allInterests = [
    'Music',
    'Sports',
    'Travel',
    'Food',
    'Art',
    'Technology',
  ];
  const interests = allInterests
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.floor(Math.random() * 4) + 2);

  const genders = DATING_CONSTANTS.GENDERS;
  const gender = genders[Math.floor(Math.random() * genders.length)];

  return {
    id:
      id ||
      `user_random_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    age,
    image,
    bio: 'Looking for meaningful connections and great conversations!',
    interests,
    location,
    distance: Math.floor(Math.random() * 50) + 1,
    isOnline: Math.random() > 0.7,
    lastSeen: new Date(Date.now() - Math.random() * 86400000),
    gender,
    preferences: {
      ageRange: [Math.max(18, age - 10), Math.min(80, age + 10)],
      maxDistance: Math.floor(Math.random() * 50) + 25,
      interestedIn:
        Math.random() > 0.5 ? 'both' : Math.random() > 0.5 ? 'male' : 'female',
    },
  };
};

// Generate multiple mock users from database
export const generateMockUsers = (count: number): User[] => {
  const users: User[] = [];
  const usedIds = new Set<string>();

  // First, try to add database users with unique IDs
  for (let i = 0; i < Math.min(count, MOCK_USERS_DATABASE.length); i++) {
    const dbUser = MOCK_USERS_DATABASE[i];
    // Create a unique ID for each generated user instance
    const uniqueId = `${dbUser.id}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Generate user based on database user but with unique ID
    const user = generateMockUser(dbUser.id);
    user.id = uniqueId;

    users.push(user);
    usedIds.add(uniqueId);
  }

  // If we need more users than in database, generate random ones with safety limit
  let attempts = 0;
  const maxAttempts = count * 10; // Safety limit to prevent infinite loops

  while (users.length < count && attempts < maxAttempts) {
    const randomUser = generateMockUser();
    if (!usedIds.has(randomUser.id)) {
      users.push(randomUser);
      usedIds.add(randomUser.id);
    }
    attempts++;
  }

  return users.slice(0, count);
};

// Generate mock chat message
export const generateMockChatMessage = (
  senderId: string,
  interests?: string[]
): ChatMessage => {
  let messageTemplate: string =
    MOCK_CHAT_MESSAGES[Math.floor(Math.random() * MOCK_CHAT_MESSAGES.length)];

  // Replace {interest} placeholder with actual interest if available
  if (
    interests &&
    interests.length > 0 &&
    messageTemplate.includes('{interest}')
  ) {
    const randomInterest =
      interests[Math.floor(Math.random() * interests.length)];
    messageTemplate = messageTemplate.replace('{interest}', randomInterest);
  }

  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    senderId,
    text: messageTemplate,
    timestamp: new Date(),
    isRead: false,
  };
};
