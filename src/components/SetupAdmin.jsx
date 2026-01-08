import { useState } from 'react';
import { auth, database } from '../base';
import { ref, update, get } from 'firebase/database';
import { showToast } from '../toast';
import './SetupAdmin.css';

/**
 * Composant pour définir le premier administrateur
 * À SUPPRIMER après avoir créé le premier admin
 */
export default function SetupAdmin() {
  const [uid, setUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const handleSearchUser = async () => {
    if (!uid.trim()) {
      showToast('Veuillez entrer un UID', { type: 'error', duration: 3000 });
      return;
    }

    setLoading(true);
    try {
      const userRef = ref(database, `users/${uid.trim()}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        setUserInfo({ uid: uid.trim(), ...snapshot.val() });
        showToast('Utilisateur trouvé', { type: 'success' });
      } else {
        showToast('Utilisateur introuvable', { type: 'error', duration: 4000 });
        setUserInfo(null);
      }
    } catch (error) {
      console.error(error);
      showToast('Erreur lors de la recherche', { type: 'error', duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const handleSetAdmin = async () => {
    if (!userInfo) return;

    setLoading(true);
    try {
      await update(ref(database, `users/${userInfo.uid}`), {
        role: 'admin'
      });
      
      showToast('✅ Utilisateur promu administrateur !', { type: 'success' });
      setUserInfo({ ...userInfo, role: 'admin' });
    } catch (error) {
      console.error(error);
      showToast('Erreur lors de la promotion', { type: 'error', duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserUid = () => {
    const user = auth.currentUser;
    if (user) {
      setUid(user.uid);
      showToast(`UID copié: ${user.uid}`, { type: 'success' });
    }
  };

  return (
    <div className="setup-admin-container">
      <div className="setup-admin-card">
        <h1>🛡️ Configuration Administrateur</h1>
        <p className="setup-subtitle">Définir le premier administrateur de la plateforme</p>

        <div className="setup-section">
          <h3>Option 1 : Promouvoir l'utilisateur connecté</h3>
          <button 
            className="btn-current-user"
            onClick={getCurrentUserUid}
          >
            📋 Utiliser mon UID (utilisateur connecté)
          </button>
        </div>

        <div className="setup-divider">OU</div>

        <div className="setup-section">
          <h3>Option 2 : Entrer un UID manuellement</h3>
          <div className="uid-input-group">
            <input
              type="text"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="Entrez l'UID Firebase de l'utilisateur"
              className="uid-input"
            />
            <button 
              onClick={handleSearchUser}
              disabled={loading}
              className="btn-search"
            >
              🔍 Rechercher
            </button>
          </div>
        </div>

        {userInfo && (
          <div className="user-preview">
            <h3>✅ Utilisateur trouvé</h3>
            <div className="user-card">
              <img 
                src={userInfo.photo || 'https://i.pravatar.cc/100'} 
                alt="Avatar"
                className="user-avatar-large"
              />
              <div className="user-details">
                <h4>{userInfo.prenom} {userInfo.nom}</h4>
                <p className="user-email">{userInfo.email}</p>
                <p className="user-uid">UID: {userInfo.uid}</p>
                {userInfo.role && (
                  <span className={`role-badge ${userInfo.role}`}>
                    {userInfo.role === 'admin' ? '🛡️ Déjà Admin' : '👤 Utilisateur'}
                  </span>
                )}
              </div>
            </div>

            {userInfo.role !== 'admin' && (
              <button
                onClick={handleSetAdmin}
                disabled={loading}
                className="btn-promote"
              >
                ⬆️ Promouvoir en Administrateur
              </button>
            )}

            {userInfo.role === 'admin' && (
              <div className="success-message">
                <p>✅ Cet utilisateur est déjà administrateur !</p>
                <a href="/admin" className="btn-go-admin">
                  🛡️ Accéder au Dashboard Admin
                </a>
              </div>
            )}
          </div>
        )}

        <div className="setup-help">
          <h4>💡 Comment trouver l'UID ?</h4>
          <ul>
            <li>Si vous êtes connecté : utilisez l'option 1</li>
            <li>Firebase Console → Authentication → liste des utilisateurs</li>
            <li>Dans l'URL du profil : /profile/[UID]</li>
            <li>Console navigateur : <code>auth.currentUser.uid</code></li>
          </ul>
        </div>

        <div className="setup-warning">
          ⚠️ <strong>Important :</strong> Supprimez ce composant après avoir créé le premier admin. 
          Utilisez ensuite le Dashboard Admin pour gérer les autres utilisateurs.
        </div>
      </div>
    </div>
  );
}
