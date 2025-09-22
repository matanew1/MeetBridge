import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingBag as Shopping, MapPin, Settings } from 'lucide-react-native';

const ProximityUser = ({ user, position }: { user: any; position: any }) => (
  <TouchableOpacity style={[styles.proximityUser, position]} activeOpacity={0.8}>
    <Image source={{ uri: user.image }} style={styles.proximityUserImage} />
  </TouchableOpacity>
);

export default function ProximityScreen() {
  const nearbyUsers = [
    { id: '1', image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100' },
    { id: '2', image: 'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=100' },
    { id: '3', image: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100' },
  ];

  return (
    <LinearGradient colors={['#FF6B9D', '#C44FAF', '#8E44AD']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.time}>9:41</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity>
              <Shopping size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.profileButton}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=100' }} 
                style={styles.headerProfile}
              />
            </View>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.genderButton}>
            <Text style={styles.genderText}>איש</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.genderButton, styles.activeGenderButton]}>
            <MapPin size={20} color="#FFF" />
            <Text style={styles.activeGenderText}>אישה</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          <View style={styles.proximityMap}>
            {/* Concentric circles */}
            <View style={[styles.circle, styles.outerCircle]} />
            <View style={[styles.circle, styles.middleCircle]} />
            <View style={[styles.circle, styles.innerCircle]} />
            
            {/* Center user */}
            <View style={styles.centerUser}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=100' }} 
                style={styles.centerUserImage}
              />
            </View>

            {/* Nearby users */}
            <ProximityUser 
              user={nearbyUsers[0]} 
              position={{ top: 60, left: 80 }}
            />
            <ProximityUser 
              user={nearbyUsers[1]} 
              position={{ bottom: 80, right: 60 }}
            />
            <ProximityUser 
              user={nearbyUsers[2]} 
              position={{ top: 120, right: 40 }}
            />
          </View>
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>אהבתי</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryActionButton}>
            <Settings size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>גילוי</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  time: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerProfile: {
    width: 40,
    height: 40,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 40,
  },
  genderButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeGenderButton: {
    backgroundColor: '#8E44AD',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  genderText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  activeGenderText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proximityMap: {
    width: 300,
    height: 300,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1000,
  },
  outerCircle: {
    width: 280,
    height: 280,
  },
  middleCircle: {
    width: 200,
    height: 200,
  },
  innerCircle: {
    width: 120,
    height: 120,
  },
  centerUser: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFF',
    zIndex: 10,
  },
  centerUserImage: {
    width: '100%',
    height: '100%',
  },
  proximityUser: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  proximityUserImage: {
    width: '100%',
    height: '100%',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  primaryActionButton: {
    backgroundColor: '#8E44AD',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  actionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});