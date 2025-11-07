// app/components/ui/EnhancedEmptyState.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Search,
  Heart,
  MessageCircle,
  Users,
  MapPin,
  RefreshCw,
  Filter,
  UserX,
  Inbox,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../../constants/theme';

export type EmptyStateType =
  | 'discover'
  | 'loved'
  | 'matches'
  | 'chat'
  | 'connections'
  | 'no-results'
  | 'no-matches'
  | 'no-messages'
  | 'blocked'
  | 'error';

export interface EnhancedEmptyStateProps {
  type: EmptyStateType;
  title?: string;
  message?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  secondaryActionLabel?: string;
  onSecondaryActionPress?: () => void;
  icon?: React.ReactNode;
  animated?: boolean;
}

export const EnhancedEmptyState: React.FC<EnhancedEmptyStateProps> = ({
  type,
  title,
  message,
  actionLabel,
  onActionPress,
  secondaryActionLabel,
  onSecondaryActionPress,
  icon,
  animated = true,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, []);

  const getDefaultContent = () => {
    switch (type) {
      case 'discover':
        return {
          icon: <Search size={64} color={theme.textSecondary} />,
          title: 'No Profiles Found',
          message:
            "We couldn't find any profiles matching your preferences. Try adjusting your filters or expanding your distance range.",
          actionLabel: 'Adjust Filters',
          secondaryActionLabel: 'Refresh',
        };
      case 'loved':
        return {
          icon: <Heart size={64} color={theme.textSecondary} />,
          title: 'No Likes Yet',
          message:
            "You haven't liked anyone yet. Start exploring profiles to find your perfect match!",
          actionLabel: 'Start Exploring',
        };
      case 'matches':
        return {
          icon: <Users size={64} color={theme.textSecondary} />,
          title: 'No Matches Yet',
          message:
            "Keep swiping! When someone you like likes you back, you'll see them here.",
          actionLabel: 'Find Matches',
        };
      case 'chat':
        return {
          icon: <MessageCircle size={64} color={theme.textSecondary} />,
          title: 'No Conversations',
          message:
            "You don't have any active conversations. Match with someone to start chatting!",
          actionLabel: 'Find Matches',
        };
      case 'connections':
        return {
          icon: <MapPin size={64} color={theme.textSecondary} />,
          title: 'No Missed Connections',
          message:
            "Haven't seen anyone interesting nearby? Create a missed connection post and see who responds!",
          actionLabel: 'Create Post',
        };
      case 'no-results':
        return {
          icon: <Search size={64} color={theme.textSecondary} />,
          title: 'No Results',
          message:
            'Try adjusting your search filters or expanding your criteria.',
          actionLabel: 'Clear Filters',
        };
      case 'no-matches':
        return {
          icon: <UserX size={64} color={theme.textSecondary} />,
          title: 'No Matches Found',
          message:
            "Don't give up! Keep exploring and someone special will come along.",
          actionLabel: 'Keep Exploring',
        };
      case 'no-messages':
        return {
          icon: <Inbox size={64} color={theme.textSecondary} />,
          title: 'No Messages',
          message: 'Say hi! Break the ice and start a conversation.',
          actionLabel: 'Send Message',
        };
      case 'blocked':
        return {
          icon: <UserX size={64} color={theme.error} />,
          title: 'User Blocked',
          message:
            'This user has been blocked and can no longer interact with you.',
          actionLabel: 'Back to Browse',
        };
      case 'error':
        return {
          icon: <RefreshCw size={64} color={theme.error} />,
          title: 'Something Went Wrong',
          message:
            "We're having trouble loading this content. Please try again.",
          actionLabel: 'Retry',
        };
      default:
        return {
          icon: <Sparkles size={64} color={theme.textSecondary} />,
          title: 'Nothing Here Yet',
          message: 'Check back later for updates!',
        };
    }
  };

  const defaultContent = getDefaultContent();
  const displayIcon = icon || defaultContent.icon;
  const displayTitle = title || defaultContent.title;
  const displayMessage = message || defaultContent.message;
  const displayActionLabel = actionLabel || defaultContent.actionLabel;
  const displaySecondaryActionLabel =
    secondaryActionLabel || defaultContent.secondaryActionLabel;

  const containerStyle = animated
    ? [
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]
    : styles.container;

  return (
    <Animated.View style={containerStyle}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>{displayIcon}</View>
        <Text style={[styles.title, { color: theme.text }]}>
          {displayTitle}
        </Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {displayMessage}
        </Text>

        {displayActionLabel && onActionPress && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={onActionPress}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{displayActionLabel}</Text>
          </TouchableOpacity>
        )}

        {displaySecondaryActionLabel && onSecondaryActionPress && (
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { borderColor: theme.border, borderWidth: 1 },
            ]}
            onPress={onSecondaryActionPress}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
              {displaySecondaryActionLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 24,
    opacity: 0.6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EnhancedEmptyState;
