import { useState, useEffect } from 'react';
import { ref, push, get, onValue, remove } from 'firebase/database';
import { database, auth } from '../base';
import { showToast } from '../toast';
import { extractKeywords, updateUserPreferences } from '../utils/preferences';
import './Comments.css';

export default function Comments({ recetteId, ingredients }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfiles, setUserProfiles] = useState({});

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!recetteId) return;
    const commentsRef = ref(database, `recettes/${recetteId}/comments`);
    const unsubscribe = onValue(commentsRef, snapshot => {
      const data = snapshot.val() || {};
      const commentsList = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setComments(commentsList);

      // Fetch user profiles for comments
      const userIds = [...new Set(commentsList.map(c => c.authorId))];
      userIds.forEach(uid => {
        if (!userProfiles[uid]) {
          get(ref(database, `users/${uid}`)).then(snap => {
            if (snap.exists()) {
              setUserProfiles(prev => ({ ...prev, [uid]: snap.val() }));
            }
          });
        }
      });
    });

    return () => unsubscribe();
  }, [recetteId, userProfiles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Connectez-vous pour commenter', { type: 'error', duration: 4000 });
      return;
    }

    if (!newComment.trim()) return;

    try {
      const commentsRef = ref(database, `recettes/${recetteId}/comments`);
      await push(commentsRef, {
        text: newComment.trim(),
        authorId: currentUser.uid,
        timestamp: Date.now()
      });
      setNewComment('');
      
      // Track user preferences (poids 3 pour un commentaire)
      if (ingredients) {
        const keywords = extractKeywords(ingredients);
        updateUserPreferences(currentUser.uid, keywords, 3);
      }
      
      showToast('Commentaire ajouté ✅', { type: 'success' });
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de l\'ajout du commentaire', { type: 'error', duration: 4000 });
    }
  };

  const handleDelete = async (commentId, authorId) => {
    if (!currentUser || currentUser.uid !== authorId) return;
    
    if (!window.confirm('Supprimer ce commentaire ?')) return;

    try {
      await remove(ref(database, `recettes/${recetteId}/comments/${commentId}`));
      showToast('Commentaire supprimé', { type: 'success' });
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la suppression', { type: 'error', duration: 4000 });
    }
  };

  return (
    <div className="comments-section">
      <h3>💬 Commentaires ({comments.length})</h3>

      {currentUser && (
        <form onSubmit={handleSubmit} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ajouter un commentaire..."
            rows="3"
            maxLength="500"
          />
          <button type="submit" disabled={!newComment.trim()}>
            Publier
          </button>
        </form>
      )}

      {!currentUser && (
        <p className="login-prompt">Connectez-vous pour commenter</p>
      )}

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">Aucun commentaire pour l'instant. Soyez le premier ! 💭</p>
        ) : (
          comments.map(comment => {
            const profile = userProfiles[comment.authorId] || {};
            const isOwner = currentUser && currentUser.uid === comment.authorId;
            
            return (
              <div key={comment.id} className="comment-item">
                <img
                  src={profile.photo || 'https://i.pravatar.cc/150'}
                  alt={profile.prenom || 'User'}
                  className="comment-avatar"
                />
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="comment-author">
                      {profile.prenom} {profile.nom}
                    </span>
                    <span className="comment-time">
                      {new Date(comment.timestamp).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {isOwner && (
                      <button
                        className="delete-comment-btn"
                        onClick={() => handleDelete(comment.id, comment.authorId)}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
