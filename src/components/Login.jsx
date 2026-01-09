import React, { Component } from "react";
import { auth } from "../base";
import { signInWithEmailAndPassword } from "firebase/auth";
import { withRouter } from "../withRouter"; // wrapper pour navigation
import { showToast } from "../toast";

class Login extends Component {
  state = {
    email: "",
    password: "",
    showPassword: false
  };

  handleChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  };

  togglePasswordVisibility = () => {
    this.setState({ showPassword: !this.state.showPassword });
  };

  login = async e => {
    e.preventDefault();
    const { email, password } = this.state;
    const { navigate } = this.props; // avec withRouter

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast("Connecté 🚀", { duration: 3000 });
      navigate("/"); // redirection vers App
    } catch (err) {
      // Messages d'erreur personnalisés en français
      let errorMessage = "Erreur de connexion";
      
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
          errorMessage = "❌ Aucun compte trouvé avec cet email";
          break;
        case 'auth/wrong-password':
          errorMessage = "❌ Mot de passe incorrect";
          break;
        case 'auth/invalid-email':
          errorMessage = "❌ Email invalide";
          break;
        case 'auth/user-disabled':
          errorMessage = "❌ Ce compte a été désactivé";
          break;
        case 'auth/too-many-requests':
          errorMessage = "❌ Trop de tentatives. Réessayez plus tard";
          break;
        case 'auth/network-request-failed':
          errorMessage = "❌ Problème de connexion Internet";
          break;
        default:
          errorMessage = `❌ ${err.message}`;
      }
      
      showToast(errorMessage, { type: 'error', duration: 5000 });
    }
  };

  render() {
    const { email, password, showPassword } = this.state;

    return (
      <div className="auth-page">
        <div className="auth-card">
          <button 
            type="button" 
            className="back-btn" 
            onClick={() => this.props.navigate('/')} 
            title="Retour au menu principal"
            style={{marginBottom:'16px'}}
          >
            <span className="material-icons" style={{fontSize:'18px',marginRight:'4px',verticalAlign:'middle'}}>home</span>
            Accueil
          </button>
          <h2>Connexion</h2>

          <form onSubmit={this.login}>
            <input
              className="full"
              name="email"
              placeholder="Email"
              value={email}
              onChange={this.handleChange}
              required
            />
            <input
              className="full"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Mot de passe"
              value={password}
              onChange={this.handleChange}
              required
            />
            <label className="show-password-label">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={this.togglePasswordVisibility}
              />
              <span>Afficher le mot de passe</span>
            </label>
            <button type="submit">Se connecter</button>
          </form>

          <div className="auth-link">
            Pas encore de compte ?{" "}
            <button
              onClick={() => this.props.navigate("/signup")}
              style={{
                border: "none",
                background: "transparent",
                color: "#ff4b5c",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Créer un compte
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Login);
