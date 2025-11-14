// components/ChatItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Animated, { SharedValue } from 'react-native-reanimated';
import { ImageIcon } from 'lucide-react-native';
import { ChatItem as ChatItemType } from '../../types/chat';

interface Props {
  chat: ChatItemType;
  theme: any;
  pulse: SharedValue<number>;
  onPress: () => void;
  onAvatarPress?: () => void;
}

export const ChatItem = React.memo(
  ({ chat, theme, pulse, onPress, onAvatarPress }: Props) => {
    return (
      <TouchableOpacity
        style={[styles.container, { backgroundColor: theme.cardBackground }]}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <TouchableOpacity
          style={styles.avatarContainer}
          activeOpacity={0.7}
          onPress={onAvatarPress}
        >
          {chat.image ? (
            <Image source={{ uri: chat.image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholder]}>
              <Text style={styles.placeholderText}>
                {chat.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {chat.isOnline && (
            <Animated.View
              style={[
                styles.onlineDot,
                {
                  backgroundColor: theme.success,
                  transform: [{ scale: pulse }],
                },
              ]}
            />
          )}
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.name, { color: theme.text }]}>
              {chat.name}, {chat.age}
            </Text>
            <Text style={[styles.time, { color: theme.textSecondary }]}>
              {chat.time}
            </Text>
          </View>
          <View style={styles.messageRow}>
            {chat.lastMessage.startsWith('http') ? (
              <>
                <ImageIcon size={14} color={theme.textSecondary} />
                <Text style={[styles.message, { color: theme.textSecondary }]}>
                  {' '}
                  image
                </Text>
              </>
            ) : (
              <Text
                style={[
                  styles.message,
                  { color: theme.textSecondary },
                  chat.unread && styles.unread,
                ]}
              >
                {chat.lastMessage}
              </Text>
            )}
          </View>
        </View>

        {chat.unread && (
          <View
            style={[styles.unreadDot, { backgroundColor: theme.primary }]}
          />
        )}
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.chat.id === next.chat.id &&
    prev.chat.unread === next.chat.unread &&
    prev.chat.isOnline === next.chat.isOnline &&
    prev.chat.lastMessage === next.chat.lastMessage &&
    prev.chat.time === next.chat.time
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    marginVertical: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  avatarContainer: { position: 'relative', marginRight: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  placeholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 24, fontWeight: 'bold', color: '#666' },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
  content: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: { fontSize: 16, fontWeight: '600' },
  time: { fontSize: 12 },
  messageRow: { flexDirection: 'row', alignItems: 'center' },
  message: { fontSize: 14 },
  unread: { fontWeight: '600' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
});
