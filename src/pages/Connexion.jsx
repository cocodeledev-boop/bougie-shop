import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Connexion() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const { connexion } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)
    const { error } = await connexion(email, password)
    setEnvoi(false)
    if (error) {
      setErreur(error.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect.' : error.message)
      return
    }
    navigate('/compte')
  }

  return (
    <div className="container" style={{ maxWidth: 420, padding: '80px 24px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 28 }}>Connexion</h1>
      <form onSubmit={handleSubmit}>
        {erreur && <div className="message-erreur" style={{ marginBottom: 16 }}>{erreur}</div>}
        <div className="champ">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="champ">
          <label htmlFor="password">Mot de passe</label>
          <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-block" disabled={envoi} type="submit">
          {envoi ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
      <p style={{ marginTop: 20, fontSize: 14, color: 'var(--fumee)' }}>
        Pas encore de compte ? <Link to="/inscription" style={{ color: 'var(--flamme)' }}>Créer un compte</Link>
      </p>
    </div>
  )
}
