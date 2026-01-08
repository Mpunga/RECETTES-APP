import { memo, useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { ref, get } from 'firebase/database';
import { database, auth } from '../base';
import Reactions from './Reactions';
import FollowButton from './FollowButton';
import { extractKeywords, updateUserPreferences } from '../utils/preferences';
import { addToShoppingList } from '../utils/shoppingList';
import { showToast } from '../toast';
import './Card.css';

function resolveImage(src) {
  if (!src) return '';
  if (src.startsWith('http') || src.startsWith('/')) return src;
  try {
    // Try to require from src/img
    return require(`../img/${src}`);
  } catch (e) {
    return src; // fallback, maybe already a valid path
  }
}

function Card({ details = {} }) {
  const navigate = useNavigate();

  const recetteId = details.id || details.nom || '';
  const authorId = details.authorId || '';
  const imgSrc = resolveImage(details.image);
  const nom = details.nom || 'Recette';
  const ingredients = details.ingredients || '';
  const instructions = details.instructions || '';

  const [followersCount, setFollowersCount] = useState(0);
  const [, setReactionsTotal] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (!authorId) {
      setFollowersCount(0);
      return undefined;
    }
    const followersRef = ref(database, `users/${authorId}/followers`);
    get(followersRef)
      .then(snap => {
        if (!mounted) return;
        const data = snap.val() || {};
        setFollowersCount(Object.keys(data).length);
      })
      .catch(() => {
        if (!mounted) return;
        setFollowersCount(0);
      });
    return () => { mounted = false; };
  }, [authorId]);


  const parseList = (text) =>
    (text || "")
      .split(/[;,\n]+/)
      .map(s => s.trim())
      .filter(Boolean);

  const handleRecipeClick = () => {
    const user = auth.currentUser;
    if (user && ingredients) {
      const keywords = extractKeywords(ingredients);
      updateUserPreferences(user.uid, keywords, 1); // poids 1 pour un clic
    }
    navigate("/recette/" + encodeURIComponent(recetteId));
  };

  const handleAddToShoppingList = async () => {
    const user = auth.currentUser;
    if (!user) {
      showToast('Connectez-vous pour utiliser la liste de courses', { type: 'error', duration: 4000 });
      return;
    }
    if (!ingredients) {
      showToast('Aucun ingrédient à ajouter', { type: 'error', duration: 3000 });
      return;
    }

    const recipe = {
      nom,
      ingredients,
      instructions,
      image: details.image || '',
      authorId: details.authorId || '',
      authorName: details.authorName || ''
    };

    const success = await addToShoppingList(user.uid, recipe);
    if (success) {
      showToast('🛒 Recette ajoutée à votre liste !', { type: 'success' });
    } else {
      showToast('Erreur lors de l\'ajout', { type: 'error', duration: 4000 });
    }
  };

  return (
    <div className="card recipe-card">
      <div className="card-media">
        <img
          src={imgSrc}
          alt={nom}
          loading="lazy"
          className="card-img"
        />
      </div>

      <div className="card-body">
        <h3 className="card-title">{nom}</h3>

        <div className="card-meta">
          <div className="meta-col ingredients">
            <h4>🧾 Ingrédients</h4>
            <ol>
              {parseList(ingredients).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          </div>

          <div className="meta-col instructions">
            <h4>📋 Instructions</h4>
            <ol>
              {parseList(instructions).map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>

        <div className="card-actions-row">
          {authorId ? (
            <FollowButton targetUid={authorId} count={followersCount} />
          ) : (
            <button className="follow-btn" type="button" disabled title="Auteur non renseigné">Suivre</button>
          )}

          <Reactions recetteId={recetteId} layout="inline" onTotalChange={setReactionsTotal} ingredients={ingredients} />
                    <button className="card-action shopping-btn" onClick={handleAddToShoppingList} title="Ajouter à ma liste de courses">
                      🛒
                    </button>
          <button className="card-action" onClick={handleRecipeClick}>
            Voir la recette 👨‍🍳
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(Card);
