import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingBag as Shopping } from 'lucide-react-native';

interface UserCard {
  id: string;
  name: string;
  age: number;
  distance: string;
  image: string;
}

const mockUsers: UserCard[] = [
  { id: '1', name: 'אילנה', age: 30, distance: 'n25', image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { id: '2', name: 'דנה', age: 26, distance: 'n25', image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { id: '3', name: 'אמונה', age: 22, distance: 'n65', image: 'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { id: '4', name: 'תמרה', age: 27, distance: 'n45', image: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { id: '5', name: 'נמר', age: 19, distance: 'n85', image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { id: '6', name: 'אלין', age: 18, distance: 'n85', image: 'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { id: '7', name: 'יונתן', age: 24, distance: 'n95', image: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { id: '8', name: 'שירה', age: 23, distance: 'n95', image: 'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=300' },
];

const ProfileCard = ({ user }: { user: UserCard }) => (
  <TouchableOpacity style={styles.card}>
    <Image source={{ uri: user.image }} style={styles.cardImage} />
    <View style={styles.distanceContainer}>
      <Text style={styles.distanceText}>{user.distance}</Text>
    </View>
    <View style={styles.cardInfo}>
      <Text style={styles.cardAge}>{user.age}</Text>
      <Text style={styles.cardName}>{user.name}</Text>
    </View>
  </TouchableOpacity>
);

export default function DiscoverScreen() {
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

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {mockUsers.map((user, index) => (
              <View key={user.id} style={[styles.gridItem, index % 2 === 1 && styles.gridItemRight]}>
                <ProfileCard user={user} />
              </View>
            ))}
          </View>
        </ScrollView>
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
    marginBottom: 20,
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
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  gridItemRight: {
    marginTop: 32,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  distanceContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(139, 69, 167, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  cardInfo: {
    padding: 12,
    alignItems: 'center',
  },
  cardAge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  cardName: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});