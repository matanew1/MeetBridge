import { Tabs } from 'expo-router';
import {
  Search,
  MessageCircleMore,
  HeartHandshake,
  Moon,
  Sun,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import ProfileModal from '../components/ProfileModal';
import '../../i18n';

export default function TabLayout() {
  const { t } = useTranslation();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user } = useAuth();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleProfilePress = () => {
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <View
        style={[styles.header, { backgroundColor: theme.headerBackground }]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[
              styles.darkModeButton,
              { backgroundColor: theme.primaryVariant },
            ]}
            onPress={toggleDarkMode}
          >
            {isDarkMode ? (
              <Sun size={20} color={theme.primary} />
            ) : (
              <Moon size={20} color={theme.primary} />
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={handleProfilePress}
        >
          <Image
            source={{
              uri:
                user?.image ||
                'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=100',
            }}
            style={styles.headerProfile}
          />
        </TouchableOpacity>
      </View>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.tabBarBackground,
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: isDarkMode ? 0.3 : 0.1,
            shadowRadius: 8,
            paddingTop: 12,
            paddingBottom: 0,
            marginBottom: 0,
            height: 90,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
          tabBarActiveTintColor: theme.tabBarActive,
          tabBarInactiveTintColor: theme.tabBarInactive,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            marginTop: 1,
          },
        }}
      >
        <Tabs.Screen
          name="loved"
          options={{
            title: t('tabs.discover'),
            tabBarIcon: ({ size, color }) => (
              <HeartHandshake size={size} color={color} />
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

      {/* Profile Modal */}
      {user && (
        <ProfileModal
          visible={showProfileModal}
          onClose={handleCloseProfileModal}
          user={user}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  darkModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
