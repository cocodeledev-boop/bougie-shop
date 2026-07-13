import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import CarteProduit from '../components/CarteProduit'

export default function Boutique() {
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [categorieActive, setCategorieActive] = useState('toutes')
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('produits').select('*').eq('actif', true).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('ordre').order('nom'),
    ]).then(([{ data: p }, { data: c }]) => {
      setProduits(p || [])
      setCategories(c || [])
      setChargement(false)
    })
  }, [])

  const produitsAffiches = categorieActive === 'toutes'
    ? produits
    : produits.filter(p => p.categorie_id === categorieActive)

  return (
    <div className="container" style={{ padding: '56px 24px 90px' }}>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>La boutique</h1>
      <p style={{ color: 'var(--fumee)', marginBottom: 32 }}>Toutes nos bougies, coulées à la main.</p>

      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 36 }}>
          <button
            onClick={() => setCategorieActive('toutes')}
            className={categorieActive === 'toutes' ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ padding: '9px 18px', fontSize: 14 }}
          >
            Toutes
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setCategorieActive(c.id)}
              className={categorieActive === c.id ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ padding: '9px 18px', fontSize: 14 }}
            >
              {c.nom}
            </button>
          ))}
        </div>
      )}

      {chargement ? (
        <p style={{ color: 'var(--fumee)' }}>Chargement...</p>
      ) : produitsAffiches.length === 0 ? (
        <p style={{ color: 'var(--fumee)' }}>Aucune bougie disponible dans cette catégorie.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 22 }}>
          {produitsAffiches.map(p => <CarteProduit key={p.id} produit={p} />)}
        </div>
      )}
    </div>
  )
}
