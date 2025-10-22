import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    // keep existing call but no-op if not present
    window.frameworkReady?.();
  });
}
