import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
  ListRenderItemInfo,
  Platform,
  StatusBar,
} from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../store';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import { useMultiplePresence } from '../../hooks/usePresence';

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  image: string;
  age: number;
  unread?: boolean;
  isOnline?: boolean;
}

const ChatItem = memo(
  ({
    chat,
    theme,
    index,
    onPress,
  }: {
    chat: ChatItem;
    theme: any;
    index: number;
    onPress: () => void;
  }) => {
    const slideAnim = React.useRef(new Animated.Value(50)).current;
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const scaleAnim = React.useRef(new Animated.Value(0.95)).current;
    const pulseAnim = React.useRef(new Animated.Value(1)).current;
    const pulseAnimationRef = React.useRef<any>(null);

    useEffect(() => {
      // Faster staggered entrance animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200, // Reduced from 300ms
          delay: index * 30, // Reduced from 50ms
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200, // Reduced from 300ms
          delay: index * 30,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 70, // Increased from 50
          friction: 7,
          delay: index * 30, // Reduced from 100ms
          useNativeDriver: true,
        }),
      ]).start();
    }, [index]);

    useEffect(() => {
      // Online indicator pulse animation - only when online
      if (chat.isOnline) {
        const pulse = () => {
          pulseAnimationRef.current = Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]);
          pulseAnimationRef.current.start(() => {
            if (chat.isOnline) {
              pulse();
            }
          });
        };
        pulse();
      } else {
        // Stop animation and reset scale when offline
        if (pulseAnimationRef.current) {
          pulseAnimationRef.current.stop();
        }
        pulseAnim.setValue(1);
      }

      return () => {
        if (pulseAnimationRef.current) {
          pulseAnimationRef.current.stop();
        }
      };
    }, [chat.isOnline]);

    return (
      <Animated.View
        style={[
          {
            transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.chatItem,
            {
              backgroundColor: theme.cardBackground,
              borderBottomColor: theme.borderLight,
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            },
          ]}
          activeOpacity={0.7}
          onPress={onPress}
        >
          <View style={styles.avatarContainer}>
            {chat.image && chat.image.trim() !== '' ? (
              <Image source={{ uri: chat.image }} style={styles.chatAvatar} />
            ) : (
              <View
                style={[
                  styles.chatAvatar,
                  {
                    backgroundColor: theme.surfaceVariant,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 24,
                    color: theme.textSecondary,
                    fontWeight: 'bold',
                  }}
                >
                  {chat.name?.charAt(0) || '?'}
                </Text>
              </View>
            )}
            {chat.isOnline && (
              <Animated.View
                style={[
                  styles.onlineIndicator,
                  {
                    backgroundColor: theme.success,
                    borderColor: theme.surface,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
            )}
          </View>
          <View style={styles.chatContent}>
            <View style={styles.chatHeader}>
              <Text style={[styles.chatName, { color: theme.text }]}>
                {chat.name}, {chat.age}
              </Text>
              <Text style={[styles.chatTime, { color: theme.textSecondary }]}>
                {chat.time}
              </Text>
            </View>
            <Text
              style={[
                styles.chatMessage,
                { color: theme.textSecondary },
                chat.unread && styles.unreadMessage,
              ]}
            >
              {chat.lastMessage}
            </Text>
          </View>
          {chat.unread && (
            <Animated.View
              style={[
                styles.unreadDot,
                {
                  backgroundColor: theme.primary,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    // Optimize re-renders - only update if these props change
    return (
      prevProps.chat.id === nextProps.chat.id &&
      prevProps.chat.lastMessage === nextProps.chat.lastMessage &&
      prevProps.chat.unread === nextProps.chat.unread &&
      prevProps.chat.isOnline === nextProps.chat.isOnline &&
      prevProps.chat.time === nextProps.chat.time &&
      prevProps.theme === nextProps.theme // IMPORTANT: Check theme changes for dark/light mode
    );
  }
);

export default function ChatScreen() {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();
  const {
    currentUser,
    conversations,
    discoverProfiles,
    matchedProfilesData,
    loadConversations,
    loadCurrentUser,
    loadDiscoverProfiles,
  } = useUserStore();
  const [chats, setChats] = useState<ChatItem[]>([]);

  // Get all chat participant IDs for presence monitoring
  const participantIds = useMemo(() => {
    return conversations
      .map((conv) => conv.participants?.find((id) => id !== currentUser?.id))
      .filter((id): id is string => typeof id === 'string');
  }, [conversations, currentUser?.id]);

  // Monitor presence for all chat participants
  const presenceMap = useMultiplePresence(participantIds);

  // Animation values
  const headerSlideAnim = React.useRef(new Animated.Value(-50)).current;
  const headerFadeAnim = React.useRef(new Animated.Value(0)).current;
  const contentSlideAnim = React.useRef(new Animated.Value(30)).current;
  const contentFadeAnim = React.useRef(new Animated.Value(0)).current;

  // Empty state animation values
  const emptyIconAnim = React.useRef(new Animated.Value(0)).current;
  const emptyTextAnim = React.useRef(new Animated.Value(50)).current;
  const emptyFadeAnim = React.useRef(new Animated.Value(0)).current;
  const formatTime = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 5) return t('chat.now');
    if (minutes < 60) return `${minutes} ${t('chat.minutes')}`;
    if (hours < 24) return `${hours} ${t('chat.hours')}`;
    if (days === 1) return t('chat.yesterday');
    return `${days} ${t('chat.days')}`;
  };

  // Load data when component mounts
  useEffect(() => {
    // Start header animations
    Animated.parallel([
      Animated.timing(headerSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    loadCurrentUser();
    loadConversations();

    // Load matches to ensure we have profile data for chat participants
    const { loadMatches } = useUserStore.getState();
    loadMatches();

    if (discoverProfiles.length === 0) {
      loadDiscoverProfiles(true);
    }

    // Set up real-time listener for conversations
    let unsubscribe: (() => void) | null = null;

    if (currentUser) {
      const setupRealtimeListener = async () => {
        const { collection, query, where, onSnapshot, orderBy } = await import(
          'firebase/firestore'
        );
        const { db } = await import('../../services/firebase/config');

        // Listen to conversations where user is a participant
        const conversationsQuery = query(
          collection(db, 'conversations'),
          where('participants', 'array-contains', currentUser.id),
          orderBy('updatedAt', 'desc')
        );

        unsubscribe = onSnapshot(
          conversationsQuery,
          async (snapshot) => {
            console.log(
              '🔔 Real-time conversation update:',
              snapshot.size,
              'conversations'
            );

            try {
              // Process the conversations directly from snapshot to avoid cache
              const conversationsData = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                  id: doc.id,
                  participants: data.participants || [],
                  createdAt:
                    data.createdAt?.toDate?.() ||
                    new Date(data.createdAt || Date.now()),
                  updatedAt:
                    data.updatedAt?.toDate?.() ||
                    new Date(data.updatedAt || Date.now()),
                  lastMessage: data.lastMessage
                    ? {
                        text: data.lastMessage.text || '',
                        senderId: data.lastMessage.senderId || '',
                        timestamp:
                          data.lastMessage.createdAt?.toDate?.() ||
                          new Date(data.lastMessage.createdAt || Date.now()),
                      }
                    : undefined,
                  unreadCount: data.unreadCount?.[currentUser.id] || 0,
                };
              });

              // Update store directly with real-time data
              useUserStore.setState({ conversations: conversationsData });
            } catch (error) {
              // Error processing conversation snapshot
            }
          },
          (error: any) => {
            if (error?.code === 'permission-denied') {
              console.log(
                '⚠️ Conversation listener permission denied (user logged out)'
              );
              return;
            }
            // Error in conversation listener
          }
        );
      };

      setupRealtimeListener();
    }

    return () => {
      if (unsubscribe) {
        console.log('🔕 Cleaning up conversation listener');
        unsubscribe();
      }
    };
  }, [currentUser?.id]);

  useEffect(() => {
    try {
      console.log('🔍 Chat screen useEffect triggered');
      console.log('Conversations count:', conversations?.length || 0);
      console.log('Discover profiles count:', discoverProfiles?.length || 0);
      console.log('Matched profiles count:', matchedProfilesData?.length || 0);

      // Safety check: ensure conversations is defined
      if (!conversations || !Array.isArray(conversations)) {
        console.log('⚠️ Conversations not yet loaded');
        setChats([]);
        return;
      }

      // Sort conversations by most recent first
      const sortedConversations = [...conversations].sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );

      const chatItems: ChatItem[] = sortedConversations
        .map((conversation) => {
          // Find the other participant (not current user)
          const otherParticipantId = conversation.participants?.find(
            (id) => id !== currentUser?.id
          );
          // Look in both discoverProfiles and matchedProfilesData
          const otherParticipant =
            (discoverProfiles || []).find(
              (profile) => profile.id === otherParticipantId
            ) ||
            (matchedProfilesData || []).find(
              (profile) => profile.id === otherParticipantId
            );

          console.log('Processing conversation:', {
            conversationId: conversation.id,
            otherParticipantId,
            foundProfile: !!otherParticipant,
            hasLastMessage: !!conversation.lastMessage,
          });

          if (!otherParticipant) {
            return null;
          }

          console.log('Mapped chat item:', conversation);

          // Get real-time presence data for this participant
          const presenceData = presenceMap.get(otherParticipantId || '');
          const isOnline =
            presenceData?.isOnline || otherParticipant.isOnline || false;

          // Show conversation even without messages (new matches)
          return {
            id: conversation.id,
            name: otherParticipant.name,
            age: otherParticipant.age,
            lastMessage: conversation.lastMessage?.text || t('chat.newMatch'),
            time: conversation.lastMessage
              ? formatTime(conversation.lastMessage.timestamp)
              : formatTime(conversation.createdAt),
            image: otherParticipant.image,
            unread: conversation.unreadCount > 0,
            isOnline: isOnline, // Use real-time presence data
          };
        })
        .filter(Boolean) as ChatItem[];

      console.log('Final chat items:', chatItems.length);
      setChats(chatItems);

      // Animate content area (whether empty or with chats)
      Animated.parallel([
        Animated.timing(contentSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      // Error in chat screen useEffect
      setChats([]);
    }
  }, [
    conversations,
    discoverProfiles,
    matchedProfilesData,
    currentUser,
    presenceMap,
  ]);

  const handleChatPress = useCallback(
    (chatId: string) => {
      router.push(`/chat/${chatId}`);
    },
    [router]
  );

  // FlatList optimization callbacks
  const keyExtractor = useCallback((item: ChatItem) => item.id, []);

  const renderChatItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ChatItem>) => (
      <ChatItem
        key={item.id}
        chat={item}
        theme={theme}
        index={index}
        onPress={() => handleChatPress(item.id)}
      />
    ),
    [theme, handleChatPress]
  );

  // Empty state animations
  useEffect(() => {
    if (chats.length === 0) {
      Animated.sequence([
        Animated.timing(emptyFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(emptyIconAnim, {
            toValue: 1,
            tension: 70,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(emptyTextAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Reset empty state animations when chats are available
      emptyIconAnim.setValue(0);
      emptyTextAnim.setValue(50);
      emptyFadeAnim.setValue(0);
    }
  }, [chats.length]);

  const renderEmptyState = () => (
    <Animated.View
      style={[
        styles.emptyState,
        {
          opacity: emptyFadeAnim,
          transform: [{ translateY: emptyTextAnim }],
        },
      ]}
    >
      <Animated.View
        style={{
          transform: [{ scale: emptyIconAnim }],
        }}
      >
        <MessageCircle size={60} color={theme.textSecondary} />
      </Animated.View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {t('chat.noConversations')}
      </Text>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        {t('chat.startMatching')}
      </Text>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.safeArea}>
        <Animated.View
          style={[
            styles.header,
            {
              transform: [{ translateY: headerSlideAnim }],
              opacity: headerFadeAnim,
            },
          ]}
        >
          <Text style={[styles.title, { color: theme.text }]}>
            {t('chat.title')} ({chats.length})
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.content,
            {
              backgroundColor: theme.background,
              transform: [{ translateY: contentSlideAnim }],
              opacity: contentFadeAnim,
            },
          ]}
        >
          <FlatList
            data={chats}
            renderItem={renderChatItem}
            keyExtractor={keyExtractor}
            ListEmptyComponent={renderEmptyState}
            extraData={theme}
            style={styles.chatList}
            contentContainerStyle={chats.length === 0 ? { flex: 1 } : undefined}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={50}
            windowSize={5}
            initialNumToRender={8}
            scrollEventThrottle={16}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 50, // Account for status bar + spacing
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
    position: 'relative',
    borderRadius: 20,
    marginVertical: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  chatAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
  },
  chatTime: {
    fontSize: 12,
  },
  chatMessage: {
    fontSize: 14,
  },
  unreadMessage: {
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
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
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 10,
  },
});
