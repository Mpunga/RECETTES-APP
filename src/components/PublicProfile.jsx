import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ref, get, onValue } from "firebase/database";
import { database } from "../base";
import './PublicProfile.css'
import Card from './Card';
import FollowButton from './FollowButton';

export default function PublicProfile() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [recettes, setRecettes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(3); // Nombre initial de recettes Ã  afficher
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    setDisplayCount(3);
    Promise.all([
      get(ref(database, "users/" + uid)),
      get(ref(database, "recettes"))
    ]).then(([userSnap, recettesSnap]) => {
      if (userSnap.exists()) {
        setProfile(userSnap.val());
      }
      if (recettesSnap.exists()) {
        const data = recettesSnap.val();
        const list = Object.entries(data)
          .filter(([, r]) => r.authorId === uid)
          .map(([id, r]) => ({ id, ...r }));
        setRecettes(list);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [uid]);

  useEffect(() => {
    if (!uid) return undefined;
    const followersRef = ref(database, `users/${uid}/followers`);
    const followingRef = ref(database, `users/${uid}/following`);

    const unsubFollowers = onValue(followersRef, snap => {
      const data = snap.val() || {};
      setFollowersCount(Object.keys(data).length);
    });

    const unsubFollowing = onValue(followingRef, snap => {
      const data = snap.val() || {};
      setFollowingCount(Object.keys(data).length);
    });

    return () => {
      unsubFollowers();
      unsubFollowing();
    };
  }, [uid]);

  const loadMore = () => {
    setDisplayCount(prev => prev + 3);
  };

  if (loading) return <p style={{textAlign:'center',padding:40}}>Chargementâ€¦</p>;
  if (!profile) return <p style={{textAlign:'center',padding:40}}>Profil introuvable</p>;

  return (
    <div className="public-profile-container">
      <button className="back-btn" onClick={() => navigate('/')} title="Retour au menu principal">
        <span className="material-icons" style={{fontSize:'18px',marginRight:'4px',verticalAlign:'middle'}}>home</span>
        Accueil
      </button>
      
      <div className="public-profile-card">
        <div className="profile-header-section">
          <img src={profile.photo} alt={`${profile.prenom} ${profile.nom}`} className="profile-avatar" />
          <div className="profile-info-main">
            <div className="profile-name-row">
              <h1>{profile.prenom} {profile.nom}</h1>
              <FollowButton targetUid={uid} />
            </div>
            {profile.pays && (
              <p className="profile-location">
                <span className="material-icons" style={{fontSize:'16px',marginRight:'4px',verticalAlign:'middle'}}>place</span>
                {profile.pays}
                {profile.province && ` • ${profile.province}`}
              </p>
            )}
            <div className="profile-stats">
              <div className="profile-stat">
                <span className="stat-label">AbonnÃ©s</span>
                <span className="stat-value">{followersCount}</span>
              </div>
              <div className="profile-stat">
                <span className="stat-label">Abonnements</span>
                <span className="stat-value">{followingCount}</span>
              </div>
              <div className="profile-stat">
                <span className="stat-label">Recettes</span>
                <span className="stat-value">{recettes.length}</span>
              </div>
            </div>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          </div>
        </div>

        {(profile.email || profile.adresse || profile.tele || profile.capital || profile.province) && (
          <div className="profile-details-grid">
            {profile.email && (
              <div className="detail-item">
                <span className="detail-label">ðŸ“§ Email</span>
                <span className="detail-value">{profile.email}</span>
              </div>
            )}
            {profile.adresse && (
              <div className="detail-item">
                <span className="detail-label">ðŸ  Adresse</span>
                <span className="detail-value">{profile.adresse}</span>
              </div>
            )}
            {profile.tele && (
              <div className="detail-item">
                <span className="detail-label">ðŸ“ž TÃ©lÃ©phone</span>
                <span className="detail-value">{profile.tele}</span>
              </div>
            )}
            {profile.capital && (
              <div className="detail-item">
                <span className="detail-label">🏛️ Capitale</span>
                <span className="detail-value">{profile.capital}</span>
              </div>
            )}
            {profile.province && (
              <div className="detail-item">
                <span className="detail-label">🌄 Province</span>
                <span className="detail-value">{profile.province}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="recipes-section">
        <h2>
          <span className="material-icons" style={{fontSize:'24px',marginRight:'8px',verticalAlign:'middle'}}>restaurant</span>
          Recettes publiées ({recettes.length})
        </h2>
        {recettes.length > 0 ? (
          <>
            <div className="recipes-grid">
              {recettes.slice(0, displayCount).map((r, i) => (
                <div key={r.id || i}>
                  <Card details={r} />
                </div>
              ))}
            </div>
            {displayCount < recettes.length && (
              <div style={{textAlign: 'center', marginTop: 24}}>
                <button className="load-more-btn" onClick={loadMore}>
                  Voir plus ({recettes.length - displayCount} restantes)
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="no-recipes">Aucune recette publiée pour l'instant.</p>
        )}
      </div>
    </div>
  );
}

