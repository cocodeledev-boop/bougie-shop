import { useParametres } from '../hooks/useParametres'

export default function APropos() {
  const { parametres } = useParametres()
  return (
    <div className="container" style={{ padding: '70px 24px 90px', maxWidth: 720 }}>
      <h1 style={{ fontSize: 34, marginBottom: 28 }}>Notre histoire</h1>
      <p style={{ color: 'var(--cire-douce)', lineHeight: 1.8, fontSize: 16, whiteSpace: 'pre-line' }}>
        {parametres.a_propos_texte || "L'histoire de la boutique arrive bientôt."}
      </p>
    </div>
  )
}
