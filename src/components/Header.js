import { auth } from "../base";

const Header = ({ pseudo }) => {
  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        window.location.reload(); // simple refresh pour retourner à la page de connexion
      })
      .catch(err => console.error(err));
  };

  return (
    <header className="header">
      <button onClick={() => document.body.classList.toggle("dark")}>
  🌙 Dark
</button>

      <h1>Ma Boîte à Recettes</h1>
      <div className="user-info">
        <span>Bonjour, {pseudo}!</span>
        <button onClick={handleLogout}>Déconnexion</button>
      </div>
    </header>
  );
};

export default Header;
