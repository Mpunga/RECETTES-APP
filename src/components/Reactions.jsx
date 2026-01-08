import { useState, useEffect } from 'react';
import { ref, get, set, remove } from 'firebase/database';
import { database, auth } from '../base';
import { extractKeywords, updateUserPreferences } from '../utils/preferences';
import './Reactions.css';

const EMOJIS = ['👍', '❤️', '😍', '🔥', '😋'];

export default function Reactions({ recetteId, layout = 'block', onTotalChange, ingredients }) {
  const [reactions, setReactions] = useState({});
  const [userReaction, setUserReaction] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!recetteId) return;
    const reactionsRef = ref(database, `recettes/${recetteId}/reactions`);
    get(reactionsRef).then(snap => {
      const data = snap.val() || {};
      setReactions(data);
      if (currentUser && data[currentUser.uid]) {
        setUserReaction(data[currentUser.uid].emoji);
      }
    }).catch(err => console.error(err));
  }, [recetteId, currentUser]);

  const addReaction = async (emoji) => {
    if (!recetteId) {
      setShowPicker(false);
      console.warn('No recetteId provided for reactions');
      return;
    }

    if (!currentUser) {
      console.warn('User must be logged in to react');
      setShowPicker(false);
      return;
    }

    try {
      const reactionRef = ref(database, `recettes/${recetteId}/reactions/${currentUser.uid}`);
      if (userReaction === emoji) {
        // Remove reaction
        await remove(reactionRef);
        setUserReaction(null);
        const newReactions = { ...reactions };
        delete newReactions[currentUser.uid];
        setReactions(newReactions);
      } else {
        // Add or update reaction
        await set(reactionRef, {
          emoji,
          timestamp: Date.now()
        });
        setUserReaction(emoji);
        setReactions({
          ...reactions,
          [currentUser.uid]: { emoji, timestamp: Date.now() }
        });
        
        // Track user preferences (poids 2 pour une réaction)
        if (ingredients) {
          const keywords = extractKeywords(ingredients);
          updateUserPreferences(currentUser.uid, keywords, 2);
        }
      }
      setShowPicker(false);
    } catch (err) {
      console.error(err);
    }
  };

  const reactionCounts = EMOJIS.map(emoji => ({
    emoji,
    count: Object.values(reactions).filter(r => r.emoji === emoji).length
  })).filter(r => r.count > 0);

  const totalReactions = Object.keys(reactions).length;

  useEffect(() => {
    if (typeof onTotalChange === 'function') {
      onTotalChange(totalReactions);
    }
  }, [totalReactions, onTotalChange]);

  const containerClass = `reactions-container ${layout === 'inline' ? 'inline' : ''}`;

  return (
    <div className={containerClass}>
      <div className="reactions-summary">
        {reactionCounts.map(({ emoji, count }) => (
          <button
            key={emoji}
            className={`reaction-bubble ${userReaction === emoji ? 'active' : ''}`}
            onClick={() => addReaction(emoji)}
          >
            <span className="emoji">{emoji}</span>
            <span className="count">{count}</span>
          </button>
        ))}
        {totalReactions === 0 && (
          <span className="no-reactions">Aucune réaction pour l'instant</span>
        )}
      </div>

      <div className="reaction-add-wrapper">
        <button
          className="add-reaction-btn"
          onClick={() => setShowPicker(!showPicker)}
          title="Ajouter une réaction"
        >
          {userReaction || '😊'}
        </button>
        {showPicker && (
          <div className="emoji-picker">
            {EMOJIS.map(emoji => (
              <button
                key={emoji}
                className="emoji-option"
                onClick={() => addReaction(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
