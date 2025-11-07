// app/components/ui/LoadingOverlay.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../../constants/theme';

export interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
  fullScreen?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  transparent = true,
  fullScreen = true,
}) => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  if (!visible) return null;

  if (fullScreen) {
    return (
      <Modal transparent visible={visible} animationType="none">
        <View
          style={[
            styles.modalOverlay,
            {
              backgroundColor: transparent
                ? 'rgba(0, 0, 0, 0.5)'
                : theme.background,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.loadingContainer,
              {
                backgroundColor: theme.surface,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <ActivityIndicator size="large" color={theme.primary} />
            {message && (
              <Text style={[styles.loadingText, { color: theme.text }]}>
                {message}
              </Text>
            )}
          </Animated.View>
        </View>
      </Modal>
    );
  }

  return (
    <Animated.View
      style={[
        styles.inlineContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <ActivityIndicator size="large" color={theme.primary} />
      {message && (
        <Text style={[styles.loadingText, { color: theme.text }]}>
          {message}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoadingOverlay;
