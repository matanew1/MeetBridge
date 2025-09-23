import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Heart, MessageCircle, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../store';
import ProfileDetail from '../components/ProfileDetail';
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
  onPress?: (user: any) => void;
  onUnmatch?: (id: string) => void;
  isMatch?: boolean;
}

const LikedProfileCard = ({
  user,
  onMessage,
  onPress,
  onUnmatch,
  isMatch = false,
}: LikedProfileCardProps) => {
  const handleUnmatchPress = (e: any) => {
    e.stopPropagation();
    console.log('Unmatch button pressed for user:', user.id);
    if (onUnmatch) {
      onUnmatch(user.id);
    }
  };

  const handleMessagePress = (e: any) => {
    e.stopPropagation();
    if (onMessage) {
      onMessage(user.id);
    }
  };

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity style={styles.card} onPress={() => onPress?.(user)}>
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

        {/* Action buttons for matches */}
        {isMatch && (
          <View style={styles.matchActions}>
            <TouchableOpacity
              style={[styles.messageButton, styles.matchMessageButton]}
              onPress={handleMessagePress}
            >
              <MessageCircle size={20} color="#4CAF50" />
              <Text style={[styles.messageText, styles.matchMessageText]}>
                צ'אט
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.unmatchButton]}
              onPress={handleUnmatchPress}
            >
              <Text style={styles.unmatchText}>בטל התאמה</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function LovedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    discoverProfiles,
    likedProfiles,
    getMatchedProfiles,
    likeProfile,
    dislikeProfile,
    unmatchProfile,
  } = useUserStore();
  const [activeTab, setActiveTab] = useState<'loved' | 'matches'>('loved');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [showUnmatchConfirm, setShowUnmatchConfirm] = useState(false);
  const [unmatchProfileId, setUnmatchProfileId] = useState<string | null>(null);

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
    // Navigate to chat tab when message button is clicked
    router.push('/chat');
  };

  const handleUnmatch = (profileId: string) => {
    console.log('handleUnmatch called with profileId:', profileId);

    // Use custom modal instead of Alert.alert
    setUnmatchProfileId(profileId);
    setShowUnmatchConfirm(true);
  };

  const confirmUnmatch = () => {
    if (unmatchProfileId) {
      console.log('Confirming unmatch for:', unmatchProfileId);
      unmatchProfile(unmatchProfileId);
      handleCloseProfile();
    }
    setShowUnmatchConfirm(false);
    setUnmatchProfileId(null);
  };

  const cancelUnmatch = () => {
    setShowUnmatchConfirm(false);
    setUnmatchProfileId(null);
  };

  const handleProfilePress = (user: any) => {
    setSelectedProfile(user);
    setShowProfileDetail(true);
  };

  const handleCloseProfile = () => {
    setShowProfileDetail(false);
    setSelectedProfile(null);
  };

  const handleLike = (profileId: string) => {
    likeProfile(profileId);
    handleCloseProfile();
  };

  const handleDislike = (profileId: string) => {
    dislikeProfile(profileId);
    handleCloseProfile();
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
              onPress={handleProfilePress}
              onUnmatch={handleUnmatch}
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

      {/* Profile Detail Modal */}
      {showProfileDetail && selectedProfile && (
        <View style={styles.modalOverlay}>
          <ProfileDetail
            user={selectedProfile}
            onClose={handleCloseProfile}
            onLike={handleLike}
            onDislike={handleDislike}
            onMessage={
              // Only allow messaging if it's a match
              matchedProfilesData.some(
                (match) => match.id === selectedProfile.id
              )
                ? handleMessage
                : undefined
            }
            onUnmatch={
              // Only allow unmatching if it's a match
              matchedProfilesData.some(
                (match) => match.id === selectedProfile.id
              )
                ? handleUnmatch
                : undefined
            }
            isLiked={likedProfiles.includes(selectedProfile.id)}
            isDisliked={false}
          />
        </View>
      )}

      {/* Custom Unmatch Confirmation Modal */}
      {showUnmatchConfirm && (
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>בטל התאמה</Text>
            <Text style={styles.confirmationText}>
              האם אתה בטוח שברצונך לבטל את ההתאמה? פעולה זו תמחק גם את השיחה
              ביניכם.
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={cancelUnmatch}
              >
                <Text style={styles.cancelButtonText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.deleteButton]}
                onPress={confirmUnmatch}
              >
                <Text style={styles.deleteButtonText}>בטל התאמה</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    marginBottom: 8,
  },
  matchActions: {
    width: '100%',
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
  unmatchButton: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  unmatchText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D32F2F',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationModal: {
    backgroundColor: '#FFF',
    margin: 20,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    maxWidth: 300,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
