import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { database, auth } from "../base";
import { onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";
import './PublicProfile.css'
import Card from './Card';

export default function PublicProfile() {
  const { uid } = useParams();  // 🔥 récupère l'ID depuis l'URL
  const [profile, setProfile] = useState(null);
  const [recettes, setRecettes] = useState([]);
  const [currentUid, setCurrentUid] = useState(null);

  useEffect(() => {
    get(ref(database, "users/" + uid)).then(snap => {
      setProfile(snap.val());
    });

    get(ref(database, "recettes")).then(snap => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.values(data).filter(r => r.authorId === uid);
        setRecettes(list);
      }
    });
  }, [uid]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUid(user ? user.uid : null);
    });
    return unsub;
  }, []);

  if (!profile) return <p>Chargement…</p>;

  return (
    <div className="public-profile">
      <img src={profile.photo} alt="" />
      <h2>{profile.prenom} {profile.nom}</h2>
      <p>{profile.bio}</p>

      <h3>🍲 Recettes</h3>

      {currentUid === uid && (
        <p>
          <Link to="/profile" className="edit-profile-link">Éditer mon profil</Link>
        </p>
      )}

      <h3>🍲 Recettes ({recettes.length})</h3>

      <div className="cards">
        {recettes.map((r, i) => {
          const target = r.id ? `/recette/${r.id}` : `/recette/${encodeURIComponent(r.nom)}`;
          return (
            <Link key={r.id || i} to={target} className="card-link">
              <div className="profile-card">
                <Card details={r} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
