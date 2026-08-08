import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { validerCodePromo } from '../lib/codePromo'
import { supabase } from '../lib/supabase'

export default function PanierTiroir({ ouvert, onFermer }) {
  const {
    articles, modifierQuantite, retirer, sousTotal, total,
    codePromo, definirCodePromo, retirerCodePromo, reductionCode, ajouter,
    pointsUtilises, definirPointsUtilises, retirerPoints, reductionPoints,
  } = useCart()
  const { user, profil } = useAuth()
  const navigate = useNavigate()
  const [saisieCode, setSaisieCode] = useState('')
  const [messageCode, setMessageCode] = useState('')
  const [verification, setVerification] = useState(false)
  const [suggestions, setSuggestions] = useState([])

  const pointsDisponibles = profil?.points_fidelite || 0
  const paliersDisponibles = Math.floor(pointsDisponibles / 100)

  useEffect(() => {
    if (!ouvert || articles.length === 0) return
    const idsDansPanier = articles.map(a => a.produitId || a.id)
    supabase.from('produits').select('id, nom, prix, image_url, couleur').eq('actif', true)
      .order('coup_de_coeur', { ascending: false }).limit(6)
      .then(({ data }) => {
        setSuggestions((data || []).filter(p => !idsDansPanier.includes(p.id)).slice(0, 3))
      })
  }, [ouvert, articles.length])

  if (!ouvert) return null

  async function appliquerCode(e) {
    e.preventDefault()
    setMessageCode('')
    setVerification(true)
    const resultat = await validerCodePromo(saisieCode, user)
    setVerification(false)
    if (!resultat.ok) {
      setMessageCode(resultat.message)
      return
    }
    definirCodePromo({ code: resultat.code, pourcentage: resultat.pourcentage, id: resultat.id })
    setSaisieCode('')
    setMessageCode('')
  }

  return (
    <>
      <div
        onClick={onFermer}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50 }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(420px, 100vw)',
        background: 'var(--nuit)', borderLeft: '1px solid var(--bois-clair)',
        zIndex: 51, display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: 24, borderBottom: '1px solid var(--bois-clair)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 20 }}>Votre panier</h3>
          <button onClick={onFermer} style={{ background: 'none', color: 'var(--fumee)', fontSize: 24, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {articles.length === 0 ? (
            <p style={{ color: 'var(--fumee)' }}>Votre panier est vide pour l'instant.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {articles.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: 12 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 4, background: 'var(--bois)',
                    backgroundImage: a.image_url ? `url(${a.image_url})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, marginBottom: 4 }}>{a.nom}</p>
                    <p style={{ fontSize: 13, color: 'var(--fumee)', marginBottom: 8 }}>{a.prix.toFixed(2)} €</p>
                    {a.reduction_par_deux && a.quantite >= 2 && (
                      <p style={{ fontSize: 12, color: 'var(--flamme)', marginBottom: 8 }}>-10% appliqué (2+ achetées)</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button onClick={() => modifierQuantite(a.id, a.quantite - 1)} style={qtyBtn}>−</button>
                      <span style={{ fontSize: 14, minWidth: 16, textAlign: 'center' }}>{a.quantite}</span>
                      <button onClick={() => modifierQuantite(a.id, a.quantite + 1)} style={qtyBtn}>+</button>
                      <button onClick={() => retirer(a.id)} style={{ background: 'none', color: 'var(--fumee)', fontSize: 12, marginLeft: 'auto' }}>
                        Retirer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {suggestions.length > 0 && (
            <div style={{ marginTop: 26 }}>
              <p style={{ fontSize: 13, color: 'var(--fumee)', marginBottom: 12 }}>Complète ta commande</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {suggestions.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 4, background: 'var(--bois-clair)', flexShrink: 0,
                      backgroundImage: p.image_url ? `url(${p.image_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
                    }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13 }}>{p.nom}</p>
                      <p style={{ fontSize: 12, color: 'var(--fumee)' }}>{p.prix.toFixed(2)} €</p>
                    </div>
                    <button
                      onClick={() => { ajouter(p); setSuggestions(s => s.filter(x => x.id !== p.id)) }}
                      className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      + Ajouter
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {articles.length > 0 && (
          <div style={{ padding: 24, borderTop: '1px solid var(--bois-clair)' }}>
            {codePromo ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, fontSize: 14 }}>
                <span style={{ color: 'var(--flamme)' }}>Code "{codePromo.code}" appliqué (-{codePromo.pourcentage}%)</span>
                <button onClick={retirerCodePromo} style={{ background: 'none', color: 'var(--fumee)', fontSize: 12 }}>Retirer</button>
              </div>
            ) : (
              <form onSubmit={appliquerCode} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input
                  value={saisieCode}
                  onChange={e => setSaisieCode(e.target.value)}
                  placeholder="Code promo"
                  style={{ flex: 1, background: 'var(--bois)', border: '1.5px solid var(--bois-clair)', borderRadius: 4, padding: '9px 12px', color: 'var(--cire)', fontSize: 14 }}
                />
                <button className="btn btn-secondary" style={{ padding: '9px 16px', fontSize: 13 }} disabled={verification} type="submit">
                  {verification ? '...' : 'Valider'}
                </button>
              </form>
            )}
            {messageCode && <p style={{ fontSize: 13, color: 'var(--erreur)', marginBottom: 10 }}>{messageCode}</p>}

            {/* Bloc points fidélité — quantité ajustable par paliers de 100 pts (5€) */}
            {user && paliersDisponibles > 0 && (
              <div style={{
                background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)',
                borderRadius: 8, padding: '12px 14px', marginBottom: 14,
              }}>
                <p style={{ fontSize: 13, color: 'var(--or)', fontWeight: 600, marginBottom: 2 }}>⭐ {pointsDisponibles} points disponibles</p>
                <p style={{ fontSize: 11, color: 'var(--fumee)', marginBottom: 10 }}>100 points = 5 € de réduction</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => definirPointsUtilises(pointsUtilises - 100, pointsDisponibles)}
                    disabled={pointsUtilises <= 0}
                    style={{ ...qtyBtn, opacity: pointsUtilises <= 0 ? 0.4 : 1 }}
                  >−</button>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--or)' }}>{pointsUtilises} pts</p>
                    <p style={{ fontSize: 11, color: 'var(--fumee)' }}>−{reductionPoints.toFixed(2)} €</p>
                  </div>
                  <button
                    onClick={() => definirPointsUtilises(pointsUtilises + 100, pointsDisponibles)}
                    disabled={pointsUtilises + 100 > pointsDisponibles}
                    style={{ ...qtyBtn, opacity: pointsUtilises + 100 > pointsDisponibles ? 0.4 : 1 }}
                  >+</button>
                  {pointsUtilises > 0 && (
                    <button onClick={retirerPoints} style={{ background: 'none', color: 'var(--fumee)', fontSize: 12 }}>
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            )}

            {user && pointsDisponibles < 100 && pointsDisponibles > 0 && (
              <p style={{ fontSize: 12, color: 'var(--fumee)', marginBottom: 12 }}>
                ⭐ {pointsDisponibles} points (encore {100 - pointsDisponibles} pour obtenir −5 €)
              </p>
            )}

            {reductionCode > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--fumee)', marginBottom: 6 }}>
                <span>Sous-total</span>
                <span>{sousTotal.toFixed(2)} €</span>
              </div>
            )}
            {reductionCode > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--flamme)', marginBottom: 6 }}>
                <span>Réduction code</span>
                <span>−{reductionCode.toFixed(2)} €</span>
              </div>
            )}
            {reductionPoints > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--or)', marginBottom: 6 }}>
                <span>⭐ Points fidélité ({pointsUtilises} pts)</span>
                <span>−{reductionPoints.toFixed(2)} €</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 17 }}>
              <span>Total</span>
              <strong>{total.toFixed(2)} €</strong>
            </div>
            <button
              className="btn btn-primary btn-block"
              onClick={() => { onFermer(); navigate('/commande') }}
            >
              Passer commande
            </button>
            <p style={{ fontSize: 11, color: 'var(--fumee)', marginTop: 8, textAlign: 'center' }}>
              🔒 Paiement 100% sécurisé via Stripe
            </p>
          </div>
        )}
      </div>
    </>
  )
}

const qtyBtn = {
  width: 26, height: 26, borderRadius: 4, background: 'var(--bois)',
  border: '1px solid var(--bois-clair)', color: 'var(--cire)', fontSize: 15
}
