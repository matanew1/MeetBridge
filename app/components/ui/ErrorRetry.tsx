// app/components/ui/ErrorRetry.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../../constants/theme';

export interface ErrorRetryProps {
  error?: Error | string;
  onRetry: () => void;
  title?: string;
  message?: string;
  isNetworkError?: boolean;
  animated?: boolean;
}

export const ErrorRetry: React.FC<ErrorRetryProps> = ({
  error,
  onRetry,
  title,
  message,
  isNetworkError = false,
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
          duration: 300,
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

  const getErrorMessage = () => {
    if (message) return message;
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (isNetworkError)
      return 'Please check your internet connection and try again.';
    return 'Something went wrong. Please try again.';
  };

  const getErrorTitle = () => {
    if (title) return title;
    if (isNetworkError) return 'No Connection';
    return 'Oops!';
  };

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
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.error + '20' },
          ]}
        >
          {isNetworkError ? (
            <WifiOff size={48} color={theme.error} />
          ) : (
            <AlertCircle size={48} color={theme.error} />
          )}
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          {getErrorTitle()}
        </Text>

        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {getErrorMessage()}
        </Text>

        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <RefreshCw size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
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
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
  retryButton: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorRetry;
