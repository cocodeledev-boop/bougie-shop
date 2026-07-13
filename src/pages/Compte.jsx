import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

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
      <p style={{ color: 'var(--fumee)', marginBottom: 40 }}>{user.email}</p>

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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderTop: '1px solid var(--bois-clair)', paddingTop: 10 }}>
                <span>Total</span>
                <span>{c.total.toFixed(2)} €</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
