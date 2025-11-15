// hooks/useRealtimeComments.ts
import { useEffect, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { useAuth } from '../contexts/AuthContext';
import toastService from '../services/toastService';
import { useTranslation } from 'react-i18next';

interface Comment {
  id: string;
  connectionId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
  isAnonymous: boolean;
}

export const useRealtimeComments = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const previousCommentsRef = useRef<Map<string, Comment[]>>(new Map());

  useEffect(() => {
    if (!user?.id) return;

    // First, get all missed connections owned by the user
    const getUserConnections = async () => {
      const connectionsQuery = query(
        collection(db, 'missed_connections'),
        where('userId', '==', user.id)
      );

      const connectionsSnapshot = await getDocs(connectionsQuery);
      const connectionIds = connectionsSnapshot.docs.map((doc) => doc.id);

      // Set up listeners for each connection's comments
      const unsubscribers: (() => void)[] = [];

      connectionIds.forEach((connectionId) => {
        const commentsQuery = query(
          collection(db, 'missed_connections', connectionId, 'comments')
        );

        const unsubscribe = onSnapshot(
          commentsQuery,
          { includeMetadataChanges: true },
          (snapshot) => {
            const comments: Comment[] = snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                connectionId,
                userId: data.userId,
                userName: data.userName || 'Anonymous',
                text: data.text || '',
                createdAt: data.createdAt?.toDate?.() || new Date(),
                isAnonymous: data.isAnonymous || false,
              };
            });

            // Check for new comments
            const previousComments =
              previousCommentsRef.current.get(connectionId) || [];
            comments.forEach((comment) => {
              const isNewComment = !previousComments.some(
                (prev) => prev.id === comment.id
              );

              if (isNewComment && comment.userId !== user.id) {
                // Show comment notification (exclude own comments)
                toastService.info(
                  t('toasts.newCommentTitle'),
                  t('toasts.newCommentBody', { name: comment.userName })
                );
              }
            });

            // Update previous comments reference
            previousCommentsRef.current.set(connectionId, comments);
          },
          (err) => {
            if (__DEV__) console.error('Comments listener error:', err);
          }
        );

        unsubscribers.push(unsubscribe);
      });

      if (__DEV__) {
        console.log(
          'Set up comment listeners for connections:',
          connectionIds.length
        );
      }

      return () => {
        unsubscribers.forEach((unsub) => unsub());
      };
    };

    getUserConnections();
  }, [user?.id]);
};
