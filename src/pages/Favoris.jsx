import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { chargerAvisResume } from '../lib/avisResume'
import CarteProduit from '../components/CarteProduit'

export default function Favoris() {
  const { user, loading } = useAuth()
  const [produits, setProduits] = useState([])
  const [avisParProduit, setAvisParProduit] = useState({})
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('favoris').select('produits(*)').eq('user_id', user.id)
      .then(async ({ data }) => {
        setProduits((data || []).map(f => f.produits).filter(Boolean))
        setAvisParProduit(await chargerAvisResume())
        setChargement(false)
      })
  }, [user])

  if (loading) return null
  if (!user) return <Navigate to="/connexion" />

  return (
    <div className="container" style={{ padding: '56px 24px 90px' }}>
      <h1 style={{ fontSize: 30, marginBottom: 32 }}>Mes favoris</h1>
      {chargement ? (
        <p style={{ color: 'var(--fumee)' }}>Chargement...</p>
      ) : produits.length === 0 ? (
        <p style={{ color: 'var(--fumee)' }}>Tu n'as pas encore de bougie en favoris. Clique sur le cœur d'une bougie pour l'ajouter ici.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 22 }}>
          {produits.map(p => <CarteProduit key={p.id} produit={p} avis={avisParProduit[p.id]} />)}
        </div>
      )}
    </div>
  )
}
