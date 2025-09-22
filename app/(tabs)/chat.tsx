import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  image: string;
  unread?: boolean;
}

const mockChats: ChatItem[] = [
  {
    id: '1',
    name: 'דנה',
    lastMessage: 'היי! איך אתה?',
    time: '10:30',
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
    unread: true
  },
  {
    id: '2',
    name: 'אילנה',
    lastMessage: 'תודה על הערב הנחמד',
    time: 'אתמול',
    image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100'
  },
  {
    id: '3',
    name: 'תמרה',
    lastMessage: 'נשמע מעולה!',
    time: 'שלשום',
    image: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100'
  }
];

const ChatItem = ({ chat }: { chat: ChatItem }) => (
  <TouchableOpacity style={styles.chatItem}>
    <Image source={{ uri: chat.image }} style={styles.chatAvatar} />
    <View style={styles.chatContent}>
      <View style={styles.chatHeader}>
        <Text style={styles.chatName}>{chat.name}</Text>
        <Text style={styles.chatTime}>{chat.time}</Text>
      </View>
      <Text style={[styles.chatMessage, chat.unread && styles.unreadMessage]}>
        {chat.lastMessage}
      </Text>
    </View>
    {chat.unread && <View style={styles.unreadDot} />}
  </TouchableOpacity>
);

export default function ChatScreen() {
  const { t } = useTranslation();

  return (
    <LinearGradient colors={['#FF6B9D', '#C44FAF', '#8E44AD']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('chat.title')}</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Search size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <ScrollView style={styles.chatList} showsVerticalScrollIndicator={false}>
            {mockChats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} />
            ))}
          </ScrollView>
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
    color: '#FFF',
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
});