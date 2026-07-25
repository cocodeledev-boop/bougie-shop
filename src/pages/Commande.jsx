import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useParametres } from '../hooks/useParametres'
import { supabase } from '../lib/supabase'

const MODES_LIVRAISON = [
  { id: 'nationale', icone: '🏠', titre: 'Livraison à domicile', detail: 'Colissimo — 2 à 4 jours ouvrés' },
  { id: 'point_relais', icone: '📮', titre: 'Point relais', detail: 'Mondial Relay — 3 à 5 jours ouvrés' },
  { id: 'drive_fampoux', icone: '📍', titre: 'Retrait à Fampoux', detail: 'Gratuit — à convenir ensemble' },
]

export default function Commande() {
  const { user, loading, profil } = useAuth()
  const { articles, sousTotal, total, reductionCode, codePromo, vider } = useCart()
  const { parametres } = useParametres()
  const navigate = useNavigate()

  const [mode, setMode] = useState('nationale')
  const [adresse, setAdresse] = useState('')
  const [ville, setVille] = useState('')
  const [codePostal, setCodePostal] = useState('')
  const [pointRelais, setPointRelais] = useState('')
  const [utiliserPoints, setUtiliserPoints] = useState(false)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  if (loading) return null
  if (!user) return <Navigate to="/connexion" />
  if (articles.length === 0) return <Navigate to="/boutique" />

  const pointsDispo = profil?.points_fidelite || 0
  const seuilPoints = parseInt(parametres.points_par_euro_reduction || 100)
  const valeurPalier = parseFloat(parametres.valeur_euro_par_palier || 5)

  // Combien de paliers complets le client peut utiliser sur cette commande
  const paliersMax = Math.min(
    Math.floor(pointsDispo / seuilPoints),
    Math.floor(total / valeurPalier) // on ne peut pas avoir plus de réduction que le total
  )
  const reductionPoints = utiliserPoints ? paliersMax * valeurPalier : 0
  const pointsUtilises = utiliserPoints ? paliersMax * seuilPoints : 0

  const seuilGratuit = parseFloat(parametres.seuil_livraison_gratuite || 50)
  const fraisNationale = parseFloat(parametres.frais_livraison || 4.9)
  const fraisPointRelais = parseFloat(parametres.frais_livraison_point_relais || 3.9)
  const fraisLivraison =
    mode === 'drive_fampoux' ? 0
    : mode === 'point_relais' ? (total >= seuilGratuit ? 0 : fraisPointRelais)
    : (total >= seuilGratuit ? 0 : fraisNationale)

  const totalFinal = Math.max(0, total - reductionPoints + fraisLivraison)

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')
    if (mode === 'point_relais' && !pointRelais.trim()) {
      setErreur('Saisis le nom/adresse du point relais choisi.')
      return
    }
    setEnvoi(true)
    try {
      const { data: commande, error: erreurCommande } = await supabase
        .from('commandes')
        .insert({
          user_id: user.id,
          statut: 'en_attente',
          total: totalFinal,
          frais_livraison: fraisLivraison,
          reduction_montant: reductionCode + reductionPoints,
          reduction_points: reductionPoints,
          points_utilises: pointsUtilises,
          mode_livraison: mode,
          point_relais: mode === 'point_relais' ? pointRelais : null,
          adresse_livraison: mode === 'nationale' ? adresse : null,
          ville_livraison: mode === 'nationale' ? ville : null,
          code_postal_livraison: mode === 'nationale' ? codePostal : null,
          code_promo: codePromo?.code || null,
          code_promo_id: codePromo?.id || null,
          reduction_montant: reductionCode,
        })
        .select()
        .single()

      if (erreurCommande) throw erreurCommande

      const lignes = articles.map(a => ({
        commande_id: commande.id,
        produit_id: (a.produitId || a.id)?.toString().startsWith('pack-') ? null : (a.produitId || a.id),
        nom_produit: a.nom,
        quantite: a.quantite,
        prix_unitaire: (a.reduction_par_deux && a.quantite >= 2) ? a.prix * 0.9 : a.prix,
      }))
      await supabase.from('commande_articles').insert(lignes)

      // Deduire immediatement les points utilises du solde du client
      if (pointsUtilises > 0) {
        await supabase.from('profils').update({
          points_fidelite: Math.max(0, pointsDispo - pointsUtilises)
        }).eq('id', user.id)
        await supabase.from('points_fidelite_historique').insert({
          user_id: user.id,
          points: -pointsUtilises,
          raison: `Réduction de ${reductionPoints.toFixed(2)} € utilisée`,
          commande_id: commande.id,
        })
      }

      const reponse = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commandeId: commande.id,
          articles: [
            ...articles.map(a => ({
              nom: a.nom, quantite: a.quantite,
              prix: (a.reduction_par_deux && a.quantite >= 2) ? a.prix * 0.9 : a.prix,
            })),
            ...(fraisLivraison > 0 ? [{ nom: 'Frais de livraison', quantite: 1, prix: fraisLivraison }] : []),
            ...(reductionPoints > 0 ? [{ nom: `Points fidélité (${pointsUtilises} pts)`, quantite: 1, prix: -reductionPoints }] : []),
          ],
          reductionPourcentage: codePromo?.pourcentage || 0,
        }),
      })

      const { url, erreur: erreurApi } = await reponse.json()
      if (erreurApi || !url) throw new Error(erreurApi || 'Impossible de créer la session.')

      vider()
      window.location.href = url
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue.')
      setEnvoi(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--nuit)', padding: '0 0 80px' }}>
      <div className="container" style={{ maxWidth: 640, padding: '48px 24px' }}>
        <h1 style={{ fontSize: 28, marginBottom: 32 }}>Finaliser la commande</h1>

        <form onSubmit={handleSubmit}>
          {erreur && <div className="message-erreur" style={{ marginBottom: 20 }}>{erreur}</div>}

          {/* Choix du mode de livraison */}
          <p style={{ fontSize: 13, color: 'var(--fumee)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mode de livraison</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {MODES_LIVRAISON.map(m => {
              const frais = m.id === 'drive_fampoux' ? 0 : m.id === 'point_relais' ? fraisPointRelais : fraisNationale
              const gratuit = m.id !== 'drive_fampoux' && total >= seuilGratuit
              const actif = mode === m.id
              return (
                <button
                  key={m.id} type="button" onClick={() => setMode(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
                    padding: '16px 18px', borderRadius: 10, textAlign: 'left',
                    background: actif ? 'rgba(47,143,106,0.12)' : 'var(--bois)',
                    border: `2px solid ${actif ? 'var(--emeraude)' : 'var(--bois-clair)'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 24 }}>{m.icone}</span>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: actif ? 'var(--emeraude-clair)' : 'var(--cire)' }}>{m.titre}</p>
                      <p style={{ fontSize: 12, color: 'var(--fumee)' }}>{m.detail}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {m.id === 'drive_fampoux' ? (
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--emeraude-clair)' }}>Gratuit</span>
                    ) : gratuit ? (
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--emeraude-clair)' }}>Offerte 🎉</span>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--cire)' }}>{frais.toFixed(2)} €</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Champs selon le mode */}
          {mode === 'nationale' && (
            <div style={{ background: 'var(--bois)', borderRadius: 10, padding: 18, marginBottom: 20 }}>
              <div className="champ">
                <label>Adresse de livraison</label>
                <input required value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="12 rue des Lilas" />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="champ" style={{ flex: '0 0 130px' }}>
                  <label>Code postal</label>
                  <input required value={codePostal} onChange={e => setCodePostal(e.target.value)} placeholder="62000" />
                </div>
                <div className="champ" style={{ flex: 1 }}>
                  <label>Ville</label>
                  <input required value={ville} onChange={e => setVille(e.target.value)} placeholder="Arras" />
                </div>
              </div>
            </div>
          )}

          {mode === 'point_relais' && (
            <div style={{ background: 'var(--bois)', borderRadius: 10, padding: 18, marginBottom: 20 }}>
              <div className="message-erreur" style={{ background: 'rgba(74,123,140,0.15)', borderColor: 'rgba(74,123,140,0.4)', color: 'var(--cire-douce)', marginBottom: 14 }}>
                <p style={{ fontSize: 13 }}>Cherche ton point relais Mondial Relay sur <a href="https://www.mondialrelay.fr/trouver-un-point-relais/" target="_blank" rel="noreferrer" style={{ color: 'var(--flamme)' }}>mondialrelay.fr</a>, puis saisis l'adresse ci-dessous.</p>
              </div>
              <div className="champ">
                <label>Nom / adresse du point relais choisi</label>
                <input value={pointRelais} onChange={e => setPointRelais(e.target.value)} placeholder="Ex : Tabac des Arts, 12 rue Victor Hugo, 62000 Arras" />
              </div>
            </div>
          )}

          {mode === 'drive_fampoux' && (
            <div style={{ background: 'rgba(47,143,106,0.08)', border: '1px solid rgba(47,143,106,0.3)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: 'var(--cire-douce)' }}>📍 Retrait gratuit à Fampoux (62). On te contactera par email pour convenir du créneau de retrait.</p>
            </div>
          )}

          {/* Récapitulatif */}
          <div style={{ background: 'var(--bois)', borderRadius: 10, padding: 18, marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--fumee)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Récapitulatif</p>
            {articles.map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span>{a.quantite} × {a.nom}</span>
                <span>{((a.reduction_par_deux && a.quantite >= 2 ? a.prix * 0.9 : a.prix) * a.quantite).toFixed(2)} €</span>
              </div>
            ))}
            {reductionCode > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--flamme)', marginBottom: 8 }}>
                <span>Code "{codePromo.code}"</span>
                <span>−{reductionCode.toFixed(2)} €</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: fraisLivraison === 0 ? 'var(--emeraude-clair)' : 'var(--cire-douce)' }}>
              <span>Livraison</span>
              <span>{fraisLivraison === 0 ? 'Offerte' : `${fraisLivraison.toFixed(2)} €`}</span>
            </div>
            {fraisLivraison > 0 && mode !== 'drive_fampoux' && (
              <p style={{ fontSize: 11, color: 'var(--fumee)', marginBottom: 8 }}>
                Encore {(seuilGratuit - total).toFixed(2)} € pour la livraison offerte
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--bois-clair)', paddingTop: 12, marginTop: 8, fontSize: 17 }}>
              <span>Total</span>
              <span>{totalFinal.toFixed(2)} €</span>
            </div>
          </div>

          <button className="btn btn-primary btn-block" disabled={envoi} type="submit" style={{ padding: '15px', fontSize: 16 }}>
            {envoi ? '⏳ Redirection vers le paiement...' : '🔒 Payer maintenant'}
          </button>
          <p style={{ fontSize: 12, color: 'var(--fumee)', textAlign: 'center', marginTop: 10 }}>
            🔒 Paiement 100% sécurisé via Stripe · Données cryptées
          </p>
        </form>
      </div>
    </div>
  )
}
