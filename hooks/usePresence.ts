// hooks/usePresence.ts
import { useState, useEffect, useCallback } from 'react';
import presenceService from '../services/presenceService';

interface PresenceState {
  isOnline: boolean;
  lastSeen: Date | null;
  lastSeenText: string;
  isRecentlyActive: boolean;
}

/**
 * Custom hook to monitor a user's online/offline presence
 * @param userId - The ID of the user to monitor
 * @returns Presence state and utility functions
 */
export const usePresence = (
  userId: string | null | undefined
): PresenceState => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsOnline(false);
      setLastSeen(null);
      return;
    }

    console.log(`👁️ Listening to presence for user: ${userId}`);

    // Listen to real-time presence updates
    const unsubscribe = presenceService.listenToUserPresence(
      userId,
      (online, lastSeenDate) => {
        setIsOnline(online);
        setLastSeen(lastSeenDate);
      }
    );

    // Initial fetch
    presenceService.getUserPresence(userId).then(({ isOnline, lastSeen }) => {
      setIsOnline(isOnline);
      setLastSeen(lastSeen);
    });

    return () => {
      console.log(`🛑 Stopped listening to presence for user: ${userId}`);
      unsubscribe();
    };
  }, [userId]);

  // Get formatted last seen text
  const lastSeenText = presenceService.getLastSeenText(lastSeen, isOnline);

  // Check if user was recently active
  const isRecentlyActive = presenceService.isRecentlyActive(lastSeen);

  return {
    isOnline,
    lastSeen,
    lastSeenText,
    isRecentlyActive,
  };
};

/**
 * Custom hook to monitor multiple users' presence
 * @param userIds - Array of user IDs to monitor
 * @returns Map of user IDs to their presence states
 */
export const useMultiplePresence = (
  userIds: (string | null | undefined)[]
): Map<string, PresenceState> => {
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceState>>(
    new Map()
  );

  useEffect(() => {
    const validUserIds = userIds.filter(
      (id): id is string => typeof id === 'string'
    );

    if (validUserIds.length === 0) {
      setPresenceMap(new Map());
      return;
    }

    console.log(`👁️ Listening to presence for ${validUserIds.length} users`);

    const unsubscribes: (() => void)[] = [];

    validUserIds.forEach((userId) => {
      const unsubscribe = presenceService.listenToUserPresence(
        userId,
        (isOnline, lastSeen) => {
          setPresenceMap((prev) => {
            const newMap = new Map(prev);
            const lastSeenText = presenceService.getLastSeenText(
              lastSeen,
              isOnline
            );
            const isRecentlyActive = presenceService.isRecentlyActive(lastSeen);

            newMap.set(userId, {
              isOnline,
              lastSeen,
              lastSeenText,
              isRecentlyActive,
            });

            return newMap;
          });
        }
      );

      unsubscribes.push(unsubscribe);

      // Initial fetch
      presenceService.getUserPresence(userId).then(({ isOnline, lastSeen }) => {
        setPresenceMap((prev) => {
          const newMap = new Map(prev);
          const lastSeenText = presenceService.getLastSeenText(
            lastSeen,
            isOnline
          );
          const isRecentlyActive = presenceService.isRecentlyActive(lastSeen);

          newMap.set(userId, {
            isOnline,
            lastSeen,
            lastSeenText,
            isRecentlyActive,
          });

          return newMap;
        });
      });
    });

    return () => {
      console.log(
        `🛑 Stopped listening to presence for ${validUserIds.length} users`
      );
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [userIds.join(',')]);

  return presenceMap;
};

export default usePresence;
