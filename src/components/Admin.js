import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../base';
import { ref, onValue, remove, update, get } from 'firebase/database';
import { showToast } from '../toast';
import './Admin.css';

export default function Admin() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // users, recipes, stats
  const [users, setUsers] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [stats, setStats] = useState({});

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();
        
        if (userData?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          showToast('Accès refusé : vous n\'êtes pas administrateur', { type: 'error', duration: 4000 });
          navigate('/');
        }
      } else {
        navigate('/login');
      }
      
      setLoading(false);
    });

    return unsub;
  }, [navigate]);

  // Charger les utilisateurs
  useEffect(() => {
    if (!isAdmin) return;

    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const usersList = Object.keys(data).map(uid => ({
        uid,
        ...data[uid]
      }));
      setUsers(usersList);
    });

    return unsubscribe;
  }, [isAdmin]);

  // Charger les recettes
  useEffect(() => {
    if (!isAdmin) return;

    const recettesRef = ref(database, 'recettes');
    const unsubscribe = onValue(recettesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const recipesList = Object.keys(data).map(id => ({
        id,
        ...data[id]
      }));
      setRecipes(recipesList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    });

    return unsubscribe;
  }, [isAdmin]);

  // Calculer les statistiques
  useEffect(() => {
    if (!isAdmin) return;

    setStats({
      totalUsers: users.length,
      totalRecipes: recipes.length,
      admins: users.filter(u => u.role === 'admin').length,
      recentUsers: users.filter(u => u.createdAt > Date.now() - 7 * 24 * 60 * 60 * 1000).length
    });
  }, [users, recipes, isAdmin]);

  const handleDeleteUser = async (uid) => {
    if (!window.confirm('Supprimer cet utilisateur ? Cette action est irréversible.')) return;
    
    try {
      await remove(ref(database, `users/${uid}`));
      showToast('Utilisateur supprimé', { type: 'success' });
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la suppression', { type: 'error', duration: 4000 });
    }
  };

  const handleToggleAdmin = async (uid, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    try {
      await update(ref(database, `users/${uid}`), { role: newRole });
      showToast(`Rôle changé en ${newRole}`, { type: 'success' });
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du changement de rôle', { type: 'error', duration: 4000 });
    }
  };

  const handleDeleteRecipe = async (id) => {
    if (!window.confirm('Supprimer cette recette ?')) return;
    
    try {
      await remove(ref(database, `recettes/${id}`));
      showToast('Recette supprimée', { type: 'success' });
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la suppression', { type: 'error', duration: 4000 });
    }
  };

  const handleAssignOrphanRecipes = async () => {
    console.log('Recettes actuelles:', recipes);
    console.log('UID admin:', currentUser?.uid);
    
    if (!window.confirm('Attribuer toutes les recettes sans auteur à votre compte admin ?')) return;
    
    try {
      let count = 0;
      
      // Parcourir toutes les recettes
      for (const recipe of recipes) {
        console.log(`Recette "${recipe.nom}" - authorId:`, recipe.authorId);
        
        // Vérifier si la recette n'a pas d'auteur
        if (!recipe.authorId || recipe.authorId === '' || recipe.authorId === 'undefined') {
          console.log(`Attribution de "${recipe.nom}" à ${currentUser.uid}`);
          await update(ref(database, `recettes/${recipe.id}`), { 
            authorId: currentUser.uid 
          });
          count++;
        }
      }
      
      if (count === 0) {
        showToast('Aucune recette sans auteur trouvée', { type: 'info', duration: 3000 });
      } else {
        showToast(`${count} recette(s) attribuée(s) à votre compte`, { type: 'success', duration: 4000 });
      }
    } catch (err) {
      console.error('Erreur:', err);
      showToast('Erreur lors de l\'attribution: ' + err.message, { type: 'error', duration: 4000 });
    }
  };

  if (loading) return <div className="admin-loading">Chargement...</div>;
  if (!isAdmin) return null;

  return (
    <div className="admin-dashboard">
      <button className="back-btn" onClick={() => navigate('/')} title="Retour au menu principal">
        <span className="material-icons" style={{fontSize:'18px',marginRight:'4px',verticalAlign:'middle'}}>home</span>
        Accueil
      </button>
      
      <div className="admin-header">
        <h1>🛡️ Tableau de bord Admin</h1>
        <p className="admin-subtitle">Gestion de la plateforme E~Food</p>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Utilisateurs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🍽️</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalRecipes}</div>
            <div className="stat-label">Recettes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🛡️</div>
          <div className="stat-info">
            <div className="stat-value">{stats.admins}</div>
            <div className="stat-label">Admins</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🆕</div>
          <div className="stat-info">
            <div className="stat-value">{stats.recentUsers}</div>
            <div className="stat-label">Nouveaux (7j)</div>
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'users' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('users')}
        >
          👥 Utilisateurs
        </button>
        <button 
          className={activeTab === 'recipes' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('recipes')}
        >
          🍽️ Recettes
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' && (
          <div className="users-table">
            <h2>Gestion des utilisateurs ({users.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.uid}>
                    <td>
                      <img 
                        src={user.photo || 'https://i.pravatar.cc/50'} 
                        alt={user.prenom}
                        className="user-avatar"
                      />
                    </td>
                    <td>
                      <strong>{user.prenom} {user.nom}</strong>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role === 'admin' ? 'admin' : 'user'}`}>
                        {user.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                      </span>
                    </td>
                    <td>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-toggle-role"
                          onClick={() => handleToggleAdmin(user.uid, user.role)}
                          disabled={user.uid === currentUser?.uid}
                        >
                          {user.role === 'admin' ? '⬇️ Rétrograder' : '⬆️ Promouvoir'}
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteUser(user.uid)}
                          disabled={user.uid === currentUser?.uid}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'recipes' && (
          <div className="recipes-table">
            <div className="recipes-header">
              <h2>Gestion des recettes ({recipes.length})</h2>
              <button 
                className="btn-assign-orphans"
                onClick={handleAssignOrphanRecipes}
              >
                🔗 Attribuer les recettes sans auteur
              </button>
            </div>
            <div className="recipes-grid">
              {recipes.map(recipe => {
                const author = users.find(u => u.uid === recipe.authorId);
                return (
                  <div key={recipe.id} className="recipe-admin-card">
                    <div className="recipe-admin-header">
                      <h3>{recipe.nom}</h3>
                      <button 
                        className="btn-delete-small"
                        onClick={() => handleDeleteRecipe(recipe.id)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="recipe-admin-info">
                      <p><strong>Auteur:</strong> {author ? `${author.prenom} ${author.nom}` : '⚠️ Sans auteur'}</p>
                      <p><strong>Date:</strong> {recipe.createdAt ? new Date(recipe.createdAt).toLocaleDateString() : 'N/A'}</p>
                      <p className="recipe-ingredients-preview">
                        <strong>Ingrédients:</strong> {(recipe.ingredients || '').substring(0, 100)}...
                      </p>
                    </div>
                    <button 
                      className="btn-view"
                      onClick={() => navigate(`/recette/${recipe.id}`)}
                    >
                      👁️ Voir la recette
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
