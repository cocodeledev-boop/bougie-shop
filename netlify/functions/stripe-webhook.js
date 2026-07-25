import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { envoyerEmail } from './_envoyerEmail.js'

export default async (req) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const signature = req.headers.get('stripe-signature')
  const corps = await req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(corps, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Signature webhook invalide:', err.message)
    return new Response('Signature invalide', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const commandeId = session.metadata?.commande_id

    if (commandeId) {
      const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

      await supabase
        .from('commandes')
        .update({ statut: 'payee', stripe_session_id: session.id, stripe_payment_intent: session.payment_intent })
        .eq('id', commandeId)

      // Si un code promo a ete utilise sur cette commande, on l'enregistre comme "utilise"
      // pour empecher le meme client de le reutiliser
      const { data: commande } = await supabase
        .from('commandes')
        .select('code_promo_id, user_id, total')
        .eq('id', commandeId)
        .single()

      if (commande?.code_promo_id && commande?.user_id) {
        await supabase
          .from('codes_promo_utilises')
          .insert({ code_promo_id: commande.code_promo_id, user_id: commande.user_id, commande_id: commandeId })
          .select()
      }

      // Decrementation du stock pour chaque article commande
      const { data: lignes } = await supabase.from('commande_articles').select('produit_id, quantite').eq('commande_id', commandeId)
      for (const ligne of lignes || []) {
        if (!ligne.produit_id) continue
        const { data: produit } = await supabase.from('produits').select('stock').eq('id', ligne.produit_id).single()
        if (produit) {
          await supabase.from('produits').update({ stock: Math.max(0, produit.stock - ligne.quantite) }).eq('id', ligne.produit_id)
        }
      }
      if (commande?.user_id) {
        const pointsGagnes = Math.floor(commande.total)
        const { data: profilActuel } = await supabase.from('profils').select('points_fidelite').eq('id', commande.user_id).single()
        await supabase.from('profils').update({ points_fidelite: (profilActuel?.points_fidelite || 0) + pointsGagnes }).eq('id', commande.user_id)
        await supabase.from('points_fidelite_historique').insert({
          user_id: commande.user_id, points: pointsGagnes, raison: 'Commande payée', commande_id: commandeId,
        })
      }

      // Email de confirmation de commande
      if (commande?.user_id) {
        const { data: utilisateur } = await supabase.auth.admin.getUserById(commande.user_id)
        const { data: reglages } = await supabase.from('parametres_site').select('cle, valeur').in('cle', ['nom_boutique', 'email_confirmation_texte'])
        const nomBoutique = reglages?.find(r => r.cle === 'nom_boutique')?.valeur || 'Lueur & Cire'
        const texte = reglages?.find(r => r.cle === 'email_confirmation_texte')?.valeur
          || 'Merci pour votre commande ! Nous préparons votre colis avec soin, vous recevrez un email dès qu\'il sera expédié.'
        if (utilisateur?.user?.email) {
          await envoyerEmail({
            destinataire: utilisateur.user.email,
            sujet: `Confirmation de votre commande — ${nomBoutique}`,
            html: `
              <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                <h2>Merci pour votre commande ! 🕯️</h2>
                <p>Votre paiement de <strong>${commande.total.toFixed(2)} €</strong> a bien été reçu.</p>
                <p>${texte}</p>
                <p style="color:#888; font-size: 13px; margin-top: 30px;">Vous pouvez suivre votre commande à tout moment depuis votre compte sur le site.</p>
              </div>
            `,
          })
        }
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
}
