import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useParametres } from '../hooks/useParametres'
import BarreRecherche from './BarreRecherche'

export default function Header({ onOuvrirPanier }) {
  const { user, profil, deconnexion } = useAuth()
  const { nombreArticles } = useCart()
  const { parametres } = useParametres()
  const navigate = useNavigate()
  const location = useLocation()

  const nomBoutique = parametres.nom_boutique || 'Lueur & Cire'

  // Le bouton "Boutique" ramene toujours en haut d'une boutique fraiche,
  // meme si on est deja sur la page (comme le clic sur le logo ramene a l'accueil)
  function allerALaBoutique(e) {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'auto' })
    navigate('/boutique', { state: { nonce: Date.now() } })
  }

  function allerAlAccueil(e) {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'auto' })
    navigate('/')
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 40,
      background: 'rgba(28, 20, 15, 0.92)', backdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--bois-clair)'
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 72, gap: 24,
      }}>
        <a href="/" onClick={allerAlAccueil} style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {parametres.logo_url ? (
            <img src={parametres.logo_url} alt={nomBoutique} style={{ height: 34, width: 34, objectFit: 'contain', borderRadius: 6 }} />
          ) : (
            <FlameIcon />
          )}
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.02em' }}>
            {nomBoutique}
          </span>
        </a>

        <BarreRecherche />

        <nav style={{ display: 'flex', alignItems: 'center', gap: 28, flexShrink: 0 }}>
          <a href="/boutique" onClick={allerALaBoutique} style={{ fontSize: 15, color: 'var(--cire-douce)' }}>Boutique</a>

          {profil?.is_admin && (
            <Link to="/admin" style={{ fontSize: 15, color: 'var(--flamme)' }}>Admin</Link>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <Link to="/favoris" style={{ fontSize: 15, color: 'var(--cire-douce)' }}>Favoris</Link>
              <Link to="/compte" style={{ fontSize: 15, color: 'var(--cire-douce)' }}>Mon compte</Link>
              <button
                onClick={async () => { await deconnexion(); navigate('/') }}
                style={{ background: 'none', color: 'var(--fumee)', fontSize: 15, padding: 0 }}
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <Link to="/connexion" style={{ fontSize: 15, color: 'var(--cire-douce)' }}>Connexion</Link>
          )}

          <button
            onClick={onOuvrirPanier}
            aria-label="Ouvrir le panier"
            style={{
              background: 'var(--bois)', border: '1px solid var(--bois-clair)',
              borderRadius: 4, padding: '10px 14px', position: 'relative',
              display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cire)'
            }}
          >
            <CartIcon />
            {nombreArticles > 0 && (
              <span style={{
                position: 'absolute', top: -8, right: -8,
                background: 'var(--braise)', color: 'var(--cire)',
                borderRadius: '50%', width: 20, height: 20,
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {nombreArticles}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  )
}

function FlameIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C12 2 6 8.5 6 13.5C6 17.09 8.69 20 12 20C15.31 20 18 17.09 18 13.5C18 12.5 17.7 11.4 17.2 10.3C16.9 12.3 15.6 13.5 14.3 13.5C15.3 10.5 13.5 6.5 12 2Z" fill="var(--flamme)"/>
      <path d="M12 20C13.66 20 15 18.43 15 16.5C15 15.2 14.2 14 13.5 13C13.6 14.5 12.7 15.3 12 15.3C11.3 15.3 10.6 14.7 10.6 13.8C9.9 14.6 9 15.7 9 16.8C9 18.57 10.34 20 12 20Z" fill="var(--braise)"/>
    </svg>
  )
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  )
}
