import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  memo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Platform,
  Modal,
  StatusBar,
  KeyboardAvoidingView,
  Keyboard,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Send,
  Ellipsis,
  Heart,
  User,
  X,
  UserX,
  ImageIcon,
  Plus,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore } from '../../store';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import ProfileDetail from '../components/ProfileDetail';
import { LoadingOverlay } from '../components/ui';
import notificationService from '../../services/notificationService';
import toastService from '../../services/toastService';
import IcebreakerSuggestions from '../components/IcebreakerSuggestions';
import { storageService } from '../../services';
import { imageCompressionService } from '../../services';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isFromCurrentUser: boolean;
}

interface MessageItemProps {
  message: Message;
  theme: any;
}

const MessageItem: React.FC<MessageItemProps> = memo(
  ({ message, theme }) => {
    const messageAnim = useSharedValue(0);
    const fadeAnim = useSharedValue(0);
    const isHeartMessage = message.text === '❤️';
    const isImageMessage = useMemo(() => {
      const text = message.text.trim();
      return (
        (text.startsWith('http://') || text.startsWith('https://')) &&
        (text.includes('cloudinary') ||
          /\.(jpg|jpeg|png|gif|webp)$/i.test(text))
      );
    }, [message.text]);

    useEffect(() => {
      const timer1 = setTimeout(() => {
        messageAnim.value = withSpring(1, { damping: 20, stiffness: 180 });
      }, 0);
      const timer2 = setTimeout(() => {
        fadeAnim.value = withTiming(1, { duration: 300 });
      }, 0);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }, [messageAnim, fadeAnim]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateX: message.isFromCurrentUser
            ? interpolate(messageAnim.value, [0, 1], [50, 0])
            : interpolate(messageAnim.value, [0, 1], [-50, 0]),
        },
        { scale: interpolate(messageAnim.value, [0, 1], [0.8, 1]) },
      ],
      opacity: fadeAnim.value,
    }));

    const bubbleStyle = [
      styles.messageBubble,
      isHeartMessage && styles.heartMessage,
      isImageMessage && styles.imageMessage,
      message.isFromCurrentUser
        ? [
            styles.myMessage,
            {
              backgroundColor:
                isHeartMessage || isImageMessage
                  ? 'transparent'
                  : theme.primary,
            },
          ]
        : [
            styles.otherMessage,
            {
              backgroundColor:
                isHeartMessage || isImageMessage
                  ? 'transparent'
                  : theme.surface,
            },
          ],
    ];

    const textStyle = [
      styles.messageText,
      isHeartMessage && styles.heartText,
      {
        color: isHeartMessage
          ? '#FF6B9D'
          : message.isFromCurrentUser
          ? '#FFF'
          : theme.text,
      },
    ];

    const timeStyle = [
      styles.messageTime,
      { color: theme.textSecondary },
      message.isFromCurrentUser
        ? styles.myMessageTime
        : styles.otherMessageTime,
    ];

    const formattedTime = message.timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          message.isFromCurrentUser
            ? styles.myMessageContainer
            : styles.otherMessageContainer,
          animatedStyle,
        ]}
      >
        <View style={bubbleStyle}>
          {isImageMessage ? (
            <Image
              source={{ uri: message.text }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={textStyle}>{message.text}</Text>
          )}
        </View>
        <Text style={timeStyle}>{formattedTime}</Text>
      </Animated.View>
    );
  },
  (prev, next) =>
    prev.message.id === next.message.id &&
    prev.message.text === next.message.text &&
    prev.message.isFromCurrentUser === next.message.isFromCurrentUser &&
    prev.theme === next.theme
);

const ChatScreen = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const {
    conversations,
    matchedProfilesData,
    discoverProfiles,
    currentUser,
    sendMessage,
    markMessagesAsRead,
    unmatchProfile,
  } = useUserStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeenText, setLastSeenText] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [showUnmatchConfirm, setShowUnmatchConfirm] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [showIcebreakers, setShowIcebreakers] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const previousMessageCountRef = useRef(0);
  const shouldAutoScrollRef = useRef(true);

  const keyboardDidShowListener = useRef<any>(null);
  const keyboardDidHideListener = useRef<any>(null);

  // Animation
  const headerSlideAnim = useSharedValue(-50);
  const headerFadeAnim = useSharedValue(0);
  const inputSlideAnim = useSharedValue(50);
  const inputFadeAnim = useSharedValue(0);
  const heartScale = useSharedValue(1);

  const conversation = useMemo(
    () => conversations.find((c) => c.id === id),
    [conversations, id]
  );

  const otherUserId = useMemo(
    () => conversation?.participants.find((p) => p !== currentUser?.id),
    [conversation, currentUser?.id]
  );

  const localUser = useMemo(() => {
    return (
      matchedProfilesData.find((p) => p.id === otherUserId) ||
      discoverProfiles.find((p) => p.id === otherUserId)
    );
  }, [matchedProfilesData, discoverProfiles, otherUserId]);

  // Fetch from Firestore if not in local state
  useEffect(() => {
    if (!otherUserId || localUser) return;
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../../services/firebase/config');
        const snap = await getDoc(doc(db, 'users', otherUserId));
        if (snap.exists() && isMounted) {
          const data = snap.data();
          const user = {
            id: snap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            dateOfBirth: data.dateOfBirth?.toDate() || new Date(),
            lastSeen: data.lastSeen?.toDate(),
            isOnline: data.isOnline || false,
          };
          setOtherUser(user);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };
    fetchUser();
    return () => {
      isMounted = false;
    };
  }, [otherUserId, localUser]);

  useEffect(() => {
    if (localUser) setOtherUser(localUser);
  }, [localUser]);

  // Online status for current user
  useEffect(() => {
    if (!currentUser?.id) return;
    const { doc, updateDoc } = require('firebase/firestore');
    const { db } = require('../../services/firebase/config');
    const ref = doc(db, 'users', currentUser.id);
    updateDoc(ref, { isOnline: true }).catch(() => {});
    return () => updateDoc(ref, { isOnline: false }).catch(() => {});
  }, [currentUser?.id]);

  // Real-time presence + last seen
  useEffect(() => {
    if (!otherUserId) return;
    const { doc, onSnapshot } = require('firebase/firestore');
    const { db } = require('../../services/firebase/config');
    const ref = doc(db, 'users', otherUserId);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const online = data.isOnline || false;
        const lastSeen = data.lastSeen?.toDate?.() || null;
        setIsOnline(online);
        if (online) {
          setLastSeenText('Online');
        } else if (lastSeen) {
          const diff = (Date.now() - lastSeen.getTime()) / 1000;
          if (diff < 60) setLastSeenText('just now');
          else if (diff < 3600)
            setLastSeenText(`${Math.floor(diff / 60)} min ago`);
          else if (diff < 86400)
            setLastSeenText(`${Math.floor(diff / 3600)} hr ago`);
          else setLastSeenText(`${Math.floor(diff / 86400)} days ago`);
        } else {
          setLastSeenText('Offline');
        }
        setOtherUser((prev) =>
          prev ? { ...prev, isOnline: online, lastSeen } : prev
        );
      },
      (err) => {
        if (err?.code !== 'permission-denied')
          console.error('Presence error:', err);
      }
    );
    return unsubscribe;
  }, [otherUserId]);

  // Load message sound
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let sound: Audio.Sound | null = null;
    const init = async () => {
      try {
        if (Platform.OS === 'ios') {
          await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        }
        sound = new Audio.Sound();
        await sound.loadAsync(require('../../assets/audios/message.mp3'));
        soundRef.current = sound;
      } catch (err) {
        console.warn('Sound load failed:', err);
      }
    };
    init();
    return () => {
      sound?.unloadAsync?.();
    };
  }, []);

  // Animations
  useEffect(() => {
    headerSlideAnim.value = withSpring(0);
    headerFadeAnim.value = withTiming(1, { duration: 400 });
    inputSlideAnim.value = withSpring(0);
    inputFadeAnim.value = withTiming(1, { duration: 400 });
  }, [headerSlideAnim, headerFadeAnim, inputSlideAnim, inputFadeAnim]);

  // Timeout
  useEffect(() => {
    const t = setTimeout(() => setLoadingTimeout(true), 5000);
    return () => clearTimeout(t);
  }, []);

  // Active chat for notifications
  useEffect(() => {
    if (otherUserId) notificationService.setActiveChat(otherUserId);
    return () => notificationService.clearActiveChat();
  }, [otherUserId]);

  // Real-time messages
  useEffect(() => {
    if (!id || !currentUser) return;
    const {
      collection,
      query,
      orderBy,
      onSnapshot,
    } = require('firebase/firestore');
    const { db } = require('../../services/firebase/config');
    const q = query(
      collection(db, 'conversations', id, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newMsgs: Message[] = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            text: d.text,
            timestamp: d.createdAt?.toDate() || new Date(),
            isFromCurrentUser: d.senderId === currentUser.id,
          };
        });
        const hasNew = newMsgs.length > previousMessageCountRef.current;
        const newFromOther =
          hasNew && newMsgs[newMsgs.length - 1]?.isFromCurrentUser === false;
        if (newFromOther && soundRef.current) {
          soundRef.current
            .setPositionAsync(0)
            .then(() => soundRef.current?.playAsync());
        }
        previousMessageCountRef.current = newMsgs.length;
        setMessages(newMsgs);
        setShowIcebreakers(newMsgs.length === 0);
      },
      (err) => {
        if (err?.code !== 'permission-denied')
          console.error('Message listener error:', err);
      }
    );
    return unsubscribe;
  }, [id, currentUser?.id]);

  // Mark as read
  useEffect(() => {
    if (!conversation || !currentUser) return;
    const unread =
      conversation.messages
        ?.filter((m) => !m.isRead && m.senderId !== currentUser.id)
        ?.map((m) => m.id) || [];
    if (unread.length > 0) {
      requestAnimationFrame(() => markMessagesAsRead(conversation.id, unread));
    }
  }, [conversation, currentUser, markMessagesAsRead]);

  // Unmatch listener
  useEffect(() => {
    if (!conversation?.matchId) return;
    const { doc, onSnapshot } = require('firebase/firestore');
    const { db } = require('../../services/firebase/config');
    const ref = doc(db, 'matches', conversation.matchId);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (!snap.exists() || snap.data()?.unmatched) {
        useUserStore.setState((s) => ({
          matchedProfiles:
            s.matchedProfiles?.filter((id) => id !== otherUserId) || [],
          matchedProfilesData:
            s.matchedProfilesData?.filter((p) => p.id !== otherUserId) || [],
          conversations:
            s.conversations?.filter(
              (c) => !c.participants?.includes(otherUserId)
            ) || [],
        }));
        toastService.show(t('chat.unmatchTitle'), t('chat.unmatchDetected'));
        router.back();
      }
    });
    return unsubscribe;
  }, [conversation?.matchId, otherUserId, router, t]);

  // === AUTO-SCROLL LOGIC ===
  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated });
      }, 0);
    });
  }, []);

  const onContentSizeChange = useCallback(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom(false);
    }
  }, [scrollToBottom]);

  const onLayout = useCallback(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom(false);
    }
  }, [scrollToBottom]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const nearBottom =
        contentOffset.y >= contentSize.height - layoutMeasurement.height - 120;
      shouldAutoScrollRef.current = nearBottom;
    },
    []
  );

  // Keyboard listeners
  useEffect(() => {
    keyboardDidShowListener.current = Keyboard.addListener(
      'keyboardDidShow',
      () => scrollToBottom(false)
    );
    keyboardDidHideListener.current = Keyboard.addListener(
      'keyboardDidHide',
      () => scrollToBottom(true)
    );

    return () => {
      keyboardDidShowListener.current?.remove();
      keyboardDidHideListener.current?.remove();
    };
  }, [scrollToBottom]);

  // Handlers
  const handleSendMessage = useCallback(() => {
    if (!inputText.trim() || !id || !currentUser) return;
    sendMessage(id as string, inputText.trim());
    setInputText('');
  }, [inputText, id, currentUser, sendMessage]);

  const handleSendHeart = useCallback(() => {
    if (!id || !currentUser) return;
    heartScale.value = withSpring(
      1.4,
      {},
      () => (heartScale.value = withSpring(1))
    );
    sendMessage(id as string, '❤️');
  }, [id, currentUser, sendMessage, heartScale]);

  const handlePickImage = useCallback(async () => {
    if (!id || !currentUser) return;
    setShowAttachMenu(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted')
      return toastService.show('Permission needed', 'Grant photo access');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingImage(true);
    try {
      const compressed = await imageCompressionService.compressChatImage(
        result.assets[0].uri
      );
      const url = await storageService.uploadChatImage(compressed.uri);
      await sendMessage(id as string, url);
      toastService.show('Photo sent', 'success');
    } catch (err) {
      toastService.show('Failed to send photo', 'error');
    } finally {
      setUploadingImage(false);
    }
  }, [id, currentUser, sendMessage]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <MessageItem message={item} theme={theme} />
    ),
    [theme]
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const headerStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: headerSlideAnim.value }],
      opacity: headerFadeAnim.value,
    }),
    []
  );

  const inputStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: inputSlideAnim.value }],
      opacity: inputFadeAnim.value,
    }),
    []
  );

  const heartStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: heartScale.value }],
    }),
    []
  );

  if (!otherUser && !loadingTimeout) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.text }]}>
            {t('chat.loading')}
          </Text>
        </View>
      </View>
    );
  }

  if (loadingTimeout && !otherUser) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.error }]}>
            {t('chat.errorLoading')}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>{t('common.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

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
          <TouchableOpacity onPress={() => setShowProfileDetail(true)}>
            {otherUser.image ? (
              <Image source={{ uri: otherUser.image }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: theme.surfaceVariant,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 20,
                    color: theme.textSecondary,
                    fontWeight: 'bold',
                  }}
                >
                  {otherUser.name?.[0] || '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {otherUser.name}
            </Text>
            <View style={styles.statusContainer}>
              {isOnline && (
                <View
                  style={[
                    styles.onlineIndicatorSmall,
                    { backgroundColor: '#4CAF50' },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.userStatus,
                  { color: isOnline ? '#4CAF50' : theme.textSecondary },
                ]}
              >
                {lastSeenText}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setShowOptionsMenu(true)}
          style={styles.actionButton}
        >
          <Ellipsis size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        extraData={theme}
        style={{ flex: 1 }}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={15}
        // === AUTO-SCROLL BEST PRACTICES ===
        onContentSizeChange={onContentSizeChange}
        onLayout={onLayout}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
      />

      {showIcebreakers && (
        <IcebreakerSuggestions
          currentUser={currentUser!}
          matchedUser={otherUser}
          onSelectIcebreaker={setInputText}
          visible
        />
      )}

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
            onPress={() => setShowAttachMenu((v) => !v)}
            style={styles.attachButton}
          >
            <Plus size={24} color={theme.primary} />
          </TouchableOpacity>
          <TextInput
            ref={textInputRef}
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
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
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
              color={
                inputText.trim() ? theme.textOnPrimary : theme.textSecondary
              }
            />
          </TouchableOpacity>
        </View>

        {showAttachMenu && (
          <Animated.View
            style={[
              styles.attachMenuBubble,
              { backgroundColor: theme.surface, shadowColor: theme.shadow },
            ]}
          >
            <View style={styles.attachMenuContent}>
              <TouchableOpacity
                style={[
                  styles.attachMenuButton,
                  { backgroundColor: theme.background },
                ]}
                onPress={handlePickImage}
              >
                <View
                  style={[
                    styles.attachIconCircle,
                    { backgroundColor: '#FF6B9D' },
                  ]}
                >
                  <ImageIcon size={22} color="#FFF" />
                </View>
                <Text style={[styles.attachButtonText, { color: theme.text }]}>
                  Photo
                </Text>
              </TouchableOpacity>
              <View
                style={[
                  styles.attachMenuDivider,
                  { backgroundColor: theme.border },
                ]}
              />
              <TouchableOpacity
                style={[
                  styles.attachMenuButton,
                  { backgroundColor: theme.background },
                ]}
                onPress={handleSendHeart}
              >
                <View
                  style={[
                    styles.attachIconCircle,
                    { backgroundColor: '#FF3B5C' },
                  ]}
                >
                  <Heart size={22} color="#FFF" />
                </View>
                <Text style={[styles.attachButtonText, { color: theme.text }]}>
                  Heart
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={[styles.bubbleArrow, { borderTopColor: theme.surface }]}
            />
          </Animated.View>
        )}
      </Animated.View>

      {/* Modals */}
      <Modal
        visible={showOptionsMenu}
        transparent
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
              onPress={() => {
                setShowOptionsMenu(false);
                setShowProfileDetail(true);
              }}
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
                setShowOptionsMenu(false);
                setShowUnmatchConfirm(true);
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

      {showProfileDetail && otherUser && (
        <View style={styles.modalOverlay}>
          <ProfileDetail
            user={otherUser}
            onClose={() => setShowProfileDetail(false)}
            onMessage={() => setShowProfileDetail(false)}
            onUnmatch={() => {
              setShowProfileDetail(false);
              setShowUnmatchConfirm(true);
            }}
            isMissedConnection={(conversation as any)?.isMissedConnection}
          />
        </View>
      )}

      <Modal
        visible={showUnmatchConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnmatchConfirm(false)}
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
              style={[styles.confirmationText, { color: theme.textSecondary }]}
            >
              {t('chat.unmatchConfirm', { name: otherUser?.name })}
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  styles.cancelButton,
                  { borderColor: theme.border },
                ]}
                onPress={() => setShowUnmatchConfirm(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  styles.deleteButton,
                  { backgroundColor: theme.error },
                ]}
                onPress={() => {
                  unmatchProfile(otherUser.id).then(() => router.back());
                  setShowUnmatchConfirm(false);
                }}
              >
                <Text style={styles.deleteButtonText}>
                  {t('common.unmatch')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <LoadingOverlay visible={uploadingImage} message="Uploading..." />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: { fontSize: 16, textAlign: 'center', marginBottom: 16 },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backButton: { padding: 8, marginRight: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600' },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  onlineIndicatorSmall: { width: 8, height: 8, borderRadius: 4 },
  userStatus: { fontSize: 12 },
  actionButton: { padding: 8 },
  messagesContent: { paddingVertical: 16, paddingHorizontal: 16 },
  messageContainer: { marginBottom: 16, maxWidth: '75%' },
  myMessageContainer: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  otherMessageContainer: { alignSelf: 'flex-start', alignItems: 'flex-start' },
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
  myMessage: { borderBottomRightRadius: 6 },
  otherMessage: { borderBottomLeftRadius: 6 },
  heartMessage: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    padding: 12,
    minHeight: 50,
    minWidth: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartText: { fontSize: 32, lineHeight: 36 },
  imageMessage: {
    backgroundColor: 'transparent',
    padding: 0,
    overflow: 'hidden',
  },
  messageImage: { width: 200, height: 200, borderRadius: 16 },
  messageText: { fontSize: 16, lineHeight: 22 },
  messageTime: { fontSize: 11, marginTop: 4 },
  myMessageTime: { textAlign: 'right' },
  otherMessageTime: { textAlign: 'left' },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    borderTopWidth: 1,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  attachButton: { padding: 8 },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 18,
    maxHeight: 100,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachMenuBubble: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 4,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    minWidth: 180,
  },
  attachMenuContent: { gap: 4 },
  attachMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  attachIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachButtonText: { fontSize: 16, fontWeight: '500', marginLeft: 12 },
  attachMenuDivider: { height: 1, marginHorizontal: 12, marginVertical: 4 },
  bubbleArrow: {
    position: 'absolute',
    bottom: -8,
    left: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  optionsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  optionText: { fontSize: 16, marginLeft: 12, fontWeight: '500' },
  optionDivider: { height: 1, marginHorizontal: 20 },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  centeredModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  confirmationButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: { borderWidth: 1 },
  cancelButtonText: { fontSize: 16, fontWeight: '500' },
  deleteButton: {},
  deleteButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});

export default ChatScreen;
