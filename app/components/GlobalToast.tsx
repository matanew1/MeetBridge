// app/components/GlobalToast.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import toastService, { ToastMessage } from '../../services/toastService';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
} from '../../utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_WIDTH = SCREEN_WIDTH - spacing.lg * 2;

const GlobalToast: React.FC = () => {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [toasts, setToasts] = useState<
    Array<ToastMessage & { animation: Animated.Value }>
  >([]);

  useEffect(() => {
    const handleShow = (toast: ToastMessage) => {
      const animation = new Animated.Value(0);

      setToasts((prev) => [...prev, { ...toast, animation }]);

      // Animate in
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();

      // Auto hide after duration
      if (toast.duration && toast.duration > 0) {
        setTimeout(() => {
          hideToast(toast.id);
        }, toast.duration);
      }
    };

    const handleHide = (id: string) => {
      hideToast(id);
    };

    toastService.on('show', handleShow);
    toastService.on('hide', handleHide);

    return () => {
      toastService.off('show', handleShow);
      toastService.off('hide', handleHide);
    };
  }, []);

  const hideToast = (id: string) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast) {
        // Animate out
        Animated.timing(toast.animation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setToasts((current) => current.filter((t) => t.id !== id));
        });
      }
      return prev;
    });
  };

  const getIcon = (type: string) => {
    const iconSize = scale(26);
    const iconColor = '#FFFFFF';

    switch (type) {
      case 'success':
        return <CheckCircle size={iconSize} color={iconColor} />;
      case 'error':
        return <XCircle size={iconSize} color={iconColor} />;
      case 'warning':
        return <AlertTriangle size={iconSize} color={iconColor} />;
      case 'info':
        return <Info size={iconSize} color={iconColor} />;
      default:
        return <Info size={iconSize} color={iconColor} />;
    }
  };

  const getColors = (type: string): [string, string] => {
    switch (type) {
      case 'success':
        return ['#10b981', '#059669'];
      case 'error':
        return ['#ef4444', '#dc2626'];
      case 'warning':
        return ['#f59e0b', '#d97706'];
      case 'info':
        return ['#3b82f6', '#2563eb'];
      default:
        return ['#6366f1', '#4f46e5'];
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast, index) => {
        const translateY = toast.animation.interpolate({
          inputRange: [0, 1],
          outputRange: [-100, 0],
        });

        const opacity = toast.animation;

        return (
          <Animated.View
            key={toast.id}
            style={[
              styles.toastWrapper,
              {
                transform: [{ translateY }],
                opacity,
                top: spacing.xl + index * (verticalScale(100) + spacing.md),
              },
            ]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => hideToast(toast.id)}
              style={styles.toastTouchable}
            >
              <LinearGradient
                colors={getColors(toast.type)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.toast,
                  {
                    ...theme.elevation.large,
                  },
                ]}
              >
                <View style={styles.iconContainer}>{getIcon(toast.type)}</View>

                <View style={styles.contentContainer}>
                  <Text style={styles.title} numberOfLines={2}>
                    {toast.title}
                  </Text>
                  {toast.message ? (
                    <Text style={styles.message} numberOfLines={4}>
                      {toast.message}
                    </Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => hideToast(toast.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={scale(18)} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  toastWrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
  },
  toastTouchable: {
    width: '100%',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    minHeight: verticalScale(80),
    width: '100%',
  },
  iconContainer: {
    width: scale(44),
    height: scale(44),
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  contentContainer: {
    flex: 1,
    marginRight: spacing.sm,
    paddingTop: spacing.xs / 2,
  },
  title: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    flexShrink: 1,
  },
  message: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: moderateScale(20),
    flexShrink: 1,
  },
  closeButton: {
    width: scale(30),
    height: scale(30),
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
});

export default GlobalToast;
