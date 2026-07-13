import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { supabase } from '../lib/supabase'

export default function Commande() {
  const { user, loading } = useAuth()
  const { articles, sousTotal, total, reductionCode, codePromo, vider } = useCart()
  const navigate = useNavigate()

  const [mode, setMode] = useState('nationale')
  const [adresse, setAdresse] = useState('')
  const [ville, setVille] = useState('')
  const [codePostal, setCodePostal] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  if (loading) return null
  if (!user) return <Navigate to="/connexion" />
  if (articles.length === 0) return <Navigate to="/boutique" />

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)

    try {
      const { data: commande, error: erreurCommande } = await supabase
        .from('commandes')
        .insert({
          user_id: user.id,
          statut: 'en_attente',
          total,
          mode_livraison: mode,
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
        produit_id: a.id,
        nom_produit: a.nom,
        quantite: a.quantite,
        prix_unitaire: (a.reduction_par_deux && a.quantite >= 2) ? a.prix * 0.9 : a.prix,
      }))
      const { error: erreurLignes } = await supabase.from('commande_articles').insert(lignes)
      if (erreurLignes) throw erreurLignes

      const reponse = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commandeId: commande.id,
          articles: articles.map(a => ({
            nom: a.nom, quantite: a.quantite,
            prix: (a.reduction_par_deux && a.quantite >= 2) ? a.prix * 0.9 : a.prix,
          })),
          reductionPourcentage: codePromo?.pourcentage || 0,
        }),
      })

      const { url, erreur: erreurApi } = await reponse.json()
      if (erreurApi || !url) throw new Error(erreurApi || 'Impossible de créer la session de paiement.')

      vider()
      window.location.href = url
    } catch (err) {
      setErreur(err.message || 'Une erreur est survenue.')
      setEnvoi(false)
    }
  }

  return (
    <div className="container" style={{ padding: '56px 24px 90px', maxWidth: 620 }}>
      <h1 style={{ fontSize: 28, marginBottom: 28 }}>Finaliser la commande</h1>

      <form onSubmit={handleSubmit}>
        {erreur && <div className="message-erreur" style={{ marginBottom: 16 }}>{erreur}</div>}

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button type="button" onClick={() => setMode('nationale')}
            className={mode === 'nationale' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ flex: 1 }}>
            Livraison
          </button>
          <button type="button" onClick={() => setMode('drive_fampoux')}
            className={mode === 'drive_fampoux' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ flex: 1 }}>
            Retrait à Fampoux
          </button>
        </div>

        {mode === 'nationale' && (
          <>
            <div className="champ">
              <label htmlFor="adresse">Adresse</label>
              <input id="adresse" required value={adresse} onChange={e => setAdresse(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="champ" style={{ flex: 1 }}>
                <label htmlFor="cp">Code postal</label>
                <input id="cp" required value={codePostal} onChange={e => setCodePostal(e.target.value)} />
              </div>
              <div className="champ" style={{ flex: 2 }}>
                <label htmlFor="ville">Ville</label>
                <input id="ville" required value={ville} onChange={e => setVille(e.target.value)} />
              </div>
            </div>
          </>
        )}

        {mode === 'drive_fampoux' && (
          <p style={{ color: 'var(--cire-douce)', fontSize: 14, marginBottom: 20 }}>
            Vous récupérerez votre commande directement à Fampoux (62). Les détails de retrait vous seront envoyés par email.
          </p>
        )}

        <div className="carte" style={{ padding: 18, margin: '20px 0' }}>
          {articles.map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
              <span>{a.quantite} × {a.nom}</span>
              <span>{((a.reduction_par_deux && a.quantite >= 2 ? a.prix * 0.9 : a.prix) * a.quantite).toFixed(2)} €</span>
            </div>
          ))}
          {reductionCode > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--flamme)', marginTop: 6 }}>
              <span>Code "{codePromo.code}"</span>
              <span>−{reductionCode.toFixed(2)} €</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderTop: '1px solid var(--bois-clair)', marginTop: 10, paddingTop: 10 }}>
            <span>Total</span>
            <span>{total.toFixed(2)} €</span>
          </div>
        </div>

        <button className="btn btn-primary btn-block" disabled={envoi} type="submit">
          {envoi ? 'Redirection vers le paiement...' : 'Payer maintenant'}
        </button>
      </form>
    </div>
  )
}
