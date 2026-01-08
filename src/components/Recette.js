import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { database } from '../base';
import Reactions from './Reactions';
import Comments from './Comments';
import FollowButton from './FollowButton';
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

  useEffect(() => {
    if (!nom) return;
    const tryId = nom;
    // First try to get by id
    get(ref(database, `recettes/${tryId}`)).then(snap => {
      if (snap.exists()) {
        setRecette({ id: tryId, ...snap.val() });
        setLoading(false);
      } else {
        // Fallback: search by decoded name
        const decoded = decodeURIComponent(nom || '');
        get(ref(database, 'recettes')).then(all => {
          const data = all.val() || {};
          const foundEntry = Object.entries(data).find(([, r]) => r.nom === decoded);
          if (foundEntry) {
            const [foundId, found] = foundEntry;
            setRecette({ id: foundId, ...found });
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
        <button className="recette-back" onClick={() => navigate(-1)}>← Retour</button>

        <h1 className="recette-title">{recette.nom}</h1>

        {recette.authorId && (
          <div className="recette-author-row">
            <button 
              className="recette-author-btn"
              onClick={() => navigate(`/profile/${recette.authorId}`)}
            >
              👤 Voir le profil du créateur
            </button>
            <FollowButton targetUid={recette.authorId} />
          </div>
        )}

        {imgSrc ? (
          <img className="recette-img" src={imgSrc} alt={recette.nom} loading="lazy" />
        ) : null}

        <div className="recette-section">
          <h3>🧾 Ingrédients</h3>
          <ul className="recette-ingredients">
            {(recette.ingredients || '').split(/[,;\n]+/).map((it, i) => (
              <li key={i}>{it.trim()}</li>
            ))}
          </ul>
        </div>

        <div className="recette-section">
          <h3>📋 Instructions</h3>
          <ol className="recette-instructions">
            {(recette.instructions || '').split(/[,;\n]+/).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>

        <div className="recette-section">
          <h3>💖 Réactions</h3>
          <Reactions recetteId={recette.id || nom} ingredients={recette.ingredients} />
        </div>

        <Comments recetteId={recette.id || nom} ingredients={recette.ingredients} />
      </div>
    </div>
  );
}

