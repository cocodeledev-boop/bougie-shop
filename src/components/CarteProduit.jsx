import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { estFavori, basculerFavori } from '../lib/favoris'

export default function CarteProduit({ produit, avis }) {
  const { ajouter } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [survole, setSurvole] = useState(false)
  const [favori, setFavori] = useState(false)
  const couleur = produit.couleur || 'var(--flamme)'

  useEffect(() => {
    if (user) estFavori(user.id, produit.id).then(setFavori)
  }, [user, produit.id])

  async function gererFavori(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { navigate('/connexion'); return }
    const nouveauStatut = await basculerFavori(user.id, produit.id, favori)
    setFavori(nouveauStatut)
  }

  const enPromo = produit.prix_barre && produit.prix_barre > produit.prix
  const pourcentage = enPromo ? Math.round((1 - produit.prix / produit.prix_barre) * 100) : 0
  const stockFaible = produit.stock > 0 && produit.stock <= 5

  return (
    <div
      className="carte"
      style={{
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        borderTop: produit.coup_de_coeur ? '3px solid var(--or)' : `3px solid ${couleur}`,
        boxShadow: produit.coup_de_coeur ? '0 0 0 1px rgba(212,175,55,0.35)' : 'none',
      }}
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

          <button
            onClick={gererFavori}
            aria-label={favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            style={{
              position: 'absolute', top: 32, right: 8, background: 'rgba(28,20,15,0.75)', borderRadius: '50%',
              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, color: favori ? 'var(--braise)' : 'var(--cire)',
            }}
          >
            {favori ? '❤️' : '🤍'}
          </button>

          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {produit.coup_de_coeur && (
              <span style={{
                background: 'var(--or)', color: 'var(--nuit)', fontSize: 11, fontWeight: 700,
                padding: '4px 9px', borderRadius: 4, boxShadow: '0 2px 10px rgba(212,175,55,0.5)',
              }}>
                ★ Coup de cœur
              </span>
            )}
            {produit.personnalisable && (
              <span style={{
                background: 'var(--emeraude)', color: 'var(--cire)', fontSize: 11, fontWeight: 700,
                padding: '4px 9px', borderRadius: 4,
              }}>
                🎨 Personnalisable
              </span>
            )}
            {enPromo && (
              <span style={{
                background: 'var(--braise)', color: 'var(--cire)', fontSize: 12, fontWeight: 700,
                padding: '4px 9px', borderRadius: 4, boxShadow: '0 2px 10px rgba(201,98,43,0.5)',
              }}>
                -{pourcentage}%
              </span>
            )}
          </div>

          {produit.reduction_par_deux && (
            <span style={{
              position: 'absolute', bottom: 10, left: 10, background: 'rgba(28,20,15,0.85)', color: 'var(--flamme)',
              fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 4,
            }}>
              2 achetées = -10%
            </span>
          )}

          {stockFaible && (
            <span style={{
              position: 'absolute', bottom: 10, right: 10, background: 'rgba(214,69,69,0.9)', color: 'var(--cire)',
              fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 4,
            }}>
              Plus que {produit.stock} en stock
            </span>
          )}
        </div>
      </Link>

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <Link to={`/boutique/${produit.id}`}>
          <h3 style={{ fontSize: 18 }}>{produit.nom}</h3>
        </Link>

        {avis && avis.nombre > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--or)', fontSize: 13, letterSpacing: '1px' }}>
              {'★'.repeat(Math.round(avis.moyenne))}{'☆'.repeat(5 - Math.round(avis.moyenne))}
            </span>
            <span style={{ fontSize: 12, color: 'var(--fumee)' }}>({avis.nombre})</span>
          </div>
        )}

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
            onClick={() => produit.personnalisable ? navigate(`/boutique/${produit.id}`) : ajouter(produit)}
          >
            {produit.stock <= 0 ? 'Rupture' : produit.personnalisable ? 'Personnaliser' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}
