// hooks/useRealtimeClaims.ts
import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { useAuth } from '../contexts/AuthContext';
import toastService from '../services/toastService';

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
  const { user } = useAuth();
  const previousClaimsRef = useRef<Claim[]>([]);

  useEffect(() => {
    if (!user?.uid) return;

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
          const connectionDoc = await import('firebase/firestore').then(
            ({ doc, getDoc }) =>
              getDoc(doc(db, 'missed_connections', claimData.connectionId))
          );

          if (connectionDoc.exists()) {
            const connectionData = connectionDoc.data();
            if (connectionData.userId === user.uid) {
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
            // Show claim notification
            toastService.info(
              'New Claim! 🎯',
              `${claim.claimerName} thinks they were at your missed connection!`
            );
          }
        });

        // Update previous claims reference
        previousClaimsRef.current = claims;

        if (__DEV__) {
          console.log('Realtime claims update:', claims.length);
        }
      },
      (err) => {
        if (__DEV__) console.error('Claims listener error:', err);
      }
    );

    return unsub;
  }, [user?.uid]);
};
