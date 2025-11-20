import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../store';
import { useChatData } from '../../hooks/useChatData';
import { EnhancedEmptyState } from '../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import ProfileModal from '../components/ProfileModal';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  borderRadius,
} from '../../utils/responsive';

// --- Sub-Components ---

const MatchStoryBubble = ({ user, onPress, theme }: any) => (
  <TouchableOpacity style={styles.storyContainer} onPress={onPress}>
    <View style={[styles.storyRing, { borderColor: theme.primary }]}>
      <Image source={{ uri: user.image }} style={styles.storyImage} />
      {user.isOnline && (
        <View style={[styles.onlineBadge, { borderColor: theme.background }]} />
      )}
    </View>
    <Text style={[styles.storyName, { color: theme.text }]} numberOfLines={1}>
      {user.name}
    </Text>
  </TouchableOpacity>
);

const ChatRow = ({ item, onPress, theme }: any) => (
  <TouchableOpacity
    style={[styles.chatRow, { backgroundColor: theme.background }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.avatarContainer}>
      <Image source={{ uri: item.image }} style={styles.chatAvatar} />
      {item.isOnline && (
        <View
          style={[styles.onlineBadgeRow, { borderColor: theme.background }]}
        />
      )}
    </View>

    <View style={styles.chatContent}>
      <View style={styles.chatHeader}>
        <Text style={[styles.chatName, { color: theme.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.chatTime, { color: theme.textSecondary }]}>
          {item.time}
        </Text>
      </View>
      <View style={styles.messageRow}>
        <Text
          style={[
            styles.lastMessage,
            {
              color: item.unread ? theme.text : theme.textSecondary,
              fontWeight: item.unread ? '600' : '400',
            },
          ]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
        {item.unread && (
          <View
            style={[styles.unreadDot, { backgroundColor: theme.primary }]}
          />
        )}
      </View>
    </View>
  </TouchableOpacity>
);

export default function ChatScreen() {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();

  const { currentUser, conversations, discoverProfiles, matchedProfilesData } =
    useUserStore();

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Ensure data is loaded
  useChatData();

  const processedChats = useMemo(() => {
    if (!currentUser) return [];
    return conversations.map((c) => {
      const otherId = c.participants.find((id) => id !== currentUser.id);
      const profile =
        matchedProfilesData.find((p) => p.id === otherId) ||
        discoverProfiles.find((p) => p.id === otherId);

      return {
        id: c.id,
        otherId,
        name: profile?.name || 'Unknown',
        image: profile?.image || 'https://via.placeholder.com/150',
        lastMessage: c.lastMessage?.text || t('chat.newMatch'),
        time: '2m', // In real app, use relative time util
        unread: (c.unreadCount || 0) > 0,
        isOnline: Math.random() > 0.7, // Mock presence
      };
    });
  }, [conversations, matchedProfilesData, discoverProfiles, currentUser, t]);

  const newMatches = useMemo(
    () => matchedProfilesData.slice(0, 6),
    [matchedProfilesData]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t('chat.title')}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stories (New Matches) */}
        {newMatches.length > 0 && (
          <View style={styles.storiesSection}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              New Matches
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesContent}
            >
              {newMatches.map((match) => (
                <MatchStoryBubble
                  key={match.id}
                  user={match}
                  theme={theme}
                  onPress={() => {
                    setSelectedProfile(match);
                    setShowProfileModal(true);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Messages List */}
        <View style={styles.listSection}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Messages
          </Text>
          {processedChats.length === 0 ? (
            <EnhancedEmptyState
              type="chat"
              onAction={() => router.push('/(tabs)/search')}
              actionLabel={t('common.startSwiping')}
            />
          ) : (
            processedChats.map((chat) => (
              <ChatRow
                key={chat.id}
                item={chat}
                theme={theme}
                onPress={() => router.push(`/chat/${chat.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Profile Modal */}
      {selectedProfile && (
        <ProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={selectedProfile}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: verticalScale(10), // Match 10pt top padding
    paddingBottom: spacing.md,
  },
  // SYNCED TITLE
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: spacing.xl,
    marginBottom: spacing.sm,
  },

  // Stories
  storiesSection: { marginBottom: spacing.lg },
  storiesContent: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  storyContainer: { alignItems: 'center', gap: 6, width: scale(68) },
  storyRing: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    borderWidth: 2,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: scale(30),
  },
  storyName: { fontSize: moderateScale(11), fontWeight: '500' },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
  },

  // List
  listSection: { flex: 1 },
  chatRow: {
    flexDirection: 'row',
    paddingVertical: verticalScale(14),
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  avatarContainer: { position: 'relative', marginRight: spacing.md },
  chatAvatar: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
  },
  onlineBadgeRow: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
  },
  chatContent: { flex: 1, justifyContent: 'center', gap: 4 },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: { fontSize: moderateScale(16), fontWeight: '700' },
  chatTime: { fontSize: moderateScale(12), fontWeight: '500' },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: { fontSize: moderateScale(14), flex: 1, marginRight: 8 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
});
