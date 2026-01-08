// Utilitaire pour définir un utilisateur comme admin
// À utiliser UNIQUEMENT pour créer le premier administrateur

import { ref, update } from 'firebase/database';
import { database } from '../base';

/**
 * Définir un utilisateur comme administrateur
 * @param {string} uid - L'ID Firebase de l'utilisateur
 */
export async function setUserAsAdmin(uid) {
  try {
    await update(ref(database, `users/${uid}`), {
      role: 'admin'
    });
    console.log(`✅ Utilisateur ${uid} est maintenant administrateur`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la définition du rôle admin:', error);
    return false;
  }
}

/**
 * Retirer le rôle admin d'un utilisateur
 * @param {string} uid - L'ID Firebase de l'utilisateur
 */
export async function removeAdminRole(uid) {
  try {
    await update(ref(database, `users/${uid}`), {
      role: 'user'
    });
    console.log(`✅ Rôle admin retiré pour ${uid}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du retrait du rôle admin:', error);
    return false;
  }
}

// Instructions d'utilisation dans la console du navigateur:
// 1. Ouvrez la console (F12)
// 2. Copiez votre UID Firebase (visible dans le profil ou l'URL)
// 3. Tapez: 
//    import { setUserAsAdmin } from './utils/setAdmin';
//    setUserAsAdmin('VOTRE_UID_ICI');
