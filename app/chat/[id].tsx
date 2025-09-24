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
  Modal,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Send,
  Phone,
  Video,
  MoveHorizontal as MoreHorizontal,
  Heart,
  User,
  X,
  UserX,
} from 'lucide-react-native';
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
import ProfileDetail from '../components/ProfileDetail';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isFromCurrentUser: boolean;
}

interface MessageItemProps {
  message: Message;
  index: number;
  theme: any;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, index, theme }) => {
  const messageAnim = useSharedValue(0);
  const fadeAnim = useSharedValue(0);

  React.useEffect(() => {
    setTimeout(() => {
      messageAnim.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
    }, index * 50);

    setTimeout(() => {
      fadeAnim.value = withTiming(1, { duration: 400 });
    }, index * 50);
  }, []);

  const messageStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          messageAnim.value,
          [0, 1],
          [message.isFromCurrentUser ? 50 : -50, 0]
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
        message.isFromCurrentUser
          ? styles.myMessageContainer
          : styles.otherMessageContainer,
        messageStyle,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          message.text === '❤️' ? styles.heartMessage : null,
          message.isFromCurrentUser
            ? [
                styles.myMessage,
                {
                  backgroundColor:
                    message.text === '❤️' ? 'transparent' : theme.primary,
                },
              ]
            : [
                styles.otherMessage,
                {
                  backgroundColor:
                    message.text === '❤️' ? 'transparent' : theme.surface,
                },
              ],
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.text === '❤️' ? styles.heartText : null,
            {
              color:
                message.text === '❤️'
                  ? '#FF6B9D'
                  : message.isFromCurrentUser
                  ? '#FFF'
                  : theme.text,
            },
          ]}
        >
          {message.text}
        </Text>
      </View>
      <Text
        style={[
          styles.messageTime,
          { color: theme.textSecondary },
          message.isFromCurrentUser
            ? styles.myMessageTime
            : styles.otherMessageTime,
        ]}
      >
        {message.timestamp.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </Animated.View>
  );
};

const ChatScreen = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const {
    conversations,
    discoverProfiles,
    matchedProfilesData,
    currentUser,
    sendMessage,
    markMessagesAsRead,
    unmatchProfile,
  } = useUserStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [showUnmatchConfirm, setShowUnmatchConfirm] = useState(false);
  const [heartAnimation, setHeartAnimation] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Animation values
  const headerSlideAnim = useSharedValue(-50);
  const headerFadeAnim = useSharedValue(0);
  const inputSlideAnim = useSharedValue(50);
  const inputFadeAnim = useSharedValue(0);
  const heartScale = useSharedValue(1);
  const heartOpacity = useSharedValue(1);

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
      // Look for the user in matchedProfilesData first, then fallback to discoverProfiles
      const foundUser =
        matchedProfilesData.find((profile) => profile.id === otherUserId) ||
        discoverProfiles.find((profile) => profile.id === otherUserId);
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
  }, [id, conversations, currentUser, discoverProfiles, matchedProfilesData]);

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerSlideAnim.value }],
    opacity: headerFadeAnim.value,
  }));

  const inputStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: inputSlideAnim.value }],
    opacity: inputFadeAnim.value,
  }));

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
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

  const handleSendHeart = () => {
    if (id && currentUser) {
      // Start heart animation
      heartScale.value = withSpring(1.5, { damping: 8, stiffness: 150 }, () => {
        heartScale.value = withSpring(1, { damping: 10, stiffness: 200 });
      });

      // Send heart message
      const heartMessage: Message = {
        id: `msg_heart_${Date.now()}`,
        text: '❤️',
        timestamp: new Date(),
        isFromCurrentUser: true,
      };

      setMessages((prev) => [...prev, heartMessage]);
      sendMessage(id as string, '❤️');

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleViewProfile = () => {
    setShowOptionsMenu(false);
    setShowProfileDetail(true);
  };

  const handleUnmatch = () => {
    console.log('🔴 handleUnmatch called');
    console.log('🔴 otherUser:', otherUser);
    console.log('🔴 Current user:', currentUser);
    setShowOptionsMenu(false);
    setShowUnmatchConfirm(true);
  };

  const confirmUnmatch = () => {
    console.log('🔴 confirmUnmatch called');
    console.log('🔴 About to unmatch user ID:', otherUser?.id);
    setShowUnmatchConfirm(false);
    if (otherUser) {
      unmatchProfile(otherUser.id)
        .then(() => {
          console.log('🔴 Unmatch completed, navigating back');
          router.back();
        })
        .catch((error) => {
          console.log('🔴 Unmatch failed:', error);
        });
    }
  };

  const cancelUnmatch = () => {
    console.log('🔴 cancelUnmatch called');
    setShowUnmatchConfirm(false);
  };

  const handleMessageFromProfile = () => {
    setShowProfileDetail(false);
    // Already in chat, so just close the modal
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => (
    <MessageItem message={item} index={index} theme={theme} />
  );

  if (!otherUser) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.text }]}>
            {t('chat.loading')}
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
                {otherUser.isOnline ? t('chat.online') : t('chat.offline')}
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
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                console.log('🔴 Three dots menu pressed');
                setShowOptionsMenu(true);
              }}
            >
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
            <TouchableOpacity
              style={styles.attachButton}
              onPress={handleSendHeart}
              activeOpacity={0.7}
            >
              <Animated.View style={heartAnimatedStyle}>
                <Heart size={20} color={theme.primary} />
              </Animated.View>
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
              placeholder={t('chat.messageInputPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              multiline
              textAlign="left"
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

      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity
          style={styles.optionsModalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View
            style={[styles.optionsMenu, { backgroundColor: theme.surface }]}
          >
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleViewProfile}
            >
              <User size={20} color={theme.primary} />
              <Text style={[styles.optionText, { color: theme.text }]}>
                {t('chat.viewProfile')}
              </Text>
            </TouchableOpacity>

            <View
              style={[styles.optionDivider, { backgroundColor: theme.border }]}
            />

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                console.log('🔴 Unmatch option pressed in menu');
                handleUnmatch();
              }}
            >
              <UserX size={20} color={theme.error} />
              <Text style={[styles.optionText, { color: theme.error }]}>
                {t('chat.unmatch')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Profile Detail Modal */}
      {showProfileDetail && otherUser && (
        <View style={styles.modalOverlay}>
          <ProfileDetail
            user={otherUser}
            onClose={() => setShowProfileDetail(false)}
            onLike={() => {}}
            onDislike={() => {}}
            onMessage={handleMessageFromProfile}
          />
        </View>
      )}

      {/* Custom Unmatch Confirmation Modal */}
      {showUnmatchConfirm && (
        <Modal
          visible={showUnmatchConfirm}
          transparent={true}
          animationType="fade"
          onRequestClose={cancelUnmatch}
        >
          <View style={styles.centeredModalOverlay}>
            <View
              style={[
                styles.confirmationModal,
                { backgroundColor: theme.surface },
              ]}
            >
              <View style={styles.confirmationIcon}>
                <X size={32} color={theme.error} />
              </View>
              <Text style={[styles.confirmationTitle, { color: theme.text }]}>
                {t('chat.unmatchTitle')}
              </Text>
              <Text
                style={[
                  styles.confirmationText,
                  { color: theme.textSecondary },
                ]}
              >
                {t('chat.unmatchConfirm', { name: otherUser?.name })}
              </Text>
              <View style={styles.confirmationButtons}>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    styles.cancelButton,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={cancelUnmatch}
                >
                  <Text
                    style={[styles.cancelButtonText, { color: theme.text }]}
                  >
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    styles.deleteButton,
                    { backgroundColor: theme.error },
                  ]}
                  onPress={confirmUnmatch}
                >
                  <Text style={styles.deleteButtonText}>
                    {t('common.unmatch')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    maxWidth: '100%',
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
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  heartMessage: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  heartText: {
    fontSize: 24,
    textAlign: 'center',
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
    alignItems: 'center',
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
    paddingVertical: 8,
    fontSize: 16,
    height: 40,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  optionsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsMenu: {
    borderRadius: 12,
    paddingVertical: 8,
    marginHorizontal: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  optionDivider: {
    height: 1,
    marginHorizontal: 20,
  },
  centeredModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationModal: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  confirmationIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmationText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    // backgroundColor will be set from theme
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default ChatScreen;
