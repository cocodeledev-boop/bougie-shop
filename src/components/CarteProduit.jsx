import { useCart } from '../contexts/CartContext'

export default function CarteProduit({ produit }) {
  const { ajouter } = useCart()

  return (
    <div className="carte" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        aspectRatio: '1 / 1', background: 'var(--bois-clair)',
        backgroundImage: produit.image_url ? `url(${produit.image_url})` : 'none',
        backgroundSize: 'cover', backgroundPosition: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {!produit.image_url && <span style={{ color: 'var(--fumee)', fontSize: 13 }}>Photo à venir</span>}
      </div>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <h3 style={{ fontSize: 18 }}>{produit.nom}</h3>
        {produit.parfum && <p style={{ fontSize: 13, color: 'var(--flamme)' }}>{produit.parfum}</p>}
        {produit.description && (
          <p style={{ fontSize: 14, color: 'var(--fumee)', flex: 1 }}>{produit.description}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 19, fontFamily: 'var(--font-display)' }}>{produit.prix.toFixed(2)} €</span>
          <button
            className="btn btn-primary"
            style={{ padding: '10px 18px', fontSize: 14 }}
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
