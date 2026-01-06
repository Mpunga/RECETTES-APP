import { Component } from "react";
import "./App.css";
import Header from "./components/Header";
import React, { Suspense, lazy } from 'react';
import { ref, onValue, set } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { database, auth } from "./base";
import Card from "./components/Card";

// Login component routed separately

class App extends Component {

  state = {
    recettes: {},
    user: null,
    loading: true,
    page: 1,
    perPage: 6
  };

  componentDidMount() {
    onAuthStateChanged(auth, user => {
      this.setState({ user, loading: false });
    });

    // Always listen for recettes so anonymous users can read them
    const recettesRef = ref(database, "recettes");
    onValue(recettesRef, snapshot => {
      const data = snapshot.val() || {};
      this.setState({ recettes: data, page: 1 });
    });
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
    const { recettes, user, loading } = this.state;

    if (loading) return <p style={{textAlign:"center"}}>Chargement… ⏳</p>;

    // sort recettes by createdAt if available, otherwise keep key order
    const entries = Object.entries(recettes || {});
    entries.sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));
    const total = entries.length;
    const { page, perPage } = this.state;
    const shown = entries.slice(0, page * perPage);

    const cards = shown.map(([key, value]) => (
      <Suspense key={key} fallback={<div style={{height:220,background:'#f5f5f5',borderRadius:12}} />}>
        <Card details={value} />
      </Suspense>
    ));

    return (
      <div className="box">
        <Header user={user} pseudo={user ? user.email : 'Invité'} />

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
