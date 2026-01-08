import { ref, get, set } from 'firebase/database';
import { database } from '../base';

// Stopwords français à ignorer lors de l'extraction
const STOPWORDS = new Set([
  'de', 'du', 'des', 'le', 'la', 'les', 'un', 'une', 'au', 'aux',
  'et', 'ou', 'à', 'en', 'pour', 'avec', 'sans', 'sur', 'dans',
  'par', 'très', 'bien', 'petit', 'grand', 'gros', 'frais', 'sec'
]);

/**
 * Extrait les mots-clés pertinents d'une liste d'ingrédients
 * @param {string} ingredients - String contenant les ingrédients séparés par ; , ou \n
 * @returns {string[]} - Tableau de mots-clés normalisés
 */
export function extractKeywords(ingredients) {
  if (!ingredients) return [];

  // Normalise et découpe les ingrédients
  const items = ingredients
    .toLowerCase()
    .split(/[;,\n]+/)
    .map(s => s.trim())
    .filter(Boolean);

  const keywords = new Set();

  items.forEach(item => {
    // Nettoie les nombres et unités courantes
    const cleaned = item
      .replace(/\d+/g, '') // retire les chiffres
      .replace(/\b(g|kg|ml|cl|l|cuillère|cuillères|tasse|tasses|pincée|pincées)\b/g, '')
      .trim();

    // Découpe en mots
    const words = cleaned
      .split(/\s+/)
      .map(w => w.replace(/[^a-zàâäéèêëïîôùûüç]/g, '')) // garde que les lettres
      .filter(w => w.length > 2 && !STOPWORDS.has(w)); // min 3 lettres, pas de stopwords

    words.forEach(word => keywords.add(word));
  });

  return Array.from(keywords);
}

/**
 * Met à jour les préférences utilisateur en incrémentant les mots-clés
 * @param {string} userId - UID de l'utilisateur
 * @param {string[]} keywords - Mots-clés à incrémenter
 * @param {number} weight - Poids de l'action (ex: 1 pour clic, 2 pour like, 3 pour commentaire)
 */
export async function updateUserPreferences(userId, keywords, weight = 1) {
  if (!userId || !keywords || keywords.length === 0) return;

  try {
    const prefsRef = ref(database, `users/${userId}/preferences`);
    const snapshot = await get(prefsRef);
    const currentPrefs = snapshot.val() || {};

    // Incrémente chaque mot-clé
    keywords.forEach(keyword => {
      currentPrefs[keyword] = (currentPrefs[keyword] || 0) + weight;
    });

    await set(prefsRef, currentPrefs);
  } catch (err) {
    console.error('Erreur mise à jour préférences:', err);
  }
}

/**
 * Calcule le score de recommandation d'une recette pour un utilisateur
 * @param {object} recette - Objet recette avec propriété ingredients
 * @param {object} userPreferences - Objet {keyword: score}
 * @returns {number} - Score de recommandation
 */
export function calculateRecommendationScore(recette, userPreferences) {
  if (!recette || !recette.ingredients || !userPreferences) return 0;

  const keywords = extractKeywords(recette.ingredients);
  let score = 0;

  keywords.forEach(keyword => {
    if (userPreferences[keyword]) {
      score += userPreferences[keyword];
    }
  });

  return score;
}
