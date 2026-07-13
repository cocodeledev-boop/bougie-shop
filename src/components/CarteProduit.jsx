import { useCart } from '../contexts/CartContext'

export default function CarteProduit({ produit }) {
  const { ajouter } = useCart()
  const couleur = produit.couleur || 'var(--flamme)'

  return (
    <div
      className="carte"
      style={{
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        borderTop: `3px solid ${couleur}`,
      }}
    >
      <div style={{
        aspectRatio: '1 / 1', position: 'relative',
        background: `radial-gradient(circle at 30% 20%, ${couleur}33, var(--bois-clair) 70%)`,
        backgroundImage: produit.image_url ? `url(${produit.image_url})` : 'none',
        backgroundSize: 'cover', backgroundPosition: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {!produit.image_url && <span style={{ color: 'var(--fumee)', fontSize: 13 }}>Photo à venir</span>}
        <span style={{
          position: 'absolute', top: 10, right: 10, width: 16, height: 16, borderRadius: '50%',
          background: couleur, border: '2px solid rgba(0,0,0,0.25)'
        }} aria-hidden="true" />
      </div>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <h3 style={{ fontSize: 18 }}>{produit.nom}</h3>
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
          <span style={{ fontSize: 19, fontFamily: 'var(--font-display)' }}>{produit.prix.toFixed(2)} €</span>
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
