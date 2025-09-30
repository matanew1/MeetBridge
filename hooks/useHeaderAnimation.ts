import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export const useHeaderAnimation = () => {
  const headerSlideAnim = useRef(new Animated.Value(-50)).current;
  const headerFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerSlideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return {
    headerSlideAnim,
    headerFadeAnim,
    headerAnimatedStyle: {
      transform: [{ translateY: headerSlideAnim }],
      opacity: headerFadeAnim,
    },
  };
};
