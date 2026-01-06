import { useState } from "react";
import { auth, database } from "../base";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref as dbRef, set } from "firebase/database";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    nom: "",
    prenom: "",
    adresse: "",
    tele: "",
    pays: "",
    capital: ""
  });

  const [photoBase64, setPhotoBase64] = useState("");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const uid = cred.user.uid;

      const photoURL = photoBase64 || `https://i.pravatar.cc/150?u=${uid}`;

      await set(dbRef(database, `users/${uid}`), {
        nom: form.nom,
        prenom: form.prenom,
        adresse: form.adresse,
        tele: form.tele,
        pays: form.pays,
        capital: form.capital,
        email: form.email,
        photo: photoURL,
        bio: "Amateur de cuisine 🍲",
        createdAt: Date.now()
      });

      alert("Compte créé 🚀");
      navigate("/login");

    } catch (error) {
      console.error(error);
      if (error.code === "auth/email-already-in-use") {
        alert("Cet email est déjà utilisé.");
      } else {
        alert("Erreur: " + error.message);
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Créer un compte</h2>

        <form onSubmit={handleSubmit}>
          <input name="nom" placeholder="Nom" onChange={handleChange} required />
          <input name="prenom" placeholder="Prénom" onChange={handleChange} required />

          {/* 📸 Upload photo */}
          <input
            type="file"
            accept="image/*"
            className="full"
            onChange={e => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setPhotoBase64(reader.result);
              reader.readAsDataURL(file);
            }}
          />

          <input className="full" name="adresse" placeholder="Adresse" onChange={handleChange} />
          <input name="tele" placeholder="Téléphone" onChange={handleChange} />
          <input name="pays" placeholder="Pays" value={form.pays} onChange={handleChange} />
          <input name="capital" placeholder="Capital" onChange={handleChange} />

          <input className="full" type="email" name="email" placeholder="Email" onChange={handleChange} required />
          <input className="full" type="password" name="password" placeholder="Mot de passe" onChange={handleChange} required />

          <button type="submit">Créer le compte</button>
        </form>

        <div className="auth-link">
          Déjà un compte ?{" "}
          <span onClick={() => navigate("/login")}>Se connecter</span>
        </div>
      </div>
    </div>
  );
}
