import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

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
        .select('code_promo_id, user_id')
        .eq('id', commandeId)
        .single()

      if (commande?.code_promo_id && commande?.user_id) {
        await supabase
          .from('codes_promo_utilises')
          .insert({ code_promo_id: commande.code_promo_id, user_id: commande.user_id, commande_id: commandeId })
          .select()
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
}
