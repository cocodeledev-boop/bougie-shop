import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useParametres } from '../hooks/useParametres'
import { supabase } from '../lib/supabase'
import BarreRecherche from './BarreRecherche'

export default function Header({ onOuvrirPanier }) {
  const { user, profil, deconnexion } = useAuth()
  const { nombreArticles } = useCart()
  const { parametres } = useParametres()
  const navigate = useNavigate()
  const location = useLocation()
  const [categories, setCategories] = useState([])
  const [menuCategoriesOuvert, setMenuCategoriesOuvert] = useState(false)
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false)

  const nomBoutique = parametres.nom_boutique || 'Hugoline & Compagnies'

  useEffect(() => {
    if (parametres.nom_boutique) document.title = parametres.nom_boutique
  }, [parametres.nom_boutique])

  useEffect(() => {
    supabase.from('categories').select('id, nom').order('ordre').order('nom').limit(8)
      .then(({ data }) => setCategories(data || []))
  }, [])

  // Ferme le menu mobile a chaque changement de page
  useEffect(() => { setMenuMobileOuvert(false) }, [location.pathname])

  // Le bouton "Boutique" ramene toujours en haut d'une boutique fraiche,
  // meme si on est deja sur la page (comme le clic sur le logo ramene a l'accueil)
  function allerALaBoutique(e, categorieId) {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'auto' })
    navigate('/boutique', { state: { nonce: Date.now(), categorieId } })
    setMenuCategoriesOuvert(false)
    setMenuMobileOuvert(false)
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

        <div className="barre-recherche-desktop" style={{ flex: 1 }}>
          <BarreRecherche />
        </div>

        {/* Navigation desktop */}
        <nav className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 28, flexShrink: 0 }}>
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setMenuCategoriesOuvert(true)}
            onMouseLeave={() => setMenuCategoriesOuvert(false)}
          >
            <a href="/boutique" onClick={e => allerALaBoutique(e)} className="lien-nav" style={{ fontSize: 15, color: 'var(--cire-douce)', display: 'flex', alignItems: 'center', gap: 5 }}>
              Boutique
              {categories.length > 0 && <span style={{ fontSize: 10, transform: menuCategoriesOuvert ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>}
            </a>
            {menuCategoriesOuvert && categories.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                marginTop: 14, background: 'var(--bois)', border: '1px solid var(--bois-clair)',
                borderRadius: 8, boxShadow: '0 16px 40px rgba(0,0,0,0.45)', overflow: 'hidden',
                minWidth: 190, paddingTop: 6,
              }}>
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={e => allerALaBoutique(e, c.id)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left', background: 'none',
                      padding: '10px 18px', fontSize: 14, color: 'var(--cire-douce)',
                      borderBottom: '1px solid var(--bois-clair)', transition: 'color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--flamme)'; e.currentTarget.style.background = 'rgba(242,166,90,0.06)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--cire-douce)'; e.currentTarget.style.background = 'none' }}
                  >
                    {c.nom}
                  </button>
                ))}
              </div>
            )}
          </div>

          {profil?.is_admin && (
            <Link to="/admin" className="lien-nav" style={{ fontSize: 15, color: 'var(--flamme)' }}>Admin</Link>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <Link to="/favoris" className="lien-nav" style={{ fontSize: 15, color: 'var(--cire-douce)' }}>Favoris</Link>
              <Link to="/compte" className="lien-nav" style={{ fontSize: 15, color: 'var(--cire-douce)' }}>Mon compte</Link>
              <button
                onClick={async () => { await deconnexion(); navigate('/') }}
                style={{ background: 'none', color: 'var(--fumee)', fontSize: 15, padding: 0 }}
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <Link to="/connexion" className="lien-nav" style={{ fontSize: 15, color: 'var(--cire-douce)' }}>Connexion</Link>
          )}

          <button
            onClick={onOuvrirPanier}
            aria-label="Ouvrir le panier"
            style={{
              background: 'var(--bois)', border: '1px solid var(--bois-clair)',
              borderRadius: 4, padding: '10px 14px', position: 'relative',
              display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cire)',
              transition: 'border-color 0.2s ease, transform 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--flamme)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bois-clair)'}
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

        {/* Boutons mobile : panier + burger, nav complete dans le tiroir */}
        <div className="nav-mobile" style={{ display: 'none', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onOuvrirPanier}
            aria-label="Ouvrir le panier"
            style={{
              background: 'var(--bois)', border: '1px solid var(--bois-clair)',
              borderRadius: 4, padding: '9px 12px', position: 'relative',
              display: 'flex', alignItems: 'center', color: 'var(--cire)',
            }}
          >
            <CartIcon />
            {nombreArticles > 0 && (
              <span style={{
                position: 'absolute', top: -7, right: -7,
                background: 'var(--braise)', color: 'var(--cire)',
                borderRadius: '50%', width: 18, height: 18,
                fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {nombreArticles}
              </span>
            )}
          </button>
          <button
            onClick={() => setMenuMobileOuvert(v => !v)}
            aria-label="Ouvrir le menu"
            style={{
              background: 'var(--bois)', border: '1px solid var(--bois-clair)',
              borderRadius: 4, padding: '9px 10px', color: 'var(--cire)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <BurgerIcon ouvert={menuMobileOuvert} />
          </button>
        </div>
      </div>

      {/* Tiroir mobile : recherche + toute la navigation */}
      {menuMobileOuvert && (
        <div className="menu-mobile-tiroir" style={{
          borderTop: '1px solid var(--bois-clair)', background: 'var(--nuit)',
          padding: '18px 16px 26px', display: 'none', flexDirection: 'column', gap: 18,
        }}>
          <BarreRecherche />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <p style={{ fontSize: 12, color: 'var(--fumee)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '4px 0 8px' }}>Boutique</p>
            <a href="/boutique" onClick={e => allerALaBoutique(e)} style={lienMobile}>Toutes les bougies</a>
            {categories.map(c => (
              <button key={c.id} onClick={e => allerALaBoutique(e, c.id)} style={{ ...lienMobile, textAlign: 'left', background: 'none' }}>
                {c.nom}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid var(--bois-clair)', paddingTop: 14 }}>
            {profil?.is_admin && <Link to="/admin" style={{ ...lienMobile, color: 'var(--flamme)' }}>Espace admin</Link>}
            {user ? (
              <>
                <Link to="/favoris" style={lienMobile}>Mes favoris</Link>
                <Link to="/compte" style={lienMobile}>Mon compte</Link>
                <button
                  onClick={async () => { await deconnexion(); navigate('/') }}
                  style={{ ...lienMobile, textAlign: 'left', background: 'none', color: 'var(--fumee)' }}
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link to="/connexion" style={lienMobile}>Connexion</Link>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .barre-recherche-desktop { display: none !important; }
          .nav-desktop { display: none !important; }
          .nav-mobile { display: flex !important; }
          .menu-mobile-tiroir { display: flex !important; }
        }
      `}</style>
    </header>
  )
}

const lienMobile = {
  fontSize: 15, color: 'var(--cire-douce)', padding: '10px 4px', borderRadius: 4,
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

function BurgerIcon({ ouvert }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {ouvert ? (
        <path d="M6 6l12 12M18 6L6 18" />
      ) : (
        <path d="M3 6h18M3 12h18M3 18h18" />
      )}
    </svg>
  )
}
