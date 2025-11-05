// app/components/IcebreakerSuggestions.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Sparkles, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import icebreakerService, {
  Icebreaker,
} from '../../services/icebreakerService';
import { User } from '../../store/types';
import { LinearGradient } from 'expo-linear-gradient';

interface IcebreakerSuggestionsProps {
  currentUser: User;
  matchedUser: User;
  onSelectIcebreaker: (text: string) => void;
  visible?: boolean;
}

const IcebreakerSuggestions: React.FC<IcebreakerSuggestionsProps> = ({
  currentUser,
  matchedUser,
  onSelectIcebreaker,
  visible = true,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [icebreakers, setIcebreakers] = useState<Icebreaker[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && !dismissed) {
      // Generate personalized icebreakers
      const suggestions = icebreakerService.generateIcebreakers(
        currentUser,
        matchedUser,
        3
      );
      setIcebreakers(suggestions);

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [currentUser, matchedUser, visible, dismissed]);

  const handleSelectIcebreaker = (icebreaker: Icebreaker) => {
    onSelectIcebreaker(icebreaker.text);
    // Fade out and dismiss
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setDismissed(true);
    });
  };

  if (!visible || dismissed || icebreakers.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.header}>
        <Sparkles size={18} color={theme.primary} />
        <Text style={[styles.headerText, { color: theme.text }]}>
          Break the ice 💬
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {icebreakers.map((icebreaker) => (
          <TouchableOpacity
            key={icebreaker.id}
            style={[styles.icebreakerCard]}
            onPress={() => handleSelectIcebreaker(icebreaker)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[theme.primary + '20', theme.secondary + '20']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <Text
                style={[styles.icebreakerText, { color: theme.text }]}
                numberOfLines={3}
              >
                {icebreaker.text}
              </Text>
              <View style={styles.iconContainer}>
                <ChevronRight size={16} color={theme.primary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.dismissButton}
        onPress={() => setDismissed(true)}
      >
        <Text style={[styles.dismissText, { color: theme.textSecondary }]}>
          Dismiss
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    gap: 12,
    paddingRight: 12,
  },
  icebreakerCard: {
    width: 250,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
    minHeight: 90,
    justifyContent: 'space-between',
  },
  icebreakerText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  iconContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  dismissButton: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  dismissText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default IcebreakerSuggestions;
