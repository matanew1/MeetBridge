// hooks/useRealtimeLikes.ts
import { useEffect, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { safeGetDoc } from '../services/firebase/firestoreHelpers';
import { useAuth } from '../contexts/AuthContext';
import toastService from '../services/toastService';
import { useTranslation } from 'react-i18next';

interface LikeUpdate {
  connectionId: string;
  userId: string;
  userName: string;
  likedBy: string[];
  likes: number;
}

export const useRealtimeLikes = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const previousLikesRef = useRef<Map<string, LikeUpdate>>(new Map());

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

      // Set up listeners for each connection's likes
      const unsubscribers: (() => void)[] = [];

      connectionIds.forEach((connectionId) => {
        const connectionRef = doc(db, 'missed_connections', connectionId);

        const unsubscribe = onSnapshot(
          connectionRef,
          { includeMetadataChanges: true },
          (snapshot) => {
            if (!snapshot.exists()) return;

            const data = snapshot.data();
            const currentLikes: LikeUpdate = {
              connectionId,
              userId: data.userId,
              userName: data.userName || 'Someone',
              likedBy: data.likedBy || [],
              likes: data.likes || 0,
            };

            // Check for new likes
            const previousLikeData = previousLikesRef.current.get(connectionId);
            if (previousLikeData) {
              const newLikes = currentLikes.likedBy.filter(
                (likerId) => !previousLikeData.likedBy.includes(likerId)
              );

              newLikes.forEach(async (likerId) => {
                if (likerId !== user.id) {
                  // Get liker name
                  try {
                    const likerDoc = await safeGetDoc(
                      doc(db, 'users', likerId),
                      `users:${likerId}`
                    );
                    const likerData = likerDoc.exists()
                      ? likerDoc.data()
                      : null;
                    const likerName = likerData?.name || 'Someone';

                    // Show like notification
                    toastService.info(
                      t('toasts.newLikeTitle'),
                      t('toasts.newLikeBody', { name: likerName })
                    );
                  } catch (error) {
                    console.warn('Failed to get liker name:', error);
                    // Show generic notification
                    toastService.info(
                      t('toasts.newLikeTitle'),
                      t('toasts.newLikeBody', { name: 'Someone' })
                    );
                  }
                }
              });
            }

            // Update previous likes reference
            previousLikesRef.current.set(connectionId, currentLikes);
          },
          (err) => {
            if (__DEV__) console.error('Likes listener error:', err);
          }
        );

        unsubscribers.push(unsubscribe);
      });

      if (__DEV__) {
        console.log(
          'Set up like listeners for connections:',
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
