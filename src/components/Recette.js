import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, get, onValue } from 'firebase/database';
import { database, auth } from '../base';
import Reactions from './Reactions';
import Comments from './Comments';
import FollowButton from './FollowButton';
import PrivateChat from './PrivateChat';
import { useUserPresence } from '../hooks/usePresence';
import './Recette.css';

function resolveImage(src) {
  if (!src) return '';
  if (src.startsWith('http') || src.startsWith('/')) return src;
  try {
    return require(`../img/${src}`);
  } catch (e) {
    return src;
  }
}

export default function Recette() {
  const { nom } = useParams();
  const navigate = useNavigate();
  const [recette, setRecette] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [authorOnline, setAuthorOnline] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Gérer l'authentification
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);
  
  // Activer la présence pour l'utilisateur actuel
  useUserPresence();

  useEffect(() => {
    if (!nom) return;
    const tryId = nom;
    // First try to get by id
    get(ref(database, `recettes/${tryId}`)).then(snap => {
      if (snap.exists()) {
        const recetteData = { id: tryId, ...snap.val() };
        setRecette(recetteData);
        // Récupérer le nom de l'auteur
        if (recetteData.authorId) {
          get(ref(database, `users/${recetteData.authorId}`)).then(userSnap => {
            if (userSnap.exists()) {
              const user = userSnap.val();
              setAuthorName(`${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || 'Auteur');
            }
          });
        }
        setLoading(false);
      } else {
        // Fallback: search by decoded name
        const decoded = decodeURIComponent(nom || '');
        get(ref(database, 'recettes')).then(all => {
          const data = all.val() || {};
          const foundEntry = Object.entries(data).find(([, r]) => r.nom === decoded);
          if (foundEntry) {
            const [foundId, found] = foundEntry;
            const recetteData = { id: foundId, ...found };
            setRecette(recetteData);
            // Récupérer le nom de l'auteur
            if (recetteData.authorId) {
              get(ref(database, `users/${recetteData.authorId}`)).then(userSnap => {
                if (userSnap.exists()) {
                  const user = userSnap.val();
                  setAuthorName(`${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || 'Auteur');
                }
              });
            }
          } else {
            setNotFound(true);
          }
          setLoading(false);
        }).catch(err => {
          console.error(err);
          setNotFound(true);
          setLoading(false);
        });
      }
    }).catch(err => {
      console.error(err);
      setNotFound(true);
      setLoading(false);
    });
  }, [nom]);

  // Écouter le statut en ligne de l'auteur
  useEffect(() => {
    if (!recette?.authorId) return;
    
    const presenceRef = ref(database, `users/${recette.authorId}/presence`);
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const data = snapshot.val();
      setAuthorOnline(data?.online || false);
    });
    
    return () => unsubscribe();
  }, [recette?.authorId]);

  if (loading) return <p style={{textAlign:'center'}}>Chargement…</p>;
  if (notFound || !recette) {
    return (
      <div className="recette-container">
        <div className="recette-card">
          <p>Recette introuvable.</p>
          <button className="recette-back" onClick={() => navigate(-1)}> Retour</button>
        </div>
      </div>
    );
  }

  const imgSrc = resolveImage(recette.image || '');

  return (
    <div className="recette-container">
      <div className="recette-card">
        <button className="recette-back" onClick={() => navigate('/')} title="Retour au menu principal">
          <span className="material-icons" style={{fontSize:'18px',marginRight:'4px',verticalAlign:'middle'}}>home</span>
          Accueil
        </button>

        <h1 className="recette-title">{recette.nom}</h1>

        {recette.authorId && (
          <div className="recette-author-row">
            <button 
              className="recette-author-btn"
              onClick={() => navigate(`/profile/${recette.authorId}`)}
            >
              <span className="material-icons" style={{fontSize:'18px',marginRight:'4px'}}>account_circle</span>
              Voir le profil du créateur
              <span className={`author-presence ${authorOnline ? 'online' : 'offline'}`}>
                {authorOnline ? '🟢' : '🔵'}
              </span>
            </button>
            <FollowButton targetUid={recette.authorId} />
            {currentUser && currentUser.uid !== recette.authorId && (
              <button 
                className="recette-contact-btn"
                onClick={() => setShowChat(true)}
              >
                <span className="material-icons" style={{fontSize:'18px',marginRight:'4px'}}>chat</span>
                Contacter l'auteur
              </button>
            )}
          </div>
        )}

        {imgSrc ? (
          <img className="recette-img" src={imgSrc} alt={recette.nom} loading="lazy" />
        ) : null}

        <div className="recette-section">
          <h3><span className="material-icons" style={{fontSize:'20px',marginRight:'8px',verticalAlign:'middle'}}>list_alt</span>Ingrédients</h3>
          <ul className="recette-ingredients">
            {(recette.ingredients || '').split(/[,;\n]+/).map((it, i) => (
              <li key={i}>{it.trim()}</li>
            ))}
          </ul>
        </div>

        <div className="recette-section">
          <h3><span className="material-icons" style={{fontSize:'20px',marginRight:'8px',verticalAlign:'middle'}}>receipt_long</span>Instructions</h3>
          <ol className="recette-instructions">
            {(recette.instructions || '').split(/[,;\n]+/).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>

        <div className="recette-section">
          <h3><span className="material-icons" style={{fontSize:'20px',marginRight:'8px',verticalAlign:'middle'}}>favorite</span>Réactions</h3>
          <Reactions recetteId={recette.id || nom} ingredients={recette.ingredients} />
        </div>

        <Comments recetteId={recette.id || nom} ingredients={recette.ingredients} />
      </div>

      {showChat && recette.authorId && (
        <PrivateChat
          recipientId={recette.authorId}
          recipientName={authorName}
          recipeId={recette.id}
          recipeName={recette.nom}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}

