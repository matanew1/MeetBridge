import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Globe } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';

interface LanguageSwitcherProps {
  style?: any;
  showLabel?: boolean;
  compact?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  style,
  showLabel = true,
  compact = false,
}) => {
  const { t } = useTranslation();
  const { isDarkMode, currentLanguage, toggleLanguage } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactButton,
          { backgroundColor: theme.surface },
          style,
        ]}
        onPress={toggleLanguage}
        activeOpacity={0.7}
      >
        <Globe size={16} color={theme.primary} />
        <Text style={[styles.compactText, { color: theme.primary }]}>
          {currentLanguage.toUpperCase()}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderColor: theme.border },
        style,
      ]}
      onPress={toggleLanguage}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Globe size={20} color={theme.primary} />
      </View>
      <View style={styles.textContainer}>
        {showLabel && (
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            {t('settings.language')}
          </Text>
        )}
        <Text style={[styles.currentLanguage, { color: theme.text }]}>
          {currentLanguage === 'he'
            ? t('settings.hebrew')
            : t('settings.english')}
        </Text>
      </View>
      <Text style={[styles.arrow, { color: theme.textSecondary }]}>
        {currentLanguage === 'he' ? '←' : '→'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 56,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 2,
  },
  currentLanguage: {
    fontSize: 16,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default LanguageSwitcher;
