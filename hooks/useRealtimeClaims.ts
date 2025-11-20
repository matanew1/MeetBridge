// hooks/useRealtimeClaims.ts
import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { safeGetDoc } from '../services/firebase/firestoreHelpers';
import { db } from '../services/firebase/config';
import { useAuth } from '../contexts/AuthContext';
import toastService from '../services/toastService';
import { useTranslation } from 'react-i18next';

interface Claim {
  id: string;
  connectionId: string;
  claimerId: string;
  claimerName: string;
  claimerImage?: string;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

export const useRealtimeClaims = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const previousClaimsRef = useRef<Claim[]>([]);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!user?.id) return;

    // Listen for claims on the user's missed connections posts
    const q = query(
      collection(db, 'missed_connection_claims'),
      where('status', '==', 'pending') // Only listen for pending claims
    );

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      async (snapshot) => {
        const claims: Claim[] = [];

        // Filter claims where the current user is the post owner
        for (const docSnap of snapshot.docs) {
          const claimData = docSnap.data();

          // Get the connection to check ownership
          let connectionDoc: any = null;
          try {
            connectionDoc = await safeGetDoc(
              doc(db, 'missed_connections', claimData.connectionId),
              `missed_connection_${claimData.connectionId}`
            );
          } catch (e) {
            console.warn('Failed to fetch connection for claim', e);
          }

          if (connectionDoc.exists()) {
            const connectionData = connectionDoc.data();
            if (connectionData.userId === user.id) {
              claims.push({
                id: docSnap.id,
                connectionId: claimData.connectionId,
                claimerId: claimData.claimerId,
                claimerName: claimData.claimerName || 'Someone',
                claimerImage: claimData.claimerImage,
                createdAt: claimData.createdAt?.toDate?.() || new Date(),
                status: claimData.status || 'pending',
              });
            }
          }
        }

        // Check for new claims
        const previousClaims = previousClaimsRef.current;
        claims.forEach((claim) => {
          const isNewClaim = !previousClaims.some(
            (prev) => prev.id === claim.id
          );

          if (isNewClaim) {
            // If this is initial load and there are many claims, don't show toasts
            if (!(isInitialLoad.current && claims.length > 3)) {
              // Show claim notification
              toastService.info(
                t('toasts.newClaimTitle'),
                t('toasts.newClaimBody', { name: claim.claimerName })
              );
            }
          }
        });

        // Update previous claims reference
        previousClaimsRef.current = claims;

        // Mark as not initial after first update
        if (isInitialLoad.current) {
          isInitialLoad.current = false;
        }

        if (__DEV__) {
          console.log('Realtime claims update:', claims.length);
        }
      },
      (err) => {
        if (__DEV__) console.error('Claims listener error:', err);
      }
    );

    return unsub;
  }, [user?.id]);
};
