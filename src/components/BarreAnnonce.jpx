import { useEffect, useState } from 'react'
import { useParametres } from '../hooks/useParametres'

// Bandeau permanent en haut du site, avec rotation entre quelques messages clés,
// pour garder en tete l'offre de bienvenue et la livraison offerte pendant la navigation.
export default function BarreAnnonce() {
  const { parametres } = useParametres()
  const [index, setIndex] = useState(0)

  const seuil = parseFloat(parametres.seuil_livraison_gratuite || 50).toFixed(0)
  const code = parametres.banniere_code || 'NOUVEAUBOUGIE'

  const messages = [
    `🚚 Livraison offerte dès ${seuil} €`,
    `🕯️ -10% sur votre première commande avec le code ${code}`,
    `📍 Retrait gratuit à Fampoux (62)`,
  ]

  useEffect(() => {
    const intervalle = setInterval(() => setIndex(i => (i + 1) % messages.length), 4000)
    return () => clearInterval(intervalle)
  }, [messages.length])

  return (
    <div style={{
      background: 'linear-gradient(90deg, var(--nuit), var(--bois) 50%, var(--nuit))',
      borderBottom: '1px solid var(--bois-clair)', overflow: 'hidden',
      height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <p
        key={index}
        style={{
          fontSize: 12.5, color: 'var(--cire-douce)', letterSpacing: '0.02em',
          animation: 'apparition-annonce 0.4s ease',
        }}
      >
        {messages[index]}
      </p>
      <style>{`
        @keyframes apparition-annonce {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
