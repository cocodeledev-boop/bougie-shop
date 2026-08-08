import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { chargerAvisResume } from '../lib/avisResume'
import CarteProduit from '../components/CarteProduit'

const OPTIONS_TRI = [
  { id: 'recommande', label: 'Recommandé' },
  { id: 'nouveaute', label: 'Nouveautés' },
  { id: 'prix_asc', label: 'Prix croissant' },
  { id: 'prix_desc', label: 'Prix décroissant' },
]

export default function Boutique() {
  const location = useLocation()
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [avisParProduit, setAvisParProduit] = useState({})
  const [categorieActive, setCategorieActive] = useState('toutes')
  const [parfumActif, setParfumActif] = useState('tous')
  const [prixMax, setPrixMax] = useState(null)
  const [tri, setTri] = useState('recommande')
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    setCategorieActive(location.state?.categorieId || 'toutes')
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

  const nombreFiltresActifs = [categorieActive !== 'toutes', parfumActif !== 'tous', prixMax !== null].filter(Boolean).length

  const produitsAffiches = produits
    .filter(p => {
      if (categorieActive !== 'toutes' && p.categorie_id !== categorieActive) return false
      if (parfumActif !== 'tous' && p.parfum !== parfumActif) return false
      if (prixMax !== null && p.prix > prixMax) return false
      return true
    })
    .sort((a, b) => {
      if (tri === 'prix_asc') return a.prix - b.prix
      if (tri === 'prix_desc') return b.prix - a.prix
      if (tri === 'nouveaute') return new Date(b.created_at) - new Date(a.created_at)
      return (b.coup_de_coeur ? 1 : 0) - (a.coup_de_coeur ? 1 : 0)
    })

  function reinitialiserTout() {
    setCategorieActive('toutes')
    setParfumActif('tous')
    setPrixMax(null)
  }

  const nomCategorieActive = categories.find(c => c.id === categorieActive)?.nom

  return (
    <div className="container" style={{ padding: '56px 24px 90px' }}>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>La boutique</h1>
      <p style={{ color: 'var(--fumee)', marginBottom: 28 }}>Toutes nos bougies, coulées à la main.</p>

      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
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

      {/* Barre de filtres */}
      <div style={{
        position: 'sticky', top: 90, zIndex: 10,
        background: 'var(--bois)', border: '1px solid var(--bois-clair)', borderRadius: 10,
        padding: '18px 20px', marginBottom: 30, boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      }}>
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'flex-end' }}>

          <FiltreSelect
            label="Trier par"
            valeur={tri}
            onChange={setTri}
            options={OPTIONS_TRI.map(o => ({ valeur: o.id, texte: o.label }))}
          />

          {parfumsDisponibles.length > 0 && (
            <FiltreSelect
              label="Parfum"
              valeur={parfumActif}
              onChange={setParfumActif}
              options={[{ valeur: 'tous', texte: 'Tous les parfums' }, ...parfumsDisponibles.map(p => ({ valeur: p, texte: p }))]}
            />
          )}

          {prixPlafondGlobal > 0 && (
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={{ fontSize: 11.5, color: 'var(--fumee)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                Prix max : <span style={{ color: 'var(--flamme)', fontWeight: 700 }}>{prixMax !== null ? `${prixMax.toFixed(0)} €` : `${prixPlafondGlobal.toFixed(0)} €`}</span>
              </label>
              <input
                type="range" min="0" max={Math.ceil(prixPlafondGlobal)} step="1"
                value={prixMax !== null ? prixMax : Math.ceil(prixPlafondGlobal)}
                onChange={e => setPrixMax(parseFloat(e.target.value))}
                className="curseur-prix"
                style={{
                  '--pourcentage': `${((prixMax !== null ? prixMax : prixPlafondGlobal) / prixPlafondGlobal) * 100}%`,
                }}
              />
            </div>
          )}

          {nombreFiltresActifs > 0 && (
            <button className="btn btn-secondary" style={{ padding: '9px 16px', fontSize: 13, flexShrink: 0 }} onClick={reinitialiserTout}>
              Réinitialiser ({nombreFiltresActifs})
            </button>
          )}
        </div>

        {/* Puces de filtres actifs, retirables individuellement */}
        {nombreFiltresActifs > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--bois-clair)' }}>
            {categorieActive !== 'toutes' && (
              <PucheFiltre texte={nomCategorieActive} onRetirer={() => setCategorieActive('toutes')} />
            )}
            {parfumActif !== 'tous' && (
              <PucheFiltre texte={parfumActif} onRetirer={() => setParfumActif('tous')} />
            )}
            {prixMax !== null && (
              <PucheFiltre texte={`≤ ${prixMax.toFixed(0)} €`} onRetirer={() => setPrixMax(null)} />
            )}
          </div>
        )}
      </div>

      <p style={{ fontSize: 13, color: 'var(--fumee)', marginBottom: 18 }}>
        {chargement ? ' ' : `${produitsAffiches.length} bougie${produitsAffiches.length !== 1 ? 's' : ''}`}
      </p>

      {chargement ? (
        <p style={{ color: 'var(--fumee)' }}>Chargement...</p>
      ) : produitsAffiches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <p style={{ color: 'var(--fumee)', marginBottom: 16 }}>Aucune bougie ne correspond à ces filtres.</p>
          <button className="btn btn-secondary" onClick={reinitialiserTout}>Réinitialiser les filtres</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 22 }}>
          {produitsAffiches.map(p => <CarteProduit key={p.id} produit={p} avis={avisParProduit[p.id]} />)}
        </div>
      )}
    </div>
  )
}

function FiltreSelect({ label, valeur, onChange, options }) {
  return (
    <div style={{ minWidth: 160 }}>
      <label style={{ fontSize: 11.5, color: 'var(--fumee)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>{label}</label>
      <select
        value={valeur} onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', background: 'var(--nuit)', color: 'var(--cire)', border: '1.5px solid var(--bois-clair)',
          borderRadius: 6, padding: '9px 12px', fontSize: 13.5, cursor: 'pointer',
        }}
      >
        {options.map(o => <option key={o.valeur} value={o.valeur}>{o.texte}</option>)}
      </select>
    </div>
  )
}

function PucheFiltre({ texte, onRetirer }) {
  return (
    <button
      onClick={onRetirer}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(242,166,90,0.1)',
        border: '1px solid var(--flamme)', color: 'var(--flamme)', borderRadius: 20,
        padding: '5px 8px 5px 14px', fontSize: 12.5,
      }}
    >
      {texte} <span style={{ fontSize: 15, lineHeight: 1 }}>×</span>
    </button>
  )
}
