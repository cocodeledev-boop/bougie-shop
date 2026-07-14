import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Avis({ produitId }) {
  const { user, profil } = useAuth()
  const [avis, setAvis] = useState([])
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const [note, setNote] = useState(5)
  const [commentaire, setCommentaire] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  async function charger() {
    let requete = supabase.from('avis').select('*').order('created_at', { ascending: false })
    requete = produitId ? requete.eq('produit_id', produitId) : requete.is('produit_id', null)
    const { data } = await requete
    setAvis(data || [])
  }

  useEffect(() => { charger() }, [produitId])

  async function envoyerAvis(e) {
    e.preventDefault()
    setErreur('')
    if (!commentaire.trim()) return
    setEnvoi(true)
    const { error } = await supabase.from('avis').insert({
      produit_id: produitId || null,
      auteur: profil?.prenom || 'Client',
      note,
      commentaire: commentaire.trim(),
    })
    setEnvoi(false)
    if (error) {
      setErreur("Impossible d'envoyer ton avis, réessaie.")
      return
    }
    setCommentaire('')
    setNote(5)
    setFormulaireOuvert(false)
    charger()
  }

  const moyenne = avis.length > 0 ? avis.reduce((s, a) => s + a.note, 0) / avis.length : 0

  return (
    <div style={{ marginTop: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22 }}>Avis clients</h2>
        {avis.length > 0 && (
          <>
            <span style={{ color: 'var(--flamme)', fontSize: 14 }}>{'★'.repeat(Math.round(moyenne))}{'☆'.repeat(5 - Math.round(moyenne))}</span>
            <span style={{ fontSize: 14, color: 'var(--fumee)' }}>{moyenne.toFixed(1)}/5 · {avis.length} avis</span>
          </>
        )}
        {user && !formulaireOuvert && (
          <button className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: 13, marginLeft: 'auto' }} onClick={() => setFormulaireOuvert(true)}>
            Laisser un avis
          </button>
        )}
      </div>

      {!user && (
        <p style={{ fontSize: 13, color: 'var(--fumee)', marginBottom: 20 }}>Connecte-toi à ton compte pour laisser un avis.</p>
      )}

      {formulaireOuvert && (
        <form onSubmit={envoyerAvis} className="carte" style={{ padding: 18, marginBottom: 24 }}>
          {erreur && <div className="message-erreur" style={{ marginBottom: 12 }}>{erreur}</div>}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => setNote(n)} style={{ background: 'none', fontSize: 22, color: n <= note ? 'var(--flamme)' : 'var(--fumee)' }}>
                ★
              </button>
            ))}
          </div>
          <textarea
            rows={3} value={commentaire} onChange={e => setCommentaire(e.target.value)}
            placeholder="Qu'as-tu pensé de cette bougie ?"
            style={{ width: '100%', background: 'var(--bois)', border: '1.5px solid var(--bois-clair)', borderRadius: 4, padding: 12, color: 'var(--cire)', fontSize: 14, marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" style={{ padding: '9px 18px', fontSize: 14 }} disabled={envoi} type="submit">
              {envoi ? 'Envoi...' : 'Publier'}
            </button>
            <button type="button" className="btn btn-secondary" style={{ padding: '9px 18px', fontSize: 14 }} onClick={() => setFormulaireOuvert(false)}>
              Annuler
            </button>
          </div>
        </form>
      )}

      {avis.length > 0 && (
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
      )}
    </div>
  )
}
