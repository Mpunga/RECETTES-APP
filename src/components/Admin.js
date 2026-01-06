// src/components/Admin.js
import AjouterRecette from "../AjouterRecette";

export default function Admin({ chargerExemple, ajouterRecette }) {
  return (
    <div className="admin">
      <AjouterRecette ajouterRecette={ajouterRecette} />

      {/* <button onClick={chargerExemple}>
        Charger les recettes d'exemple
      </button> */}
    </div>
  );
}
