import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  he: {
    translation: {
      tabs: {
        discover: 'אהבתי',
        search: 'חיפוש',
        chat: 'צ\'אטים'
      },
      discover: {
        title: 'גילוי'
      },
      search: {
        title: 'חיפוש'
      },
      chat: {
        title: 'צ\'אטים'
      }
    }
  },
  en: {
    translation: {
      tabs: {
        discover: 'Liked',
        search: 'Search',
        chat: 'Chats'
      },
      discover: {
        title: 'Discover'
      },
      search: {
        title: 'Search'
      },
      chat: {
        title: 'Chats'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'he', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;