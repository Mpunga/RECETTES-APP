import { useEffect, useState } from "react";
import { auth, database} from "../base";
import { ref as dbRef, get, set, update, onValue, remove } from "firebase/database";
import { useNavigate } from "react-router-dom";
import './Profile.css';
import './RecetteModal.css';
import AjouterRecette from '../AjouterRecette';


export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [showRecetteModal, setShowRecetteModal] = useState(false);
  const [userRecipes, setUserRecipes] = useState([]);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const navigate = useNavigate();

 useEffect(() => {
  const unsub = auth.onAuthStateChanged(user => {
    if (!user) {
      setLoading(false);
      return;
    }

    const userRef = dbRef(database, "users/" + user.uid);

    get(userRef)
      .then(snapshot => {
        if (snapshot.exists()) {
          setProfile(snapshot.val());
          setForm(snapshot.val());
        } else {
          setMissing(true);
        }
      })
      .finally(() => setLoading(false));
  });

  return () => unsub();
}, []);

useEffect(() => {
  const unsubAuth = auth.onAuthStateChanged(user => {
    if (!user) {
      setUserRecipes([]);
      return;
    }

    const recettesRef = dbRef(database, "recettes");
    const unsubscribe = onValue(recettesRef, snapshot => {
      const all = snapshot.val() || {};
      const list = Object.keys(all)
        .map(k => all[k])
        .filter(r => r.authorId === user.uid)
        .sort((a,b)=> (b.createdAt||0)-(a.createdAt||0));
      setUserRecipes(list);
    });

    return () => {
      unsubscribe();
    };
  });

  return () => unsubAuth();
}, []);


  const createProfile = async () => {
    const user = auth.currentUser;
    await set(dbRef(database, "users/" + user.uid), {
      nom: "Utilisateur",
      prenom: "Inconnu",
      email: user.email,
      pays: "pays",
      photo: "https://i.pravatar.cc/150?u=" + user.uid,
      bio: "Nouveau membre 🍽️",
      createdAt: Date.now()
    });
    alert("Profil créé 🚀");
    // update local state instead of forcing a reload
    const snapshot = await get(dbRef(database, "users/" + user.uid));
    if (snapshot.exists()) {
      setProfile(snapshot.val());
      setForm(snapshot.val());
      setMissing(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    await update(dbRef(database, "users/" + user.uid), form);
    setProfile(form);
    setEditMode(false);
    setPhotoPreview(null);
    alert("Profil mis à jour ✅");
  };

  /* const handlePhotoChange = async e => {
    const user = auth.currentUser;
    const file = e.target.files[0];
    if (!file) return;

    const fileRef = storageRef(storage, `avatars/${user.uid}-${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    await update(dbRef(database, "users/" + user.uid), { photo: url });
    setProfile(prev => ({ ...prev, photo: url }));
    alert("Photo mise à jour 📸");
  }; */

 const handlePhotoChange = e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const base64 = reader.result;
    // preview locally and store in the form; save to DB on handleSave
    setPhotoPreview(base64);
    setForm(prev => ({ ...prev, photo: base64 }));
  };

  reader.readAsDataURL(file);
};

  const handleDeleteRecipe = async id => {
    if (!window.confirm('Supprimer cette recette ?')) return;
    try {
      await remove(dbRef(database, `recettes/${id}`));
      alert('Recette supprimée');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression');
    }
  };

  const openEdit = recipe => {
    setEditingRecipe(recipe);
    setShowAddForm(true);
  };

  const openAdd = () => {
    setEditingRecipe(null);
    setShowAddForm(true);
  };


  if (loading) return <p>Chargement profil...</p>;
  if (missing)
    return (
      <div className="profile-missing">
        <h2>Profil introuvable 😬</h2>
        <p>Ton compte existe mais ton profil n’a jamais été créé.</p>
        <button onClick={createProfile}>Créer mon profil</button>
      </div>
    );

  return (
    <div className="profile">
      <button className="back-btn" onClick={() => navigate(-1)}>⬅ Retour</button>

      <div className="profile-card">
        <div className="profile-photo">
          <img src={photoPreview || profile.photo} alt="Profil" />
        </div>

        <div className="profile-main">
          {editMode ? (
            <div className="profile-edit">
              <label className="field">
                Photo de profil
                <input type="file" accept="image/*" onChange={handlePhotoChange} />
              </label>

              <label className="field">
                Prénom
                <input name="prenom" value={form.prenom || ""} onChange={handleChange} placeholder="Prénom" />
              </label>

              <label className="field">
                Nom
                <input name="nom" value={form.nom || ""} onChange={handleChange} placeholder="Nom" />
              </label>

              <label className="field">
                Pays
                <input name="pays" value={form.pays || ""} onChange={handleChange} placeholder="Pays" />
              </label>

              <label className="field">
                Bio
                <textarea name="bio" value={form.bio || ""} onChange={handleChange} placeholder="Bio" />
              </label>

              <div className="profile-actions">
                <button className="primary" onClick={handleSave}>Enregistrer ✅</button>
                <button className="secondary" onClick={() => setEditMode(false)}>Annuler ❌</button>
              </div>
            </div>
          ) : (
            <div className="profile-info">
                <div className="profile-header">
                <div>
                  <h1>{profile.prenom} {profile.nom}</h1>
                  <h3>{profile.pays}</h3>
                </div>
                <div className="profile-actions-inline">
                  <button className="primary" onClick={() => setEditMode(true)}>✏️ Modifier profil</button>
                </div>
              </div>

              <p className="profile-bio">{profile.bio}</p>

              <div style={{marginTop:16}}>
                <button className="primary" onClick={() => setShowRecetteModal(true)}>➕ Gérer mes recettes</button>
              </div>
          {showRecetteModal && (
            <div className="recette-modal-overlay" onClick={() => { setShowRecetteModal(false); setShowAddForm(false); }}>
              <div className="recette-modal" onClick={e => e.stopPropagation()}>
                <button className="recette-modal-close" onClick={() => { setShowRecetteModal(false); setShowAddForm(false); }}>✖</button>
                <h3>Gérer mes recettes</h3>

                {!showAddForm ? (
                  <div>
                    <button style={{marginBottom:10}} onClick={openAdd}>➕ Ajouter une recette</button>
                    <div>
                      {userRecipes.length === 0 && <p>Aucune recette pour l'instant.</p>}
                      {userRecipes.map(r => (
                        <div key={r.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #eee'}}>
                          <div style={{display:'flex',alignItems:'center',gap:12}}>
                            <img src={(r.image && (r.image.startsWith('http')||r.image.startsWith('/')))? r.image : (()=>{try{return require(`../img/${r.image}`)}catch(e){return r.image}})()} alt={r.nom} style={{width:72,height:54,objectFit:'cover',borderRadius:6}} />
                            <div>
                              <div style={{fontWeight:600}}>{r.nom}</div>
                              <div style={{fontSize:12,color:'#666'}}>{(r.ingredients||'').split(',').slice(0,3).join(', ')}</div>
                            </div>
                          </div>
                          <div>
                            <button onClick={() => openEdit(r)} style={{marginRight:8}}>✏️ Edit</button>
                            <button onClick={() => handleDeleteRecipe(r.id)}>🗑️ Suppr</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <button onClick={() => setShowAddForm(false)} style={{marginBottom:10}}>← Retour à la liste</button>
                    <AjouterRecette initial={editingRecipe || undefined} recipeId={editingRecipe?.id} onSuccess={() => { setShowAddForm(false); setShowRecetteModal(false); }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
      </div>
    </div>
  );
}   
