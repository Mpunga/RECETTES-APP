import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database, auth } from '../base';
import { removeFromShoppingList, clearShoppingList } from '../utils/shoppingList';
import { showToast } from '../toast';
import './ShoppingList.css';

// Fonction pour formater le texte en liste HTML
function formatToList(text, type = 'ul') {
  if (!text) return '';
  
  const lines = text
    .split(/[\n,;]/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  const items = lines.map(line => `<li>${line}</li>`).join('');
  return type === 'ol' 
    ? `<ol>${items}</ol>` 
    : `<ul>${items}</ul>`;
}

export default function ShoppingList() {
  const navigate = useNavigate();
  const [shoppingList, setShoppingList] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedRecipes, setExpandedRecipes] = useState({});

  const toggleInstructions = (recipeKey) => {
    setExpandedRecipes(prev => ({
      ...prev,
      [recipeKey]: !prev[recipeKey]
    }));
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setShoppingList({});
      return;
    }

    const shoppingListRef = ref(database, `shoppingList/${currentUser.uid}`);
    const unsubscribe = onValue(shoppingListRef, snapshot => {
      const data = snapshot.val() || {};
      setShoppingList(data);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleRemoveItem = async (recipeKey) => {
    if (!currentUser) return;
    const success = await removeFromShoppingList(currentUser.uid, recipeKey);
    if (success) {
      showToast('Recette retirée ✅', { type: 'success' });
    } else {
      showToast('Erreur lors de la suppression', { type: 'error', duration: 4000 });
    }
  };

  const handleClearList = async () => {
    if (!currentUser) return;
    if (!window.confirm('Vider toute la liste de courses ?')) return;
    
    const success = await clearShoppingList(currentUser.uid);
    if (success) {
      showToast('Liste vidée ✅', { type: 'success' });
    } else {
      showToast('Erreur lors du vidage', { type: 'error', duration: 4000 });
    }
  };

  const handleExportPDF = () => {
    if (Object.keys(shoppingList).length === 0) {
      showToast('Aucune recette à exporter', { type: 'error', duration: 3000 });
      return;
    }

    const recipesHtml = Object.entries(shoppingList)
      .map(([key, recipe]) => `
        <div style="margin-bottom: 20px; page-break-inside: avoid;">
          <h2 style="color: #ff4b5c;">${recipe.nom}</h2>
          <h3>Ingrédients:</h3>
          <p style="white-space: pre-wrap;">${recipe.ingredients}</p>
          ${recipe.instructions ? `<h3>Instructions:</h3><p style="white-space: pre-wrap;">${recipe.instructions}</p>` : ''}
        </div>
      `)
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Liste de courses</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { color: #ff4b5c; }
            h2 { color: #ff4b5c; margin-top: 20px; }
            h3 { color: #333; margin-top: 12px; }
            p { line-height: 1.6; }
            .footer { margin-top: 24px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>🛒 Ma liste de courses</h1>
          ${recipesHtml}
          <div class="footer">Généré par E~Food</div>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    } else {
      showToast('Impossible d\'ouvrir la fenêtre d\'export', { type: 'error', duration: 4000 });
    }
  };

  const handleShareWhatsApp = () => {
    if (Object.keys(shoppingList).length === 0) {
      showToast('Aucune recette à partager', { type: 'error', duration: 3000 });
      return;
    }

    // Format pour WhatsApp
    const recipes = Object.entries(shoppingList)
      .map(([key, recipe]) => {
        let text = `*${recipe.nom}*%0A%0A`;
        text += `Ingrédients:%0A${recipe.ingredients.replace(/\n/g, '%0A')}`;
        if (recipe.instructions) {
          text += `%0A%0AInstructions:%0A${recipe.instructions.replace(/\n/g, '%0A')}`;
        }
        return text;
      })
      .join('%0A%0A----%0A%0A');

    const message = `📋 *Ma liste de courses*%0A%0A${recipes}%0A%0AGénéré par E~Food 🍽️`;
    const whatsappUrl = `https://wa.me/?text=${message}`;

    window.open(whatsappUrl, '_blank');
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Chargement...</p>;

  if (!currentUser) {
    return (
      <div className="shopping-list-container">
        <button className="back-btn" onClick={() => navigate(-1)}>← Retour</button>
        <div className="shopping-list-empty">
          <h2>🛒 Liste de courses</h2>
          <p>Connectez-vous pour accéder à votre liste de courses.</p>
        </div>
      </div>
    );
  }

  const items = Object.entries(shoppingList);

  return (
    <div className="shopping-list-container">
      <button className="back-btn" onClick={() => navigate(-1)}>← Retour</button>
      <div className="shopping-list-header">
        <h1>🛒 Ma liste de courses</h1>
        <p className="shopping-list-subtitle">
          {items.length === 0 ? 'Aucune recette' : `${items.length} recette(s)`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="shopping-list-empty">
          <p>Votre liste est vide.</p>
          <p className="hint">
            Cliquez sur 🛒 sur une recette pour l'ajouter ici.
          </p>
        </div>
      ) : (
        <>
          <div className="shopping-list-actions">
            <button className="btn-export" onClick={handleExportPDF}>
              📥 Exporter en PDF
            </button>
            <button className="btn-whatsapp" onClick={handleShareWhatsApp}>
              💬 Partager sur WhatsApp
            </button>
            <button className="btn-clear" onClick={handleClearList}>
              🗑️ Vider la liste
            </button>
          </div>

          <div className="shopping-list-recipes">
            {items.map(([recipeKey, recipe]) => (
              <div key={recipeKey} className="recipe-card-shopping">
                <div className="recipe-header">
                  <h3 className="recipe-name">{recipe.nom}</h3>
                  <button
                    className="item-remove"
                    onClick={() => handleRemoveItem(recipeKey)}
                    title="Retirer cette recette"
                  >
                    ✕
                  </button>
                </div>

                <div className="recipe-ingredients">
                  <h4>📝 Ingrédients</h4>
                  <div 
                    className="ingredients-text"
                    dangerouslySetInnerHTML={{ __html: formatToList(recipe.ingredients, 'ul') }}
                  />
                </div>

                {recipe.instructions && (
                  <div className="recipe-instructions">
                    <button 
                      className="toggle-instructions-btn"
                      onClick={() => toggleInstructions(recipeKey)}
                    >
                      {expandedRecipes[recipeKey] ? '▼' : '▶'} Instructions
                    </button>
                    {expandedRecipes[recipeKey] && (
                      <div 
                        className="instructions-text"
                        dangerouslySetInnerHTML={{ __html: formatToList(recipe.instructions, 'ol') }}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
