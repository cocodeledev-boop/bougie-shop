import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Avis({ produitId }) {
  const [avis, setAvis] = useState([])

  useEffect(() => {
    let requete = supabase.from('avis').select('*').order('created_at', { ascending: false })
    requete = produitId ? requete.eq('produit_id', produitId) : requete.is('produit_id', null)
    requete.then(({ data }) => setAvis(data || []))
  }, [produitId])

  if (avis.length === 0) return null

  const moyenne = avis.reduce((s, a) => s + a.note, 0) / avis.length

  return (
    <div style={{ marginTop: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <h2 style={{ fontSize: 22 }}>Avis clients</h2>
        <span style={{ color: 'var(--flamme)', fontSize: 14 }}>{'★'.repeat(Math.round(moyenne))}{'☆'.repeat(5 - Math.round(moyenne))}</span>
        <span style={{ fontSize: 14, color: 'var(--fumee)' }}>{moyenne.toFixed(1)}/5 · {avis.length} avis</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {avis.map(a => (
          <div key={a.id} className="carte" style={{ padding: 16 }}>
            <div style={{ color: 'var(--flamme)', fontSize: 13, marginBottom: 8 }}>
              {'★'.repeat(a.note)}{'☆'.repeat(5 - a.note)}
            </div>
            <p style={{ fontSize: 14, color: 'var(--cire-douce)', marginBottom: 10, lineHeight: 1.5 }}>{a.commentaire}</p>
            <p style={{ fontSize: 12, color: 'var(--fumee)', fontStyle: 'italic' }}>{a.auteur}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
