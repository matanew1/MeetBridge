import { Tabs } from 'expo-router';
import {
  Heart,
  Search,
  MessageCircleMore,
  ShoppingCart as Shopping,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import '../../i18n';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { backgroundColor: '#fcf1fcff' }]}>
          <TouchableOpacity style={styles.shoppingButton}>
            <Shopping size={20} color="#8E44AD" />
          </TouchableOpacity>
          <View style={styles.profileButton}>
            <Image
              source={{
                uri: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=100',
              }}
              style={styles.headerProfile}
            />
          </View>
        </View>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 0,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              paddingBottom: 5,
              paddingTop: 12,
              height: 80,
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
            },
            tabBarActiveTintColor: '#8E44AD',
            tabBarInactiveTintColor: '#9CA3AF',
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '500',
              marginTop: 1,
            },
          }}
        >
          <Tabs.Screen
            name="discover"
            options={{
              title: t('tabs.discover'),
              tabBarIcon: ({ size, color }) => (
                <Heart size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="search"
            options={{
              title: t('tabs.search'),
              tabBarIcon: ({ size, color }) => (
                <Search size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="chat"
            options={{
              title: t('tabs.chat'),
              tabBarIcon: ({ size, color }) => (
                <MessageCircleMore size={size} color={color} />
              ),
            }}
          />
        </Tabs>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#F8F9FA',
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
  shoppingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
