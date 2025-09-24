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
        chat: 'Chat',
      },

      // Search Screen
      search: {
        title: 'Discover People',
        searchingPerfectMatch: 'Searching for the perfect match...',
        searching: 'Searching...',
        newSearch: 'New Search',
        loading: 'Loading...',
        distance: 'm',
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

      // Filter Modal
      filter: {
        title: 'Search Distance',
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
      },
    },
  },
};

// Language detection and persistence (English only)
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    callback('en'); // Always default to English
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    // No-op since we only support English
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default and only language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
