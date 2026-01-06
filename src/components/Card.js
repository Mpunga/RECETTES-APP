import React from 'react';
import { useNavigate } from "react-router-dom";
import './Card.css';

function resolveImage(src) {
  if (!src) return '';
  if (src.startsWith('http') || src.startsWith('/')) return src;
  try {
    // Try to require from src/img
    return require(`../img/${src}`);
  } catch (e) {
    return src; // fallback, maybe already a valid path
  }
}

function Card({ details }) {
  const navigate = useNavigate();

  if (!details) return null;

  const imgSrc = resolveImage(details.image);

  const parseList = (text) =>
    (text || "")
      .split(/[;,\n]+/)
      .map(s => s.trim())
      .filter(Boolean);

  return (
    <div className="card recipe-card">
      <div className="card-media">
        <img
          src={imgSrc}
          alt={details.nom}
          loading="lazy"
          className="card-img"
        />
      </div>

      <div className="card-body">
        <h3 className="card-title">{details.nom}</h3>

        <div className="card-meta">
          <div className="meta-col ingredients">
            <h4>🧾 Ingrédients</h4>
            <ol>
              {parseList(details.ingredients).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          </div>

          <div className="meta-col instructions">
            <h4>📋 Instructions</h4>
            <ol>
              {parseList(details.instructions).map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>

        <button className="card-action" onClick={() => navigate("/recette/" + encodeURIComponent(details.nom))}>
          Voir la recette 👨‍🍳
        </button>
      </div>
    </div>
  );
}

export default React.memo(Card);
