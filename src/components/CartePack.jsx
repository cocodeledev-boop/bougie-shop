import { useCart } from '../contexts/CartContext'

export default function CartePack({ pack }) {
  const { ajouter } = useCart()

  const prixNormal = (pack.packs_produits || []).reduce(
    (sum, ligne) => sum + (ligne.produits?.prix || 0) * ligne.quantite, 0
  )
  const economie = prixNormal - pack.prix
  const pourcentage = prixNormal > 0 ? Math.round((economie / prixNormal) * 100) : 0

  function ajouterLePack() {
    // Un pack s'ajoute au panier comme un article a part entiere
    ajouter({ id: `pack-${pack.id}`, nom: `Pack — ${pack.nom}`, prix: pack.prix, image_url: pack.image_url })
  }

  return (
    <div className="carte" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', borderTop: '3px solid var(--flamme)' }}>
      <div style={{
        aspectRatio: '1 / 1', position: 'relative',
        background: 'linear-gradient(160deg, var(--bois-clair), var(--bois) 70%)',
        backgroundImage: pack.image_url ? `url(${pack.image_url})` : 'none',
        backgroundSize: 'cover', backgroundPosition: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {!pack.image_url && <span style={{ color: 'var(--fumee)', fontSize: 13 }}>Photo à venir</span>}
        {pourcentage > 0 && (
          <span style={{
            position: 'absolute', top: 10, left: 10, background: 'var(--braise)', color: 'var(--cire)',
            fontSize: 12, fontWeight: 700, padding: '4px 9px', borderRadius: 4,
          }}>
            -{pourcentage}%
          </span>
        )}
      </div>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <h3 style={{ fontSize: 18 }}>{pack.nom}</h3>
        {pack.description && <p style={{ fontSize: 14, color: 'var(--fumee)', flex: 1 }}>{pack.description}</p>}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 19, fontFamily: 'var(--font-display)' }}>{pack.prix.toFixed(2)} €</span>
          {prixNormal > pack.prix && (
            <span style={{ fontSize: 13, color: 'var(--fumee)', textDecoration: 'line-through' }}>{prixNormal.toFixed(2)} €</span>
          )}
        </div>
        {economie > 0 && (
          <p style={{ fontSize: 12, color: 'var(--flamme)' }}>Vous économisez {economie.toFixed(2)} €</p>
        )}
        <button className="btn btn-primary" style={{ marginTop: 6 }} onClick={ajouterLePack}>
          Ajouter le pack
        </button>
      </div>
    </div>
  )
}
