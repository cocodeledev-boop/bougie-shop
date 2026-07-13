import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function BarreRecherche() {
  const [terme, setTerme] = useState('')
  const [resultats, setResultats] = useState([])
  const [ouvert, setOuvert] = useState(false)
  const navigate = useNavigate()
  const conteneurRef = useRef(null)

  useEffect(() => {
    function fermerSiExterieur(e) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target)) setOuvert(false)
    }
    document.addEventListener('mousedown', fermerSiExterieur)
    return () => document.removeEventListener('mousedown', fermerSiExterieur)
  }, [])

  useEffect(() => {
    if (terme.trim().length < 2) {
      setResultats([])
      return
    }
    const delai = setTimeout(async () => {
      const { data } = await supabase
        .from('produits')
        .select('id, nom, prix, image_url, parfum')
        .eq('actif', true)
        .ilike('nom', `%${terme}%`)
        .limit(6)
      setResultats(data || [])
    }, 250)
    return () => clearTimeout(delai)
  }, [terme])

  return (
    <div ref={conteneurRef} style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
      <input
        value={terme}
        onChange={e => { setTerme(e.target.value); setOuvert(true) }}
        onFocus={() => setOuvert(true)}
        placeholder="Rechercher une bougie..."
        style={{
          width: '100%', background: 'var(--bois)', border: '1.5px solid var(--bois-clair)',
          borderRadius: 20, padding: '9px 16px', color: 'var(--cire)', fontSize: 14,
        }}
      />
      {ouvert && terme.trim().length >= 2 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          background: 'var(--bois)', border: '1px solid var(--bois-clair)', borderRadius: 6,
          overflow: 'hidden', zIndex: 60, boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        }}>
          {resultats.length === 0 ? (
            <p style={{ padding: 14, fontSize: 13, color: 'var(--fumee)' }}>Aucune bougie trouvée.</p>
          ) : (
            resultats.map(p => (
              <button
                key={p.id}
                onClick={() => { setOuvert(false); setTerme(''); navigate(`/boutique/${p.id}`) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px',
                  background: 'none', textAlign: 'left', borderBottom: '1px solid var(--bois-clair)',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 4, background: 'var(--bois-clair)', flexShrink: 0,
                  backgroundImage: p.image_url ? `url(${p.image_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
                }} />
                <div>
                  <p style={{ fontSize: 14, color: 'var(--cire)' }}>{p.nom}</p>
                  <p style={{ fontSize: 12, color: 'var(--fumee)' }}>{p.prix.toFixed(2)} €</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
