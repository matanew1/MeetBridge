// hooks/useRealtimeConversations.ts
import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { safeGetDoc } from '../services/firebase/firestoreHelpers';
import { db } from '../services/firebase/config';
import { useUserStore } from '../store';
import { Conversation } from '../store/types';
import toastService from '../services/toastService';
import i18n from '../i18n';
import { usePathname } from 'expo-router';

export const useRealtimeConversations = (userId?: string) => {
  const setConversations = useUserStore((s) => s.setConversations);
  const previousConversationsRef = useRef<Conversation[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId)
    );

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const data: Conversation[] = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            participants: d.participants || [],
            createdAt: d.createdAt?.toDate?.() || new Date(),
            updatedAt: d.updatedAt?.toDate?.() || new Date(),
            lastMessage: d.lastMessage
              ? {
                  text: d.lastMessage.text || '',
                  senderId: d.lastMessage.senderId || '',
                  createdAt: d.lastMessage.createdAt?.toDate?.() || new Date(),
                }
              : undefined,
            messages: d.messages || [],
            unreadCount: d.unreadCount || { [userId || '']: 0 },
            isMissedConnection: d.isMissedConnection || false,
          };
        });

        // Check for new messages and show notifications
        const previousConversations = previousConversationsRef.current;
        data.forEach(async (conversation) => {
          const previousConversation = previousConversations.find(
            (prev) => prev.id === conversation.id
          );

          // If conversation has unread messages and wasn't previously tracked or had fewer unread messages
          const unreadNow = conversation.unreadCount?.[userId || ''] || 0;
          const unreadPrev =
            previousConversation?.unreadCount?.[userId || ''] || 0;
          if (
            unreadNow > 0 &&
            conversation.lastMessage &&
            conversation.lastMessage.senderId !== userId && // Not from current user
            (!previousConversation || unreadPrev < unreadNow)
          ) {
            // Skip toast if user is currently viewing this chat
            const isInChat = pathname === `/chat/${conversation.id}`;
            if (isInChat) {
              if (__DEV__)
                console.log(
                  'Skipping toast - user is in chat:',
                  conversation.id
                );
              return;
            }

            // Get the other participant's name (not the current user)
            const otherParticipantId = conversation.participants.find(
              (id) => id !== userId
            );

            // Try to resolve the other participant's display name
            let otherName = 'someone';
            try {
              if (otherParticipantId) {
                const snap = await safeGetDoc(
                  doc(db, 'users', otherParticipantId),
                  `user_${otherParticipantId}`
                );
                const u =
                  snap && typeof snap.exists === 'function' && snap.exists()
                    ? snap.data()
                    : null;
                otherName =
                  (u && (u as any).name) || otherParticipantId || otherName;
              }
            } catch (e) {
              // Best-effort fallback to id
              console.warn('Failed to fetch other participant name', e);
            }

            // Show message notification with name instead of id
            toastService.info(
              i18n.t('toasts.newMessageTitle'),
              i18n.t('toasts.newMessageBody', { name: otherName })
            );
          }
        });

        // Update previous conversations reference
        previousConversationsRef.current = data;

        // Sort by latest message
        data.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        setConversations(data);

        if (__DEV__) {
          console.log('Realtime conv update:', data.length);
        }
      },
      (err) => {
        if (__DEV__) console.error('Conversation listener error:', err);
      }
    );

    return unsub;
  }, [userId, setConversations, pathname]);
};
