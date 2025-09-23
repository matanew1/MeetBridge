import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Heart, MessageCircle, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../../store';
import '../../i18n';

interface LikedProfileCardProps {
  user: {
    id: string;
    name: string;
    age: number;
    distance?: number;
    image: string;
    bio?: string;
  };
  onMessage?: (id: string) => void;
  isMatch?: boolean;
}

const LikedProfileCard = ({
  user,
  onMessage,
  isMatch = false,
}: LikedProfileCardProps) => (
  <View style={styles.cardContainer}>
    <TouchableOpacity style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: user.image }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={[styles.heartOverlay, isMatch && styles.matchOverlay]}>
          {isMatch ? (
            <Users size={16} color="#4CAF50" />
          ) : (
            <Heart size={16} color="#FF69B4" fill="#FF69B4" />
          )}
        </View>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>
          {user.name}, {user.age}
        </Text>
        {user.distance && (
          <Text style={styles.distanceText}>{user.distance} ק"מ ממך</Text>
        )}
        {user.bio && (
          <Text style={styles.bioText} numberOfLines={2}>
            {user.bio}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.messageButton, isMatch && styles.matchMessageButton]}
        onPress={() => onMessage?.(user.id)}
      >
        <MessageCircle size={20} color={isMatch ? '#4CAF50' : '#8E44AD'} />
        <Text style={[styles.messageText, isMatch && styles.matchMessageText]}>
          {isMatch ? 'התחל שיחה' : 'שלח הודעה'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  </View>
);

export default function LovedScreen() {
  const { t } = useTranslation();
  const { discoverProfiles, likedProfiles, getMatchedProfiles } =
    useUserStore();
  const [activeTab, setActiveTab] = useState<'loved' | 'matches'>('loved');

  // Get liked profiles in real-time
  const likedProfilesData = discoverProfiles.filter((profile) =>
    likedProfiles.includes(profile.id)
  );

  // Get matched profiles
  const matchedProfilesData = getMatchedProfiles();

  // Get only liked profiles that are not matches
  const onlyLikedProfiles = likedProfilesData.filter(
    (profile) => !matchedProfilesData.some((match) => match.id === profile.id)
  );

  const handleMessage = (profileId: string) => {
    // TODO: Navigate to chat with this profile
    console.log('Message profile:', profileId);
  };

  const renderEmptyState = (type: 'loved' | 'matches') => (
    <View style={styles.emptyState}>
      {type === 'loved' ? (
        <Heart size={60} color="#E1C8EB" />
      ) : (
        <Users size={60} color="#C8E6C9" />
      )}
      <Text style={styles.emptyTitle}>
        {type === 'loved' ? 'עדיין לא אהבת אף אחד' : 'עדיין אין לך התאמות'}
      </Text>
      <Text style={styles.emptyText}>
        עבור לעמוד החיפוש כדי למצוא אנשים מעניינים!
      </Text>
    </View>
  );

  const renderProfileGrid = (profiles: any[], isMatch: boolean = false) => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.grid}>
        {profiles.map((user) => (
          <View key={user.id} style={styles.gridItem}>
            <LikedProfileCard
              user={user}
              onMessage={handleMessage}
              isMatch={isMatch}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>אהובים והתאמות</Text>
        <Text style={styles.headerSubtitle}>
          {activeTab === 'loved'
            ? `${onlyLikedProfiles.length} ${
                onlyLikedProfiles.length === 1 ? 'אדם שאהבתי' : 'אנשים שאהבתי'
              }`
            : `${matchedProfilesData.length} ${
                matchedProfilesData.length === 1 ? 'התאמה' : 'התאמות'
              }`}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'loved' && styles.activeTab]}
          onPress={() => setActiveTab('loved')}
        >
          <Heart size={20} color={activeTab === 'loved' ? '#8E44AD' : '#999'} />
          <Text
            style={[
              styles.tabText,
              activeTab === 'loved' && styles.activeTabText,
            ]}
          >
            אהבתי ({onlyLikedProfiles.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'matches' && styles.activeTab]}
          onPress={() => setActiveTab('matches')}
        >
          <Users
            size={20}
            color={activeTab === 'matches' ? '#4CAF50' : '#999'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'matches' && styles.activeTabText,
            ]}
          >
            ההתאמות שלי ({matchedProfilesData.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'loved'
        ? onlyLikedProfiles.length === 0
          ? renderEmptyState('loved')
          : renderProfileGrid(onlyLikedProfiles, false)
        : matchedProfilesData.length === 0
        ? renderEmptyState('matches')
        : renderProfileGrid(matchedProfilesData, true)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf1fcff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#8E44AD',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#333',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  gridItem: {
    marginBottom: 16,
  },
  cardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  card: {
    padding: 16,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  heartOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  matchOverlay: {
    backgroundColor: '#E8F5E8',
  },
  cardInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8D5F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  matchMessageButton: {
    backgroundColor: '#E8F5E8',
  },
  messageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E44AD',
    marginLeft: 8,
  },
  matchMessageText: {
    color: '#4CAF50',
  },
});
