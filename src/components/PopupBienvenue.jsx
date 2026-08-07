import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useParametres } from '../hooks/useParametres'

const CODE = 'NOUVEAUBOUGIE'

export default function PopupBienvenue() {
  const { user, loading } = useAuth()
  const { parametres } = useParametres()
  const [visible, setVisible] = useState(false)
  const [copie, setCopie] = useState(false)

  useEffect(() => {
    if (loading || !user) return

    let annule = false
    async function verifierEligibilite() {
      const { count } = await supabase
        .from('commandes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .neq('statut', 'annulee')

      if (count && count > 0) return

      const { data: promo } = await supabase.from('codes_promo').select('id').eq('code', CODE).eq('actif', true).maybeSingle()
      if (!promo) return

      const { data: dejaUtilise } = await supabase
        .from('codes_promo_utilises')
        .select('id')
        .eq('code_promo_id', promo.id)
        .eq('user_id', user.id)
        .maybeSingle()

      // S'affiche à chaque chargement / actualisation de page (dans les 5 secondes)
      // tant que le client est éligible à l'offre de bienvenue.
      if (!annule && !dejaUtilise) {
        setTimeout(() => setVisible(true), 5000)
      }
    }
    verifierEligibilite()
    return () => { annule = true }
  }, [user, loading])

  function fermer() {
    setVisible(false)
  }

  function copier() {
    navigator.clipboard?.writeText(CODE)
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  if (!visible) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={fermer}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, var(--bois-clair), var(--nuit) 75%)',
          border: '1px solid var(--bois-clair)', borderRadius: 10, padding: 40,
          maxWidth: 420, width: '100%', textAlign: 'center', position: 'relative',
        }}
      >
        <button onClick={fermer} style={{ position: 'absolute', top: 14, right: 16, background: 'none', color: 'var(--fumee)', fontSize: 22 }}>×</button>
        <div style={{ fontSize: 38, marginBottom: 12 }}>🕯️</div>
        <h2 style={{ fontSize: 26, marginBottom: 10 }}>Bienvenue chez {parametres.nom_boutique || 'Hugoline & Compagnies'}</h2>
        <p style={{ color: 'var(--cire-douce)', marginBottom: 22, lineHeight: 1.6 }}>
          -10% sur votre première commande avec le code :
        </p>
        <button
          onClick={copier}
          style={{
            background: 'var(--nuit)', border: `1.5px dashed var(--flamme)`, borderRadius: 6,
            padding: '12px 24px', fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--flamme)',
            letterSpacing: '0.05em', marginBottom: 18, width: '100%',
          }}
        >
          {copie ? 'Copié !' : CODE}
        </button>
        <p style={{ fontSize: 12, color: 'var(--fumee)' }}>À coller dans le panier au moment de payer.</p>
      </div>
    </div>
  )
}
