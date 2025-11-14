// hooks/useChatData.ts
import { useEffect } from 'react';
import { useUserStore } from '../store';
import { useFocusEffect } from '@react-navigation/native';
import { useRealtimeConversations } from './useRealtimeConversations';
import { useCallback } from 'react';

export const useChatData = () => {
  const {
    currentUser,
    loadMatches,
    loadDiscoverProfiles,
    discoverProfiles,
    loadConversations,
  } = useUserStore();

  // Load static data once
  useEffect(() => {
    loadMatches();
    if (!discoverProfiles.length) loadDiscoverProfiles(true);
  }, [loadMatches, loadDiscoverProfiles, discoverProfiles.length]);

  // Real-time listener
  const unsubscribe = useRealtimeConversations(currentUser?.id);

  // Refresh on focus if stale (>30s)
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const lastFetched = useUserStore.getState().lastFetchedConversations || 0;
      if (now - lastFetched > 30_000) {
        loadConversations();
        useUserStore.setState({ lastFetchedConversations: now });
      }
    }, [loadConversations])
  );

  return { unsubscribe };
};
