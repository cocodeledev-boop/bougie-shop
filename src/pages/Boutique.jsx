import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import CarteProduit from '../components/CarteProduit'

export default function Boutique() {
  const [produits, setProduits] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    supabase.from('produits').select('*').eq('actif', true).order('created_at', { ascending: false })
      .then(({ data }) => { setProduits(data || []); setChargement(false) })
  }, [])

  return (
    <div className="container" style={{ padding: '56px 24px 90px' }}>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>La boutique</h1>
      <p style={{ color: 'var(--fumee)', marginBottom: 40 }}>Toutes nos bougies, coulées à la main.</p>

      {chargement ? (
        <p style={{ color: 'var(--fumee)' }}>Chargement...</p>
      ) : produits.length === 0 ? (
        <p style={{ color: 'var(--fumee)' }}>Aucune bougie disponible pour le moment.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 22 }}>
          {produits.map(p => <CarteProduit key={p.id} produit={p} />)}
        </div>
      )}
    </div>
  )
}
