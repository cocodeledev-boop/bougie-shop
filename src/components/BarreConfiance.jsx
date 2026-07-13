export default function BarreConfiance() {
  const items = [
    { icone: '🚚', titre: 'Livraison offerte', detail: 'dès 50€ d\'achat' },
    { icone: '📦', titre: 'Expédition rapide', detail: 'sous 2 à 4 jours' },
    { icone: '🇫🇷', titre: 'Marque française', detail: 'fabriquée à Fampoux' },
  ]
  return (
    <div style={{ background: 'var(--bois)', borderTop: '1px solid var(--bois-clair)', borderBottom: '1px solid var(--bois-clair)' }}>
      <div className="container" style={{
        display: 'flex', flexWrap: 'wrap', gap: 28, justifyContent: 'center',
        padding: '18px 24px',
      }}>
        {items.map(item => (
          <div key={item.titre} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{item.icone}</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600 }}>{item.titre}</p>
              <p style={{ fontSize: 12, color: 'var(--fumee)' }}>{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
