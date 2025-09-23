import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resources = {
  he: {
    translation: {
      // Navigation & Tabs
      tabs: {
        discover: 'אהבתי',
        search: 'חיפוש',
        chat: "צ'אט",
      },

      // Search Screen
      search: {
        title: 'גלה אנשים',
        searchingPerfectMatch: 'מחפש את ההתאמה המושלמת...',
        searching: 'מחפש...',
        newSearch: 'חיפוש חדש',
        loading: 'טוען...',
        distance: 'ק"מ',
      },

      // Chat Screen
      chat: {
        title: "צ'אטים",
        noConversations: 'אין לך עדיין שיחות',
        startMatching: 'התחל להכיר אנשים חדשים',
        chatsCount: "צ'אטים",
        now: 'עכשיו',
        minutes: 'דק',
        hours: 'שעות',
        yesterday: 'אתמול',
        days: 'ימים',
      },

      // Loved/Liked Screen
      loved: {
        title: 'התאמות ולייקים',
        matches: 'התאמות',
        liked: 'לייקים',
        noMatches: 'אין התאמות עדיין',
        noLiked: 'אין לייקים עדיין',
        startSwiping: 'התחל לסוייפ כדי למצוא התאמות',
        keepSwiping: 'המשך לסוייפ כדי למצוא אנשים שתאהב',
        message: 'הודעה',
        unmatch: 'בטל התאמה',
        personLiked: 'אדם שאהבתי',
        peopleLiked: 'אנשים שאהבתי',
        oneMatch: 'התאמה',
        multipleMatches: 'התאמות',
      },

      // Profile Detail
      profile: {
        title: 'פרופיל',
        interests: 'תחומי עניין',
        about: 'אודות',
        location: 'מיקום',
        age: 'גיל',
        distance: 'מרחק',
        sendMessage: 'שלח הודעה',
        like: 'לייק',
        pass: 'עבור',
        unmatch: 'בטל התאמה',
      },

      // Actions & Buttons
      actions: {
        like: 'אהבתי',
        dislike: 'לא אהבתי',
        message: 'הודעה',
        close: 'סגור',
        cancel: 'ביטול',
        confirm: 'אישור',
        save: 'שמור',
        edit: 'עריכה',
        delete: 'מחק',
        back: 'חזור',
        next: 'הבא',
        skip: 'דלג',
        done: 'סיום',
      },

      // Modals & Confirmations
      modals: {
        unmatchTitle: 'בטל התאמה',
        unmatchText:
          'האם אתה בטוח שברצונך לבטל את ההתאמה? פעולה זו תמחק גם את השיחה ביניכם ולא תוכל לשחזר אותה.',
        confirmUnmatch: 'בטל התאמה',
        matchTitle: 'זו התאמה!',
        matchText: 'שניכם אוהבים אחד את השני',
        startChatting: 'התחילו לשוחח',
      },

      // Settings & Theme
      settings: {
        title: 'הגדרות',
        language: 'שפה',
        theme: 'נושא',
        darkMode: 'מצב כהה',
        lightMode: 'מצב בהיר',
        hebrew: 'עברית',
        english: 'English',
        notifications: 'הודעות',
        privacy: 'פרטיות',
        help: 'עזרה',
        about: 'אודות',
        logout: 'התנתק',
      },

      // Common
      common: {
        loading: 'טוען...',
        error: 'שגיאה',
        retry: 'נסה שוב',
        noData: 'אין נתונים',
        comingSoon: 'בקרוב',
        ok: 'אישור',
        yes: 'כן',
        no: 'לא',
      },
    },
  },
  en: {
    translation: {
      // Navigation & Tabs
      tabs: {
        discover: 'Liked',
        search: 'Search',
        chat: 'Chat',
      },

      // Search Screen
      search: {
        title: 'Discover People',
        searchingPerfectMatch: 'Searching for the perfect match...',
        searching: 'Searching...',
        newSearch: 'New Search',
        loading: 'Loading...',
        distance: 'km',
      },

      // Chat Screen
      chat: {
        title: 'Chats',
        noConversations: 'No conversations yet',
        startMatching: 'Start meeting new people',
        chatsCount: 'Chats',
        now: 'now',
        minutes: 'min',
        hours: 'hrs',
        yesterday: 'yesterday',
        days: 'days',
      },

      // Loved/Liked Screen
      loved: {
        title: 'Matches & Likes',
        matches: 'Matches',
        liked: 'Liked',
        noMatches: 'No matches yet',
        noLiked: 'No likes yet',
        startSwiping: 'Start swiping to find matches',
        keepSwiping: 'Keep swiping to find people you like',
        message: 'Message',
        unmatch: 'Unmatch',
        personLiked: 'person liked',
        peopleLiked: 'people liked',
        oneMatch: 'match',
        multipleMatches: 'matches',
      },

      // Profile Detail
      profile: {
        title: 'Profile',
        interests: 'Interests',
        about: 'About',
        location: 'Location',
        age: 'Age',
        distance: 'Distance',
        sendMessage: 'Send Message',
        like: 'Like',
        pass: 'Pass',
        unmatch: 'Unmatch',
      },

      // Actions & Buttons
      actions: {
        like: 'Like',
        dislike: 'Dislike',
        message: 'Message',
        close: 'Close',
        cancel: 'Cancel',
        confirm: 'Confirm',
        save: 'Save',
        edit: 'Edit',
        delete: 'Delete',
        back: 'Back',
        next: 'Next',
        skip: 'Skip',
        done: 'Done',
      },

      // Modals & Confirmations
      modals: {
        unmatchTitle: 'Unmatch',
        unmatchText:
          'Are you sure you want to unmatch? This will also delete your conversation and cannot be undone.',
        confirmUnmatch: 'Unmatch',
        matchTitle: "It's a Match!",
        matchText: 'You both like each other',
        startChatting: 'Start Chatting',
      },

      // Settings & Theme
      settings: {
        title: 'Settings',
        language: 'Language',
        theme: 'Theme',
        darkMode: 'Dark Mode',
        lightMode: 'Light Mode',
        hebrew: 'עברית',
        english: 'English',
        notifications: 'Notifications',
        privacy: 'Privacy',
        help: 'Help',
        about: 'About',
        logout: 'Logout',
      },

      // Common
      common: {
        loading: 'Loading...',
        error: 'Error',
        retry: 'Try Again',
        noData: 'No Data',
        comingSoon: 'Coming Soon',
        ok: 'OK',
        yes: 'Yes',
        no: 'No',
      },
    },
  },
};

// Language detection and persistence
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage) {
        callback(savedLanguage);
      } else {
        callback('he'); // Default to Hebrew
      }
    } catch (error) {
      console.error('Error loading language:', error);
      callback('he');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem('language', lng);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'he', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
