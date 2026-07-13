import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'

export default function CarteProduit({ produit }) {
  const { ajouter } = useCart()
  const [survole, setSurvole] = useState(false)
  const couleur = produit.couleur || 'var(--flamme)'

  const enPromo = produit.prix_barre && produit.prix_barre > produit.prix
  const pourcentage = enPromo ? Math.round((1 - produit.prix / produit.prix_barre) * 100) : 0

  return (
    <div
      className="carte"
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', borderTop: `3px solid ${couleur}` }}
      onMouseEnter={() => setSurvole(true)}
      onMouseLeave={() => setSurvole(false)}
    >
      <Link to={`/boutique/${produit.id}`} style={{ display: 'block' }}>
        <div style={{
          aspectRatio: '1 / 1', position: 'relative', overflow: 'hidden',
          background: `radial-gradient(circle at 30% 20%, ${couleur}33, var(--bois-clair) 70%)`,
        }}>
          {produit.image_url && (
            <img
              src={produit.image_url}
              alt={produit.nom}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                opacity: survole && produit.image_url_secondaire ? 0 : 1,
                transition: 'opacity 0.35s ease',
              }}
            />
          )}
          {produit.image_url_secondaire && (
            <img
              src={produit.image_url_secondaire}
              alt={`${produit.nom} — autre vue`}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                opacity: survole ? 1 : 0,
                transform: survole ? 'scale(1.03)' : 'scale(1)',
                transition: 'opacity 0.35s ease, transform 0.35s ease',
              }}
            />
          )}
          {!produit.image_url && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--fumee)', fontSize: 13 }}>Photo à venir</span>
            </div>
          )}

          <span style={{
            position: 'absolute', top: 10, right: 10, width: 16, height: 16, borderRadius: '50%',
            background: couleur, border: '2px solid rgba(0,0,0,0.25)'
          }} aria-hidden="true" />

          {enPromo && (
            <span style={{
              position: 'absolute', top: 10, left: 10, background: 'var(--braise)', color: 'var(--cire)',
              fontSize: 12, fontWeight: 700, padding: '4px 9px', borderRadius: 4,
              boxShadow: '0 2px 10px rgba(201,98,43,0.5)'
            }}>
              -{pourcentage}%
            </span>
          )}

          {produit.reduction_par_deux && (
            <span style={{
              position: 'absolute', bottom: 10, left: 10, background: 'rgba(28,20,15,0.85)', color: 'var(--flamme)',
              fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 4,
            }}>
              2 achetées = -10%
            </span>
          )}
        </div>
      </Link>

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <Link to={`/boutique/${produit.id}`}>
          <h3 style={{ fontSize: 18 }}>{produit.nom}</h3>
        </Link>
        {produit.parfum && (
          <p style={{ fontSize: 13, color: couleur, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: couleur, flexShrink: 0 }} />
            {produit.parfum}
          </p>
        )}
        {produit.description && (
          <p style={{ fontSize: 14, color: 'var(--fumee)', flex: 1 }}>{produit.description}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 19, fontFamily: 'var(--font-display)' }}>{produit.prix.toFixed(2)} €</span>
            {enPromo && (
              <span style={{ fontSize: 13, color: 'var(--fumee)', textDecoration: 'line-through' }}>
                {produit.prix_barre.toFixed(2)} €
              </span>
            )}
          </span>
          <button
            className="btn"
            style={{
              padding: '10px 18px', fontSize: 14, color: 'var(--cire)',
              background: `linear-gradient(135deg, ${couleur}, ${couleur}cc)`,
              boxShadow: `0 4px 16px ${couleur}55`,
            }}
            disabled={produit.stock <= 0}
            onClick={() => ajouter(produit)}
          >
            {produit.stock <= 0 ? 'Rupture' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}
