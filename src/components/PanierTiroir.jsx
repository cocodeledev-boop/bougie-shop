import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { validerCodePromo } from '../lib/codePromo'
import { supabase } from '../lib/supabase'

// Le panier s'affiche desormais comme un vrai menu : un panneau large et centre
// (plein ecran sur mobile), avec les articles a gauche et le recapitulatif fixe
// a droite -- plutot qu'un petit tiroir colle sur le bord de l'ecran.
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
        setSuggestions((data || []).filter(p => !idsDansPanier.includes(p.id)).slice(0, 4))
      })
  }, [ouvert, articles.length])

  // Empeche le scroll de la page derriere le panier quand il est ouvert
  useEffect(() => {
    if (ouvert) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [ouvert])

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
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 50, backdropFilter: 'blur(2px)' }}
      />
      <div className="menu-panier" style={{
        position: 'fixed', top: '4vh', left: '50%', transform: 'translateX(-50%)',
        width: 'min(920px, 94vw)', height: '92vh', maxHeight: 780,
        background: 'var(--nuit)', border: '1px solid var(--bois-clair)', borderRadius: 14,
        zIndex: 51, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,0.55)',
      }}>
        <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--bois-clair)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h3 style={{ fontSize: 22, fontFamily: 'var(--font-display)' }}>Votre panier{articles.length > 0 && <span style={{ color: 'var(--fumee)', fontSize: 15, fontFamily: 'inherit', marginLeft: 10 }}>· {articles.reduce((s, a) => s + a.quantite, 0)} article{articles.reduce((s, a) => s + a.quantite, 0) > 1 ? 's' : ''}</span>}</h3>
          <button onClick={onFermer} aria-label="Fermer le panier" style={{ background: 'var(--bois)', border: '1px solid var(--bois-clair)', borderRadius: '50%', width: 36, height: 36, color: 'var(--fumee)', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <div className="menu-panier-corps" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Colonne articles */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
            {articles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>🕯️</p>
                <p style={{ color: 'var(--fumee)', marginBottom: 20 }}>Votre panier est vide pour l'instant.</p>
                <button className="btn btn-primary" onClick={() => { onFermer(); navigate('/boutique') }}>Découvrir la boutique</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {articles.map(a => (
                  <div key={a.id} className="carte" style={{ display: 'flex', gap: 16, padding: 14, alignItems: 'center' }}>
                    <div style={{
                      width: 76, height: 76, borderRadius: 6, background: 'var(--bois)',
                      backgroundImage: a.image_url ? `url(${a.image_url})` : 'none',
                      backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, marginBottom: 4, fontWeight: 600 }}>{a.nom}</p>
                      <p style={{ fontSize: 13, color: 'var(--fumee)', marginBottom: 8 }}>{a.prix.toFixed(2)} € / unité</p>
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
                    <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 70 }}>
                      <p style={{ fontSize: 16, fontWeight: 700 }}>
                        {((a.reduction_par_deux && a.quantite >= 2 ? a.prix * 0.9 : a.prix) * a.quantite).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {suggestions.length > 0 && (
              <div style={{ marginTop: 30 }}>
                <p style={{ fontSize: 13, color: 'var(--fumee)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Complète ta commande</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                  {suggestions.map(p => (
                    <div key={p.id} className="carte" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 4, background: 'var(--bois-clair)', flexShrink: 0,
                        backgroundImage: p.image_url ? `url(${p.image_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12.5 }}>{p.nom}</p>
                        <p style={{ fontSize: 11, color: 'var(--fumee)' }}>{p.prix.toFixed(2)} €</p>
                      </div>
                      <button
                        onClick={() => { ajouter(p); setSuggestions(s => s.filter(x => x.id !== p.id)) }}
                        className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 11, flexShrink: 0 }}
                      >
                        + Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Colonne resume, fixe a droite sur desktop */}
          {articles.length > 0 && (
            <div className="menu-panier-resume" style={{
              width: 320, flexShrink: 0, borderLeft: '1px solid var(--bois-clair)',
              background: 'var(--bois)', overflowY: 'auto', padding: 24,
              display: 'flex', flexDirection: 'column',
            }}>
              {codePromo ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, fontSize: 14 }}>
                  <span style={{ color: 'var(--flamme)' }}>Code "{codePromo.code}" (-{codePromo.pourcentage}%)</span>
                  <button onClick={retirerCodePromo} style={{ background: 'none', color: 'var(--fumee)', fontSize: 12 }}>Retirer</button>
                </div>
              ) : (
                <form onSubmit={appliquerCode} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <input
                    value={saisieCode}
                    onChange={e => setSaisieCode(e.target.value)}
                    placeholder="Code promo"
                    style={{ flex: 1, background: 'var(--nuit)', border: '1.5px solid var(--bois-clair)', borderRadius: 4, padding: '9px 12px', color: 'var(--cire)', fontSize: 13, minWidth: 0 }}
                  />
                  <button className="btn btn-secondary" style={{ padding: '9px 14px', fontSize: 13, flexShrink: 0 }} disabled={verification} type="submit">
                    {verification ? '...' : 'OK'}
                  </button>
                </form>
              )}
              {messageCode && <p style={{ fontSize: 12.5, color: 'var(--erreur)', marginBottom: 10 }}>{messageCode}</p>}

              {/* Bloc points fidélité — quantité ajustable par paliers de 100 pts (5€) */}
              {user && paliersDisponibles > 0 && (
                <div style={{
                  background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)',
                  borderRadius: 8, padding: '12px 14px', marginBottom: 14,
                }}>
                  <p style={{ fontSize: 12.5, color: 'var(--or)', fontWeight: 600, marginBottom: 2 }}>⭐ {pointsDisponibles} pts</p>
                  <p style={{ fontSize: 10.5, color: 'var(--fumee)', marginBottom: 10 }}>100 points = 5 € de réduction</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => definirPointsUtilises(pointsUtilises - 100, pointsDisponibles)}
                      disabled={pointsUtilises <= 0}
                      style={{ ...qtyBtn, opacity: pointsUtilises <= 0 ? 0.4 : 1 }}
                    >−</button>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--or)' }}>{pointsUtilises} pts</p>
                      <p style={{ fontSize: 10.5, color: 'var(--fumee)' }}>−{reductionPoints.toFixed(2)} €</p>
                    </div>
                    <button
                      onClick={() => definirPointsUtilises(pointsUtilises + 100, pointsDisponibles)}
                      disabled={pointsUtilises + 100 > pointsDisponibles}
                      style={{ ...qtyBtn, opacity: pointsUtilises + 100 > pointsDisponibles ? 0.4 : 1 }}
                    >+</button>
                    {pointsUtilises > 0 && (
                      <button onClick={retirerPoints} style={{ background: 'none', color: 'var(--fumee)', fontSize: 11 }}>
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              )}

              {user && pointsDisponibles < 100 && pointsDisponibles > 0 && (
                <p style={{ fontSize: 11.5, color: 'var(--fumee)', marginBottom: 12 }}>
                  ⭐ {pointsDisponibles} points (encore {100 - pointsDisponibles} pour obtenir −5 €)
                </p>
              )}

              <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--bois-clair)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 6, color: 'var(--cire-douce)' }}>
                  <span>Sous-total</span>
                  <span>{sousTotal.toFixed(2)} €</span>
                </div>
                {reductionCode > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--flamme)', marginBottom: 6 }}>
                    <span>Réduction code</span>
                    <span>−{reductionCode.toFixed(2)} €</span>
                  </div>
                )}
                {reductionPoints > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--or)', marginBottom: 6 }}>
                    <span>⭐ Points fidélité</span>
                    <span>−{reductionPoints.toFixed(2)} €</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, marginBottom: 16, fontSize: 19 }}>
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
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .menu-panier { top: 0 !important; left: 0 !important; transform: none !important; width: 100vw !important; height: 100vh !important; max-height: none !important; border-radius: 0 !important; }
          .menu-panier-corps { flex-direction: column !important; }
          .menu-panier-resume { width: 100% !important; border-left: none !important; border-top: 1px solid var(--bois-clair); }
        }
      `}</style>
    </>
  )
}

const qtyBtn = {
  width: 26, height: 26, borderRadius: 4, background: 'var(--bois)',
  border: '1px solid var(--bois-clair)', color: 'var(--cire)', fontSize: 15
}
