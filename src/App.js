import React, { Component } from "react";
import "./App.css";
import Header from "./components/Header";
import Admin from "./components/Admin";
import Card from "./components/Card";
import recettesExemple from "./recettes"; // fichier local avec recettes exemple

// Firebase
import { ref, onValue, set } from "firebase/database";
import { database } from "./base";
import { withRouter } from "./withRouter";

class App extends Component {
  state = {
    pseudo: "",
    recettes: {}
  };

  componentDidMount() {
    // Récupérer pseudo depuis URL
    const pseudo = this.props.params?.pseudo || "Invité";
    this.setState({ pseudo });

    // Charger les recettes depuis Firebase
    const recettesRef = ref(database, "recettes"); // <-- chemin exact dans la DB
    onValue(recettesRef, snapshot => {
      const data = snapshot.val();
      console.log("Données reçues depuis Firebase :", data);
      if (data) {
        this.setState({ recettes: data });
      }
    });
  }

  // Charger les recettes d'exemple dans Firebase
  chargerExemple = () => {
    Object.keys(recettesExemple).forEach(key => {
      set(ref(database, `recettes/${key}`), recettesExemple[key]);
    });
    alert("Recettes d'exemple ajoutées !");
  };

  render() {
    const { pseudo, recettes } = this.state;

    // Créer les cartes à partir des recettes
    const cards = Object.keys(recettes).map(key => (
      <Card key={key} details={recettes[key]} />
    ));

    return (
      <div className="box">
        <Header pseudo={pseudo} />
        <div className="cards">
          {cards.length ? cards : <p>Aucune recette disponible.</p>}
        </div>
        <Admin chargerExemple={this.chargerExemple} />
      </div>
    );
  }
}

export default withRouter(App);
