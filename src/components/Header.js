
import { ref, get } from "firebase/database"
import { auth, database } from "../base"
import { useEffect, useState } from "react";



import { useNavigate } from 'react-router-dom';

const Header = ({ user, pseudo }) => {
  const navigate = useNavigate();
  const [name, setName] = useState(pseudo || 'Invité');
  const [showGreeting, setShowGreeting] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      // if no saved preference, use system preference
      if (window && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    } catch(e){}
    return document.body.classList.contains('dark');
  });

  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        navigate('/');
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    let timer;
    const u = auth.currentUser || user;
    if (u) {
      get(ref(database, "users/" + u.uid)).then(snapshot => {
        const data = snapshot.val() || {};
        const prenom = data.prenom || data.nom || (u.email ? u.email.split('@')[0] : 'Utilisateur');
        setName(prenom);
        // show greeting for 60s when user is present
        setShowGreeting(true);
        timer = setTimeout(() => setShowGreeting(false), 60000);
      }).catch(() => {
        const fallback = (u.email && u.email.split('@')[0]) || 'Utilisateur';
        setName(fallback);
        setShowGreeting(true);
        timer = setTimeout(() => setShowGreeting(false), 60000);
      });
    } else {
      setName('Invité');
      setShowGreeting(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [user]);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      try { localStorage.setItem('theme','dark'); } catch(e){}
    } else {
      document.body.classList.remove('dark');
      try { localStorage.setItem('theme','light'); } catch(e){}
    }
  }, [darkMode]);

  const toggleDark = () => setDarkMode(d => !d);

  return (
    <header className="header">
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <button
          className={"dark-toggle" + (darkMode ? ' active' : '')}
          onClick={toggleDark}
          aria-pressed={darkMode}
          title={darkMode ? 'Désactiver le thème sombre' : 'Activer le thème sombre'}
        >
          <span style={{display:'inline-block',transform: darkMode ? 'rotate(20deg)' : 'none'}}>🌙</span>
        </button>
        <span className={"dark-label" + (darkMode ? ' active' : '')} aria-hidden>
          Sombre
        </span>
      </div>

      <h1 className="brand" aria-label="E~Food">E~Food</h1>

      <div className="user-info">
        {user ? (
          <>
                        <button onClick={() => navigate('/courses')}>🛒 Liste de courses</button>
            <button onClick={() => navigate('/profile')}>👤 Mon profil</button>
            {showGreeting && (
              <span className="greeting" style={{margin:'0 8px',fontWeight:600,color:'#2c7'}}>
                Bonjour, {name}!
              </span>
            )}
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
