// hooks/useRealtimeConversations.ts
import { useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { useUserStore } from '../store';
import { Conversation } from '../types/chat';

export const useRealtimeConversations = (userId?: string) => {
  const setConversations = useUserStore((s) => s.setConversations);

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
                  timestamp: d.lastMessage.createdAt?.toDate?.() || new Date(),
                }
              : undefined,
            unreadCount: d.unreadCount?.[userId] || 0,
            isMissedConnection: d.isMissedConnection || false,
          };
        });

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
  }, [userId, setConversations]);
};
