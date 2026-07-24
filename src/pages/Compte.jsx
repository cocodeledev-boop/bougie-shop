import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useParametres } from '../hooks/useParametres'
import { supabase } from '../lib/supabase'
import { genererFacturePDF } from '../lib/facture'

const LIBELLES_STATUT = {
  en_attente: 'En attente de paiement',
  payee: 'Payée — en préparation',
  preparee: 'Préparée',
  expediee: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée',
}

export default function Compte() {
  const { user, profil, loading } = useAuth()
  const { parametres } = useParametres()
  const [commandes, setCommandes] = useState([])

  useEffect(() => {
    if (!user) return
    supabase
      .from('commandes')
      .select('*, commande_articles(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setCommandes(data || []))
  }, [user])

  if (loading) return null
  if (!user) return <Navigate to="/connexion" />

  return (
    <div className="container" style={{ padding: '56px 24px 90px', maxWidth: 760 }}>
      <h1 style={{ fontSize: 30, marginBottom: 6 }}>Bonjour {profil?.prenom || ''}</h1>
      <p style={{ color: 'var(--fumee)', marginBottom: 20 }}>{user.email}</p>

      <div className="carte" style={{ padding: 18, marginBottom: 40, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 26 }}>🎁</span>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>{profil?.points_fidelite || 0} points de fidélité</p>
          <p style={{ fontSize: 13, color: 'var(--fumee)' }}>1 point gagné par euro dépensé — contacte-nous pour les échanger contre une réduction.</p>
        </div>
      </div>

      <h2 style={{ fontSize: 20, marginBottom: 18 }}>Mes commandes</h2>

      {commandes.length === 0 ? (
        <p style={{ color: 'var(--fumee)' }}>Vous n'avez pas encore passé de commande.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {commandes.map(c => (
            <div key={c.id} className="carte" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--fumee)' }}>
                  {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span style={{ fontSize: 13, color: 'var(--flamme)', fontWeight: 600 }}>
                  {LIBELLES_STATUT[c.statut] || c.statut}
                </span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--cire-douce)', marginBottom: 10 }}>
                {c.commande_articles?.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{a.quantite} × {a.nom_produit}</span>
                    <span>{(a.prix_unitaire * a.quantite).toFixed(2)} €</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderTop: '1px solid var(--bois-clair)', paddingTop: 10, marginBottom: (c.statut !== 'en_attente' || c.numero_suivi) ? 8 : 0 }}>
                <span>Total</span>
                <span>{c.total.toFixed(2)} €</span>
              </div>
              {c.numero_suivi && (
                <p style={{ fontSize: 13, color: 'var(--flamme)', marginBottom: 12 }}>
                  📦 Suivi{c.transporteur ? ` (${c.transporteur})` : ''} : <strong>{c.numero_suivi}</strong>
                </p>
              )}
              {c.statut !== 'en_attente' && c.statut !== 'annulee' && (
                <button
                  className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: 13 }}
                  onClick={() => genererFacturePDF(c, parametres.nom_boutique)}
                >
                  📄 Télécharger la facture
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
