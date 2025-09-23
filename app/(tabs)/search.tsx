import React, { useState } from 'react';
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

const { width, height } = Dimensions.get('window');

export default function SearchScreen() {
  const { t } = useTranslation();
  const [selectedGender, setSelectedGender] = useState('woman');

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

  return (
    <View style={styles.container}>
      {/* Gender Selection */}
      <View style={styles.genderContainer}>
        <TouchableOpacity
          style={[
            styles.genderButton,
            styles.manButton,
            selectedGender === 'man' && styles.selectedButton,
          ]}
          onPress={() => setSelectedGender('man')}
        >
          <Text style={styles.manIcon}>♂</Text>
          <Text style={styles.genderText}>איש</Text>
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
        {/* Outer Circle */}
        <View style={styles.outerCircle}>
          {/* Middle Circle */}
          <View style={styles.middleCircle}>
            {/* Inner Circle */}
            <View style={styles.innerCircle}>
              {/* Center Profile */}
              <View style={styles.centerProfileContainer}>
                <Image
                  source={{ uri: centerProfile.image }}
                  style={styles.centerProfile}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Surrounding Profiles */}
        {surroundingProfiles.map((profile, index) => {
          const angle = index * 72 - 90; // 360/5 = 72 degrees apart, start from top
          const radius = 140;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;

          return (
            <View
              key={profile.id}
              style={[
                styles.surroundingProfile,
                {
                  transform: [{ translateX: x }, { translateY: y }],
                },
              ]}
            >
              <Image
                source={{ uri: profile.image }}
                style={styles.profileImage}
              />
            </View>
          );
        })}

        {/* Heart Icon */}
        <View style={styles.heartContainer}>
          <Heart size={24} color="#8E44AD" fill="#8E44AD" />
        </View>
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
  genderText: {
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
    backgroundColor: 'rgba(171, 71, 188, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(171, 71, 188, 0.2)',
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
  },
  centerProfileContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  centerProfile: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  surroundingProfile: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
});
