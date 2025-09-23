import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Heart, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function SearchScreen() {
  const { t } = useTranslation();
  const [selectedGender, setSelectedGender] = useState('woman');
  const [isSearching, setIsSearching] = useState(false);

  // Animation values
  const pulseAnimation = useSharedValue(0);
  const rotationAnimation = useSharedValue(0);
  const profileAnimation = useSharedValue(0);

  const centerProfile = {
    id: 'center',
    image:
      'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=300',
  };

  const surroundingProfiles = [
    {
      id: '1',
      image:
        'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300',
    },
    {
      id: '2',
      image:
        'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=300',
    },
    {
      id: '3',
      image:
        'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=300',
    },
    {
      id: '4',
      image:
        'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=300',
    },
    {
      id: '5',
      image:
        'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300',
    },
  ];

  useEffect(() => {
    // Start animations when component mounts
    setIsSearching(true);
    
    // Pulse animation for circles
    pulseAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Rotation animation for surrounding profiles
    rotationAnimation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );

    // Profile floating animation
    profileAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  // Animated styles
  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnimation.value, [0, 1], [1, 1.1]);
    const opacity = interpolate(pulseAnimation.value, [0, 1], [0.3, 0.6]);
    
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const rotationStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotationAnimation.value}deg` }],
    };
  });

  const profileFloatStyle = useAnimatedStyle(() => {
    const translateY = interpolate(profileAnimation.value, [0, 1], [0, -10]);
    
    return {
      transform: [{ translateY }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Gender Selection */}
      <View style={styles.genderContainer}>
        <TouchableOpacity
          style={[
            styles.genderButton,
            styles.manButton,
            selectedGender === 'man' && styles.selectedManButton,
          ]}
          onPress={() => setSelectedGender('man')}
        >
          <Text style={styles.manIcon}>♂</Text>
          <Text style={styles.manText}>איש</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.genderButton,
            styles.womanButton,
            selectedGender === 'woman' && styles.selectedWomanButton,
          ]}
          onPress={() => setSelectedGender('woman')}
        >
          {selectedGender === 'woman' && (
            <View style={styles.checkIcon}>
              <Check size={16} color="#FFF" />
            </View>
          )}
          <Text style={styles.womanIcon}>♀</Text>
          <Text style={styles.womanText}>אישה</Text>
        </TouchableOpacity>
      </View>

      {/* Circular Search Interface */}
      <View style={styles.searchInterface}>
        {/* Animated Outer Circle */}
        <Animated.View style={[styles.outerCircle, pulseStyle]}>
          {/* Animated Middle Circle */}
          <Animated.View style={[styles.middleCircle, pulseStyle]}>
            {/* Inner Circle */}
            <View style={styles.innerCircle}>
              {/* Center Profile */}
              <Animated.View style={[styles.centerProfileContainer, profileFloatStyle]}>
                <Image
                  source={{ uri: centerProfile.image }}
                  style={styles.centerProfile}
                />
              </Animated.View>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Surrounding Profiles with Rotation */}
        <Animated.View style={[styles.profilesContainer, rotationStyle]}>
          {surroundingProfiles.map((profile, index) => {
            const angle = index * 72 - 90; // 360/5 = 72 degrees apart, start from top
            const radius = 140;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;

            return (
              <Animated.View
                key={profile.id}
                style={[
                  styles.surroundingProfile,
                  profileFloatStyle,
                  {
                    transform: [{ translateX: x }, { translateY: y }],
                  },
                ]}
              >
                <Image
                  source={{ uri: profile.image }}
                  style={styles.profileImage}
                />
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Animated Heart Icon */}
        <Animated.View style={[styles.heartContainer, profileFloatStyle]}>
          <Heart size={24} color="#8E44AD" fill="#8E44AD" />
        </Animated.View>

        {/* Searching indicator */}
        {isSearching && (
          <View style={styles.searchingIndicator}>
            <Text style={styles.searchingText}>מחפש...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 60,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 60,
    paddingHorizontal: 40,
  },
  genderButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 20,
    minWidth: 100,
    position: 'relative',
  },
  manButton: {
    backgroundColor: '#4FC3F7',
    borderRadius: 50,
    width: 80,
    height: 80,
  },
  selectedManButton: {
    backgroundColor: '#29B6F6',
  },
  womanButton: {
    backgroundColor: '#AB47BC',
    borderRadius: 20,
    width: 120,
    height: 80,
  },
  selectedWomanButton: {
    backgroundColor: '#8E44AD',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manIcon: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  womanIcon: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  manText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  womanText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchInterface: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  outerCircle: {
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(171, 71, 188, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(171, 71, 188, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#4FC3F7',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  centerProfileContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  centerProfile: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profilesContainer: {
    position: 'absolute',
    width: 320,
    height: 320,
  },
  surroundingProfile: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heartContainer: {
    position: 'absolute',
    bottom: -120,
    backgroundColor: '#FFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  searchingIndicator: {
    position: 'absolute',
    bottom: -180,
    backgroundColor: 'rgba(142, 68, 173, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  searchingText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});