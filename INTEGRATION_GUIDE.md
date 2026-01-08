# Guide d'intégration des nouvelles fonctionnalités

## ✅ Composants créés

1. **FollowButton.jsx** + **FollowButton.css** - Bouton suivre/se désabonner
2. **Reactions.jsx** + **Reactions.css** - Système de réactions emoji
3. **Comments.jsx** + **Comments.css** - Section commentaires

## 📝 Étapes d'intégration

### 1. Dans `PublicProfile.jsx`

Ajouter les imports :
```javascript
import { ref, get, onValue } from "firebase/database"; // Modifier la ligne import
import FollowButton from './FollowButton';
```

Ajouter les states :
```javascript
const [followersCount, setFollowersCount] = useState(0);
const [followingCount, setFollowingCount] = useState(0);
```

Dans le useEffect, ajouter l'écoute des followers/following :
```javascript
// À la fin du useEffect existant, avant le }, [uid]);
const followersRef = ref(database, `users/${uid}/followers`);
const followingRef = ref(database, `users/${uid}/following`);

const unsubFollowers = onValue(followersRef, snap => {
  setFollowersCount(snap.exists() ? Object.keys(snap.val()).length : 0);
});

const unsubFollowing = onValue(followingRef, snap => {
  setFollowingCount(snap.exists() ? Object.keys(snap.val()).length : 0);
});

return () => {
  unsubFollowers();
  unsubFollowing();
};
```

Modifier la section profile-header-section :
```jsx
<div className="profile-header-section">
  <img src={profile.photo} alt={`${profile.prenom} ${profile.nom}`} className="profile-avatar" />
  <div className="profile-info-main">
    <div className="profile-name-row">
      <h1>{profile.prenom} {profile.nom}</h1>
      <FollowButton targetUid={uid} />
    </div>
    <div className="profile-stats">
      <span><strong>{followersCount}</strong> abonné{followersCount > 1 ? 's' : ''}</span>
      <span><strong>{followingCount}</strong> abonnement{followingCount > 1 ? 's' : ''}</span>
      <span><strong>{recettes.length}</strong> recette{recettes.length > 1 ? 's' : ''}</span>
    </div>
    {profile.pays && <p className="profile-location">📍 {profile.pays}</p>}
    {profile.bio && <p className="profile-bio">{profile.bio}</p>}
  </div>
</div>
```

### 2. Dans `PublicProfile.css`

Ajouter ces styles :
```css
.profile-name-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.profile-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.profile-stats span strong {
  color: #111;
  font-weight: 700;
}

body.dark .profile-stats {
  color: #9ca3af;
}

body.dark .profile-stats span strong {
  color: #e5e7eb;
}
```

### 3. Dans `Recette.js`

Ajouter les imports :
```javascript
import Reactions from './Reactions';
import Comments from './Comments';
```

Après la section instructions, ajouter :
```jsx
<Reactions recetteId={recette.id} />
<Comments recetteId={recette.id} />
```

## 🎯 Fonctionnalités

### ✅ Follow/Abonnés
- Bouton "Suivre" sur les profils publics
- Compteurs d'abonnés et abonnements
- Stockage dans Firebase : `users/{uid}/followers` et `users/{uid}/following`

### ✅ Réactions emoji
- 5 emojis : 👍 ❤️ 😍 🔥 😋
- Réaction unique par utilisateur
- Compteurs en temps réel
- Stockage : `recettes/{id}/reactions/{uid}`

### ✅ Commentaires
- Ajout/suppression de commentaires
- Avatar et nom de l'auteur
- Horodatage
- Suppression uniquement par l'auteur
- Stockage : `recettes/{id}/comments/{commentId}`

## 📊 Structure Firebase

```
users/
  {uid}/
    followers/
      {followerId}: { timestamp }
    following/
      {followedId}: { timestamp }

recettes/
  {recetteId}/
    reactions/
      {userId}: { emoji, timestamp }
    comments/
      {commentId}: { text, authorId, timestamp }
```

## 🎨 Thème sombre

Tous les composants supportent le mode sombre automatiquement via `body.dark`.
