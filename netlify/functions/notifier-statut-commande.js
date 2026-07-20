import { createClient } from '@supabase/supabase-js'
import { envoyerEmail } from './_envoyerEmail.js'

const MESSAGES = {
  expediee: { sujet: 'Votre commande est en route ! 🚚', texte: 'Votre commande vient d\'être expédiée. Elle arrive bientôt !' },
  livree: { sujet: 'Votre commande est arrivée 🕯️', texte: 'Votre commande a été livrée. On espère qu\'elle vous plaira !' },
  preparee: { sujet: 'Votre commande est en préparation', texte: 'Votre commande est en cours de préparation avec soin.' },
}

export default async (req) => {
  if (req.method !== 'POST') return new Response('Méthode non autorisée', { status: 405 })

  try {
    const { commandeId, statut } = await req.json()
    const message = MESSAGES[statut]
    if (!message) return new Response(JSON.stringify({ ok: true, ignore: true }), { status: 200 })

    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data: commande } = await supabase.from('commandes').select('user_id, total').eq('id', commandeId).single()
    if (!commande?.user_id) return new Response(JSON.stringify({ ok: true }), { status: 200 })

    const { data: utilisateur } = await supabase.auth.admin.getUserById(commande.user_id)
    if (!utilisateur?.user?.email) return new Response(JSON.stringify({ ok: true }), { status: 200 })

    await envoyerEmail({
      destinataire: utilisateur.user.email,
      sujet: message.sujet,
      html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;"><h2>${message.sujet}</h2><p>${message.texte}</p></div>`,
    })

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ erreur: 'Erreur envoi notification' }), { status: 500 })
  }
}
