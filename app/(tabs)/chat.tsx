// screens/ChatScreen.tsx
import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../store';
import { useChatData } from '../../hooks/useChatData';
import { useMultiplePresence } from '../../hooks/usePresence';
import { usePulse } from '../../hooks/usePulse';
import { ChatItem } from '../components/ChatItem';
import { EnhancedEmptyState } from '../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import { ChatItem as ChatItemType, Profile } from '../../types/chat';

export default function ChatScreen() {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();
  const pulse = usePulse();

  const { currentUser, conversations, discoverProfiles, matchedProfilesData } =
    useUserStore();

  const [activeTab, setActiveTab] = useState<'matches' | 'missed'>('matches');
  const [fetchedProfiles] = useState(() => new Map<string, Profile>());

  // Data + real-time
  useChatData();

  // Presence
  const participantIds = useMemo(() => {
    return conversations
      .map((c) => c.participants.find((id) => id !== currentUser?.id))
      .filter((id): id is string => !!id);
  }, [conversations, currentUser?.id]);

  const presenceMap = useMultiplePresence(participantIds);

  // Format time
  const formatTime = useCallback(
    (date: Date): string => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (minutes < 5) return t('chat.now');
      if (minutes < 60) return `${minutes} ${t('chat.minutes')}`;
      if (hours < 24) return `${hours} ${t('chat.hours')}`;
      if (days === 1) return t('chat.yesterday');
      return `${days} ${t('chat.days')}`;
    },
    [t]
  );

  // Chat items
  const chatItems = useMemo<ChatItemType[]>(() => {
    if (!conversations.length || !currentUser) return [];

    const filtered = conversations.filter((c) =>
      activeTab === 'missed' ? c.isMissedConnection : !c.isMissedConnection
    );

    return filtered
      .map((conv) => {
        const otherId = conv.participants.find((id) => id !== currentUser.id);
        const profile =
          discoverProfiles.find((p) => p.id === otherId) ||
          matchedProfilesData.find((p) => p.id === otherId) ||
          fetchedProfiles.get(otherId!);

        if (!profile) return null;

        const presence = presenceMap.get(otherId!) || {};
        const isOnline = presence.isOnline || profile.isOnline || false;

        return {
          id: conv.id,
          name: profile.name,
          age: profile.age,
          image: profile.image,
          lastMessage: conv.lastMessage?.text || t('chat.newMatch'),
          time: conv.lastMessage
            ? formatTime(conv.lastMessage.timestamp)
            : formatTime(conv.createdAt),
          unread: (conv.unreadCount || 0) > 0,
          isOnline,
        };
      })
      .filter(Boolean) as ChatItemType[];
  }, [
    conversations,
    currentUser,
    discoverProfiles,
    matchedProfilesData,
    activeTab,
    fetchedProfiles,
    presenceMap,
    formatTime,
    t,
  ]);

  const handlePress = useCallback(
    (id: string) => router.push(`/chat/${id}`),
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatItemType }) => (
      <ChatItem
        chat={item}
        theme={theme}
        pulse={pulse}
        onPress={() => handlePress(item.id)}
      />
    ),
    [theme, pulse, handlePress]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 88,
      offset: 88 * index,
      index,
    }),
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            {t('chat.title')}
          </Text>
        </View>

        <View style={[styles.tabs, { borderBottomColor: theme.border }]}>
          {(['matches', 'missed'] as const).map((tab) => {
            const count = conversations.filter((c) =>
              tab === 'missed' ? c.isMissedConnection : !c.isMissedConnection
            ).length;
            const isActive = activeTab === tab;

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, isActive && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: theme.textSecondary },
                    isActive && [
                      styles.activeTabText,
                      { color: theme.primary },
                    ],
                  ]}
                >
                  {tab === 'matches' ? t('chat.matches') : t('chat.missed')} (
                  {count})
                </Text>
                {isActive && (
                  <View
                    style={[
                      styles.indicator,
                      { backgroundColor: theme.primary },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <FlatList
          data={chatItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EnhancedEmptyState
              type="chat"
              onAction={() => router.push('/(tabs)/search')}
              actionLabel={t('common.startSwiping')}
            />
          }
          getItemLayout={getItemLayout}
          removeClippedSubviews
          maxToRenderPerBatch={6}
          windowSize={5}
          initialNumToRender={8}
          contentContainerStyle={
            chatItems.length === 0 ? { flex: 1 } : { paddingBottom: 120 }
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 50,
  },
  header: { paddingHorizontal: 24, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {},
  tabText: { fontSize: 15, fontWeight: '600' },
  activeTabText: { fontWeight: '700' },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 3,
  },
});
