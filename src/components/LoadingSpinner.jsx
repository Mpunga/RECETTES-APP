import React from 'react';
import './LoadingSpinner.css';

export default function LoadingSpinner({ message = 'Chargement…' }) {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-icon">🍽️</div>
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
}
