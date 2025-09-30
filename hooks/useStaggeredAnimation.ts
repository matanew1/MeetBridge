import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface StaggeredAnimationConfig {
  index: number;
  delay?: number;
  duration?: number;
}

export const useStaggeredAnimation = ({
  index,
  delay = 100,
  duration = 500,
}: StaggeredAnimationConfig) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration,
        delay: index * delay,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        delay: index * delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: index * delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return {
    slideAnim,
    fadeAnim,
    scaleAnim,
    animatedStyle: {
      transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
      opacity: fadeAnim,
    },
  };
};
