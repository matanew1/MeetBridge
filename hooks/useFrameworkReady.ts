import { useEffect } from 'react';
import { discoveryService } from '../services';

declare global {
  interface Window {
    frameworkReady?: () => void;
    clearInteractionCache?: (userId: string) => Promise<void>;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    // Expose clearInteractionCache globally for debugging
    window.clearInteractionCache = async (userId: string) => {
      try {
        await discoveryService.clearInteractionCache(userId);
        console.log('✅ Interaction cache cleared for user:', userId);
      } catch (error) {
        console.error('❌ Failed to clear interaction cache:', error);
      }
    };

    // keep existing call but no-op if not present
    window.frameworkReady?.();
  });
}
