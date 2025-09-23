import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle, Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../../store';

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  image: string;
  age: number;
  unread?: boolean;
}

const ChatItem = ({ chat }: { chat: ChatItem }) => (
  <TouchableOpacity style={styles.chatItem}>
    <Image source={{ uri: chat.image }} style={styles.chatAvatar} />
    <View style={styles.chatContent}>
      <View style={styles.chatHeader}>
        <Text style={styles.chatName}>
          {chat.name}, {chat.age}
        </Text>
        <Text style={styles.chatTime}>{chat.time}</Text>
      </View>
      <Text style={[styles.chatMessage, chat.unread && styles.unreadMessage]}>
        {chat.lastMessage}
      </Text>
    </View>
    {chat.unread && <View style={styles.unreadDot} />}
    <View style={styles.matchBadge}>
      <Heart size={12} color="#4CAF50" fill="#4CAF50" />
    </View>
  </TouchableOpacity>
);

export default function ChatScreen() {
  const { t } = useTranslation();
  const { conversations, discoverProfiles } = useUserStore();
  const [chats, setChats] = useState<ChatItem[]>([]);

  const formatTime = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 5) return 'עכשיו';
    if (minutes < 60) return `${minutes} דק`;
    if (hours < 24) return `${hours} שעות`;
    if (days === 1) return 'אתמול';
    return `${days} ימים`;
  };

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
          (id) => id !== 'current-user'
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
        };
      })
      .filter(Boolean) as ChatItem[];

    console.log('Final chat items:', chatItems.length);
    setChats(chatItems);
  }, [conversations, discoverProfiles]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MessageCircle size={60} color="#E1C8EB" />
      <Text style={styles.emptyTitle}>אין לך עדיין שיחות</Text>
      <Text style={styles.emptyText}>
        כשתקבל התאמות חדשות, תוכל להתחיל לשוחח איתן כאן!
      </Text>
      <Text style={styles.emptySubtext}>
        עבור לעמוד החיפוש כדי למצוא התאמות
      </Text>
    </View>
  );

  return (
    <LinearGradient colors={['#fcf1fc', '#f8e8f8']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>צ'אטים ({chats.length})</Text>
        </View>

        <View style={styles.content}>
          {chats.length === 0 ? (
            renderEmptyState()
          ) : (
            <ScrollView
              style={styles.chatList}
              showsVerticalScrollIndicator={false}
            >
              {chats.map((chat) => (
                <ChatItem key={chat.id} chat={chat} />
              ))}
            </ScrollView>
          )}
        </View>
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
    color: '#8E44AD',
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
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    position: 'relative',
  },
  chatAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
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
    color: '#333',
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  chatMessage: {
    fontSize: 14,
    color: '#666',
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#333',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8E44AD',
    marginLeft: 8,
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    right: 8,
    backgroundColor: '#E8F5E8',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E44AD',
    textAlign: 'center',
    fontWeight: '500',
  },
});
