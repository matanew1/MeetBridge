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
  KeyboardAvoidingView,
  Platform,
  Modal,
  Keyboard,
  StatusBar,
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
import { Audio } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore } from '../../store';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/theme';
import ProfileDetail from '../components/ProfileDetail';
import { LoadingOverlay } from '../components/ui';
import { usePresence } from '../../hooks/usePresence';
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
  index: number;
  theme: any;
}

const MessageItem: React.FC<MessageItemProps> = memo(
  ({ message, index, theme }) => {
    const messageAnim = useSharedValue(0);
    const fadeAnim = useSharedValue(0);

    const isHeartMessage = useMemo(() => message.text === '❤️', [message.text]);
    const isImageMessage = useMemo(() => {
      const text = message.text.trim();
      return (
        (text.startsWith('http://') || text.startsWith('https://')) &&
        (text.includes('cloudinary') ||
          text.match(/\.(jpg|jpeg|png|gif|webp)$/i))
      );
    }, [message.text]);

    React.useEffect(() => {
      // Disable animation for existing messages to reduce jumping
      const animationDelay = 0; // No delay for smooth rendering

      const messageTimer = setTimeout(() => {
        messageAnim.value = withSpring(1, {
          damping: 20, // Increased damping for smoother animation
          stiffness: 180,
        });
      }, animationDelay);

      const fadeTimer = setTimeout(() => {
        fadeAnim.value = withTiming(1, { duration: 300 }); // Reduced duration
      }, animationDelay);

      return () => {
        clearTimeout(messageTimer);
        clearTimeout(fadeTimer);
      };
    }, []); // Remove dependencies to prevent re-animation on re-render

    const messageStyle = useAnimatedStyle(
      () => ({
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
      }),
      [message.isFromCurrentUser]
    );

    const bubbleStyle = useMemo(
      () => [
        styles.messageBubble,
        isHeartMessage ? styles.heartMessage : null,
        isImageMessage ? styles.imageMessage : null,
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
      ],
      [
        isHeartMessage,
        isImageMessage,
        message.isFromCurrentUser,
        theme.primary,
        theme.surface,
      ]
    );

    const textStyle = useMemo(
      () => [
        styles.messageText,
        isHeartMessage ? styles.heartText : null,
        {
          color: isHeartMessage
            ? '#FF6B9D'
            : message.isFromCurrentUser
            ? '#FFF'
            : theme.text,
        },
      ],
      [isHeartMessage, message.isFromCurrentUser, theme.text]
    );

    const timeStyle = useMemo(
      () => [
        styles.messageTime,
        { color: theme.textSecondary },
        message.isFromCurrentUser
          ? styles.myMessageTime
          : styles.otherMessageTime,
      ],
      [message.isFromCurrentUser, theme.textSecondary]
    );

    const formattedTime = useMemo(
      () =>
        message.timestamp.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      [message.timestamp]
    );

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
  (prevProps, nextProps) => {
    // Only re-render if message content changes
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.text === nextProps.message.text &&
      prevProps.message.isFromCurrentUser ===
        nextProps.message.isFromCurrentUser &&
      prevProps.theme === nextProps.theme // IMPORTANT: Check theme changes for dark/light mode
    );
  }
);

const ChatScreen = () => {
  // Set current user's online status in Firestore when entering/leaving chat
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
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showIcebreakers, setShowIcebreakers] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const previousMessageCountRef = useRef(0);

  // Get real-time presence for the other user using Firestore directly
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeenText, setLastSeenText] = useState('');

  // Animation values
  const headerSlideAnim = useSharedValue(-50);
  const headerFadeAnim = useSharedValue(0);
  const inputSlideAnim = useSharedValue(50);
  const inputFadeAnim = useSharedValue(0);
  const heartScale = useSharedValue(1);

  // Memoized values for better performance
  const conversation = useMemo(
    () => conversations.find((conv) => conv.id === id),
    [conversations, id]
  );

  const otherUserId = useMemo(
    () =>
      conversation?.participants.find(
        (participantId) => participantId !== currentUser?.id
      ),
    [conversation?.participants, currentUser?.id]
  );

  const foundUser = useMemo(() => {
    console.log('🔍 Looking for user with ID:', otherUserId);
    console.log(
      '🔍 In matchedProfilesData:',
      matchedProfilesData?.map((p) => p.id)
    );
    console.log(
      '🔍 In discoverProfiles:',
      discoverProfiles?.map((p) => p.id)
    );

    if (!otherUserId) return null;

    const matchedUser = matchedProfilesData.find(
      (profile) => profile.id === otherUserId
    );
    const discoverUser = discoverProfiles.find(
      (profile) => profile.id === otherUserId
    );

    console.log('🔍 Found matched user:', matchedUser?.name);
    console.log('🔍 Found discover user:', discoverUser?.name);

    return matchedUser || discoverUser;
  }, [matchedProfilesData, discoverProfiles, otherUserId]);

  // Fetch user from Firestore if not found in local state (for missed connections)
  useEffect(() => {
    if (!otherUserId || foundUser) return;

    console.log(
      '🔍 User not found in local state, fetching from Firestore:',
      otherUserId
    );

    const fetchUser = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../../services/firebase/config');

        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const user = {
            id: userDoc.id,
            ...userData,
            createdAt: userData.createdAt?.toDate?.() || new Date(),
            updatedAt: userData.updatedAt?.toDate?.() || new Date(),
            dateOfBirth: userData.dateOfBirth?.toDate?.() || new Date(),
            lastSeen: userData.lastSeen?.toDate?.(),
          };
          console.log('✅ Fetched user from Firestore:', user.name);
          setOtherUser(user);
        } else {
          console.error('❌ User not found in Firestore:', otherUserId);
        }
      } catch (error) {
        console.error('❌ Error fetching user from Firestore:', error);
      }
    };

    fetchUser();
  }, [otherUserId, foundUser]);

  // Set active chat to suppress notifications while in this chat
  useEffect(() => {
    if (otherUserId) {
      notificationService.setActiveChat(otherUserId as string);
    }
    return () => {
      notificationService.clearActiveChat();
    };
  }, [otherUserId]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const { doc, updateDoc } = require('firebase/firestore');
    const { db } = require('../../services/firebase/config');
    const userDocRef = doc(db, 'users', currentUser.id);
    // Set online true on mount
    updateDoc(userDocRef, { isOnline: true }).catch((err) => {
      console.error('Failed to set online status:', err);
    });
    // Set online false on unmount
    return () => {
      updateDoc(userDocRef, { isOnline: false }).catch((err) => {
        console.error('Failed to unset online status:', err);
      });
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!otherUserId) return;
    const { doc, onSnapshot } = require('firebase/firestore');
    const { db } = require('../../services/firebase/config');
    const userDocRef = doc(db, 'users', otherUserId);
    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          setIsOnline(userData.isOnline || false);
          // Format lastSeen as text
          let lastSeen =
            userData.lastSeen?.toDate?.() ||
            (userData.lastSeen?.seconds
              ? new Date(userData.lastSeen.seconds * 1000)
              : null);
          if (lastSeen) {
            const now = new Date();
            const diff = Math.floor(
              (now.getTime() - lastSeen.getTime()) / 1000
            );
            if (userData.isOnline) {
              setLastSeenText('Online');
            } else if (diff < 60) {
              setLastSeenText('Last seen just now');
            } else if (diff < 3600) {
              setLastSeenText(`Last seen ${Math.floor(diff / 60)} min ago`);
            } else if (diff < 86400) {
              setLastSeenText(`Last seen ${Math.floor(diff / 3600)} hr ago`);
            } else {
              setLastSeenText(`Last seen ${Math.floor(diff / 86400)} days ago`);
            }
          } else {
            setLastSeenText('Offline');
          }
        }
      },
      (error: any) => {
        if (error?.code === 'permission-denied') {
          console.log(
            '⚠️ User status listener permission denied (user logged out)'
          );
          return;
        }
        console.error('❌ Error in user status listener:', error);
      }
    );
    return () => unsubscribe();
  }, [otherUserId]);

  // Add timeout effect to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('⏰ Loading timeout reached');
      setLoadingTimeout(true);
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, []);

  // Load message sound effect
  useEffect(() => {
    // Skip audio on web platform
    if (Platform.OS === 'web') {
      console.log('📱 Audio not available on web platform');
      return;
    }

    const loadSound = async () => {
      try {
        // Check if Audio is available
        if (!Audio || !Audio.Sound) {
          console.warn(
            '⚠️ Audio module not available, skipping sound initialization'
          );
          return;
        }

        // Set audio mode for iOS
        if (Platform.OS === 'ios' && Audio.setAudioModeAsync) {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
          });
        }

        // Load the audio file
        const audioSource = require('../../assets/audios/message.mp3');
        soundRef.current = new Audio.Sound();
        await soundRef.current.loadAsync(audioSource);
        console.log('🔊 Message sound loaded successfully');
      } catch (error) {
        console.error('❌ Error loading message sound:', error);
      }
    };

    loadSound();

    return () => {
      // Cleanup sound on unmount
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch((error) => {
          console.error('❌ Error unloading sound:', error);
        });
      }
    };
  }, []);

  // Add cleanup effect for better memory management
  useEffect(() => {
    return () => {
      // Cancel any pending animations on unmount
      headerSlideAnim.value = -50;
      headerFadeAnim.value = 0;
      inputSlideAnim.value = 50;
      inputFadeAnim.value = 0;
      heartScale.value = 1;
    };
  }, []);

  // Keyboard listeners for auto-scrolling
  useEffect(() => {
    // Skip keyboard listeners on web platform
    if (Platform.OS === 'web') {
      return;
    }

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Auto-scroll when keyboard appears
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        // Scroll to bottom when keyboard hides (important for after sending message)
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Initialize and manage component state more efficiently
  useEffect(() => {
    let isMounted = true;

    // Start animations only if component is still mounted
    if (isMounted) {
      headerSlideAnim.value = withSpring(0, { damping: 20, stiffness: 180 });
      headerFadeAnim.value = withTiming(1, { duration: 400 });
      inputSlideAnim.value = withSpring(0, { damping: 20, stiffness: 180 });
      inputFadeAnim.value = withTiming(1, { duration: 400 });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Separate effect for data initialization
  useEffect(() => {
    console.log('🔍 Chat Debug - Data initialization check:');
    console.log('🔍 conversation:', conversation);
    console.log('🔍 currentUser:', currentUser);
    console.log('🔍 foundUser:', foundUser);
    console.log('🔍 id:', id);
    console.log('🔍 conversations:', conversations?.length);
    console.log('🔍 matchedProfilesData:', matchedProfilesData?.length);
    console.log('🔍 discoverProfiles:', discoverProfiles?.length);

    if (conversation && currentUser && foundUser) {
      console.log('✅ All conditions met, setting otherUser');
      setOtherUser(foundUser);

      // Don't set messages here - let real-time listener handle it
      // This prevents conflicts between store data and Firestore data

      // Mark messages as read (debounced)
      // Safety check: ensure messages array exists and is an array
      if (
        conversation.messages &&
        Array.isArray(conversation.messages) &&
        conversation.messages.length > 0
      ) {
        const unreadMessageIds = conversation.messages
          .filter((msg) => !msg.isRead && msg.senderId !== currentUser.id)
          .map((msg) => msg.id);

        if (unreadMessageIds.length > 0) {
          // Batch read operations for better performance
          requestAnimationFrame(() => {
            markMessagesAsRead(conversation.id, unreadMessageIds);
          });
        }
      } else {
        console.log(
          'ℹ️ No messages to mark as read yet (conversation just started or messages not loaded)'
        );
      }
    } else {
      console.log('❌ Missing required data for chat initialization');
      if (!conversation) console.log('❌ Missing conversation');
      if (!currentUser) console.log('❌ Missing currentUser');
      if (!foundUser) console.log('❌ Missing foundUser');
    }
  }, [conversation, currentUser, foundUser, markMessagesAsRead]);

  // Real-time message listener
  useEffect(() => {
    if (!id || !currentUser) return;

    console.log('🔔 Setting up real-time message listener for:', id);

    const {
      collection,
      query,
      orderBy,
      onSnapshot,
    } = require('firebase/firestore');
    const { db } = require('../../services/firebase/config');

    // Listen to messages collection
    const messagesQuery = query(
      collection(db, 'conversations', id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      async (snapshot: any) => {
        const newMessages: Message[] = snapshot.docs.map((doc: any) => {
          const data = doc.data();
          const timestamp =
            data.createdAt?.toDate?.() ||
            (data.createdAt?.seconds
              ? new Date(data.createdAt.seconds * 1000)
              : new Date());

          return {
            id: doc.id,
            text: data.text,
            timestamp,
            isFromCurrentUser: data.senderId === currentUser.id,
          };
        });

        console.log(
          `📨 Received ${newMessages.length} messages from Firestore`
        );
        console.log('📨 Message IDs:', newMessages.map((m) => m.id).join(', '));

        // Check if there's a new message from the other user
        const hasNewMessageFromOther =
          newMessages.length > previousMessageCountRef.current &&
          newMessages.length > 0 &&
          !newMessages[newMessages.length - 1].isFromCurrentUser;

        // Play sound if new message received from other user
        if (hasNewMessageFromOther && soundRef.current) {
          try {
            // Reset to beginning and play
            await soundRef.current.setPositionAsync(0);
            await soundRef.current.playAsync();
            console.log('🔊 Playing message received sound');
          } catch (error) {
            console.error('❌ Error playing sound:', error);
          }
        }

        // Update previous message count
        previousMessageCountRef.current = newMessages.length;

        // Update messages from Firestore (single source of truth)
        setMessages(newMessages);

        // Show icebreakers only if there are no messages yet
        setShowIcebreakers(newMessages.length === 0);

        // Scroll to bottom when messages are loaded or updated
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 50);
      },
      (error: any) => {
        if (error?.code === 'permission-denied') {
          console.log(
            '⚠️ Message listener permission denied (user logged out)'
          );
          return;
        }
        console.error('❌ Error in message listener:', error);
      }
    );

    return () => {
      console.log('🔕 Cleaning up message listener');
      unsubscribe();
    };
  }, [id, currentUser?.id]);

  // Real-time unmatch listener
  useEffect(() => {
    if (!conversation?.matchId) return;

    console.log('🔔 Setting up real-time unmatch listener');

    const { doc, onSnapshot } = require('firebase/firestore');
    const { db } = require('../../services/firebase/config');

    const matchDocRef = doc(db, 'matches', conversation.matchId);

    const unsubscribe = onSnapshot(
      matchDocRef,
      (snapshot: any) => {
        if (!snapshot.exists()) {
          console.log('🚫 Match document deleted - unmatch detected!');

          // Update store to remove unmatched user
          if (otherUserId) {
            console.log(`🚫 Removing ${otherUserId} from store`);
            useUserStore.setState((state) => ({
              matchedProfiles: (state.matchedProfiles || []).filter(
                (id) => id !== otherUserId
              ),
              matchedProfilesData: (state.matchedProfilesData || []).filter(
                (profile) => profile.id !== otherUserId
              ),
              likedProfiles: (state.likedProfiles || []).filter(
                (id) => id !== otherUserId
              ),
              likedProfilesData: (state.likedProfilesData || []).filter(
                (profile) => profile.id !== otherUserId
              ),
              conversations: (state.conversations || []).filter(
                (conv) => !conv.participants?.includes(otherUserId)
              ),
            }));
          }

          toastService.show(t('chat.unmatchTitle'), t('chat.unmatchDetected')); // Replaced Alert.alert with toastService.show

          return;
        }

        const data = snapshot.data();
        if (data?.unmatched) {
          console.log('🚫 Match unmatched - redirecting');

          // Update store to remove unmatched user
          if (otherUserId) {
            console.log(`🚫 Removing ${otherUserId} from store`);
            useUserStore.setState((state) => ({
              matchedProfiles: state.matchedProfiles.filter(
                (id) => id !== otherUserId
              ),
              matchedProfilesData: state.matchedProfilesData.filter(
                (profile) => profile.id !== otherUserId
              ),
              likedProfiles: state.likedProfiles.filter(
                (id) => id !== otherUserId
              ),
              likedProfilesData: state.likedProfilesData.filter(
                (profile) => profile.id !== otherUserId
              ),
              conversations: state.conversations.filter(
                (conv) => !conv.participants.includes(otherUserId)
              ),
            }));
          }

          toastService.show(t('chat.unmatchTitle'), t('chat.unmatchDetected')); // Replaced Alert.alert with toastService.show
        }
      },
      (error: any) => {
        if (error?.code === 'permission-denied') {
          console.log(
            '⚠️ Unmatch listener permission denied (user logged out)'
          );
          return;
        }
        console.error('❌ Error in unmatch listener:', error);
      }
    );

    return () => {
      console.log('🔕 Cleaning up unmatch listener');
      unsubscribe();
    };
  }, [conversation?.matchId, router, t]);

  // Real-time presence listener for other user's online status
  useEffect(() => {
    if (!otherUserId) return;

    console.log('👁️ Setting up real-time presence listener for:', otherUserId);

    const { doc, onSnapshot } = require('firebase/firestore');
    const { db } = require('../../services/firebase/config');

    const userDocRef = doc(db, 'users', otherUserId);

    console.log('👁️ isonline', userDocRef);

    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot: any) => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          const isOnline = userData.isOnline || false;
          const lastSeen =
            userData.lastSeen?.toDate?.() ||
            (userData.lastSeen?.seconds
              ? new Date(userData.lastSeen.seconds * 1000)
              : null);

          console.log(`👁️ Presence update for ${otherUserId}:`, {
            isOnline,
            lastSeen: lastSeen?.toISOString(),
          });

          // Update otherUser state with fresh presence data
          setOtherUser((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              isOnline,
              lastSeen,
            };
          });
        }
      },
      (error: any) => {
        if (error?.code === 'permission-denied') {
          console.log(
            '⚠️ Presence listener permission denied (user logged out)'
          );
          return;
        }
        console.error('❌ Error in presence listener:', error);
      }
    );

    return () => {
      console.log('🔕 Cleaning up presence listener');
      unsubscribe();
    };
  }, [otherUserId]);

  // Show icebreakers for empty conversations
  useEffect(() => {
    if (messages.length === 0 && currentUser && otherUser) {
      setShowIcebreakers(true);
    } else {
      setShowIcebreakers(false);
    }
  }, [messages.length, currentUser, otherUser]);

  // Memoized animation styles
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

  const heartAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: heartScale.value }],
    }),
    []
  );

  // Optimized message handlers with useCallback
  const handleSendMessage = useCallback(() => {
    if (inputText.trim() && id && currentUser) {
      const messageText = inputText.trim();

      // Clear input immediately for better UX
      setInputText('');

      // Blur the TextInput to dismiss keyboard
      textInputRef.current?.blur();

      // Also call Keyboard.dismiss as backup
      Keyboard.dismiss();

      // Send message to Firestore - real-time listener will update UI
      sendMessage(id as string, messageText);

      // Multiple scroll attempts with increasing delays to ensure scrolling after:
      // 1. Keyboard dismissal animation
      // 2. Message arrives from Firestore
      // 3. Message renders in FlatList
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 400);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 700);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 1000);
    }
  }, [inputText, id, currentUser, sendMessage]);

  const handleSendHeart = useCallback(() => {
    if (id && currentUser) {
      setShowAttachMenu(false);

      // Optimized heart animation
      heartScale.value = withSpring(
        1.4,
        { damping: 12, stiffness: 200 },
        () => {
          heartScale.value = withSpring(1, { damping: 15, stiffness: 250 });
        }
      );

      // Send heart to Firestore - real-time listener will update UI
      sendMessage(id as string, '❤️');

      // Scroll to bottom after a short delay to ensure message is rendered
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [id, currentUser, sendMessage, heartScale]);

  const handleViewProfile = useCallback(() => {
    setShowOptionsMenu(false);
    setShowProfileDetail(true);
  }, []);

  const handleUnmatch = useCallback(() => {
    console.log('🔴 handleUnmatch called');
    console.log('🔴 otherUser:', otherUser);
    console.log('🔴 Current user:', currentUser);
    setShowOptionsMenu(false);
    setShowUnmatchConfirm(true);
  }, [otherUser, currentUser]);

  const confirmUnmatch = useCallback(() => {
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
  }, [otherUser, unmatchProfile, router]);

  const cancelUnmatch = useCallback(() => {
    console.log('🔴 cancelUnmatch called');
    setShowUnmatchConfirm(false);
  }, []);

  const handleMessageFromProfile = useCallback(() => {
    setShowProfileDetail(false);
    // Already in chat, so just close the modal
  }, []);

  const handlePickImage = useCallback(async () => {
    if (!id || !currentUser) return;

    setShowAttachMenu(false);

    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        toastService.show(
          'Permission needed',
          'Please grant photo library access'
        );
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);

        // Compress image
        const compressionResult =
          await imageCompressionService.compressChatImage(result.assets[0].uri);

        console.log('📷 Compressed image URI:', compressionResult.uri);

        // Upload to storage
        const imageUrl = await storageService.uploadChatImage(
          compressionResult.uri
        );

        // Send image message - just send the URL directly
        await sendMessage(id as string, imageUrl);

        setUploadingImage(false);
        toastService.show('Photo sent', 'success');
      }
    } catch (error) {
      console.error('Error sending photo:', error);
      setUploadingImage(false);
      toastService.show('Failed to send photo', 'error');
    }
  }, [id, currentUser, sendMessage]);

  // Optimized render function for FlatList
  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => (
      <MessageItem message={item} index={index} theme={theme} />
    ),
    [theme]
  );

  // Memoized key extractor for better FlatList performance
  const keyExtractor = useCallback((item: Message) => item.id, []);

  // FlatList optimization methods
  const getItemLayout = useCallback(
    (data: Message[] | null | undefined, index: number) => ({
      length: 70, // Estimated item height
      offset: 70 * index,
      index,
    }),
    []
  );

  const onContentSizeChange = useCallback(() => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  // Memoized modal handlers
  const closeOptionsMenu = useCallback(() => setShowOptionsMenu(false), []);
  const closeProfileDetail = useCallback(() => setShowProfileDetail(false), []);

  // Memoized loading component
  const LoadingComponent = useMemo(
    () => (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.background}
        />
        <View style={styles.loadingContainer}>
          {loadingTimeout ? (
            <>
              <Text style={[styles.loadingText, { color: theme.error }]}>
                {t('chat.errorLoading')}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  setLoadingTimeout(false);
                  router.back();
                }}
              >
                <Text style={styles.retryButtonText}>{t('common.goBack')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={[styles.loadingText, { color: theme.text }]}>
              {t('chat.loading')}
            </Text>
          )}
        </View>
      </View>
    ),
    [
      theme.background,
      theme.text,
      theme.error,
      theme.primary,
      t,
      loadingTimeout,
      router,
      isDarkMode,
    ]
  );

  if (!otherUser && !loadingTimeout) {
    return LoadingComponent;
  }

  if (loadingTimeout && !otherUser) {
    return LoadingComponent;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
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
            <TouchableOpacity onPress={handleViewProfile} activeOpacity={0.7}>
              {otherUser.image && otherUser.image.trim() !== '' ? (
                <Image
                  source={{ uri: otherUser.image }}
                  style={styles.avatar}
                />
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
                    {otherUser.name?.charAt(0) || '?'}
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
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                console.log('🔴 Three dots menu pressed');
                setShowOptionsMenu(true);
              }}
            >
              <Ellipsis size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          extraData={theme}
          getItemLayout={getItemLayout}
          style={[styles.messagesList, { backgroundColor: theme.background }]}
          contentContainerStyle={[
            styles.messagesContent,
            {
              paddingBottom: Platform.OS === 'android' ? keyboardHeight : 0,
            },
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={onContentSizeChange}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => Keyboard.dismiss()}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={15}
          updateCellsBatchingPeriod={50}
          disableVirtualization={false}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
        />

        {/* Icebreaker Suggestions - show only for empty chats */}
        {showIcebreakers && currentUser && otherUser && (
          <IcebreakerSuggestions
            currentUser={currentUser}
            matchedUser={otherUser}
            onSelectIcebreaker={(text) => {
              setInputText(text);
              setShowIcebreakers(false);
            }}
            visible={showIcebreakers}
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
              style={styles.attachButton}
              onPress={() => setShowAttachMenu(!showAttachMenu)}
              activeOpacity={0.7}
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
              numberOfLines={1}
              textAlign="left"
              blurOnSubmit={true}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
              onFocus={() => {
                setShowAttachMenu(false);
                // Scroll to bottom when input is focused
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 300);
              }}
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

          {/* Attachment Menu */}
          {showAttachMenu && (
            <Animated.View
              style={[
                styles.attachMenuBubble,
                {
                  backgroundColor: theme.surface,
                  shadowColor: theme.shadow,
                },
              ]}
            >
              <View style={styles.attachMenuContent}>
                <TouchableOpacity
                  style={[
                    styles.attachMenuButton,
                    { backgroundColor: theme.background },
                  ]}
                  onPress={handlePickImage}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.attachIconCircle,
                      { backgroundColor: '#FF6B9D' },
                    ]}
                  >
                    <ImageIcon size={22} color="#FFF" />
                  </View>
                  <Text
                    style={[styles.attachButtonText, { color: theme.text }]}
                  >
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
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.attachIconCircle,
                      { backgroundColor: '#FF3B5C' },
                    ]}
                  >
                    <Heart size={22} color="#FFF" />
                  </View>
                  <Text
                    style={[styles.attachButtonText, { color: theme.text }]}
                  >
                    Heart
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Arrow pointer */}
              <View
                style={[styles.bubbleArrow, { backgroundColor: theme.surface }]}
              />
            </Animated.View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={closeOptionsMenu}
      >
        <TouchableOpacity
          style={styles.optionsModalOverlay}
          activeOpacity={1}
          onPress={closeOptionsMenu}
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
            onClose={closeProfileDetail}
            onLike={() => {}}
            onDislike={() => {}}
            onMessage={handleMessageFromProfile}
            onUnmatch={handleUnmatch}
            isMissedConnection={(conversation as any)?.isMissedConnection}
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
                  <Text style={[styles.deleteButtonText, { color: '#FFF' }]}>
                    {t('common.unmatch')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Loading Overlay for Image Upload */}
      <LoadingOverlay visible={uploadingImage} message="Uploading image..." />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    // color will be set from theme.textOnPrimary
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 12, // Add top padding for iOS notch
    paddingBottom: 12,
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  onlineIndicatorSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    maxWidth: '75%', // 75% of screen width
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
    lineHeight: 22,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  heartMessage: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 50,
    minWidth: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartText: {
    fontSize: 32,
    lineHeight: 36,
    textAlign: 'center',
  },
  imageMessage: {
    backgroundColor: 'transparent',
    padding: 0,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
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
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12, // Extra padding for iOS home indicator
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
  attachMenu: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  attachMenuItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  attachMenuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachMenuText: {
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 18,
    lineHeight: 24,
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
    // color will be set from theme.textOnPrimary or white
  },
  attachMenuBubble: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    minWidth: 180,
  },
  attachMenuContent: {
    gap: 4,
  },
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
  attachButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    color: '#1A1A1A',
  },
  attachMenuDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 12,
    marginVertical: 4,
  },
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
    borderTopColor: '#FFFFFF',
  },
});

export default ChatScreen;
