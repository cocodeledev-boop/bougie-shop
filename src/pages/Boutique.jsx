import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { chargerAvisResume } from '../lib/avisResume'
import CarteProduit from '../components/CarteProduit'

export default function Boutique() {
  const location = useLocation()
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [avisParProduit, setAvisParProduit] = useState({})
  const [categorieActive, setCategorieActive] = useState('toutes')
  const [parfumActif, setParfumActif] = useState('tous')
  const [prixMax, setPrixMax] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    setCategorieActive('toutes')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.state?.nonce])

  useEffect(() => {
    Promise.all([
      supabase.from('produits').select('*').eq('actif', true)
        .order('coup_de_coeur', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('ordre').order('nom'),
      chargerAvisResume(),
    ]).then(([{ data: p }, { data: c }, avis]) => {
      setProduits(p || [])
      setCategories(c || [])
      setAvisParProduit(avis)
      setChargement(false)
    })
  }, [])

  const parfumsDisponibles = useMemo(() => {
    const set = new Set(produits.map(p => p.parfum).filter(Boolean))
    return [...set].sort()
  }, [produits])

  const prixPlafondGlobal = useMemo(() => Math.max(0, ...produits.map(p => p.prix)), [produits])

  const produitsAffiches = produits.filter(p => {
    if (categorieActive !== 'toutes' && p.categorie_id !== categorieActive) return false
    if (parfumActif !== 'tous' && p.parfum !== parfumActif) return false
    if (prixMax !== null && p.prix > prixMax) return false
    return true
  })

  return (
    <div className="container" style={{ padding: '56px 24px 90px' }}>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>La boutique</h1>
      <p style={{ color: 'var(--fumee)', marginBottom: 28 }}>Toutes nos bougies, coulées à la main.</p>

      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <button onClick={() => setCategorieActive('toutes')} className={categorieActive === 'toutes' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ padding: '9px 18px', fontSize: 14 }}>
            Toutes
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setCategorieActive(c.id)} className={categorieActive === c.id ? 'btn btn-primary' : 'btn btn-secondary'} style={{ padding: '9px 18px', fontSize: 14 }}>
              {c.nom}
            </button>
          ))}
        </div>
      )}

      <div className="carte" style={{ padding: 16, marginBottom: 32, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {parfumsDisponibles.length > 0 && (
          <div>
            <label style={{ fontSize: 12, color: 'var(--fumee)', display: 'block', marginBottom: 6 }}>Parfum</label>
            <select
              value={parfumActif} onChange={e => setParfumActif(e.target.value)}
              style={{ background: 'var(--bois)', color: 'var(--cire)', border: '1.5px solid var(--bois-clair)', borderRadius: 4, padding: '8px 12px', fontSize: 13 }}
            >
              <option value="tous">Tous les parfums</option>
              {parfumsDisponibles.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}
        {prixPlafondGlobal > 0 && (
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 12, color: 'var(--fumee)', display: 'block', marginBottom: 6 }}>
              Prix max : {prixMax !== null ? `${prixMax.toFixed(0)} €` : `${prixPlafondGlobal.toFixed(0)} €`}
            </label>
            <input
              type="range" min="0" max={Math.ceil(prixPlafondGlobal)} step="1"
              value={prixMax !== null ? prixMax : Math.ceil(prixPlafondGlobal)}
              onChange={e => setPrixMax(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        )}
        {(parfumActif !== 'tous' || prixMax !== null) && (
          <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => { setParfumActif('tous'); setPrixMax(null) }}>
            Réinitialiser
          </button>
        )}
      </div>

      {chargement ? (
        <p style={{ color: 'var(--fumee)' }}>Chargement...</p>
      ) : produitsAffiches.length === 0 ? (
        <p style={{ color: 'var(--fumee)' }}>Aucune bougie ne correspond à ces filtres.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 22 }}>
          {produitsAffiches.map(p => <CarteProduit key={p.id} produit={p} avis={avisParProduit[p.id]} />)}
        </div>
      )}
    </div>
  )
}
