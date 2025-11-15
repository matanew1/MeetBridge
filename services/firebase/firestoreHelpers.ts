import {
  DocumentReference,
  DocumentSnapshot,
  getDoc,
} from 'firebase/firestore';
import cacheService from '../cacheService';

/**
 * Safe wrapper for getDoc that returns a DocumentSnapshot-like object.
 * If Firestore call fails due to offline errors, we'll try to return cached data
 * using cacheService (if a cacheKey is provided).
 */
export async function safeGetDoc<T = any>(
  ref: DocumentReference,
  cacheKey?: string,
  cacheTtlMs?: number
): Promise<
  | DocumentSnapshot<T>
  | { exists: () => boolean; id: string; data: () => T | undefined }
  | null
> {
  try {
    const snap = (await getDoc(ref as any)) as DocumentSnapshot<T>;
    // Optionally cache the doc data for offline fallbacks
    if (cacheKey && snap.exists()) {
      await cacheService.set(
        cacheKey,
        snap.data(),
        cacheTtlMs || 5 * 60 * 1000
      );
    }
    return snap;
  } catch (error: any) {
    // Check for common offline errors
    const message = String(error?.message || '');
    const isOffline =
      /client is offline|network error|offline|unavailable/i.test(message);
    if (isOffline && cacheKey) {
      // Try to return cached data in a minimal snapshot-like shape
      const cached = await cacheService.get<T>(cacheKey).catch(() => null);
      if (cached) {
        return {
          exists: () => true,
          id: (ref as any).id || cacheKey || '',
          data: () => cached,
        };
      }
    }

    // Re-throw if not offline or no cached data available
    throw error;
  }
}

export default { safeGetDoc };
