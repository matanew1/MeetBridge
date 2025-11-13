import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
} from 'react-native';
import { ChevronLeft, Globe, Check } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import { Card } from '../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../store/types';
import { changeLanguage } from '../../i18n';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
} from '../../utils/responsive';

interface LanguageSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (settings: Partial<User['settings']>) => void;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

// Available languages
const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
];

interface LanguageItemProps {
  language: LanguageOption;
  isSelected: boolean;
  onSelect: () => void;
}

const LanguageItem: React.FC<LanguageItemProps> = ({
  language,
  isSelected,
  onSelect,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <TouchableOpacity
      style={[
        styles.languageItem,
        {
          backgroundColor: isSelected ? theme.primaryVariant : theme.surface,
          borderColor: isSelected ? theme.primary : theme.borderLight,
        },
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.languageLeft}>
        <Text style={styles.flag}>{language.flag}</Text>
        <View style={styles.languageText}>
          <Text
            style={[
              styles.languageName,
              { color: theme.text, ...theme.typography.bodyMedium },
            ]}
          >
            {language.name}
          </Text>
          <Text
            style={[
              styles.nativeName,
              { color: theme.textSecondary, ...theme.typography.caption },
            ]}
          >
            {language.nativeName}
          </Text>
        </View>
      </View>

      {isSelected && (
        <View
          style={[styles.checkContainer, { backgroundColor: theme.primary }]}
        >
          <Check size={scale(16)} color={theme.surface} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const LanguageSettingsModal: React.FC<LanguageSettingsModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { isDarkMode } = useTheme();
  const { user, updateProfile } = useAuth();
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Initialize selected language from user settings
  const [selectedLanguage, setSelectedLanguage] = useState(
    user?.settings?.appearance?.language || 'en'
  );

  // Update selected language when user data changes
  useEffect(() => {
    if (user?.settings?.appearance?.language) {
      setSelectedLanguage(user.settings.appearance.language);
    }
  }, [user?.settings?.appearance?.language]);

  const handleSave = async () => {
    try {
      const updatedSettings = {
        appearance: {
          language: selectedLanguage,
          theme: user?.settings?.appearance?.theme || 'system',
        },
      };

      await updateProfile({ settings: updatedSettings });
      onSave(updatedSettings);

      // Change i18n language
      await changeLanguage(selectedLanguage as 'en' | 'he' | 'ru' | 'es');

      onClose();
    } catch (error) {
      console.error('Error saving language settings:', error);
    }
  };

  const selectedLanguageData = LANGUAGES.find(
    (lang) => lang.code === selectedLanguage
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.surface }]}
            onPress={onClose}
          >
            <ChevronLeft size={scale(24)} color={theme.text} />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.text, ...theme.typography.h1 },
            ]}
          >
            Language
          </Text>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveButtonText, { color: theme.surface }]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Language Display */}
          <Card
            variant="elevated"
            elevation="small"
            style={styles.currentLanguageCard}
          >
            <View style={styles.currentLanguageContent}>
              <Globe size={scale(24)} color={theme.primary} />
              <View style={styles.currentLanguageText}>
                <Text
                  style={[
                    styles.currentLanguageLabel,
                    { color: theme.textSecondary, ...theme.typography.caption },
                  ]}
                >
                  Current Language
                </Text>
                <Text
                  style={[
                    styles.currentLanguageValue,
                    { color: theme.text, ...theme.typography.bodyMedium },
                  ]}
                >
                  {selectedLanguageData
                    ? `${selectedLanguageData.flag} ${selectedLanguageData.name}`
                    : 'English'}
                </Text>
              </View>
            </View>
          </Card>

          {/* Language Options */}
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.textSecondary, ...theme.typography.captionMedium },
            ]}
          >
            SELECT LANGUAGE
          </Text>

          <Card
            variant="elevated"
            elevation="small"
            style={styles.languagesCard}
          >
            {LANGUAGES.map((language) => (
              <LanguageItem
                key={language.code}
                language={language}
                isSelected={selectedLanguage === language.code}
                onSelect={() => setSelectedLanguage(language.code)}
              />
            ))}
          </Card>

          {/* Note */}
          <Text
            style={[
              styles.note,
              { color: theme.textTertiary, ...theme.typography.tiny },
            ]}
          >
            Note: Language changes will take effect after restarting the app.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  saveButtonText: {
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  currentLanguageCard: {
    marginBottom: spacing.xl,
  },
  currentLanguageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentLanguageText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  currentLanguageLabel: {
    textTransform: 'uppercase',
  },
  currentLanguageValue: {
    marginTop: spacing.xs / 2,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    textTransform: 'uppercase',
  },
  languagesCard: {
    flex: 1,
    minHeight: verticalScale(400),
  },
  languagesList: {
    padding: spacing.md,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: moderateScale(24),
    marginRight: spacing.md,
  },
  languageText: {
    flex: 1,
  },
  languageName: {},
  nativeName: {
    marginTop: spacing.xs / 2,
  },
  checkContainer: {
    width: scale(24),
    height: scale(24),
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  note: {
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});

export default LanguageSettingsModal;
