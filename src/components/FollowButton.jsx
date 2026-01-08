import { useState, useEffect } from 'react';
import { ref, get, set, remove } from 'firebase/database';
import { database, auth } from '../base';
import { showToast } from '../toast';
import './FollowButton.css';

export default function FollowButton({ targetUid, count }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Reset state when switching targets
    setIsFollowing(false);
    setLoading(false);
  }, [targetUid]);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (user && targetUid) {
        get(ref(database, `users/${user.uid}/following/${targetUid}`))
          .then(snap => setIsFollowing(snap.exists()))
          .catch(err => console.error(err));
      }
    });
    return unsub;
  }, [targetUid]);

  const toggleFollow = async () => {
    if (!targetUid) {
      showToast('Auteur non renseigné', { type: 'error', duration: 3000 });
      return;
    }

    if (!currentUser) {
      showToast('Connectez-vous pour suivre cet utilisateur', { type: 'error', duration: 4000 });
      return;
    }

    if (currentUser.uid === targetUid) {
      showToast('Vous ne pouvez pas vous suivre vous-même', { type: 'error', duration: 3000 });
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await remove(ref(database, `users/${currentUser.uid}/following/${targetUid}`));
        await remove(ref(database, `users/${targetUid}/followers/${currentUser.uid}`));
        setIsFollowing(false);
        showToast('Vous ne suivez plus cet utilisateur', { type: 'success' });
      } else {
        // Follow
        await set(ref(database, `users/${currentUser.uid}/following/${targetUid}`), {
          timestamp: Date.now()
        });
        await set(ref(database, `users/${targetUid}/followers/${currentUser.uid}`), {
          timestamp: Date.now()
        });
        setIsFollowing(true);
        showToast('Vous suivez maintenant cet utilisateur 🎉', { type: 'success' });
      }
    } catch (err) {
      console.error(err);
      const code = err?.code;
      if (code === 'PERMISSION_DENIED') {
        showToast('Accès refusé : vérifiez vos droits ou reconnectez-vous.', { type: 'error', duration: 5000 });
      } else {
        const message = err?.message || 'Erreur lors de l\'opération';
        showToast(message, { type: 'error', duration: 4000 });
      }
    } finally {
      setLoading(false);
    }
  };

  if (currentUser && currentUser.uid === targetUid) {
    return (
      <button className="follow-btn following" type="button" disabled>
        Vous {typeof count === 'number' ? `(${count})` : ''}
      </button>
    );
  }

  if (!targetUid) {
    return (
      <button className="follow-btn" type="button" disabled title="Auteur non renseigné">
        Suivre
      </button>
    );
  }

  return (
    <button
      className={`follow-btn ${isFollowing ? 'following' : ''}`}
      onClick={toggleFollow}
      disabled={loading}
      type="button"
    >
      {loading
        ? '...'
        : isFollowing
          ? `✓ Abonné (${typeof count === 'number' ? count : 0})`
          : `+ Suivre (${typeof count === 'number' ? count : 0})`}
    </button>
  );
}
