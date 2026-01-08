import { ref, get, set } from 'firebase/database';
import { database } from '../base';

/**
 * Parse une liste d'ingrédients et extrait nom + quantité
 * Ex: "3 tomates" → { name: "tomates", quantity: 3 }
 * Ex: "poulet" → { name: "poulet", quantity: 1 }
 */
function parseIngredient(ingredientStr) {
  const cleaned = ingredientStr.trim().toLowerCase();
  
  // Essaie de détecter un nombre au début
  const match = cleaned.match(/^(\d+(?:[.,]\d+)?)\s*(.+)$/);
  
  if (match) {
    const quantity = parseFloat(match[1].replace(',', '.'));
    const name = match[2].trim();
    return { name, quantity };
  }
  
  // Pas de nombre détecté, quantité par défaut = 1
  return { name: cleaned, quantity: 1 };
}

// Nettoie un nom d'ingrédient pour qu'il soit un key Firebase valide
function sanitizeKey(name) {
  if (!name) return '';
  let k = name.toLowerCase();
  // supprime certains mots en tête fréquents
  k = k.replace(/^\b(de|du|des|d'|de la|de l')\b\s*/g, '');
  // remplace les caractères interdits pour Firebase keys: . # $ [ ] /
    k = k.replace(/[.#$/[\]]/g, ' ');
  // supprime parenthèses
  k = k.replace(/[()]/g, ' ');
  // condense espaces
  k = k.replace(/\s+/g, ' ').trim();
  return k;
}

/**
 * Ajoute une recette complète à la liste de courses de l'utilisateur
 * @param {string} userId - UID de l'utilisateur
 * @param {object} recipe - Objet recette avec nom, ingredients, instructions
 */
export async function addToShoppingList(userId, recipe) {
  if (!userId || !recipe || !recipe.ingredients) return;

  try {
    const shoppingListRef = ref(database, `shoppingList/${userId}`);
    const snapshot = await get(shoppingListRef);
    const currentList = snapshot.val() || {};

    // Créer une clé unique pour cette recette
    const recipeKey = sanitizeKey(recipe.nom || 'recette') + '_' + Date.now();

    // Stocker la recette complète avec ses ingrédients et instructions
    currentList[recipeKey] = {
      nom: recipe.nom || 'Sans nom',
      ingredients: recipe.ingredients,
      instructions: recipe.instructions || '',
      image: recipe.image || '',
      addedAt: Date.now()
    };

    await set(shoppingListRef, currentList);
    return true;
  } catch (err) {
    console.error('Erreur ajout liste de courses:', err);
    return false;
  }
}

/**
 * Récupère la liste de courses de l'utilisateur
 * @param {string} userId - UID de l'utilisateur
 * @returns {object} - Objet {recipeKey: {nom, ingredients, instructions, ...}}
 */
export async function getShoppingList(userId) {
  if (!userId) return {};

  try {
    const shoppingListRef = ref(database, `shoppingList/${userId}`);
    const snapshot = await get(shoppingListRef);
    return snapshot.val() || {};
  } catch (err) {
    console.error('Erreur récupération liste de courses:', err);
    return {};
  }
}

/**
 * Supprime une recette de la liste de courses
 * @param {string} userId - UID de l'utilisateur
 * @param {string} recipeKey - Clé de la recette à supprimer
 */
export async function removeFromShoppingList(userId, recipeKey) {
  if (!userId || !recipeKey) return false;

  try {
    const shoppingListRef = ref(database, `shoppingList/${userId}`);
    const snapshot = await get(shoppingListRef);
    const currentList = snapshot.val() || {};

    delete currentList[recipeKey];

    await set(shoppingListRef, currentList);
    return true;
  } catch (err) {
    console.error('Erreur suppression de la liste:', err);
    return false;
  }
}

/**
 * Vide complètement la liste de courses
 * @param {string} userId - UID de l'utilisateur
 */
export async function clearShoppingList(userId) {
  if (!userId) return false;

  try {
    const shoppingListRef = ref(database, `shoppingList/${userId}`);
    await set(shoppingListRef, {});
    return true;
  } catch (err) {
    console.error('Erreur vidage liste de courses:', err);
    return false;
  }
}
