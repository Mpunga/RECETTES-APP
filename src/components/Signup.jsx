import { useState } from "react";
import { auth, database } from "../base";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref as dbRef, set } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { showToast } from "../toast";

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
    capital: "",
    province: ""
  });

  const [photoBase64, setPhotoBase64] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useState(null)[0];
  const canvasRef = useState(null)[0];

  const handleChange = e => {
    const { name, value } = e.target;
    
    // Si le pays change, réinitialiser capitale et province
    if (name === "pays") {
      setForm({ 
        ...form, 
        pays: value, 
        capital: CAPITALES_PAR_PAYS[value]?.[0] || PAYS_CAPITALES[value] || "",
        province: ""
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Obtenir la liste des capitales pour le pays sélectionné
  const getCapitalesOptions = () => {
    if (!form.pays) return [];
    return CAPITALES_PAR_PAYS[form.pays] || [PAYS_CAPITALES[form.pays]];
  };

  // Obtenir la liste des provinces pour le pays sélectionné
  const getProvincesOptions = () => {
    if (!form.pays) return [];
    return PROVINCES_PAR_PAYS[form.pays] || [];
  };

  // Gérer la capture photo depuis la caméra
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      // Attendre que le modal soit rendu
      setTimeout(() => {
        const video = document.getElementById('camera-video');
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
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      setPhotoBase64(base64);
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

  // Gérer la sélection de fichier
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
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
        province: form.province || "",
        email: form.email,
        photo: photoURL,
        bio: "Amateur de cuisine 🍲",
        createdAt: Date.now()
      });

      showToast("Compte créé 🚀", { type: 'success' });
      navigate("/login");

    } catch (error) {
      console.error(error);
      
      // Messages d'erreur personnalisés en français
      let errorMessage = "Erreur lors de la création du compte";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "❌ Cet email est déjà utilisé";
          break;
        case 'auth/invalid-email':
          errorMessage = "❌ Email invalide";
          break;
        case 'auth/weak-password':
          errorMessage = "❌ Mot de passe trop faible (minimum 6 caractères)";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "❌ Inscription désactivée. Contactez l'administrateur";
          break;
        case 'auth/network-request-failed':
          errorMessage = "❌ Problème de connexion Internet";
          break;
        default:
          errorMessage = `❌ ${error.message}`;
      }
      
      showToast(errorMessage, { type: 'error', duration: 5000 });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button 
          type="button" 
          className="back-btn" 
          onClick={() => navigate('/')} 
          title="Retour au menu principal"
          style={{marginBottom:'16px'}}
        >
          <span className="material-icons" style={{fontSize:'18px',marginRight:'4px',verticalAlign:'middle'}}>home</span>
          Accueil
        </button>
        <h2>Créer un compte</h2>

        <form onSubmit={handleSubmit}>
          <input name="nom" placeholder="Nom" onChange={handleChange} required />
          <input name="prenom" placeholder="Prénom" onChange={handleChange} required />

          {/* 📸 Photo de profil */}
          <div className="photo-upload-section" style={{marginBottom:'16px'}}>
            <label style={{display:'block',marginBottom:'8px',fontWeight:'600'}}>Photo de profil</label>
            {photoBase64 && (
              <div style={{marginBottom:'12px',textAlign:'center'}}>
                <img src={photoBase64} alt="Aperçu" style={{width:'120px',height:'120px',objectFit:'cover',borderRadius:'50%',border:'3px solid #667eea'}} />
              </div>
            )}
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              <button type="button" onClick={startCamera} style={{flex:'1',minWidth:'120px',padding:'10px',background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'600'}}>
                <span className="material-icons" style={{fontSize:'18px',verticalAlign:'middle',marginRight:'4px'}}>photo_camera</span>
                Capturer
              </button>
              <label style={{flex:'1',minWidth:'120px',padding:'10px',background:'#e0e0e0',color:'#333',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'600',textAlign:'center',display:'inline-block'}}>
                <span className="material-icons" style={{fontSize:'18px',verticalAlign:'middle',marginRight:'4px'}}>photo_library</span>
                Galerie
                <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{display:'none'}} />
              </label>
            </div>
          </div>

          <input className="full" name="adresse" placeholder="Adresse" onChange={handleChange} />
          <input name="tele" placeholder="Téléphone" onChange={handleChange} />
          
          {/* Liste déroulante pour le pays */}
          <select 
            name="pays" 
            value={form.pays} 
            onChange={handleChange}
            required
            className="full"
          >
            <option value="">Sélectionnez votre pays</option>
            {Object.keys(PAYS_CAPITALES).sort().map(pays => (
              <option key={pays} value={pays}>{pays}</option>
            ))}
          </select>

          {/* Liste déroulante pour la capitale/ville */}
          {form.pays && (
            <select 
              name="capital" 
              value={form.capital} 
              onChange={handleChange}
              required
              className="full"
            >
              <option value="">Sélectionnez votre ville</option>
              {getCapitalesOptions().map(ville => (
                <option key={ville} value={ville}>{ville}</option>
              ))}
            </select>
          )}

          {/* Liste déroulante pour la province */}
          {form.pays && getProvincesOptions().length > 0 && (
            <select 
              name="province" 
              value={form.province} 
              onChange={handleChange}
              className="full"
            >
              <option value="">Province / Région (facultatif)</option>
              {getProvincesOptions().map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          )}

          <input className="full" type="email" name="email" placeholder="Email" onChange={handleChange} required />
          <input 
            className="full" 
            type={showPassword ? "text" : "password"} 
            name="password" 
            placeholder="Mot de passe" 
            onChange={handleChange} 
            required 
          />
          <label className="show-password-label">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            <span>Afficher le mot de passe</span>
          </label>

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
