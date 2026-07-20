import { useEffect, useState } from 'react'

export default function CompteARebours({ dateFin }) {
  const [tempsRestant, setTempsRestant] = useState(calculer())

  function calculer() {
    const diff = new Date(dateFin).getTime() - Date.now()
    if (diff <= 0) return null
    return {
      jours: Math.floor(diff / 86400000),
      heures: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
    }
  }

  useEffect(() => {
    const intervalle = setInterval(() => setTempsRestant(calculer()), 60000)
    return () => clearInterval(intervalle)
  }, [dateFin])

  if (!tempsRestant) return null

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(28,20,15,0.3)',
      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: 'var(--cire)',
    }}>
      ⏳ Plus que {tempsRestant.jours > 0 ? `${tempsRestant.jours}j ` : ''}{tempsRestant.heures}h{tempsRestant.minutes.toString().padStart(2, '0')}
    </span>
  )
}
