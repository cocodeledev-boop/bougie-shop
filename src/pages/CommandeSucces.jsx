import { Link } from 'react-router-dom'

export default function CommandeSucces() {
  return (
    <div className="container" style={{ padding: '100px 24px', textAlign: 'center', maxWidth: 520 }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>🕯️</div>
      <h1 style={{ fontSize: 30, marginBottom: 14 }}>Commande confirmée</h1>
      <p style={{ color: 'var(--cire-douce)', marginBottom: 34, lineHeight: 1.6 }}>
        Merci pour votre achat ! Vous recevrez un email de confirmation, et vous pouvez suivre
        l'avancement de votre commande à tout moment depuis votre compte.
      </p>
      <Link to="/compte" className="btn btn-primary">Voir ma commande</Link>
    </div>
  )
}
