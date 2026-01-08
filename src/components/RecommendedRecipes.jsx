import { useState, useEffect, useMemo } from 'react';
import { ref, get } from 'firebase/database';
import { database, auth } from '../base';
import { calculateRecommendationScore } from '../utils/preferences';
import Card from './Card';
import './RecommendedRecipes.css';

export default function RecommendedRecipes({ allRecipes = {} }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  // Memoize allRecipes keys to avoid recalculating on every render
  const recipeKeys = useMemo(() => Object.keys(allRecipes), [allRecipes]);

  useEffect(() => {
    if (!currentUser) {
      setRecommendations([]);
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        // Récupère les préférences de l'utilisateur
        const prefsRef = ref(database, `users/${currentUser.uid}/preferences`);
        const prefsSnap = await get(prefsRef);
        const userPreferences = prefsSnap.val();

        if (!userPreferences || Object.keys(userPreferences).length === 0) {
          setRecommendations([]);
          setLoading(false);
          return;
        }

        // Calcule le score pour chaque recette
        const recettesWithScores = recipeKeys.map(id => {
          const recette = allRecipes[id];
          const score = calculateRecommendationScore(recette, userPreferences);
          return {
            id,
            ...recette,
            score
          };
        });

        // Filtre les recettes avec score > 0 et trie par score décroissant
        const sorted = recettesWithScores
          .filter(r => r.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 6); // Limite à 6 recommandations

        setRecommendations(sorted);
      } catch (err) {
        console.error('Erreur chargement recommandations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentUser, recipeKeys, allRecipes]);

  if (!currentUser) return null;
  if (loading) return null; // Don't show loading state
  if (recommendations.length === 0) return null;

  return (
    <div className="recommended-section">
      <h2 className="recommended-title">🍽️ Recommandé pour vous</h2>
      <p className="recommended-subtitle">
        Basé sur vos goûts ({Object.keys(recommendations[0]?.score ? recommendations : []).length} recettes)
      </p>
      <div className="recommended-grid">
        {recommendations.map(recette => (
          <Card key={recette.id} details={recette} />
        ))}
      </div>
    </div>
  );
}
