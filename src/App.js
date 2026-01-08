import { Component } from "react";
import "./App.css";
import Header from "./components/Header";
import { ref, onValue, set } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { database, auth } from "./base";
import Card from "./components/Card";
import RecommendedRecipes from "./components/RecommendedRecipes";


// Login component routed separately

class App extends Component {

  state = {
    recettes: {},
    user: null,
    loading: true,
    page: 1,
    perPage: 6,
    search: '',
    users: {},
    searchMode: 'nom'
  };

  unsubscribeAuth = null;
  unsubscribeRecettes = null;
  unsubscribeUsers = null;

  componentDidMount() {
    this.unsubscribeAuth = onAuthStateChanged(auth, user => {
      this.setState({ user, loading: false });
    });

    // Always listen for recettes so anonymous users can read them
    const recettesRef = ref(database, "recettes");
    this.unsubscribeRecettes = onValue(recettesRef, snapshot => {
      const data = snapshot.val() || {};
      this.setState({ recettes: data, page: 1 });
    });

    // Listen for users to power author search
    const usersRef = ref(database, "users");
    this.unsubscribeUsers = onValue(usersRef, snapshot => {
      const data = snapshot.val() || {};
      this.setState({ users: data });
    });
  }

  componentWillUnmount() {
    if (this.unsubscribeAuth) this.unsubscribeAuth();
    if (this.unsubscribeRecettes) this.unsubscribeRecettes();
    if (this.unsubscribeUsers) this.unsubscribeUsers();
  }

  componentDidUpdate(prevProps, prevState) {
    const prevCount = Object.keys(prevState.recettes || {}).length;
    const currCount = Object.keys(this.state.recettes || {}).length;
    if (prevCount !== currCount && this.state.page !== 1) {
      this.setState({ page: 1 });
    }
  }


  // 🔥 Charger les recettes depuis Firebase
  loadRecettes = () => {
    const recettesRef = ref(database, "recettes");

    onValue(recettesRef, snapshot => {
      const data = snapshot.val() || {};
      this.setState({ recettes: data });
    });
  };

      // ➕ Ajouter une recette dans Firebase
  ajouterRecette = recette => {
  const key = `recette-${Date.now()}`;
  set(ref(database, "recettes/" + key), recette);
};

  render() {
    const { recettes, user, loading, search, users, searchMode } = this.state;

    if (loading) return <p style={{textAlign:"center"}}>Chargement… ⏳</p>;

    // sort recettes by createdAt if available, otherwise keep key order
    const entries = Object.entries(recettes || {});
    entries.sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));
    const q = (search || '').trim().toLowerCase();
    const filteredEntries = q
      ? entries.filter(([, value]) => {
          const nameMatch = (value.nom || '').toLowerCase().includes(q);
          const ingMatch = (value.ingredients || '').toLowerCase().includes(q);
          const author = users[value.authorId] || {};
          const authorLabel = `${author.prenom || ''} ${author.nom || ''} ${author.email || ''}`.toLowerCase();
          const authorMatch = authorLabel.includes(q);

          if (searchMode === 'auteur') {
            return authorMatch;
          }
          // mode nom: match on name or ingredients
          return nameMatch || ingMatch;
        })
      : entries;

    const total = filteredEntries.length;
    const { page, perPage } = this.state;
    const shown = filteredEntries.slice(0, page * perPage);

    const cards = shown.map(([key, value]) => {
      const cardDetails = { ...value, id: key };
      return <Card key={key} details={cardDetails} />;
    });

    return (
      <div className="box">
        <Header user={user} pseudo={user ? user.email : 'Invité'} />

        <div className="search-panel">
          <div className="search-row">
            <span className="search-label">🔎 Recherche</span>
            <input
              type="search"
              value={search}
              onChange={(e) => this.setState({ search: e.target.value, page: 1 })}
              placeholder="Par nom, ingrédient ou auteur"
              className="search-input"
            />
          </div>
          <div className="search-toggle">
            <button
              type="button"
              className={searchMode === 'nom' ? 'search-chip active' : 'search-chip'}
              onClick={() => this.setState({ searchMode: 'nom', page: 1 })}
            >
              Nom / Ingrédient
            </button>
            <button
              type="button"
              className={searchMode === 'auteur' ? 'search-chip active' : 'search-chip'}
              onClick={() => this.setState({ searchMode: 'auteur', page: 1 })}
            >
              Auteur
            </button>
          </div>
          <div className="search-meta">{filteredEntries.length} résultat(s)</div>
        </div>

        <RecommendedRecipes allRecipes={recettes} />

        <div className="cards">
          {cards.length ? cards : <p>Aucune recette pour l’instant 🍽️</p>}
        </div>

        {shown.length < total && (
          <div style={{textAlign:'center', marginTop:18}}>
            <button className="load-more" onClick={() => this.setState({ page: page + 1 })}>
              Charger plus
            </button>
          </div>
        )}
      </div>
    );
  }
}

export default App;
