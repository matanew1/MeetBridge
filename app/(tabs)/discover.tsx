import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Heart, MessageCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import '../../i18n';

interface UserCard {
  id: string;
  name: string;
  age: number;
  distance: string;
  image: string;
}

const mockUsers: UserCard[] = [
  {
    id: '1',
    name: 'אריק',
    age: 30,
    distance: 25,
    image:
      'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: '2',
    name: 'דנה',
    age: 26,
    distance: 25,
    image:
      'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: '3',
    name: 'אלונה',
    age: 22,
    distance: 65,
    image:
      'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: '4',
    name: 'תמרה',
    age: 27,
    distance: 45,
    image:
      'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: '5',
    name: 'נמר',
    age: 19,
    distance: 85,
    image:
      'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: '6',
    name: 'אלין',
    age: 18,
    distance: 85,
    image:
      'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: '7',
    name: 'נורה',
    age: 24,
    distance: 95,
    image:
      'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
  {
    id: '8',
    name: 'ויקטוריה',
    age: 23,
    distance: 95,
    image:
      'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300',
  },
];

const ProfileCard = ({ user }: { user: UserCard }) => (
  <View style={styles.cardContainer}>
    <TouchableOpacity style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: user.image }} style={styles.cardImage} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardText}>
          {user.age}, {user.name}
        </Text>
      </View>
    </TouchableOpacity>
    <View style={styles.distanceContainer}>
      <Text style={styles.distanceText}>{user.distance}מ</Text>
    </View>
  </View>
);

export default function DiscoverScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {mockUsers.map((user, index) => (
            <View key={user.id} style={styles.gridItem}>
              <ProfileCard user={user} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf1fcff',
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  cardContainer: {
    position: 'relative',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    aspectRatio: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 5,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  distanceContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#c9b7e9ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 25,
    zIndex: 2,
    minWidth: 40,
    alignItems: 'center',
  },
  distanceText: {
    color: '#461237ff',
    fontSize: 11,
    fontWeight: '600',
  },
  cardInfo: {
    alignItems: 'center',
  },
  cardText: {
    fontSize: 17,
    color: '#333',
    textAlign: 'center',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#8E44AD',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  centerButton: {
    backgroundColor: '#8E44AD',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  centerButtonIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
