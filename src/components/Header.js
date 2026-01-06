
import { ref, get } from "firebase/database"
import { auth, database } from "../base"
import { useEffect } from "react";



import { useNavigate } from 'react-router-dom';

const Header = ({ user, pseudo }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        navigate('/');
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    const u = auth.currentUser;
    if (u) {
      get(ref(database, "users/" + u.uid)).then(snapshot => console.log(snapshot.val()));
    }
  }, []);

  return (
    <header className="header">
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <button onClick={() => document.body.classList.toggle("dark")}>🌙 Dark</button>
      </div>

      <h1>Ma Boîte à Recettes</h1>

      <div className="user-info">
        {user ? (
          <>
            <button onClick={() => navigate('/profile')}>👤 Mon profil</button>
            <span>Bonjour, {pseudo}!</span>
            <button onClick={handleLogout}>Déconnexion</button>
          </>
        ) : (
          <>
            <button onClick={() => navigate('/signup')}>Créer un compte</button>
            <button onClick={() => navigate('/login')}>Se connecter</button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
