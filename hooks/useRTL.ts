import { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Updates from 'expo-updates';

/**
 * Hook to handle RTL/LTR layout direction
 * Hebrew = RTL, English = LTR
 */
export const useRTL = () => {
  const { i18n } = useTranslation();
  const [isRTL, setIsRTL] = useState(i18n.language === 'he');

  useEffect(() => {
    const currentIsRTL = i18n.language === 'he';
    setIsRTL(currentIsRTL);

    // Update React Native's RTL setting
    if (I18nManager.isRTL !== currentIsRTL) {
      I18nManager.forceRTL(currentIsRTL);
      I18nManager.allowRTL(currentIsRTL);

      // Alert user that app needs to reload for RTL to take effect
      if (__DEV__) {
        console.log(`RTL changed to: ${currentIsRTL}. App reload recommended.`);
      }
    }
  }, [i18n.language]);

  const changeLanguage = async (lng: 'en' | 'he') => {
    const newIsRTL = lng === 'he';

    // Change language
    await i18n.changeLanguage(lng);

    // Force RTL if needed
    if (I18nManager.isRTL !== newIsRTL) {
      I18nManager.forceRTL(newIsRTL);
      I18nManager.allowRTL(newIsRTL);

      // Reload the app for RTL changes to take effect
      try {
        await Updates.reloadAsync();
      } catch (error) {
        console.warn('Could not reload app:', error);
        // Fallback: just update state
        setIsRTL(newIsRTL);
      }
    }
  };

  return {
    isRTL,
    isHebrew: i18n.language === 'he',
    isEnglish: i18n.language === 'en',
    currentLanguage: i18n.language as 'en' | 'he',
    changeLanguage,
    direction: isRTL ? 'rtl' : 'ltr',
  };
};
