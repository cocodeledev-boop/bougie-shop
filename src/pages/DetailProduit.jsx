import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import CarteProduit from '../components/CarteProduit'
import Avis from '../components/Avis'

export default function DetailProduit() {
  const { id } = useParams()
  const { ajouter } = useCart()
  const [produit, setProduit] = useState(null)
  const [associes, setAssocies] = useState([])
  const [chargement, setChargement] = useState(true)
  const [introuvable, setIntrouvable] = useState(false)
  const [imageActive, setImageActive] = useState('principale')
  const [quantite, setQuantite] = useState(1)

  useEffect(() => {
    setChargement(true)
    setImageActive('principale')
    setQuantite(1)
    supabase.from('produits').select('*, categories(id, nom)').eq('id', id).single()
      .then(async ({ data, error }) => {
        if (error || !data) {
          setIntrouvable(true)
          setChargement(false)
          return
        }
        setProduit(data)
        if (data.categorie_id) {
          const { data: autres } = await supabase
            .from('produits')
            .select('*')
            .eq('categorie_id', data.categorie_id)
            .eq('actif', true)
            .neq('id', data.id)
            .limit(4)
          setAssocies(autres || [])
        }
        setChargement(false)
      })
  }, [id])

  if (introuvable) return <Navigate to="/boutique" />
  if (chargement || !produit) return <div className="container" style={{ padding: '80px 24px' }}><p style={{ color: 'var(--fumee)' }}>Chargement...</p></div>

  const couleur = produit.couleur || 'var(--flamme)'
  const enPromo = produit.prix_barre && produit.prix_barre > produit.prix
  const pourcentage = enPromo ? Math.round((1 - produit.prix / produit.prix_barre) * 100) : 0
  const imageAffichee = imageActive === 'secondaire' && produit.image_url_secondaire ? produit.image_url_secondaire : produit.image_url

  return (
    <div className="container" style={{ padding: '48px 24px 90px' }}>
      <Link to="/boutique" style={{ fontSize: 14, color: 'var(--fumee)', display: 'inline-block', marginBottom: 24 }}>← Retour à la boutique</Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 60 }}>
        <div>
          <div style={{
            aspectRatio: '1 / 1', borderRadius: 8, position: 'relative', overflow: 'hidden',
            background: `radial-gradient(circle at 30% 20%, ${couleur}33, var(--bois-clair) 70%)`,
            marginBottom: 12,
          }}>
            {imageAffichee ? (
              <img src={imageAffichee} alt={produit.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <span style={{ color: 'var(--fumee)' }}>Photo à venir</span>
              </div>
            )}
            {enPromo && (
              <span style={{
                position: 'absolute', top: 14, left: 14, background: 'var(--braise)', color: 'var(--cire)',
                fontSize: 13, fontWeight: 700, padding: '5px 11px', borderRadius: 4,
              }}>
                -{pourcentage}%
              </span>
            )}
          </div>
          {produit.image_url_secondaire && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setImageActive('principale')} style={miniature(imageActive === 'principale')}>
                <img src={produit.image_url} alt="Vue 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
              <button onClick={() => setImageActive('secondaire')} style={miniature(imageActive === 'secondaire')}>
                <img src={produit.image_url_secondaire} alt="Vue 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            </div>
          )}
        </div>

        <div>
          {produit.categories?.nom && (
            <p style={{ fontSize: 13, color: couleur, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              {produit.categories.nom}
            </p>
          )}
          <h1 style={{ fontSize: 32, marginBottom: 14 }}>{produit.nom}</h1>

          {produit.parfum && (
            <p style={{ fontSize: 15, color: couleur, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: couleur }} />
              {produit.parfum}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 22 }}>
            <span style={{ fontSize: 30, fontFamily: 'var(--font-display)' }}>{produit.prix.toFixed(2)} €</span>
            {enPromo && (
              <span style={{ fontSize: 17, color: 'var(--fumee)', textDecoration: 'line-through' }}>{produit.prix_barre.toFixed(2)} €</span>
            )}
          </div>

          {produit.reduction_par_deux && (
            <div style={{
              background: 'rgba(242,166,90,0.12)', border: `1px solid ${couleur}55`, borderRadius: 6,
              padding: '12px 16px', marginBottom: 22, fontSize: 14, color: 'var(--flamme)'
            }}>
              🕯️ Achetez-en 2, la 2ᵉ bénéficie automatiquement de -10% (calculé dans le panier)
            </div>
          )}

          {produit.description && (
            <p style={{ color: 'var(--cire-douce)', lineHeight: 1.7, marginBottom: 26 }}>{produit.description}</p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bois)', border: '1px solid var(--bois-clair)', borderRadius: 4, padding: '6px 10px' }}>
              <button onClick={() => setQuantite(q => Math.max(1, q - 1))} style={{ background: 'none', color: 'var(--cire)', fontSize: 18, width: 24 }}>−</button>
              <span style={{ minWidth: 20, textAlign: 'center' }}>{quantite}</span>
              <button onClick={() => setQuantite(q => q + 1)} style={{ background: 'none', color: 'var(--cire)', fontSize: 18, width: 24 }}>+</button>
            </div>
            <span style={{ fontSize: 13, color: 'var(--fumee)' }}>
              {produit.stock > 0 ? `${produit.stock} en stock` : 'Rupture de stock'}
            </span>
          </div>

          <button
            className="btn btn-primary btn-block"
            disabled={produit.stock <= 0}
            onClick={() => ajouter(produit, quantite)}
          >
            {produit.stock <= 0 ? 'Rupture de stock' : 'Ajouter au panier'}
          </button>
        </div>
      </div>

      <Avis produitId={produit.id} />

      {associes.length > 0 && (
        <div style={{ marginTop: 60 }}>
          <h2 style={{ fontSize: 24, marginBottom: 24 }}>Peut être associé avec</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {associes.map(p => <CarteProduit key={p.id} produit={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function miniature(actif) {
  return {
    width: 64, height: 64, borderRadius: 4, overflow: 'hidden', padding: 0,
    border: actif ? '2px solid var(--flamme)' : '2px solid var(--bois-clair)',
    background: 'none', opacity: actif ? 1 : 0.6,
  }
}
