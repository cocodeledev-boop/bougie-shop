import { Link } from 'react-router-dom'
import { useParametres } from '../hooks/useParametres'

export default function Footer() {
  const { parametres } = useParametres()
  const nom = parametres.nom_boutique || 'Hugoline & Compagnies'

  return (
    <footer style={{ background: 'var(--bois)', borderTop: '1px solid var(--bois-clair)', marginTop: 60 }}>
      <div className="container" style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32,
        padding: '48px 24px 36px',
      }}>
        {/* Colonne identité */}
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 10 }}>{nom}</p>
          <p style={{ fontSize: 13, color: 'var(--fumee)', lineHeight: 1.7, marginBottom: 14 }}>
            {parametres.footer_texte || 'Bougies coulées à la main à Fampoux, dans le Pas-de-Calais.'}
          </p>
          {/* Réseaux sociaux */}
          <div style={{ display: 'flex', gap: 10 }}>
            {parametres.instagram_url && (
              <a href={parametres.instagram_url} target="_blank" rel="noreferrer" style={iconStyle} aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
                </svg>
              </a>
            )}
            {parametres.tiktok_url && (
              <a href={parametres.tiktok_url} target="_blank" rel="noreferrer" style={iconStyle} aria-label="TikTok">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.86a8.25 8.25 0 004.84 1.55V7.01a4.85 4.85 0 01-1.07-.32z"/>
                </svg>
              </a>
            )}
            {parametres.facebook_url && (
              <a href={parametres.facebook_url} target="_blank" rel="noreferrer" style={iconStyle} aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Boutique */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--cire-douce)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Boutique</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/boutique" style={{ fontSize: 13, color: 'var(--fumee)' }}>Toutes les bougies</Link>
            <Link to="/favoris" style={{ fontSize: 13, color: 'var(--fumee)' }}>Mes favoris</Link>
            <Link to="/compte" style={{ fontSize: 13, color: 'var(--fumee)' }}>Mon compte</Link>
            <Link to="/a-propos" style={{ fontSize: 13, color: 'var(--fumee)' }}>Notre histoire</Link>
          </div>
        </div>

        {/* Livraison */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--cire-douce)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Livraison</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 13, color: 'var(--fumee)' }}>🏠 À domicile — {parseFloat(parametres.frais_livraison || 4.9).toFixed(2)} €</p>
            <p style={{ fontSize: 13, color: 'var(--fumee)' }}>📮 Point relais — {parseFloat(parametres.frais_livraison_point_relais || 3.9).toFixed(2)} €</p>
            <p style={{ fontSize: 13, color: 'var(--fumee)' }}>📍 Retrait Fampoux — Gratuit</p>
            <p style={{ fontSize: 13, color: 'var(--emeraude-clair)' }}>🎉 Offerte dès {parseFloat(parametres.seuil_livraison_gratuite || 50).toFixed(0)} €</p>
          </div>
        </div>

        {/* -10% nouveau client */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--cire-douce)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Offre de bienvenue</p>
          <p style={{ fontSize: 13, color: 'var(--fumee)', lineHeight: 1.7, marginBottom: 10 }}>
            -10% sur ta première commande avec un compte.
          </p>
          <span style={{
            display: 'inline-block', background: 'var(--nuit)', color: 'var(--or)',
            fontFamily: 'var(--font-display)', fontSize: 15, padding: '8px 14px',
            borderRadius: 6, border: '1px dashed var(--or)', letterSpacing: '0.04em',
          }}>
            {parametres.banniere_code || 'NOUVEAUBOUGIE'}
          </span>
        </div>
      </div>

      {/* Barre du bas — SIRET + paiements */}
      <div style={{ borderTop: '1px solid var(--bois-clair)', padding: '16px 24px' }}>
        <div className="container" style={{
          display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 11, color: 'var(--fumee)', lineHeight: 1.7 }}>
            <p>© {new Date().getFullYear()} {nom}</p>
            {parametres.siret && <p>SIRET : {parametres.siret}</p>}
            {parametres.mentions_legales && (
              <p style={{ maxWidth: 400 }}>{parametres.mentions_legales}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {['Visa', 'Mastercard', 'CB', 'Apple Pay'].map(moyen => (
              <span key={moyen} style={{
                fontSize: 11, color: 'var(--fumee)', border: '1px solid var(--bois-clair)',
                borderRadius: 4, padding: '3px 8px',
              }}>
                {moyen}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

const iconStyle = {
  width: 36, height: 36, borderRadius: 8, background: 'var(--bois-clair)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--fumee)', transition: 'color 0.15s, background 0.15s',
}
