import React from "react"
import { useNavigate } from "react-router-dom"

export default function Connexion() {
  const [pseudo, setPseudo] = React.useState("")
  const navigate = useNavigate()

  const goToApp = (e) => {
    e.preventDefault()
    navigate(`/pseudo/${pseudo}`)
  }

  return (
    <div className="connexionBox">
      <form className="connexion" onSubmit={goToApp}>
        <h1>Bileyi</h1>

        <input
          type="text"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          placeholder="Nom du Chef"
          pattern="[A-Za-z-]{1,}"
          required
        />

        <button type="submit">GO 🚀</button>
        <p>Pas de caractères spéciaux.</p>
      </form>
    </div>
  )
}
