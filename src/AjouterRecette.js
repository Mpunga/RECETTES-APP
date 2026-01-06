import React, { Component } from "react";
import "./AjouterRecette.css";
import { auth, database } from "./base";
import { ref as dbRef, set } from "firebase/database";

export default class AjouterRecette extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nom: props.initial?.nom || "",
      image: props.initial?.image || "",
      ingredients: props.initial?.ingredients || "",
      instructions: props.initial?.instructions || ""
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.initial !== this.props.initial) {
      this.setState({
        nom: this.props.initial?.nom || "",
        image: this.props.initial?.image || "",
        ingredients: this.props.initial?.ingredients || "",
        instructions: this.props.initial?.instructions || ""
      });
    }
  }

  handleChange = e => {
    this.setState({
      [e.target.name]: e.target.value
    });
  };

  handleFileChange = e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      this.setState({ image: base64 });
    };
    reader.readAsDataURL(file);
  };

  parseList = (text) => {
    if (!text) return [];
    return text
      .split(/[;,\n]+/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  handleSubmit = async e => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return alert('Vous devez être connecté pour ajouter une recette.');

    try {
      if (this.props.recipeId) {
        const recette = {
          id: this.props.recipeId,
          ...this.state,
          authorId: user.uid,
          authorName: user.email,
          authorPhoto: user.photoURL || "https://i.pravatar.cc/150?u=" + user.uid,
          updatedAt: Date.now()
        };

        await set(dbRef(database, `recettes/${this.props.recipeId}`), recette);
        alert('Recette mise à jour ✅');
      } else {
        const key = `recette-${Date.now()}`;
        const recette = {
          id: key,
          ...this.state,
          authorId: user.uid,
          authorName: user.email,
          authorPhoto: user.photoURL || "https://i.pravatar.cc/150?u=" + user.uid,
          createdAt: Date.now()
        };
        await set(dbRef(database, `recettes/${key}`), recette);
        alert('Recette ajoutée ✅');
      }

      this.setState({ nom: "", image: "", ingredients: "", instructions: "" });
      if (e.currentTarget) e.currentTarget.reset();
      if (this.props.onSuccess) this.props.onSuccess();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'enregistrement de la recette.');
    }
  };

  render() {
    return (
      <form className="ajouter-recette" onSubmit={this.handleSubmit}>
        <input
          name="nom"
          onChange={this.handleChange}
          placeholder="Nom de la recette"
          required
        />
        <input
          name="image"
          value={this.state.image || ''}
          onChange={this.handleChange}
          placeholder="URL de l’image (ou choisissez un fichier)"
        />

        <label style={{display:'block',marginTop:8}}>
          Choisir une image depuis l'appareil
          <input type="file" accept="image/*" onChange={this.handleFileChange} />
        </label>
        
        <textarea
          name="ingredients"
          value={this.state.ingredients || ''}
          onChange={this.handleChange}
          placeholder="Ingrédients (séparés par des virgules ou ;)"
        />

        {this.parseList(this.state.ingredients).length > 0 && (
          <ol style={{marginTop:6, marginBottom:8, paddingLeft:18}}>
            {this.parseList(this.state.ingredients).map((it,i)=> (
              <li key={i} style={{fontSize:14}}>{it}</li>
            ))}
          </ol>
        )}

        <textarea
          name="instructions"
          value={this.state.instructions || ''}
          onChange={this.handleChange}
          placeholder="Instructions (séparées par des sauts de ligne, ; ou ,)"
        />

        {this.parseList(this.state.instructions).length > 0 && (
          <ol style={{marginTop:6, marginBottom:8, paddingLeft:18}}>
            {this.parseList(this.state.instructions).map((it,i)=> (
              <li key={i} style={{fontSize:14, marginBottom:6}}>{it}</li>
            ))}
          </ol>
        )}

        {this.state.image ? (
          <div style={{margin:'10px 0'}}>
            <img src={this.state.image} alt="aperçu" style={{maxWidth:120,maxHeight:90,objectFit:'cover',borderRadius:6}} />
          </div>
        ) : null}

        <button type="submit">{this.props.recipeId ? '💾 Enregistrer' : '➕ Ajouter la recette'}</button>
      </form>
    );
  }
}
