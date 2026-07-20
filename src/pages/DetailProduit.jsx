import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import { chargerOptionsProduit } from '../lib/optionsProduit'
import CarteProduit from '../components/CarteProduit'
import Avis from '../components/Avis'

export default function DetailProduit() {
  const { id } = useParams()
  const { ajouter } = useCart()
  const [produit, setProduit] = useState(null)
  const [associes, setAssocies] = useState([])
  const [options, setOptions] = useState({ parfums: [], tailles: [] })
  const [parfumChoisi, setParfumChoisi] = useState(null)
  const [tailleChoisie, setTailleChoisie] = useState(null)
  const [photosSupplementaires, setPhotosSupplementaires] = useState([])
  const [chargement, setChargement] = useState(true)
  const [introuvable, setIntrouvable] = useState(false)
  const [imageActive, setImageActive] = useState(0)
  const [quantite, setQuantite] = useState(1)
  const [zoomOuvert, setZoomOuvert] = useState(false)

  useEffect(() => {
    setChargement(true)
    setImageActive(0)
    setQuantite(1)
    setParfumChoisi(null)
    setTailleChoisie(null)
    supabase.from('produits').select('*, categories(id, nom)').eq('id', id).single()
      .then(async ({ data, error }) => {
        if (error || !data) {
          setIntrouvable(true)
          setChargement(false)
          return
        }
        setProduit(data)
        const { data: photos } = await supabase.from('produit_photos').select('*').eq('produit_id', data.id).order('ordre')
        setPhotosSupplementaires(photos || [])
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
        if (data.personnalisable) {
          const opts = await chargerOptionsProduit(data.id)
          setOptions(opts)
          if (opts.parfums.length > 0) setParfumChoisi(opts.parfums[0])
          if (opts.tailles.length > 0) setTailleChoisie(opts.tailles[0])
        }
        setChargement(false)
      })
  }, [id])

  if (introuvable) return <Navigate to="/boutique" />
  if (chargement || !produit) return <div className="container" style={{ padding: '80px 24px' }}><p style={{ color: 'var(--fumee)' }}>Chargement...</p></div>

  const couleur = produit.couleur || 'var(--flamme)'
  const enPromo = produit.prix_barre && produit.prix_barre > produit.prix
  const pourcentage = enPromo ? Math.round((1 - produit.prix / produit.prix_barre) * 100) : 0

  const toutesLesImages = [produit.image_url, produit.image_url_secondaire, ...photosSupplementaires.map(p => p.url)].filter(Boolean)
  const imageAffichee = toutesLesImages[imageActive] || null

  const supplement = (parfumChoisi?.supplement_prix || 0) + (tailleChoisie?.supplement_prix || 0)
  const prixAffiche = produit.prix + supplement

  return (
    <div className="container" style={{ padding: '48px 24px 90px' }}>
      <Link to="/boutique" style={{ fontSize: 14, color: 'var(--fumee)', display: 'inline-block', marginBottom: 24 }}>← Retour à la boutique</Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 60 }}>
        <div>
          <div
            onClick={() => imageAffichee && setZoomOuvert(true)}
            style={{
              aspectRatio: '1 / 1', borderRadius: 8, position: 'relative', overflow: 'hidden',
              background: `radial-gradient(circle at 30% 20%, ${couleur}33, var(--bois-clair) 70%)`,
              marginBottom: 12, cursor: imageAffichee ? 'zoom-in' : 'default',
            }}
          >
            {imageAffichee ? (
              <img src={imageAffichee} alt={produit.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <span style={{ color: 'var(--fumee)' }}>Photo à venir</span>
              </div>
            )}
            {imageAffichee && (
              <span style={{
                position: 'absolute', bottom: 12, right: 12, background: 'rgba(28,20,15,0.75)', color: 'var(--cire)',
                fontSize: 11, padding: '4px 9px', borderRadius: 4,
              }}>
                🔍 Cliquer pour zoomer
              </span>
            )}
            {enPromo && (
              <span style={{
                position: 'absolute', top: 14, left: 14, background: 'var(--braise)', color: 'var(--cire)',
                fontSize: 13, fontWeight: 700, padding: '5px 11px', borderRadius: 4,
              }}>
                -{pourcentage}%
              </span>
            )}
            {produit.coup_de_coeur && (
              <span style={{
                position: 'absolute', top: enPromo ? 52 : 14, left: 14, background: 'var(--or)', color: 'var(--nuit)',
                fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 4,
              }}>
                ★ Coup de cœur
              </span>
            )}
          </div>
          {toutesLesImages.length > 1 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {toutesLesImages.map((url, i) => (
                <button key={i} onClick={() => setImageActive(i)} style={miniature(imageActive === i)}>
                  <img src={url} alt={`Vue ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
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
            <span style={{ fontSize: 30, fontFamily: 'var(--font-display)' }}>{prixAffiche.toFixed(2)} €</span>
            {enPromo && !produit.personnalisable && (
              <span style={{ fontSize: 17, color: 'var(--fumee)', textDecoration: 'line-through' }}>{produit.prix_barre.toFixed(2)} €</span>
            )}
            {supplement > 0 && (
              <span style={{ fontSize: 13, color: 'var(--fumee)' }}>(dont +{supplement.toFixed(2)} € d'options)</span>
            )}
          </div>

          {produit.personnalisable && (
            <div className="carte" style={{ padding: 18, marginBottom: 22 }}>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: couleur }}>🎨 Personnalise ta bougie</p>

              {options.parfums.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, color: 'var(--fumee)', display: 'block', marginBottom: 8 }}>Parfum</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {options.parfums.map(o => (
                      <button
                        key={o.id} type="button" onClick={() => setParfumChoisi(o)}
                        className={parfumChoisi?.id === o.id ? 'btn btn-primary' : 'btn btn-secondary'}
                        style={{ padding: '8px 14px', fontSize: 13 }}
                      >
                        {o.nom}{o.supplement_prix > 0 ? ` (+${o.supplement_prix.toFixed(2)} €)` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {options.tailles.length > 0 && (
                <div>
                  <label style={{ fontSize: 13, color: 'var(--fumee)', display: 'block', marginBottom: 8 }}>Taille</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {options.tailles.map(o => (
                      <button
                        key={o.id} type="button" onClick={() => setTailleChoisie(o)}
                        className={tailleChoisie?.id === o.id ? 'btn btn-primary' : 'btn btn-secondary'}
                        style={{ padding: '8px 14px', fontSize: 13 }}
                      >
                        {o.nom}{o.supplement_prix > 0 ? ` (+${o.supplement_prix.toFixed(2)} €)` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
            <span style={{ fontSize: 13, color: produit.stock > 0 && produit.stock <= 5 ? 'var(--erreur)' : 'var(--fumee)', fontWeight: produit.stock > 0 && produit.stock <= 5 ? 600 : 400 }}>
              {produit.stock > 0 && produit.stock <= 5 ? `Plus que ${produit.stock} en stock !` : produit.stock > 0 ? `${produit.stock} en stock` : 'Rupture de stock'}
            </span>
          </div>

          <button
            className="btn btn-primary btn-block"
            disabled={produit.stock <= 0}
            onClick={() => ajouter(produit, quantite, produit.personnalisable ? { parfum: parfumChoisi, taille: tailleChoisie } : null)}
          >
            {produit.stock <= 0 ? 'Rupture de stock' : 'Ajouter au panier'}
          </button>
          <p style={{ fontSize: 12, color: 'var(--fumee)', marginTop: 10, textAlign: 'center' }}>
            🔒 Paiement sécurisé · 🚚 Livraison offerte dès 50€ · 📦 Expédié sous 2 à 4 jours
          </p>
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
      {zoomOuvert && imageAffichee && (
        <div
          onClick={() => setZoomOuvert(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30, cursor: 'zoom-out',
          }}
        >
          <img src={imageAffichee} alt={produit.nom} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
          <button onClick={() => setZoomOuvert(false)} style={{ position: 'fixed', top: 20, right: 24, background: 'none', color: 'var(--cire)', fontSize: 32 }}>×</button>
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
