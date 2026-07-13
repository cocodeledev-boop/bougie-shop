import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Inscription() {
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const { inscription } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')
    if (password.length < 6) {
      setErreur('Le mot de passe doit faire au moins 6 caractères.')
      return
    }
    setEnvoi(true)
    const { error } = await inscription(email, password, prenom)
    setEnvoi(false)
    if (error) {
      setErreur(error.message)
      return
    }
    navigate('/compte')
  }

  return (
    <div className="container" style={{ maxWidth: 420, padding: '80px 24px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 28 }}>Créer un compte</h1>
      <form onSubmit={handleSubmit}>
        {erreur && <div className="message-erreur" style={{ marginBottom: 16 }}>{erreur}</div>}
        <div className="champ">
          <label htmlFor="prenom">Prénom</label>
          <input id="prenom" type="text" required value={prenom} onChange={e => setPrenom(e.target.value)} />
        </div>
        <div className="champ">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="champ">
          <label htmlFor="password">Mot de passe</label>
          <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-block" disabled={envoi} type="submit">
          {envoi ? 'Création...' : 'Créer mon compte'}
        </button>
      </form>
      <p style={{ marginTop: 20, fontSize: 14, color: 'var(--fumee)' }}>
        Déjà un compte ? <Link to="/connexion" style={{ color: 'var(--flamme)' }}>Se connecter</Link>
      </p>
    </div>
  )
}
