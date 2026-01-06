import React, { Component } from "react";
import { auth } from "../base";
import { signInWithEmailAndPassword } from "firebase/auth";
import { withRouter } from "../withRouter"; // wrapper pour navigation

class Login extends Component {
  state = {
    email: "",
    password: ""
  };

  handleChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  };

  login = async e => {
    e.preventDefault();
    const { email, password } = this.state;
    const { navigate } = this.props; // avec withRouter

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Connecté 🚀");
      navigate("/"); // redirection vers App
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  render() {
    const { email, password } = this.state;

    return (
      <div className="auth-page">
        <div className="auth-card">
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
              type="password"
              name="password"
              placeholder="Mot de passe"
              value={password}
              onChange={this.handleChange}
              required
            />
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
