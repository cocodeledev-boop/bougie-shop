// Fonction utilitaire (pas une route) pour envoyer un email via l'API Resend
export async function envoyerEmail({ destinataire, sujet, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY absente, email non envoye:', sujet)
    return
  }
  const expediteur = process.env.EMAIL_EXPEDITEUR || 'onboarding@resend.dev'
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: expediteur, to: destinataire, subject: sujet, html }),
    })
  } catch (err) {
    console.error('Erreur envoi email:', err)
  }
}
