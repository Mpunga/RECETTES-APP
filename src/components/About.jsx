import React from 'react';
import { useNavigate } from 'react-router-dom';
import './About.css';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="about-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Retour
      </button>

      <div className="about-content">
        <div className="about-header">
          <h1 className="about-title">
            <span className="title-icon">🥘</span>
            Historique de E-Food
          </h1>
        </div>

        <div className="about-story">
          <section className="story-section intro">
            <p className="lead-text">
              E-Food est né d'une idée simple mais puissante :
              <strong> aider les gens à mieux cuisiner, mieux manger et mieux partager la culture culinaire.</strong>
            </p>
          </section>

          <section className="story-section mission">
            <h2>Notre Mission</h2>
            <p>
              L'objectif principal de E-Food est d'offrir aux jeunes filles, jeunes garçons, 
              cuisiniers, restaurants et chefs la possibilité de préparer n'importe quel plat, 
              en commençant par <strong>la cuisine congolaise</strong>, puis en s'ouvrant progressivement 
              aux cuisines internationales.
            </p>
          </section>

          <section className="story-section features">
            <h2>Grâce à E-Food, chacun peut :</h2>
            <ul className="features-list">
              <li>
                <span className="feature-icon">🍲</span>
                <span>découvrir des recettes locales,</span>
              </li>
              <li>
                <span className="feature-icon">👨‍🍳</span>
                <span>apprendre à cuisiner pas à pas,</span>
              </li>
              <li>
                <span className="feature-icon">📸</span>
                <span>partager ses propres plats,</span>
              </li>
              <li>
                <span className="feature-icon">💡</span>
                <span>et s'inspirer de la communauté.</span>
              </li>
            </ul>
          </section>

          <section className="story-section platform">
            <p>
              Nous voulons que E-Food devienne <strong>la plateforme de référence</strong> pour 
              tous les repas congolais : qu'il s'agisse d'un plat traditionnel, d'une recette 
              de famille ou d'une création moderne.
            </p>
          </section>

          <section className="story-section vision">
            <h2>Notre Vision</h2>
            <p>
              À long terme, notre vision est claire : faire de E-Food un pont entre la cuisine 
              congolaise et le monde, en valorisant nos saveurs, notre savoir-faire et notre identité.
            </p>
          </section>

          <section className="story-section conclusion">
            <div className="highlight-box">
              <p className="conclusion-text">
                <strong>E-Food, ce n'est pas juste une application.</strong><br />
                C'est une communauté, une école de cuisine et un mouvement pour faire rayonner 
                la gastronomie congolaise
                <span className="emoji-group"> 🌍🔥</span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
