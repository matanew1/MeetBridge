import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resources = {
  en: {
    translation: {
      // Navigation & Tabs
      tabs: {
        discover: 'Liked',
        search: 'Search',
        connections: 'Connections',
        chat: 'Chat',
      },

      // Search Screen
      search: {
        title: 'Discover People',
        searchingPerfectMatch: 'Searching for nearby profiles...',
        searching: 'Searching...',
        newSearch: 'New Search',
        loading: 'Loading...',
        distance: 'm',
        noProfiles: 'No profiles available. Try adjusting your filters.',
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
        loading: 'Loading...',
        online: 'Online now',
        offline: 'Offline',
        messageInputPlaceholder: 'Write a message...',
        viewProfile: 'View Profile',
        unmatch: 'Unmatch',
        unmatchTitle: 'Unmatch',
        unmatchConfirm:
          'Are you sure you want to unmatch {{name}}? This cannot be undone.',
        newMatch: "It's a match! Say hi 👋",
        unmatchDetected: 'This conversation has ended.',
      },

      // Loved/Liked Screen
      loved: {
        title: 'Matches & Likes',
        matches: 'Matches',
        liked: 'You Liked',
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

      // Filter Modal
      filter: {
        title: 'Search Filters',
        apply: 'Apply',
        upTo: 'Up to',
        meters: 'm',
      },

      // Settings & Theme
      settings: {
        title: 'Settings',
        language: 'Language',
        theme: 'Theme',
        darkMode: 'Dark Mode',
        lightMode: 'Light Mode',
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
        cancel: 'Cancel',
        unmatch: 'Unmatch',
      },
    },
  },
  he: {
    translation: {
      // Navigation & Tabs
      tabs: {
        discover: 'אהבתי',
        search: 'חיפוש',
        connections: 'קשרים',
        chat: "צ'אט",
      },

      // Search Screen
      search: {
        title: 'גלה אנשים',
        searchingPerfectMatch: 'מחפש את ההתאמה המושלמת...',
        searching: 'מחפש...',
        newSearch: 'חיפוש חדש',
        loading: 'טוען...',
        distance: "מ'",
        noProfiles: 'אין פרופילים זמינים. נסה לשנות את הפילטרים.',
      },

      // Chat Screen
      chat: {
        title: 'שיחות',
        noConversations: 'אין שיחות עדיין',
        startMatching: 'התחל להכיר אנשים חדשים',
        chatsCount: 'שיחות',
        now: 'עכשיו',
        minutes: "דק'",
        hours: 'שעות',
        yesterday: 'אתמול',
        days: 'ימים',
        loading: 'טוען...',
        online: 'מחובר עכשיו',
        offline: 'לא מחובר',
        messageInputPlaceholder: 'כתוב הודעה...',
        viewProfile: 'צפה בפרופיל',
        unmatch: 'בטל התאמה',
        unmatchTitle: 'בטל התאמה',
        unmatchConfirm:
          'האם אתה בטוח שברצונך לבטל התאמה עם {{name}}? לא ניתן לבטל פעולה זו.',
        newMatch: 'יש התאמה! אמור שלום 👋',
        unmatchDetected: 'השיחה הזו הסתיימה.',
      },

      // Profile Screen
      profile: {
        title: 'פרופיל',
        interests: 'תחומי עניין',
        bio: 'אודות',
        unmatch: 'בטל התאמה',
        report: 'דווח',
        block: 'חסום',
      },

      // Connections Screen
      connections: {
        title: 'קשרים',
        matches: 'התאמות',
        posts: 'פוסטים',
        noMatches: 'אין התאמות עדיין',
        startSwiping: 'התחל להחליק כדי למצוא התאמות',
        noPosts: 'אין פוסטים עדיין',
        createPost: 'צור את הפוסט הראשון שלך',
      },

      // Modals
      modals: {
        unmatchTitle: 'בטל התאמה',
        unmatchText:
          'האם אתה בטוח שברצונך לבטל התאמה? פעולה זו תמחק גם את השיחה ולא ניתן לבטלה.',
        confirmUnmatch: 'בטל התאמה',
        matchTitle: '!יש התאמה',
        matchText: 'שניכם אהבתם אחד את השני',
        startChatting: 'התחל לשוחח',
      },

      // Filter Modal
      filter: {
        title: 'פילטרי חיפוש',
        apply: 'החל',
        upTo: 'עד',
        meters: "מ'",
      },

      // Settings & Theme
      settings: {
        title: 'הגדרות',
        language: 'שפה',
        theme: 'ערכת נושא',
        darkMode: 'מצב כהה',
        lightMode: 'מצב בהיר',
        notifications: 'התראות',
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
        cancel: 'ביטול',
        unmatch: 'בטל התאמה',
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
      const savedLanguage = await AsyncStorage.getItem('user-language');
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'he')) {
        callback(savedLanguage);
      } else {
        callback('en'); // Default to English
      }
    } catch (error) {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem('user-language', lng);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    supportedLngs: ['en', 'he'],
    interpolation: {
      escapeValue: false,
    },
  });

// Helper to check if current language is RTL
export const isRTL = () => i18n.language === 'he';

// Helper to change language and update RTL
export const changeLanguage = async (lng: 'en' | 'he') => {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem('user-language', lng);
};

export default i18n;
