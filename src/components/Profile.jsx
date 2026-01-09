import { useEffect, useState } from "react";
import { auth, database} from "../base";
import { showToast } from "../toast";
import { ref as dbRef, get, set, update, onValue, remove, push } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { useUserPresence } from "../hooks/usePresence";
import './Profile.css';
import './RecetteModal.css';
import AjouterRecette from '../AjouterRecette';

// Liste des pays avec leurs capitales
const PAYS_CAPITALES = {
  "France": "Paris",
  "Belgique": "Bruxelles",
  "Suisse": "Berne",
  "Canada": "Ottawa",
  "États-Unis": "Washington D.C.",
  "Royaume-Uni": "Londres",
  "Allemagne": "Berlin",
  "Italie": "Rome",
  "Espagne": "Madrid",
  "Portugal": "Lisbonne",
  "Pays-Bas": "Amsterdam",
  "Maroc": "Rabat",
  "Algérie": "Alger",
  "Tunisie": "Tunis",
  "Sénégal": "Dakar",
  "Côte d'Ivoire": "Yamoussoukro",
  "Cameroun": "Yaoundé",
  "Congo (RDC)": "Kinshasa",
  "Madagascar": "Antananarivo",
  "Mali": "Bamako",
  "Burkina Faso": "Ouagadougou",
  "Niger": "Niamey",
  "Tchad": "N'Djamena",
  "Gabon": "Libreville",
  "Guinée": "Conakry",
  "Bénin": "Porto-Novo",
  "Togo": "Lomé",
  "Rwanda": "Kigali",
  "Burundi": "Gitega",
  "Haïti": "Port-au-Prince",
  "Luxembourg": "Luxembourg",
  "Monaco": "Monaco"
};

// Capitales alternatives pour certains pays
const CAPITALES_PAR_PAYS = {
  "France": ["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Nantes", "Lille", "Strasbourg"],
  "Belgique": ["Bruxelles", "Anvers", "Gand", "Charleroi", "Liège", "Bruges"],
  "Suisse": ["Berne", "Zurich", "Genève", "Bâle", "Lausanne", "Lucerne"],
  "Canada": ["Ottawa", "Toronto", "Montréal", "Vancouver", "Québec", "Calgary", "Edmonton"],
  "États-Unis": ["Washington D.C.", "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia"],
  "Maroc": ["Rabat", "Casablanca", "Marrakech", "Fès", "Tanger", "Agadir", "Meknès"],
  "Algérie": ["Alger", "Oran", "Constantine", "Annaba", "Batna", "Sétif"],
  "Tunisie": ["Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabès"],
  "Sénégal": ["Dakar", "Thiès", "Kaolack", "Saint-Louis", "Ziguinchor"],
  "Cameroun": ["Yaoundé", "Douala", "Bafoussam", "Garoua", "Bamenda"],
  "Côte d'Ivoire": ["Yamoussoukro", "Abidjan", "Bouaké", "Daloa", "San-Pédro"],
  "Congo (RDC)": ["Kinshasa", "Lubumbashi", "Mbuji-Mayi", "Kananga", "Kisangani", "Goma", "Bukavu"]
};

// Provinces par pays
const PROVINCES_PAR_PAYS = {
  "France": ["Île-de-France", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine", "Occitanie", "Hauts-de-France", "Provence-Alpes-Côte d'Azur", "Grand Est", "Bretagne", "Pays de la Loire", "Normandie", "Bourgogne-Franche-Comté", "Centre-Val de Loire", "Corse"],
  "Belgique": ["Région flamande", "Région wallonne", "Région de Bruxelles-Capitale", "Anvers", "Brabant flamand", "Brabant wallon", "Flandre-Occidentale", "Flandre-Orientale", "Hainaut", "Liège", "Limbourg", "Luxembourg", "Namur"],
  "Suisse": ["Zurich", "Berne", "Lucerne", "Uri", "Schwyz", "Genève", "Vaud", "Valais", "Neuchâtel", "Fribourg", "Jura", "Tessin"],
  "Canada": ["Alberta", "Colombie-Britannique", "Manitoba", "Nouveau-Brunswick", "Terre-Neuve-et-Labrador", "Nouvelle-Écosse", "Ontario", "Île-du-Prince-Édouard", "Québec", "Saskatchewan"],
  "Maroc": ["Tanger-Tétouan-Al Hoceïma", "Oriental", "Fès-Meknès", "Rabat-Salé-Kénitra", "Béni Mellal-Khénifra", "Casablanca-Settat", "Marrakech-Safi", "Drâa-Tafilalet", "Souss-Massa", "Guelmim-Oued Noun", "Laâyoune-Sakia El Hamra", "Dakhla-Oued Ed-Dahab"],
  "Algérie": ["Alger", "Oran", "Constantine", "Annaba", "Sétif", "Batna", "Blida", "Tizi Ouzou", "Béjaïa", "Tlemcen"],
  "Tunisie": ["Tunis", "Ariana", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba", "Kairouan", "Kasserine", "Kébili", "Mahdia", "Sfax", "Sousse"],
  "Sénégal": ["Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack", "Kédougou", "Kolda", "Louga", "Matam", "Saint-Louis", "Sédhiou", "Tambacounda", "Thiès", "Ziguinchor"],
  "Cameroun": ["Adamaoua", "Centre", "Est", "Extrême-Nord", "Littoral", "Nord", "Nord-Ouest", "Ouest", "Sud", "Sud-Ouest"],
  "Côte d'Ivoire": ["Abidjan", "Bas-Sassandra", "Comoé", "Denguélé", "Gôh-Djiboua", "Lacs", "Lagunes", "Montagnes", "Sassandra-Marahoué", "Savanes", "Vallée du Bandama", "Woroba", "Yamoussoukro", "Zanzan"],
  "Congo (RDC)": ["Kinshasa", "Kongo-Central", "Kwango", "Kwilu", "Mai-Ndombe", "Kasaï", "Kasaï-Central", "Kasaï-Oriental", "Lomami", "Sankuru", "Maniema", "Sud-Kivu", "Nord-Kivu", "Ituri", "Haut-Uélé", "Tshopo", "Bas-Uélé", "Nord-Ubangi", "Mongala", "Sud-Ubangi", "Équateur", "Tshuapa", "Tanganyika", "Haut-Lomami", "Lualaba", "Haut-Katanga"]
};


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
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const navigate = useNavigate();
  
  // Activer la présence pour l'utilisateur actuel
  useUserPresence();

  // Fonctions helper pour obtenir les options de sélection
  const getCapitalesOptions = () => {
    if (!form.pays) return [];
    return CAPITALES_PAR_PAYS[form.pays] || [PAYS_CAPITALES[form.pays]];
  };

  const getProvincesOptions = () => {
    if (!form.pays) return [];
    return PROVINCES_PAR_PAYS[form.pays] || [];
  };

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
      pays: "France",
      capital: "Paris",
      province: "",
      photo: "https://i.pravatar.cc/150?u=" + user.uid,
      bio: "Nouveau membre ",
      createdAt: Date.now()
    });
    showToast("Profil créé ", { type: 'success' });
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
    showToast("Profil mis à jour ", { type: 'success' });
  };

  // Réinitialiser photoPreview quand on quitte le mode édition
  useEffect(() => {
    if (!editMode) {
      setPhotoPreview(null);
    }
  }, [editMode]);

  /* const handlePhotoChange = async e => {
    const user = auth.currentUser;
    const file = e.target.files[0];
    if (!file) return;

    const fileRef = storageRef(storage, `avatars/${user.uid}-${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    await update(dbRef(database, "users/" + user.uid), { photo: url });
    setProfile(prev => ({ ...prev, photo: url }));
    showToast("Photo mise à jour ", { type: 'success' });
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

  // Gérer la capture photo depuis la caméra
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      setTimeout(() => {
        const video = document.getElementById('camera-video-profile');
        if (video) {
          video.srcObject = mediaStream;
        }
      }, 100);
    } catch (error) {
      console.error('Erreur caméra:', error);
      showToast('❌ Impossible d\'accéder à la caméra', { type: 'error' });
    }
  };

  const capturePhoto = () => {
    const video = document.getElementById('camera-video-profile');
    const canvas = document.getElementById('camera-canvas-profile');
    
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      setPhotoPreview(base64);
      setForm(prev => ({ ...prev, photo: base64 }));
      stopCamera();
      showToast('✅ Photo capturée', { type: 'success' });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const handleDeleteRecipe = async id => {
    if (!window.confirm('Supprimer cette recette ?')) return;
    try {
      await remove(dbRef(database, `recettes/${id}`));
      showToast('Recette supprimée', { type: 'success' });
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la suppression', { type: 'error', duration: 5000 });
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

  const submitFeedback = async (e) => {
    e.preventDefault();
    const message = (feedbackText || '').trim();
    if (!message) {
      showToast('Merci de saisir un retour', { type: 'error', duration: 3000 });
      return;
    }

    const user = auth.currentUser;
    const payload = {
      message,
      email: (feedbackEmail || user?.email || '').trim(),
      authorId: user?.uid || null,
      createdAt: Date.now()
    };

    try {
      await push(dbRef(database, 'feedback'), payload);
      setFeedbackText('');
      setFeedbackEmail('');
      showToast('Merci pour votre feedback ! ', { type: 'success' });
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de l\'envoi du feedback', { type: 'error', duration: 4000 });
    }
  };


  if (loading) return <p>Chargement profil...</p>;
  if (missing)
    return (
      <div className="profile-missing">
        <h2>Profil introuvable </h2>
        <p>Ton compte existe mais ton profil n'a jamais été créé.</p>
        <button onClick={createProfile}>Créer mon profil</button>
      </div>
    );

  return (
    <div className="profile">
      <button className="back-btn" onClick={() => navigate('/')} title="Retour au menu principal">
        <span className="material-icons" style={{fontSize:'18px',marginRight:'4px',verticalAlign:'middle'}}>home</span>
        Accueil
      </button>

      <div className="profile-card">
        <div className="profile-photo">
          <img src={photoPreview || profile.photo} alt="Profil" />
        </div>

        <div className="profile-main">
          {editMode ? (
            <div className="profile-edit">
              <label className="field">
                Photo de profil
                <div style={{display:'flex',gap:'8px',marginTop:'8px',flexWrap:'wrap'}}>
                  <button type="button" onClick={startCamera} style={{flex:'1',minWidth:'120px',padding:'10px',background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'600'}}>
                    <span className="material-icons" style={{fontSize:'18px',verticalAlign:'middle',marginRight:'4px'}}>photo_camera</span>
                    Capturer
                  </button>
                  <label style={{flex:'1',minWidth:'120px',padding:'10px',background:'#e0e0e0',color:'#333',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'600',textAlign:'center',display:'inline-block'}}>
                    <span className="material-icons" style={{fontSize:'18px',verticalAlign:'middle',marginRight:'4px'}}>photo_library</span>
                    Galerie
                    <input type="file" accept="image/*" onChange={handlePhotoChange} style={{display:'none'}} />
                  </label>
                </div>
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
                <select 
                  name="pays" 
                  value={form.pays || ""} 
                  onChange={(e) => {
                    const pays = e.target.value;
                    setForm({ 
                      ...form, 
                      pays, 
                      capital: CAPITALES_PAR_PAYS[pays]?.[0] || PAYS_CAPITALES[pays] || "",
                      province: ""
                    });
                  }}
                >
                  <option value=""><span className="material-icons">public</span> Sélectionnez</option>
                  {Object.keys(PAYS_CAPITALES).sort().map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>

              {form.pays && (
                <label className="field">
                  Ville
                  <select 
                    name="capital" 
                    value={form.capital || ""} 
                    onChange={handleChange}
                  >
                    <option value=""><span className="material-icons">location_city</span> Sélectionnez</option>
                    {getCapitalesOptions().map(ville => (
                      <option key={ville} value={ville}>{ville}</option>
                    ))}
                  </select>
                </label>
              )}

              {form.pays && getProvincesOptions().length > 0 && (
                <label className="field">
                  Province / Région
                  <select 
                    name="province" 
                    value={form.province || ""} 
                    onChange={handleChange}
                  >
                    <option value=""><span className="material-icons">place</span> Facultatif</option>
                    {getProvincesOptions().map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </label>
              )}

              <label className="field">
                Bio
                <textarea name="bio" value={form.bio || ""} onChange={handleChange} placeholder="Bio" />
              </label>

              <div className="profile-actions">
                <button className="primary" onClick={handleSave}>Enregistrer </button>
                <button className="secondary" onClick={() => setEditMode(false)}>Annuler </button>
              </div>
            </div>
          ) : (
            <div className="profile-info">
                <div className="profile-header">
                <div>
                  <h1>{profile.prenom} {profile.nom}</h1>
                  <h3>
                    {profile.pays}
                    {profile.province && ` • ${profile.province}`}
                  </h3>
                </div>
                <div className="profile-actions-inline">
                  <button className="primary" onClick={() => setEditMode(true)}> Modifier profil</button>
                </div>
              </div>

              <p className="profile-bio">{profile.bio}</p>

              {profile.role === 'admin' && (
                <div className="admin-access" style={{marginTop:16}}>
                  <button 
                    className="admin-button" 
                    onClick={() => navigate('/admin')}
                  >
                    <span className="material-icons" style={{fontSize:'18px',marginRight:'4px',verticalAlign:'middle'}}>admin_panel_settings</span>
                    Accéder au Dashboard Admin
                  </button>
                </div>
              )}

              <div style={{marginTop:16}}>
                <button className="primary" onClick={() => setShowRecetteModal(true)}>
                  <span className="material-icons" style={{fontSize:'18px',marginRight:'4px',verticalAlign:'middle'}}>restaurant_menu</span>
                  Gérer mes recettes
                </button>
              </div>

              <div className="feedback-section">
                <h3> Votre feedback</h3>
                <p className="feedback-hint">Dites-nous ce qui fonctionne ou ce qu'on doit améliorer.</p>
                <form className="feedback-form" onSubmit={submitFeedback}>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Partager une idée, un bug ou une suggestion..."
                    rows="3"
                    maxLength="500"
                    required
                  />
                  <div className="feedback-row">
                    <input
                      type="email"
                      value={feedbackEmail}
                      onChange={(e) => setFeedbackEmail(e.target.value)}
                      placeholder="Votre email (optionnel)"
                    />
                    <button type="submit">Envoyer</button>
                  </div>
                </form>
              </div>

          {showRecetteModal && (
            <div className="recette-modal-overlay" onClick={() => { setShowRecetteModal(false); setShowAddForm(false); }}>
              <div className="recette-modal" onClick={e => e.stopPropagation()}>
                <button className="recette-modal-close" onClick={() => { setShowRecetteModal(false); setShowAddForm(false); }}></button>
                <h3>Gérer mes recettes</h3>

                {!showAddForm ? (
                  <div>
                    <button style={{marginBottom:10}} onClick={openAdd}> Ajouter une recette</button>
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
                            <button onClick={() => openEdit(r)} style={{marginRight:8}}> Edit</button>
                            <button onClick={() => handleDeleteRecipe(r.id)}> Suppr</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <button className="back-btn" onClick={() => setShowAddForm(false)}> Retour à la liste</button>
                    <AjouterRecette initial={editingRecipe || undefined} recipeId={editingRecipe?.id} onSuccess={() => { setShowAddForm(false); setShowRecetteModal(false); }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de caméra */}
      {showCamera && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
          <div style={{background:'white',borderRadius:'16px',padding:'20px',maxWidth:'600px',width:'90%',textAlign:'center'}}>
            <h3 style={{marginBottom:'16px'}}>Capture photo</h3>
            <video id="camera-video-profile" autoPlay playsInline style={{width:'100%',maxWidth:'400px',borderRadius:'12px',marginBottom:'16px'}}></video>
            <canvas id="camera-canvas-profile" style={{display:'none'}}></canvas>
            <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
              <button type="button" onClick={capturePhoto} style={{padding:'12px 24px',background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'600'}}>
                <span className="material-icons" style={{fontSize:'18px',verticalAlign:'middle',marginRight:'4px'}}>camera</span>
                Capturer
              </button>
              <button type="button" onClick={stopCamera} style={{padding:'12px 24px',background:'#e0e0e0',color:'#333',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'600'}}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}   

