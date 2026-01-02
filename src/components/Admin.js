// src/components/Admin.js
import React from "react";

export default function Admin({ chargerExemple }) {
  return (
    <div className="admin">
      <button onClick={chargerExemple}>Charger exemple</button>
    </div>
  );
}
