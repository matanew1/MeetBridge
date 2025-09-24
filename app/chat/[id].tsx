import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Phone, Video, MoveHorizontal as MoreHorizontal, Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useUserStore } from '../../store';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isFromCurrentUser: boolean;
}

const ChatScreen = () => {
  const { t } = useTranslation();
  const { isDarkMode, isRTL } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const {
    conversations,
    discoverProfiles,
    currentUser,
    sendMessage,
    markMessagesAsRead,
  } = useUserStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  // Animation values
  const headerSlideAnim = useSharedValue(-50);
  const headerFadeAnim = useSharedValue(0);
  const inputSlideAnim = useSharedValue(50);
  const inputFadeAnim = useSharedValue(0);

  useEffect(() => {
    // Start animations
    headerSlideAnim.value = withSpring(0, { damping: 15, stiffness: 150 });
    headerFadeAnim.value = withTiming(1, { duration: 500 });
    inputSlideAnim.value = withSpring(0, { damping: 15, stiffness: 150 });
    inputFadeAnim.value = withTiming(1, { duration: 500 });

    // Find conversation and other user
    const conversation = conversations.find((conv) => conv.id === id);
    if (conversation && currentUser) {
      const otherUserId = conversation.participants.find(
        (participantId) => participantId !== currentUser.id
      );
      const foundUser = discoverProfiles.find(
        (profile) => profile.id === otherUserId
      );
      setOtherUser(foundUser);

      // Convert conversation messages to display format
      const displayMessages: Message[] = conversation.messages.map((msg) => ({
        id: msg.id,
        text: msg.text,
        timestamp: msg.timestamp,
        isFromCurrentUser: msg.senderId === currentUser.id,
      }));
      setMessages(displayMessages);

      // Mark messages as read
      const unreadMessageIds = conversation.messages
        .filter((msg) => !msg.isRead && msg.senderId !== currentUser.id)
        .map((msg) => msg.id);
      if (unreadMessageIds.length > 0) {
        markMessagesAsRead(conversation.id, unreadMessageIds);
      }
    }
  }, [id, conversations, currentUser, discoverProfiles]);

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerSlideAnim.value }],
    opacity: headerFadeAnim.value,
  }));

  const inputStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: inputSlideAnim.value }],
    opacity: inputFadeAnim.value,
  }));

  const handleSendMessage = () => {
    if (inputText.trim() && id && currentUser) {
      const newMessage: Message = {
        id: `msg_${Date.now()}`,
        text: inputText.trim(),
        timestamp: new Date(),
        isFromCurrentUser: true,
      };

      setMessages((prev) => [...prev, newMessage]);
      sendMessage(id as string, inputText.trim());
      setInputText('');

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const messageAnim = useSharedValue(0);
    const fadeAnim = useSharedValue(0);

    React.useEffect(() => {
      messageAnim.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
        delay: index * 50,
      });
      fadeAnim.value = withTiming(1, { duration: 400, delay: index * 50 });
    }, []);

    const messageStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateX: interpolate(
            messageAnim.value,
            [0, 1],
            [item.isFromCurrentUser ? 50 : -50, 0]
          ),
        },
        { scale: interpolate(messageAnim.value, [0, 1], [0.8, 1]) },
      ],
      opacity: fadeAnim.value,
    }));

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          item.isFromCurrentUser
            ? styles.myMessageContainer
            : styles.otherMessageContainer,
          messageStyle,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            item.isFromCurrentUser
              ? [styles.myMessage, { backgroundColor: theme.primary }]
              : [styles.otherMessage, { backgroundColor: theme.surface }],
          ]}
        >
          <Text
            style={[
              styles.messageText,
              {
                color: item.isFromCurrentUser
                  ? '#FFF'
                  : theme.text,
              },
            ]}
          >
            {item.text}
          </Text>
        </View>
        <Text
          style={[
            styles.messageTime,
            { color: theme.textSecondary },
            item.isFromCurrentUser
              ? styles.myMessageTime
              : styles.otherMessageTime,
          ]}
        >
          {item.timestamp.toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </Animated.View>
    );
  };

  if (!otherUser) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.text }]}>
            טוען...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
            headerStyle,
          ]}
        >
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>
            <Image source={{ uri: otherUser.image }} style={styles.avatar} />
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.text }]}>
                {otherUser.name}
              </Text>
              <Text style={[styles.userStatus, { color: theme.textSecondary }]}>
                {otherUser.isOnline ? 'מחובר/ת עכשיו' : 'לא מחובר/ת'}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Phone size={20} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Video size={20} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MoreHorizontal size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={[styles.messagesList, { backgroundColor: theme.background }]}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Input */}
        <Animated.View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.surface, borderTopColor: theme.border },
            inputStyle,
          ]}
        >
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.attachButton}>
              <Heart size={20} color={theme.primary} />
            </TouchableOpacity>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="כתוב הודעה..."
              placeholderTextColor={theme.textSecondary}
              multiline
              textAlign={isRTL ? 'right' : 'left'}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim()
                    ? theme.primary
                    : theme.border,
                },
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <Send
                size={18}
                color={inputText.trim() ? '#FFF' : theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: width * 0.75,
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  myMessage: {
    borderBottomRightRadius: 6,
  },
  otherMessage: {
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    textAlign: 'right',
  },
  otherMessageTime: {
    textAlign: 'left',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  attachButton: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;