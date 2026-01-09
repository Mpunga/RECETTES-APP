import { useEffect } from 'react';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { database, auth } from '../base';

// Hook pour mettre à jour le statut en ligne de l'utilisateur actuel
export function useUserPresence() {
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const presenceRef = ref(database, `users/${user.uid}/presence`);
    const connectedRef = ref(database, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        // Marquer comme en ligne
        set(presenceRef, {
          online: true,
          lastSeen: serverTimestamp()
        });

        // Configurer le déclencheur de déconnexion
        onDisconnect(presenceRef).set({
          online: false,
          lastSeen: serverTimestamp()
        });
      }
    });

    return () => {
      // Marquer comme hors ligne lors du démontage
      set(presenceRef, {
        online: false,
        lastSeen: Date.now()
      });
      unsubscribe();
    };
  }, []);
}

// Hook pour surveiller le statut en ligne d'un autre utilisateur
export function useUserOnlineStatus(userId, callback) {
  useEffect(() => {
    if (!userId) return;

    const presenceRef = ref(database, `users/${userId}/presence`);
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const data = snapshot.val();
      const isOnline = data?.online || false;
      callback(isOnline);
    });

    return () => unsubscribe();
  }, [userId, callback]);
}
