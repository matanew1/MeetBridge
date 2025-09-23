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

// Mock Names (replace with backend user data)
export const MOCK_NAMES = [
  'שרה',
  'רחל',
  'לאה',
  'מרים',
  'רבקה',
  'דינה',
  'יעל',
  'תמר',
  'דוד',
  'שלמה',
  'יוסף',
  'אברהם',
  'יצחק',
  'יעקב',
  'משה',
  'אהרן',
  'דניאל',
  'יונתן',
  'מיכל',
  'נועה',
  'אסתר',
  'רות',
  'חנה',
  'שמואל',
] as const;

// Mock Interests/Hobbies (replace with backend categories)
export const MOCK_INTERESTS = [
  'צילום',
  'מוזיקה',
  'ספורט',
  'בישול',
  'נסיעות',
  'קריאה',
  'אמנות',
  'טכנולוגיה',
  'יוגה',
  'ריקוד',
  'סרטים',
  'משחקים',
  'טבע',
  'אופנה',
  'פילוסופיה',
  'חדר כושר',
  'מדעים',
  'היסטוריה',
  'שחייה',
  'ריצה',
  'גינון',
  'מדיטציה',
] as const;

// Mock Bio Templates
export const MOCK_BIO_TEMPLATES = [
  'אוהב/ת לגלות מקומות חדשים ולפגוש אנשים מעניינים',
  'אוהב/ת לבלות עם חברים ומשפחה',
  'מחפש/ת מישהו לשתף איתו את החיים',
  'אוהב/ת לצאת למסעדות ולהופעות',
  'אוהב/ת ספורט ופעילות גופנית',
  'אוהב/ת אמנות ותרבות',
  'אוהב/ת טבע וטיולים',
] as const;

// Mock Cities/Locations (replace with real location data)
export const MOCK_LOCATIONS = [
  'תל אביב',
  'ירושלים',
  'חיפה',
  'ראשון לציון',
  'פתח תקווה',
  'אשדוד',
  'נתניה',
  'באר שבע',
  'בני ברק',
  'חולון',
  'רמת גן',
  'בת ים',
] as const;

// Mock Chat Messages for initial conversations
export const MOCK_CHAT_MESSAGES = [
  'היי! איך אתה? נחמד להכיר!',
  'וואו, נראה שיש לנו הרבה במשותף!',
  'היי! ראיתי שאת אוהבת {interest}, גם אני!',
  'שלום! איך היום שלך?',
  'היי! מקווה שנוכל להכיר יותר',
  'נחמד מאוד להכיר אותך!',
  'היי! איך אתה? יש לך תוכניות לסוף השבוע?',
  'וואו, יש לנו המון במשותף! איך אתה?',
  'שלום! נחמד לראות שיש לנו התאמה',
  'היי! איך הולך? מה המצב?',
] as const;

// Utility function to generate random mock user data
export const generateMockUser = (id?: string): User => {
  const name = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
  const age = Math.floor(Math.random() * 25) + 20; // 20-44 years old
  const image =
    MOCK_PROFILE_IMAGES[Math.floor(Math.random() * MOCK_PROFILE_IMAGES.length)];
  const location =
    MOCK_LOCATIONS[Math.floor(Math.random() * MOCK_LOCATIONS.length)];
  const interests = MOCK_INTERESTS.sort(() => 0.5 - Math.random()).slice(
    0,
    Math.floor(Math.random() * 5) + 2
  ); // 2-6 interests

  const bioTemplate =
    MOCK_BIO_TEMPLATES[Math.floor(Math.random() * MOCK_BIO_TEMPLATES.length)];
  const genders = DATING_CONSTANTS.GENDERS;
  const gender = genders[Math.floor(Math.random() * genders.length)];

  return {
    id: id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    age,
    image,
    bio: bioTemplate,
    interests,
    location,
    distance: Math.floor(Math.random() * 50) + 1, // 1-50 km
    isOnline: Math.random() > 0.7, // 30% online
    lastSeen: new Date(Date.now() - Math.random() * 86400000), // Last 24 hours
    gender,
    preferences: {
      ageRange: [Math.max(18, age - 10), Math.min(80, age + 10)],
      maxDistance: Math.floor(Math.random() * 50) + 25, // 25-75 km
      interestedIn:
        Math.random() > 0.5 ? 'both' : Math.random() > 0.5 ? 'male' : 'female',
    },
  };
};

// Generate multiple mock users
export const generateMockUsers = (count: number): User[] => {
  return Array.from({ length: count }, () => generateMockUser());
};

// Generate mock chat message
export const generateMockChatMessage = (
  senderId: string,
  interests?: string[]
): ChatMessage => {
  let messageTemplate =
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
