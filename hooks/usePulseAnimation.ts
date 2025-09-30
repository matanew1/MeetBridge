import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface PulseAnimationConfig {
  enabled?: boolean;
  duration?: number;
  minScale?: number;
  maxScale?: number;
}

export const usePulseAnimation = ({
  enabled = true,
  duration = 1000,
  minScale = 1,
  maxScale = 1.2,
}: PulseAnimationConfig = {}) => {
  const pulseAnim = useRef(new Animated.Value(minScale)).current;

  useEffect(() => {
    if (!enabled) return;

    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: maxScale,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: minScale,
          duration,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };

    pulse();

    return () => {
      pulseAnim.stopAnimation();
    };
  }, [enabled, duration, minScale, maxScale]);

  return { pulseAnim };
};
