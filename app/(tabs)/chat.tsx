import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../store';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';

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

const ChatItem = ({
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

  useEffect(() => {
    // Staggered entrance animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Online indicator pulse animation
    if (chat.isOnline) {
      const pulse = () => {
        Animated.sequence([
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
        ]).start(() => pulse());
      };
      pulse();
    }
  }, [index, chat.isOnline]);

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
        style={[styles.chatItem, { backgroundColor: theme.cardBackground }]}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <View style={styles.avatarContainer}>
          <Image source={{ uri: chat.image }} style={styles.chatAvatar} />
          {chat.isOnline && (
            <Animated.View
              style={[
                styles.onlineIndicator,
                {
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
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ChatScreen() {
  const { t } = useTranslation();
  const { isDarkMode, isRTL } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();
  const {
    currentUser,
    conversations,
    discoverProfiles,
    loadConversations,
    loadCurrentUser,
    loadDiscoverProfiles,
  } = useUserStore();
  const [chats, setChats] = useState<ChatItem[]>([]);

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
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    loadCurrentUser();
    loadConversations();
    if (discoverProfiles.length === 0) {
      loadDiscoverProfiles(true);
    }
  }, []);

  useEffect(() => {
    console.log('🔍 Chat screen useEffect triggered');
    console.log('Conversations count:', conversations.length);
    console.log('Discover profiles count:', discoverProfiles.length);

    // Sort conversations by most recent first
    const sortedConversations = [...conversations].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );

    const chatItems: ChatItem[] = sortedConversations
      .map((conversation) => {
        // Find the other participant (not current user)
        const otherParticipantId = conversation.participants.find(
          (id) => id !== currentUser?.id
        );
        const otherParticipant = discoverProfiles.find(
          (profile) => profile.id === otherParticipantId
        );

        console.log('Processing conversation:', {
          conversationId: conversation.id,
          otherParticipantId,
          foundProfile: !!otherParticipant,
          hasLastMessage: !!conversation.lastMessage,
        });

        if (!otherParticipant || !conversation.lastMessage) {
          return null;
        }

        return {
          id: conversation.id,
          name: otherParticipant.name,
          age: otherParticipant.age,
          lastMessage: conversation.lastMessage.text,
          time: formatTime(conversation.lastMessage.timestamp),
          image: otherParticipant.image,
          unread: conversation.unreadCount > 0,
          isOnline: otherParticipant.isOnline,
        };
      })
      .filter(Boolean) as ChatItem[];

    console.log('Final chat items:', chatItems.length);
    setChats(chatItems);

    // Animate content when chats are loaded
    if (chatItems.length > 0) {
      Animated.parallel([
        Animated.timing(contentSlideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [conversations, discoverProfiles, currentUser]);

  const handleChatPress = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  // Empty state animations
  useEffect(() => {
    if (chats.length === 0) {
      Animated.sequence([
        Animated.timing(emptyFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(emptyIconAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(emptyTextAnim, {
            toValue: 0,
            duration: 400,
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
    <LinearGradient
      colors={
        isDarkMode
          ? [theme.background, theme.surfaceVariant]
          : ['#fcf1fc', '#f8e8f8']
      }
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.header,
            {
              transform: [{ translateY: headerSlideAnim }],
              opacity: headerFadeAnim,
            },
            isRTL && styles.headerRTL,
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
              backgroundColor: theme.surface,
              transform: [{ translateY: contentSlideAnim }],
              opacity: contentFadeAnim,
            },
          ]}
        >
          {chats.length === 0 ? (
            renderEmptyState()
          ) : (
            <ScrollView
              style={styles.chatList}
              showsVerticalScrollIndicator={false}
            >
              {chats.map((chat, index) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  theme={theme}
                  index={index}
                  onPress={() => handleChatPress(chat.id)}
                />
              ))}
            </ScrollView>
          )}
        </Animated.View>
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
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    position: 'relative',
    borderRadius: 12,
    marginVertical: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
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
    backgroundColor: '#8E44AD',
    marginLeft: 8,
    shadowColor: '#8E44AD',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
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
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});
