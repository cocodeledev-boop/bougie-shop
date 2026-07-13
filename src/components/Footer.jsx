import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ background: 'var(--bois)', borderTop: '1px solid var(--bois-clair)', marginTop: 60 }}>
      <div className="container" style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32,
        padding: '48px 24px',
      }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 10 }}>Lueur & Cire</p>
          <p style={{ fontSize: 13, color: 'var(--fumee)', lineHeight: 1.6 }}>
            Bougies coulées à la main à Fampoux, dans le Pas-de-Calais.
          </p>
        </div>

        <div>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--cire-douce)' }}>Boutique</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to="/boutique" style={{ fontSize: 13, color: 'var(--fumee)' }}>Toutes les bougies</Link>
            <Link to="/compte" style={{ fontSize: 13, color: 'var(--fumee)' }}>Mon compte</Link>
          </div>
        </div>

        <div>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--cire-douce)' }}>Suivez-nous</p>
          <div style={{ display: 'flex', gap: 14 }}>
            <a href="#" style={{ fontSize: 13, color: 'var(--fumee)' }} aria-label="Instagram">Instagram</a>
            <a href="#" style={{ fontSize: 13, color: 'var(--fumee)' }} aria-label="TikTok">TikTok</a>
          </div>
        </div>

        <div>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--cire-douce)' }}>
            -10% sur votre 1ʳᵉ commande
          </p>
          <p style={{ fontSize: 13, color: 'var(--fumee)', lineHeight: 1.6 }}>
            Créez un compte et utilisez le code <strong style={{ color: 'var(--flamme)' }}>NOUVEAUBOUGIE</strong> au moment de payer.
          </p>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--bois-clair)', padding: '18px 24px' }}>
        <div className="container" style={{
          display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center',
        }}>
          <p style={{ fontSize: 12, color: 'var(--fumee)' }}>© {new Date().getFullYear()} Lueur & Cire</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['Visa', 'Mastercard', 'CB', 'Apple Pay'].map(moyen => (
              <span key={moyen} style={{
                fontSize: 11, color: 'var(--fumee)', border: '1px solid var(--bois-clair)',
                borderRadius: 4, padding: '3px 8px',
              }}>
                {moyen}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
